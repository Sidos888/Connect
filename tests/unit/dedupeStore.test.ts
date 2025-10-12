/**
 * DedupeStore Unit Tests
 * 
 * Tests for the TTL-based deduplication store with LRU eviction.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DedupeStore, createCompositeKey } from '@/lib/utils/dedupeStore';

describe('DedupeStore', () => {
  let store: DedupeStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new DedupeStore({
      ttlMs: 1000, // 1 second for tests
      maxSize: 5,
      cleanupIntervalMs: 500
    });
  });

  afterEach(() => {
    store.destroy();
    vi.restoreAllMocks();
  });

  describe('add() and has()', () => {
    it('should add and retrieve keys', () => {
      store.add('key1');
      expect(store.has('key1')).toBe(true);
      expect(store.has('key2')).toBe(false);
    });

    it('should handle multiple keys', () => {
      store.add('key1');
      store.add('key2');
      store.add('key3');
      
      expect(store.has('key1')).toBe(true);
      expect(store.has('key2')).toBe(true);
      expect(store.has('key3')).toBe(true);
      expect(store.size()).toBe(3);
    });
  });

  describe('TTL expiration', () => {
    it('should expire keys after TTL', () => {
      store.add('key1');
      expect(store.has('key1')).toBe(true);
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(1100); // 1.1 seconds
      
      expect(store.has('key1')).toBe(false);
    });

    it('should not expire keys before TTL', () => {
      store.add('key1');
      expect(store.has('key1')).toBe(true);
      
      // Advance time within TTL
      vi.advanceTimersByTime(500); // 0.5 seconds
      
      expect(store.has('key1')).toBe(true);
    });
  });

  describe('cleanup()', () => {
    it('should remove expired entries', () => {
      store.add('key1');
      store.add('key2');
      
      // Expire key1 but not key2
      vi.advanceTimersByTime(600);
      store.add('key2'); // Refresh key2
      
      vi.advanceTimersByTime(600); // key1 now expired
      
      const removed = store.cleanup();
      expect(removed).toBe(1);
      expect(store.has('key1')).toBe(false);
      expect(store.has('key2')).toBe(true);
    });

    it('should return count of removed entries', () => {
      store.add('key1');
      store.add('key2');
      store.add('key3');
      
      vi.advanceTimersByTime(1100); // Expire all
      
      const removed = store.cleanup();
      expect(removed).toBe(3);
      expect(store.size()).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entries when maxSize reached', () => {
      // Add 6 entries (max is 5)
      for (let i = 1; i <= 6; i++) {
        store.add(`key${i}`);
      }
      
      // Should have evicted oldest (key1)
      expect(store.size()).toBeLessThanOrEqual(5);
      expect(store.has('key6')).toBe(true); // Newest should exist
    });

    it('should maintain most recent entries', () => {
      for (let i = 1; i <= 10; i++) {
        store.add(`key${i}`);
      }
      
      // Should keep newest entries
      expect(store.size()).toBeLessThanOrEqual(5);
      expect(store.has('key10')).toBe(true);
      expect(store.has('key9')).toBe(true);
    });
  });

  describe('remove()', () => {
    it('should remove specific key', () => {
      store.add('key1');
      store.add('key2');
      
      const removed = store.remove('key1');
      expect(removed).toBe(true);
      expect(store.has('key1')).toBe(false);
      expect(store.has('key2')).toBe(true);
    });

    it('should return false if key not found', () => {
      const removed = store.remove('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should remove all entries', () => {
      store.add('key1');
      store.add('key2');
      store.add('key3');
      
      store.clear();
      
      expect(store.size()).toBe(0);
      expect(store.has('key1')).toBe(false);
      expect(store.has('key2')).toBe(false);
      expect(store.has('key3')).toBe(false);
    });
  });

  describe('getStats()', () => {
    it('should return store statistics', () => {
      store.add('key1');
      vi.advanceTimersByTime(100);
      store.add('key2');
      
      const stats = store.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.ttlMs).toBe(1000);
      expect(stats.oldestEntryAge).toBeGreaterThan(0);
      expect(stats.newestEntryAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('destroy()', () => {
    it('should stop cleanup interval and clear store', () => {
      store.add('key1');
      store.destroy();
      
      expect(store.size()).toBe(0);
      // Cleanup interval should be cleared (can't easily test this without implementation details)
    });
  });
});

describe('createCompositeKey', () => {
  it('should combine multiple parts into single key', () => {
    const key = createCompositeKey('chat-123', 'user-456', 'client-789');
    expect(key).toBe('chat-123:user-456:client-789');
  });

  it('should filter out undefined and null values', () => {
    const key = createCompositeKey('chat-123', undefined, 'client-789', null);
    expect(key).toBe('chat-123:client-789');
  });

  it('should handle numbers', () => {
    const key = createCompositeKey('chat', 123, 'user', 456);
    expect(key).toBe('chat:123:user:456');
  });

  it('should handle empty array', () => {
    const key = createCompositeKey();
    expect(key).toBe('');
  });
});

