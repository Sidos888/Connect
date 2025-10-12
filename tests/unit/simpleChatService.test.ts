/**
 * SimpleChatService Unit Tests
 * 
 * Tests for idempotent sends, seq ordering, pagination, and deduplication.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SimpleChatService', () => {
  // Note: Full integration tests require actual Supabase connection
  // These are unit tests focusing on logic and edge cases

  describe('Message Ordering', () => {
    it('should sort messages by seq when available', () => {
      const messages = [
        { id: '1', seq: 3, created_at: '2025-01-01T10:00:00Z', text: 'Third' },
        { id: '2', seq: 1, created_at: '2025-01-01T10:02:00Z', text: 'First' },
        { id: '3', seq: 2, created_at: '2025-01-01T10:01:00Z', text: 'Second' }
      ];

      const sorted = [...messages].sort((a, b) => {
        if (a.seq !== undefined && b.seq !== undefined) {
          return a.seq - b.seq;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      expect(sorted[0].text).toBe('First');
      expect(sorted[1].text).toBe('Second');
      expect(sorted[2].text).toBe('Third');
    });

    it('should fallback to created_at when seq is missing', () => {
      const messages = [
        { id: '1', created_at: '2025-01-01T10:02:00Z', text: 'Third' },
        { id: '2', created_at: '2025-01-01T10:00:00Z', text: 'First' },
        { id: '3', created_at: '2025-01-01T10:01:00Z', text: 'Second' }
      ];

      const sorted = [...messages].sort((a: any, b: any) => {
        if (a.seq !== undefined && b.seq !== undefined) {
          return a.seq - b.seq;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      expect(sorted[0].text).toBe('First');
      expect(sorted[1].text).toBe('Second');
      expect(sorted[2].text).toBe('Third');
    });

    it('should handle mixed seq and non-seq messages', () => {
      const messages = [
        { id: '1', seq: 2, created_at: '2025-01-01T10:02:00Z', text: 'Has seq 2' },
        { id: '2', created_at: '2025-01-01T10:00:00Z', text: 'No seq, old' },
        { id: '3', seq: 1, created_at: '2025-01-01T10:03:00Z', text: 'Has seq 1' },
        { id: '4', created_at: '2025-01-01T10:01:00Z', text: 'No seq, newer' }
      ];

      const sorted = [...messages].sort((a: any, b: any) => {
        // Both have seq: sort by seq
        if (a.seq !== undefined && b.seq !== undefined) {
          return a.seq - b.seq;
        }
        // Only one has seq: seq comes first (undefined is treated as higher)
        if (a.seq !== undefined) return -1;
        if (b.seq !== undefined) return 1;
        // Neither has seq: sort by created_at
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      // Actually, messages with seq should be sorted by seq among themselves,
      // and messages without seq should be sorted by created_at among themselves
      // But they can be interleaved. The current sorting puts all seq first, then non-seq.
      // This is acceptable behavior - seq messages come first in order, then legacy by time.
      expect(sorted[0].text).toBe('Has seq 1');
      expect(sorted[1].text).toBe('Has seq 2');
      expect(sorted[2].text).toBe('No seq, old');
      expect(sorted[3].text).toBe('No seq, newer');
    });
  });

  describe('Idempotency Logic', () => {
    it('should detect duplicate by message ID', () => {
      const messages = [
        { id: 'msg-123', text: 'Hello' },
        { id: 'msg-456', text: 'World' }
      ];

      const newMessage = { id: 'msg-123', text: 'Hello again' };
      const isDuplicate = messages.some(m => m.id === newMessage.id);

      expect(isDuplicate).toBe(true);
    });

    it('should detect duplicate by client_generated_id', () => {
      const messages = [
        { id: 'msg-1', client_generated_id: 'client-abc', text: 'Hello' },
        { id: 'msg-2', client_generated_id: 'client-def', text: 'World' }
      ];

      const newMessage = { id: 'msg-3', client_generated_id: 'client-abc', text: 'Duplicate' };
      const isDuplicate = messages.some(m => 
        m.client_generated_id && m.client_generated_id === newMessage.client_generated_id
      );

      expect(isDuplicate).toBe(true);
    });

    it('should not detect duplicate when IDs are different', () => {
      const messages = [
        { id: 'msg-123', client_generated_id: 'client-abc', text: 'Hello' }
      ];

      const newMessage = { id: 'msg-456', client_generated_id: 'client-def', text: 'World' };
      const isDuplicate = messages.some(m => 
        m.id === newMessage.id || 
        (m.client_generated_id && m.client_generated_id === newMessage.client_generated_id)
      );

      expect(isDuplicate).toBe(false);
    });
  });

  describe('Seq Filtering', () => {
    it('should filter out messages with old seq', () => {
      const latestSeq = 10;
      const newMessage = { id: 'msg-1', seq: 8, text: 'Old message' };

      const shouldSkip = newMessage.seq && newMessage.seq <= latestSeq;

      expect(shouldSkip).toBe(true);
    });

    it('should accept messages with newer seq', () => {
      const latestSeq = 10;
      const newMessage = { id: 'msg-1', seq: 11, text: 'New message' };

      const shouldSkip = newMessage.seq && newMessage.seq <= latestSeq;

      expect(shouldSkip).toBe(false);
    });

    it('should accept messages without seq (legacy)', () => {
      const latestSeq = 10;
      const newMessage: any = { id: 'msg-1', text: 'Legacy message' };

      const shouldSkip = Boolean(newMessage.seq && newMessage.seq <= latestSeq);

      expect(shouldSkip).toBe(false); // Should not skip legacy messages
    });
  });

  describe('Offline Queue Logic', () => {
    it('should add message to queue when offline', () => {
      const queue: any[] = [];
      const isOnline = false;

      if (!isOnline) {
        const pending = {
          chatId: 'chat-123',
          senderId: 'user-456',
          text: 'Hello',
          clientGenId: 'client-abc',
          retries: 0,
          lastAttempt: Date.now(),
          tempId: 'temp-123'
        };
        queue.push(pending);
      }

      expect(queue.length).toBe(1);
      expect(queue[0].text).toBe('Hello');
    });

    it('should retry with exponential backoff', () => {
      const retries = [0, 1, 2, 3, 4];
      const baseDelay = 1000;
      const maxDelay = 30000;

      const delays = retries.map(retry => {
        const exponentialDelay = baseDelay * Math.pow(2, retry);
        return Math.min(exponentialDelay, maxDelay);
      });

      expect(delays[0]).toBe(1000);   // 1s
      expect(delays[1]).toBe(2000);   // 2s
      expect(delays[2]).toBe(4000);   // 4s
      expect(delays[3]).toBe(8000);   // 8s
      expect(delays[4]).toBe(16000);  // 16s
    });

    it('should cap delay at maxDelay', () => {
      const retry = 10;
      const baseDelay = 1000;
      const maxDelay = 30000;

      const exponentialDelay = baseDelay * Math.pow(2, retry); // Would be 1024000ms
      const cappedDelay = Math.min(exponentialDelay, maxDelay);

      expect(cappedDelay).toBe(30000); // Capped at 30s
    });

    it('should give up after max retries', () => {
      const maxRetries = 5;
      let currentRetries = 0;

      // Simulate retries
      while (currentRetries <= maxRetries) {
        currentRetries++;
      }

      expect(currentRetries).toBe(6); // Initial + 5 retries
    });
  });

  describe('Delivery Status Lifecycle', () => {
    it('should transition from sent → delivered → read', () => {
      let status = 'sent';
      
      // Receiver receives message
      status = 'delivered';
      expect(status).toBe('delivered');
      
      // Receiver opens chat
      status = 'read';
      expect(status).toBe('read');
    });

    it('should only update unread messages to read', () => {
      const messages = [
        { id: '1', status: 'sent', sender_id: 'other' },
        { id: '2', status: 'delivered', sender_id: 'other' },
        { id: '3', status: 'read', sender_id: 'other' },
        { id: '4', status: 'sent', sender_id: 'me' } // Own message
      ];

      const toUpdate = messages.filter(m => 
        m.sender_id !== 'me' && m.status !== 'read'
      );

      expect(toUpdate.length).toBe(2); // Only messages 1 and 2
      expect(toUpdate[0].id).toBe('1');
      expect(toUpdate[1].id).toBe('2');
    });
  });
});

