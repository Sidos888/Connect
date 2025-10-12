import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';
import { formatNameForDisplay } from './utils';
import { withRetry, isOnline } from './utils/network';
import { DedupeStore, createCompositeKey } from './utils/dedupeStore';

// Account interface for injected account
interface Account {
  id: string;
  name: string;
  bio?: string;
  dob?: string | null;
  profile_pic?: string;
  connect_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleChat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  photo?: string;
  participants: Array<{
    id: string;
    name: string;
    profile_pic?: string;
  }>;
  messages: SimpleMessage[];
  last_message?: string;
  last_message_at?: string;
  unreadCount: number;
}

export interface MediaAttachment {
  id: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_size?: number;
  thumbnail_url?: string;
  width?: number;
  height?: number;
}

export interface SimpleMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_profile_pic?: string;
  text: string;
  created_at: string;
  seq?: number; // NEW: Deterministic ordering sequence
  client_generated_id?: string; // NEW: For idempotency
  status?: 'sent' | 'delivered' | 'read'; // NEW: Delivery lifecycle
  reply_to_message_id?: string | null;
  reply_to_message?: SimpleMessage | null;
  media_urls?: string[]; // Keep for backward compatibility
  attachments?: MediaAttachment[]; // New structured attachments
  reactions?: MessageReaction[];
  deleted_at?: string | null;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface PendingMessage {
  chatId: string;
  senderId: string;
  text: string;
  clientGenId: string;
  replyToId?: string;
  mediaUrls?: string[];
  retries: number;
  lastAttempt: number;
  tempId: string; // For UI optimistic updates
}

export class SimpleChatService {
  private supabase: SupabaseClient;
  private currentAccount: Account;
  private chats: Map<string, SimpleChat> = new Map();
  private userChats: Map<string, SimpleChat[]> = new Map();
  private userChatsTimestamp: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  
  constructor(supabase: SupabaseClient, account: Account) {
    this.supabase = supabase;
    this.currentAccount = account;
    console.log('🔧 SimpleChatService: Initialized with account:', account.id);
  }
  
  // Real-time subscriptions
  private messageSubscriptions: Map<string, any> = new Map();
  // Allow multiple listeners per chat - now with subscription IDs for robust cleanup
  private messageCallbacks: Map<string, Map<string, (message: SimpleMessage) => void>> = new Map();
  // Track subscription IDs for each component to enable forced cleanup
  private subscriptionIds: Map<string, string> = new Map(); // callbackId -> subscriptionId
  private nextSubscriptionId = 0;
  private typingSubscriptions: Map<string, any> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();
  private typingCallbacks: Map<string, (typingUsers: string[]) => void> = new Map();
  
  // NEW: Deduplication store (replaces old processedMessages and recentMessageSignatures)
  private dedupeStore: DedupeStore = new DedupeStore({
    ttlMs: 2 * 60 * 1000, // 2 minutes
    maxSize: 1000
  });
  
  // NEW: Offline queue for failed message sends
  private pendingQueue: PendingMessage[] = [];
  private isFlushingQueue = false;
  
  // Chat message cache for instant loading
  private chatMessages: Map<string, SimpleMessage[]> = new Map();
  private chatParticipants: Map<string, any[]> = new Map();
  
  // Per-chat latest seq tracking for realtime filtering
  private chatLatestSeq: Map<string, number> = new Map();
  
  // Cleanup interval
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldTracking();
      }, 5 * 60 * 1000); // 5 minutes
      
      // Listen for online event to flush pending queue
      window.addEventListener('online', () => {
        console.log('SimpleChatService: Network online, flushing pending queue');
        this.flushPendingQueue();
      });
    }
  }

  // Retry mechanism now uses utility function from network.ts
  // Kept as private wrapper for backward compatibility with existing code
  private async withRetryCompat<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 2,
    baseDelay: number = 1000
  ): Promise<T> {
    return withRetry(operation, {
      retries: maxRetries,
      baseDelayMs: baseDelay,
      onRetry: (attempt, error) => {
        console.warn(`SimpleChatService: Retry ${attempt}/${maxRetries} after error:`, error.message);
      }
    });
  }

  // Expose Supabase client for advanced queries from UI components when needed
  getSupabaseClient() {
    return this.supabase;
  }

  // Clear chat cache (useful when chat data is updated)
  clearChatCache(chatId?: string) {
    if (chatId) {
      this.chats.delete(chatId);
      this.chatMessages.delete(chatId);
      this.chatParticipants.delete(chatId);
    } else {
      this.chats.clear();
      this.chatMessages.clear();
      this.chatParticipants.clear();
    }
  }

  // Clear all caches (chats and user chats)
  clearAllCaches() {
    this.chats.clear();
    this.userChats.clear();
    this.chatMessages.clear();
    this.userChatsTimestamp.clear();
  }

  // Force refresh conversations (clear cache and reload)
  async forceRefreshConversations(userId: string) {
    this.clearAllCaches();
    return await this.getUserChats(userId);
  }

  // Real-time messaging methods - SINGLETON APPROACH: Only allow ONE subscription per chat
  subscribeToMessages(chatId: string, onNewMessage: (message: SimpleMessage) => void): () => void {
    console.log(`🔍 SimpleChatService - subscribeToMessages called - Chat: ${chatId} - Existing callbacks: ${this.messageCallbacks.get(chatId)?.size || 0}`);
    
    // SINGLETON: If chat already has subscriptions, replace them with this new one
    if (this.messageCallbacks.has(chatId)) {
      console.log(`🔍 SimpleChatService - SINGLETON CLEANUP - Chat ${chatId} already has subscriptions, cleaning up first`);
      this.forceCleanupChat(chatId);
    }
    
    // Generate unique subscription ID for robust cleanup
    const subscriptionId = `sub_${this.nextSubscriptionId++}_${Date.now()}`;
    
    // Store the callback with ID for reliable removal
    this.messageCallbacks.set(chatId, new Map());
    const cbMap = this.messageCallbacks.get(chatId)!;
    
    const beforeSize = cbMap.size;
    cbMap.set(subscriptionId, onNewMessage);
    this.subscriptionIds.set(subscriptionId, chatId);
    console.log(`🔍 SimpleChatService - Added SINGLETON callback to chat: ${chatId} - Callbacks before: ${beforeSize} - Callbacks after: ${cbMap.size} - ID: ${subscriptionId}`);
    
    // Create subscription once per chat
    if (!this.messageSubscriptions.has(chatId)) {
      console.log(`🔍 SimpleChatService - Creating NEW subscription for chat: ${chatId} - Total subscriptions: ${this.messageSubscriptions.size}`);

    const subscription = this.supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        }, 
        async (payload) => {
          try {
            // Get sender name from participants
            const chat = this.chats.get(chatId);
            const sender = chat?.participants.find(p => p.id === payload.new.sender_id);
          
          const message: SimpleMessage = {
            id: payload.new.id,
            chat_id: payload.new.chat_id,
            sender_id: payload.new.sender_id,
            sender_name: sender?.name || 'Unknown',
            sender_profile_pic: sender?.profile_pic || undefined,
            text: payload.new.message_text,
            created_at: payload.new.created_at,
            seq: payload.new.seq || undefined, // NEW
            client_generated_id: payload.new.client_generated_id || undefined, // NEW
            status: payload.new.status || 'sent', // NEW
            reply_to_message_id: payload.new.reply_to_message_id || null,
            media_urls: payload.new.media_urls || undefined,
            reactions: [],
            deleted_at: payload.new.deleted_at || null
          };

          // NEW: Seq-based filtering - ignore old messages
          const latestSeq = this.chatLatestSeq.get(chatId) || 0;
          if (message.seq && message.seq <= latestSeq) {
            console.log(`SimpleChatService: Ignoring old message with seq ${message.seq} (latest: ${latestSeq})`);
            return;
          }

          // NEW: DedupeStore check (replaces old processedMessages + recentMessageSignatures)
          const messageIdKey = message.id;
          const clientGenKey = message.client_generated_id 
            ? createCompositeKey(chatId, message.sender_id, message.client_generated_id)
            : null;
          
          if (this.dedupeStore.has(messageIdKey) || (clientGenKey && this.dedupeStore.has(clientGenKey))) {
            console.log(`SimpleChatService: Duplicate message detected (id or client_gen_id), skipping`);
            return;
          }

          // Check if this message already exists in cache (optimistic update check)
          const existingMessage = chat?.messages.find(m => 
            m.id === message.id || 
            (m.client_generated_id && m.client_generated_id === message.client_generated_id)
          );
          
          if (!existingMessage) {
            // Add to local cache
            if (chat) {
              chat.messages.push(message);
              chat.last_message = message.text;
              chat.last_message_at = message.created_at;
            }
            
            // Update the message cache for instant future access
            const cachedMessages = this.chatMessages.get(chatId) || [];
            cachedMessages.push(message);
            this.chatMessages.set(chatId, cachedMessages);
          }
          
          // Update latest seq tracking
          if (message.seq) {
            this.chatLatestSeq.set(chatId, message.seq);
          }

          // Check if sender was typing BEFORE removing them
          const typingSet = this.typingUsers.get(chatId);
          const wasTyping = typingSet ? typingSet.has(payload.new.sender_id) : false;
          
          // Add typing state to message for smooth transition detection
          (message as any).wasTyping = wasTyping;

          // Only notify callback if this is a NEW message (not a duplicate)
          if (!existingMessage) {
            // Mark as processed in DedupeStore
            this.dedupeStore.add(messageIdKey);
            if (clientGenKey) {
              this.dedupeStore.add(clientGenKey);
            }
            
            const listeners = this.messageCallbacks.get(chatId);
            console.log(`🔍 SimpleChatService - Executing SINGLETON callbacks for chat: ${chatId} - Listeners count: ${listeners?.size || 0} - Message ID: ${message.id}`);
            if (listeners) {
              let callbackIndex = 0;
              listeners.forEach((cb, subId) => {
                console.log(`🔍 SimpleChatService - Executing SINGLETON callback #${callbackIndex + 1} (ID: ${subId}) for chat: ${chatId} - Message ID: ${message.id}`);
                cb(message);
                callbackIndex++;
              });
              
              // Warn if we have more than one callback (shouldn't happen with singleton)
              if (listeners.size > 1) {
                console.warn(`🔍 SimpleChatService - WARNING: Multiple real-time callbacks detected (${listeners.size}) - singleton should prevent this!`);
              }
            }
          }
          
          // THEN stop typing indicator after a delay to allow smooth transition
          if (wasTyping && typingSet) {
            setTimeout(() => {
              typingSet.delete(payload.new.sender_id);
              const typingCallback = this.typingCallbacks.get(chatId);
              if (typingCallback) {
                typingCallback(Array.from(typingSet));
              }
            }, 500); // Wait 500ms for smooth transition to complete
          }
          } catch (error) {
            console.error('SimpleChatService: Error processing message in subscription:', error);
            // Don't throw - keep subscription alive even if one message fails
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`SimpleChatService: Message subscription active for chat ${chatId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`SimpleChatService: Subscription error for chat ${chatId}, will retry...`);
          // Retry subscription after 3 seconds
          setTimeout(() => {
            console.log(`SimpleChatService: Retrying message subscription for chat ${chatId}`);
            const cbMap = this.messageCallbacks.get(chatId);
            if (cbMap && cbMap.size > 0) {
              // Resubscribe if there are still listeners
              this.messageSubscriptions.delete(chatId);
              // Trigger resubscription by calling subscribeToMessages again
              const firstCallback = Array.from(cbMap.values())[0];
              this.subscribeToMessages(chatId, firstCallback);
            }
          }, 3000);
        } else if (status === 'TIMED_OUT') {
          console.error(`SimpleChatService: Subscription timeout for chat ${chatId}, will retry...`);
          // Retry after timeout
          setTimeout(() => {
            console.log(`SimpleChatService: Retrying message subscription after timeout for chat ${chatId}`);
            const cbMap = this.messageCallbacks.get(chatId);
            if (cbMap && cbMap.size > 0) {
              this.messageSubscriptions.delete(chatId);
              const firstCallback = Array.from(cbMap.values())[0];
              this.subscribeToMessages(chatId, firstCallback);
            }
          }, 5000);
        }
      });

      this.messageSubscriptions.set(chatId, subscription);
    }
    
    // Return cleanup function with subscription ID for reliable removal
    return () => {
      console.log(`🔍 SimpleChatService - CLEANUP called - Chat: ${chatId} - Subscription ID: ${subscriptionId}`);
      this.removeSubscription(chatId, subscriptionId);
    };
  }
  
  // Robust subscription removal by ID - works even if callback reference changed
  private removeSubscription(chatId: string, subscriptionId: string): void {
    const cbMap = this.messageCallbacks.get(chatId);
    if (!cbMap) {
      console.log(`🔍 SimpleChatService - No callback map found for chat: ${chatId} during cleanup`);
      return;
    }
    
    const beforeSize = cbMap.size;
    const deleted = cbMap.delete(subscriptionId);
    this.subscriptionIds.delete(subscriptionId);
    
    console.log(`🔍 SimpleChatService - Removed callback from chat: ${chatId} - Deleted: ${deleted} - Callbacks before: ${beforeSize} - Callbacks after: ${cbMap.size} - ID: ${subscriptionId}`);
    
    // Clean up channel subscription if no more listeners
    if (cbMap.size === 0) {
      console.log(`🔍 SimpleChatService - No more callbacks for chat: ${chatId} - Cleaning up Supabase subscription`);
      this.messageCallbacks.delete(chatId);
      const sub = this.messageSubscriptions.get(chatId);
      if (sub) {
        console.log(`🔍 SimpleChatService - Unsubscribing from Supabase channel for chat: ${chatId}`);
        try {
          sub.unsubscribe();
        } catch (error) {
          console.error(`SimpleChatService - Error unsubscribing from chat ${chatId}:`, error);
        }
      }
      this.messageSubscriptions.delete(chatId);
      console.log(`🔍 SimpleChatService - Cleanup complete for chat: ${chatId} - Remaining subscriptions: ${this.messageSubscriptions.size}`);
    }
  }

  // Force cleanup ALL subscriptions for a chat - nuclear option to prevent orphans
  forceCleanupChat(chatId: string): void {
    console.log(`🔍 SimpleChatService - FORCE CLEANUP for chat: ${chatId}`);
    
    // Remove all callbacks for this chat
    const cbMap = this.messageCallbacks.get(chatId);
    if (cbMap) {
      const callbackCount = cbMap.size;
      console.log(`🔍 SimpleChatService - Removing ${callbackCount} callbacks for chat: ${chatId}`);
      
      // Clean up all subscription IDs for this chat
      for (const [subId, subChatId] of this.subscriptionIds.entries()) {
        if (subChatId === chatId) {
          this.subscriptionIds.delete(subId);
        }
      }
      
      this.messageCallbacks.delete(chatId);
    }
    
    // Clean up Supabase subscription
    const sub = this.messageSubscriptions.get(chatId);
    if (sub) {
      console.log(`🔍 SimpleChatService - Force unsubscribing from Supabase channel for chat: ${chatId}`);
      try {
        sub.unsubscribe();
      } catch (error) {
        console.error(`SimpleChatService - Error force unsubscribing from chat ${chatId}:`, error);
      }
      this.messageSubscriptions.delete(chatId);
    }
    
    console.log(`🔍 SimpleChatService - Force cleanup complete for chat: ${chatId} - Remaining subscriptions: ${this.messageSubscriptions.size}`);
  }

  subscribeToTyping(chatId: string, userId: string, onTypingUpdate: (typingUsers: string[]) => void): () => void {
    
    // Initialize typing users set for this chat
    if (!this.typingUsers.has(chatId)) {
      this.typingUsers.set(chatId, new Set());
    }
    
    // Store callback
    this.typingCallbacks.set(chatId, onTypingUpdate);

    const subscription = this.supabase
      .channel(`typing:${chatId}`)
      .on('presence', { event: 'sync' }, () => {
        try {
          const state = subscription.presenceState();
        
        // Extract typing users from presence state
        // The key is a client ID, but we need the user_id from the presence data
        const typingUserIds: string[] = [];
        
        Object.entries(state).forEach(([clientKey, presences]: [string, any[]]) => {
          
          if (presences && presences.length > 0) {
            const presence = presences[0];
            const presenceUserId = presence.user_id;
            const isTyping = presence.typing === true;
            
            
            // Only include if typing and not the current user
            if (isTyping && presenceUserId && presenceUserId !== userId) {
              typingUserIds.push(presenceUserId);
            }
          }
        });
        
        
        // Update typing users
        const typingSet = this.typingUsers.get(chatId)!;
        typingSet.clear();
        typingUserIds.forEach(id => typingSet.add(id));
        
        // Notify callback
        onTypingUpdate(Array.from(typingSet));
        } catch (error) {
          console.error('SimpleChatService: Error in typing sync handler:', error);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        try {
          if (newPresences && newPresences[0]) {
            const presenceUserId = newPresences[0].user_id;
            const isTyping = newPresences[0].typing === true;
            
            // Only add if typing and not the current user
            if (isTyping && presenceUserId && presenceUserId !== userId) {
              const typingSet = this.typingUsers.get(chatId)!;
              typingSet.add(presenceUserId);
              onTypingUpdate(Array.from(typingSet));
            }
          }
        } catch (error) {
          console.error('SimpleChatService: Error in typing join handler:', error);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        try {
          if (leftPresences && leftPresences[0]) {
            const presenceUserId = leftPresences[0].user_id;
            
            if (presenceUserId) {
              const typingSet = this.typingUsers.get(chatId)!;
              typingSet.delete(presenceUserId);
              onTypingUpdate(Array.from(typingSet));
            }
          }
        } catch (error) {
          console.error('SimpleChatService: Error in typing leave handler:', error);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await subscription.track({
            user_id: userId,
            online_at: new Date().toISOString()
          });
        }
      });

    this.typingSubscriptions.set(chatId, subscription);
    
    return () => {
      subscription.unsubscribe();
      this.typingSubscriptions.delete(chatId);
      this.typingUsers.delete(chatId);
      this.typingCallbacks.delete(chatId);
    };
  }

  // Send typing indicator
  async sendTypingIndicator(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    const subscription = this.typingSubscriptions.get(chatId);
    if (!subscription) return;

    try {
      if (isTyping) {
        await subscription.track({
          user_id: userId,
          typing: true,
          online_at: new Date().toISOString()
        });
      } else {
        await subscription.track({
          user_id: userId,
          typing: false,
          online_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('SimpleChatService: Error sending typing indicator:', error);
    }
  }

  // Subscribe to reaction changes for real-time updates
  subscribeToReactions(chatId: string, onReactionUpdate: (messageId: string) => void): () => void {
    
    const subscription = this.supabase
      .channel(`reactions:${chatId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
        filter: `message_id=in.(SELECT id FROM chat_messages WHERE chat_id=${chatId})`
      }, (payload) => {
        try {
          const messageId = payload.new?.message_id || payload.old?.message_id;
          if (messageId) {
            onReactionUpdate(messageId);
          }
        } catch (error) {
          console.error('SimpleChatService: Error processing reaction update:', error);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`SimpleChatService: Reaction subscription active for chat ${chatId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`SimpleChatService: Reaction subscription error for chat ${chatId}`);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }

  // Cleanup all subscriptions
  cleanup() {
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Unsubscribe from all message subscriptions
    this.messageSubscriptions.forEach((subscription, chatId) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('SimpleChatService: Error unsubscribing from messages:', error);
      }
    });
    this.messageSubscriptions.clear();
    this.messageCallbacks.clear();
    
    // Unsubscribe from all typing subscriptions
    this.typingSubscriptions.forEach((subscription, chatId) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('SimpleChatService: Error unsubscribing from typing:', error);
      }
    });
    this.typingSubscriptions.clear();
    
    this.typingUsers.clear();
    this.typingCallbacks.clear();
    
    // NEW: Cleanup DedupeStore (replaces old processedMessages and recentMessageSignatures)
    this.dedupeStore.destroy();
    
    // Clear pending queue
    this.pendingQueue = [];
    
    console.log('SimpleChatService: Cleanup completed successfully');
  }

  // Periodically clean up old tracked data to prevent unbounded growth
  private cleanupOldTracking() {
    // Cleanup dedupe store (happens automatically in DedupeStore)
    const removed = this.dedupeStore.cleanup();
    if (removed > 0) {
      console.log(`SimpleChatService: Cleaned up ${removed} dedupe entries`);
    }
    
    // Clean up old pending messages (remove failed ones after 5 minutes)
    const now = Date.now();
    const MAX_AGE = 5 * 60 * 1000;
    const beforeSize = this.pendingQueue.length;
    
    this.pendingQueue = this.pendingQueue.filter(msg => {
      const age = now - msg.lastAttempt;
      return age < MAX_AGE;
    });
    
    const removedPendingMessages = beforeSize - this.pendingQueue.length;
    if (removedPendingMessages > 0) {
      console.log(`SimpleChatService: Removed ${removedPendingMessages} old pending messages`);
    }
  }

  // NEW: Offline queue management
  private async flushPendingQueue(): Promise<void> {
    if (this.isFlushingQueue || this.pendingQueue.length === 0) {
      return;
    }
    
    this.isFlushingQueue = true;
    console.log(`SimpleChatService: Flushing ${this.pendingQueue.length} pending messages`);
    
    // Process queue in order
    const queue = [...this.pendingQueue];
    this.pendingQueue = [];
    
    for (const pending of queue) {
      try {
        // Try to send with exponential backoff
        const maxDelay = 30000; // Max 30 seconds
        const delay = Math.min(1000 * Math.pow(2, pending.retries), maxDelay);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const { message, error } = await this.sendMessage(
          pending.chatId,
          pending.senderId,
          pending.text,
          pending.replyToId,
          pending.mediaUrls
        );
        
        if (error) {
          // Re-add to queue if retries remaining
          if (pending.retries < 5) {
            pending.retries++;
            pending.lastAttempt = Date.now();
            this.pendingQueue.push(pending);
          } else {
            console.error(`SimpleChatService: Gave up on pending message after 5 retries:`, error);
          }
        } else {
          console.log(`SimpleChatService: Successfully sent pending message ${pending.clientGenId}`);
        }
      } catch (error) {
        console.error('SimpleChatService: Error flushing pending message:', error);
        // Re-add to queue
        if (pending.retries < 5) {
          pending.retries++;
          pending.lastAttempt = Date.now();
          this.pendingQueue.push(pending);
        }
      }
    }
    
    this.isFlushingQueue = false;
  }

  // NEW: Add message to offline queue
  private addToPendingQueue(pending: PendingMessage): void {
    this.pendingQueue.push(pending);
    console.log(`SimpleChatService: Added message to pending queue (${this.pendingQueue.length} pending)`);
  }

  // NEW: Get pending messages (for UI display)
  getPendingMessages(): PendingMessage[] {
    return [...this.pendingQueue];
  }

  // NEW: Delivery lifecycle - Mark messages as delivered
  async markMessagesAsDelivered(chatId: string, receiverId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.rpc('mark_messages_as_delivered', {
        p_chat_id: chatId,
        p_receiver_id: receiverId
      });
      
      if (error) {
        console.error('SimpleChatService: Error marking messages as delivered:', error);
        return { error };
      }
      
      // Invalidate cache to force reload with updated status
      this.chatMessages.delete(chatId);
      
      return { error: null };
    } catch (error) {
      console.error('SimpleChatService: Error in markMessagesAsDelivered:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // NEW: Delivery lifecycle - Mark messages as read (overrides existing method)
  async markMessagesAsRead(chatId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.rpc('mark_messages_as_read', {
        p_chat_id: chatId,
        p_user_id: userId
      });
      
      if (error) {
        console.error('SimpleChatService: Error marking messages as read:', error);
        return { error };
      }
      
      // Invalidate cache to force reload with updated status
      this.chatMessages.delete(chatId);
      
      return { error: null };
    } catch (error) {
      console.error('SimpleChatService: Error in markMessagesAsRead:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // NEW: Get latest seq for a chat
  async getLatestSeq(chatId: string): Promise<number> {
    // Check cache first
    const cached = this.chatLatestSeq.get(chatId);
    if (cached !== undefined) {
      return cached;
    }
    
    try {
      const { data, error } = await this.supabase.rpc('get_latest_seq', {
        p_chat_id: chatId
      });
      
      if (error) {
        console.error('SimpleChatService: Error getting latest seq:', error);
        return 0;
      }
      
      const latestSeq = data || 0;
      this.chatLatestSeq.set(chatId, latestSeq);
      return latestSeq;
    } catch (error) {
      console.error('SimpleChatService: Error in getLatestSeq:', error);
      return 0;
    }
  }

  // Get user's contacts from the database (only actual connections)
  async getContacts(userId: string): Promise<{ contacts: any[]; error: Error | null }> {
    try {
      
      // Get connections where the user is either user1 or user2
      const { data: connections, error: connectionsError } = await this.supabase
        .from('connections')
        .select(`
          id,
          user1_id,
          user2_id,
          status,
          created_at
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        // If it's an RLS policy error, return empty contacts instead of failing
        if (connectionsError.message?.includes('policy') || connectionsError.message?.includes('permission')) {
          console.warn('SimpleChatService: RLS policy blocked connections query, returning empty list');
          return { contacts: [], error: null };
        }
        return { contacts: [], error: connectionsError };
      }


      // Extract the connected user IDs (not the current user)
      const connectedUserIds = new Set<string>();
      
      (connections || []).forEach(connection => {
        if (connection.user1_id === userId) {
          connectedUserIds.add(connection.user2_id);
        } else if (connection.user2_id === userId) {
          connectedUserIds.add(connection.user1_id);
        }
      });

      // Get account details for connected users
      const connectedUsers = new Map();
      if (connectedUserIds.size > 0) {
        const { data: accountsData, error: accountsError } = await this.supabase
          .from('accounts')
          .select('id, name, profile_pic, connect_id, bio, dob')
          .in('id', Array.from(connectedUserIds));

        if (!accountsError && accountsData) {
          accountsData.forEach(account => {
            connectedUsers.set(account.id, {
              id: account.id,
              name: account.name,
              profile_pic: account.profile_pic,
              connect_id: account.connect_id,
              bio: account.bio,
              dob: account.dob,
              is_blocked: false
            });
          });
        } else {
          console.warn('SimpleChatService: Failed to fetch account details for connections:', accountsError);
        }
      }

      // Convert map to array and sort by name
      const contacts = Array.from(connectedUsers.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      return { contacts, error: null };
    } catch (error) {
      console.error('Error in getContacts:', error);
      return { contacts: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get user's chats (now loads from Supabase with caching)
  async getUserChats(): Promise<{ chats: SimpleChat[]; error: Error | null }> {
    const userId = this.currentAccount.id;
    try {
      // Check cache first
      const cachedChats = this.userChats.get(userId);
      const cacheTimestamp = this.userChatsTimestamp.get(userId);
      const now = Date.now();
      
      if (cachedChats && cacheTimestamp && (now - cacheTimestamp) < this.CACHE_DURATION) {
        return { chats: cachedChats, error: null };
      }

      return await this.withRetryCompat(async () => {
        return await this._getUserChatsInternal(userId);
      });
    } catch (error) {
      console.error('Error in getUserChats after retries:', error);
      return { chats: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  private async _getUserChatsInternal(userId: string): Promise<{ chats: SimpleChat[]; error: Error | null }> {
    try {
      // Get user's chats from Supabase with last_read_at
      const { data: userChats, error: userChatsError } = await this.supabase
        .from('chat_participants')
        .select('chat_id, last_read_at')
        .eq('user_id', userId);

      if (userChatsError) {
        console.error('Error getting user chat participants:', userChatsError);
        return { chats: [], error: userChatsError };
      }

      if (!userChats || userChats.length === 0) {
        return { chats: [], error: null };
      }

      // Get the actual chat details
      const chatIds = userChats.map(chat => chat.chat_id);
      const { data: chatsData, error: chatsError } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, photo, created_by, created_at, updated_at, last_message_at
        `)
        .in('id', chatIds)
        .order('last_message_at', { ascending: false });

      if (chatsError) {
        console.error('Error loading chats from Supabase:', chatsError);
        return { chats: [], error: chatsError };
      }

      // Bulk load all participants for all chats at once
      const allChatIds = chatsData?.map(chat => chat.id) || [];
      let allParticipants: Map<string, Array<{ id: string; name: string; profile_pic?: string }>> = new Map();
      let allUnreadCounts: Map<string, number> = new Map();

      if (allChatIds.length > 0) {
        // Get all participants for all chats in one query
        const { data: allParticipantData, error: allParticipantsError } = await this.supabase
          .from('chat_participants')
          .select('chat_id, user_id, last_read_at')
          .in('chat_id', allChatIds);

        if (!allParticipantsError && allParticipantData) {
          // Group participants by chat_id
          const participantsByChat = new Map<string, string[]>();
          const lastReadByChat = new Map<string, string>();
          
          allParticipantData.forEach(participant => {
            if (!participantsByChat.has(participant.chat_id)) {
              participantsByChat.set(participant.chat_id, []);
            }
            participantsByChat.get(participant.chat_id)!.push(participant.user_id);
            
            // Store last_read_at for the current user
            if (participant.user_id === userId) {
              lastReadByChat.set(participant.chat_id, participant.last_read_at);
            }
          });

          // Get all unique user IDs
          const allUserIds = [...new Set(allParticipantData.map(p => p.user_id))];
          
          // Fetch account details for all users in one query
          const { data: allAccountsData, error: allAccountsError } = await this.supabase
            .from('accounts')
            .select('id, name, profile_pic')
            .in('id', allUserIds);

          if (!allAccountsError && allAccountsData) {
            const accountsMap = new Map(allAccountsData.map(account => [account.id, account]));
            
            // Build participants map for each chat
            participantsByChat.forEach((userIds, chatId) => {
              const participants = userIds.map(userId => {
                const account = accountsMap.get(userId);
                return account ? {
                  id: account.id,
                  name: formatNameForDisplay(account.name),
                  profile_pic: account.profile_pic || undefined
                } : {
                  id: userId,
                  name: 'Unknown User',
                  profile_pic: undefined
                };
              });
              allParticipants.set(chatId, participants);
            });
          }

          // Bulk calculate unread counts and get last messages for all chats
          const unreadCountPromises = allChatIds.map(async (chatId) => {
            const lastReadAt = lastReadByChat.get(chatId);
            let unreadCount = 0;
            let lastMessage = null;

            // Get unread count
            if (lastReadAt) {
              const { count, error: unreadError } = await this.supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('chat_id', chatId)
                .gt('created_at', lastReadAt)
                .neq('sender_id', userId);
              
              unreadCount = (!unreadError && count !== null) ? count : 0;
            }

            // Get last message with attachments (only non-deleted messages)
            // NEW: Order by seq for deterministic ordering
            const { data: lastMessageData, error: lastMessageError } = await this.supabase
              .from('chat_messages')
              .select(`
                id, message_text, sender_id, created_at, seq, status,
                attachments:attachments(id, file_url, file_type, file_size, thumbnail_url, width, height, created_at)
              `)
              .eq('chat_id', chatId)
              .is('deleted_at', null)
              .order('seq', { ascending: false, nullsFirst: false })
              .order('created_at', { ascending: false }) // Fallback for legacy messages
              .limit(1)
              .single();

            if (!lastMessageError && lastMessageData) {
              // Get sender name from participants
              const sender = allParticipants.get(chatId)?.find(p => p.id === lastMessageData.sender_id);
              const senderName = lastMessageData.sender_id === userId ? 'You' : (sender?.name || 'Unknown');
              
              lastMessage = {
                id: lastMessageData.id,
                chat_id: chatId,
                sender_id: lastMessageData.sender_id,
                sender_name: senderName,
                text: lastMessageData.message_text,
                created_at: lastMessageData.created_at,
                attachments: lastMessageData.attachments || []
              };
            }
            
            return { chatId, count: unreadCount, lastMessage };
          });

          const unreadResults = await Promise.all(unreadCountPromises);
          unreadResults.forEach(({ chatId, count, lastMessage }) => {
            allUnreadCounts.set(chatId, count);
            // Store last message in the chat object
            const chat = chatsData?.find(c => c.id === chatId);
            if (chat && lastMessage) {
              (chat as any).lastMessage = lastMessage;
            }
          });
        }
      }

      // Build the final chats array
      const chats: SimpleChat[] = [];
      for (const chat of chatsData || []) {
        const participants = allParticipants.get(chat.id) || [];
        const unreadCount = allUnreadCounts.get(chat.id) || 0;

        // Get the last message if it was loaded
        const lastMessage = (chat as any).lastMessage;
        
        chats.push({
          id: chat.id,
          type: chat.type,
          name: chat.name,
          photo: chat.photo,
          participants,
          messages: lastMessage ? [lastMessage] : [], // Include last message if available
          last_message: lastMessage?.text,
          last_message_at: chat.last_message_at,
          unreadCount
        });
      }

      // Update in-memory chats and cache
      chats.forEach(chat => {
        this.chats.set(chat.id, chat);
      });
      
      // Cache the user's chats with timestamp
      this.userChats.set(userId, chats);
      this.userChatsTimestamp.set(userId, Date.now());
      
      return { chats, error: null };
    } catch (error) {
      console.error('Error in getUserChats:', error);
      return { chats: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Mark messages as read for a user in a chat
  async markMessagesAsRead(chatId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking messages as read:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Find existing direct chat between two users
  async findExistingDirectChat(userId1: string, userId2: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {

      // Query for direct chats where both users are participants
      const { data: chats, error } = await this.supabase
        .from('chats')
        .select(`
          id,
          type,
          name,
          created_at,
          chat_participants!inner(user_id)
        `)
        .eq('type', 'direct')
        .in('chat_participants.user_id', [userId1, userId2]);

      if (error) {
        console.error('Error finding existing chats:', error);
        return { chat: null, error };
      }

      // Find a chat that has both users as participants
      for (const chat of chats || []) {
        const { data: participants, error: participantsError } = await this.supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chat.id);

        if (participantsError) continue;

        const participantIds = participants?.map(p => p.user_id) || [];
        if (participantIds.includes(userId1) && participantIds.includes(userId2)) {
          // Found existing chat, convert to SimpleChat format
          const { chat: fullChat, error: chatError } = await this.getChatById(chat.id);
          if (!chatError && fullChat) {
            return { chat: fullChat, error: null };
          }
        }
      }

      return { chat: null, error: null };
    } catch (error) {
      console.error('Error in findExistingDirectChat:', error);
      return { chat: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Create a direct chat (now saves to Supabase)
  async createDirectChat(otherUserId: string, currentUserId: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {

      // Create chat in Supabase
      const { data: chatData, error: chatError } = await this.supabase
        .from('chats')
        .insert({
          type: 'direct',
          name: null,
          created_by: currentUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat in Supabase:', chatError);
        return { chat: null, error: chatError };
      }

      // Add participants to Supabase
      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert([
          { chat_id: chatData.id, user_id: currentUserId },
          { chat_id: chatData.id, user_id: otherUserId }
        ]);

      if (participantsError) {
        console.error('Error adding participants to Supabase:', participantsError);
        return { chat: null, error: participantsError };
      }
      
      const chat: SimpleChat = {
        id: chatData.id,
        type: 'direct',
        participants: [
          {
            id: currentUserId,
            name: 'You', // We'll get this from accounts table later
            profile_pic: undefined
          },
          {
            id: otherUserId,
            name: otherUserId === '569b346c-3e6e-48cd-a432-190dbfe78120' ? 'Chandan Saddi' : 'Frizzy Valiyff',
            profile_pic: otherUserId === '569b346c-3e6e-48cd-a432-190dbfe78120' 
              ? 'https://rxlqtyfhsocxnsnnnlwl.supabase.co/storage/v1/object/public/avatars/avatars/569b346c-3e6e-48cd-a432-190dbfe78120.jpeg'
              : 'https://rxlqtyfhsocxnsnnnlwl.supabase.co/storage/v1/object/public/avatars/avatars/d5943fed-3a45-45a9-a871-937bad29cedb.jpeg'
          }
        ],
        messages: []
      };

      // Store the chat in memory
      this.chats.set(chatData.id, chat);
      
      return { chat, error: null };
    } catch (error) {
      console.error('SimpleChatService: Error creating chat:', error);
      return { chat: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Create a group chat
  async createGroupChat(name: string, participantIds: string[], photo?: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      
      // Create chat in Supabase
      const { data: chatData, error: chatError } = await this.supabase
        .from('chats')
        .insert({
          type: 'group',
          name: name,
          photo: photo ?? null,
          created_by: participantIds[0]
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating group chat in Supabase:', chatError);
        return { chat: null, error: chatError };
      }

      // Add participants to chat_participants table
      const participantInserts = participantIds.map(userId => ({
        chat_id: chatData.id,
        user_id: userId
      }));

      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantsError) {
        console.error('Error adding participants to group chat:', participantsError);
        return { chat: null, error: participantsError };
      }

      // Get participant details
      const { data: participantsData, error: participantsError2 } = await this.supabase
        .from('chat_participants')
        .select(`
          user_id,
          accounts!inner(id, name, profile_pic)
        `)
        .eq('chat_id', chatData.id);

      if (participantsError2) {
        console.error('Error loading group chat participants:', participantsError2);
        return { chat: null, error: participantsError2 };
      }

      type ParticipantRow2 = { accounts: { id: string; name: string; profile_pic?: string | null } };
      const participants = (participantsData || []).map((p: ParticipantRow2) => ({
        id: p.accounts.id,
        name: formatNameForDisplay(p.accounts.name),
        profile_pic: p.accounts.profile_pic || undefined
      }));

      const chat: SimpleChat = {
        id: chatData.id,
        type: 'group',
        name: name,
        participants,
        messages: []
      };

      // Store in memory
      this.chats.set(chat.id, chat);

      return { chat, error: null };
    } catch (error) {
      console.error('SimpleChatService: Error creating group chat:', error);
      return { chat: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get a chat from cache only (no database query)
  getChatFromCache(chatId: string): SimpleChat | null {
    return this.chats.get(chatId) || null;
  }

  // Get a specific chat by ID
  async getChatById(chatId: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      // First check local cache
      const cachedChat = this.chats.get(chatId);
      if (cachedChat) {
        return { chat: cachedChat, error: null };
      }

      // If not in cache, query the database
      
      // Get chat details
      const { data: chatData, error: chatError } = await this.supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError || !chatData) {
        console.error('Error fetching chat:', chatError);
        return { chat: null, error: new Error('Chat not found') };
      }

      // Get participants
      const { data: participantsData, error: participantsError } = await this.supabase
        .from('chat_participants')
        .select(`
          user_id,
          accounts!inner(id, name, profile_pic)
        `)
        .eq('chat_id', chatId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return { chat: null, error: participantsError };
      }

      type ParticipantRow3 = { accounts: { id: string; name: string; profile_pic?: string | null } };
      const participants = (participantsData || []).map((p: ParticipantRow3) => ({
        id: p.accounts.id,
        name: formatNameForDisplay(p.accounts.name),
        profile_pic: p.accounts.profile_pic || undefined
      }));

      // Convert to SimpleChat format
      const simpleChat: SimpleChat = {
        id: chatData.id,
        type: chatData.type,
        name: chatData.name || undefined,
        photo: chatData.photo || undefined,
        participants: participants,
        messages: [],
        unreadCount: 0,
        last_message: chatData.last_message || undefined,
        last_message_at: chatData.last_message_at || undefined
      };


      // Cache the result
      this.chats.set(chatId, simpleChat);

      return { chat: simpleChat, error: null };
    } catch (error) {
      console.error('Error in getChatById:', error);
      return { chat: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get message reactions for a batch of messages
  async getMessageReactions(messageIds: string[]): Promise<Record<string, any[]>> {
    if (!messageIds.length) return {};
    
    try {
      const { data, error } = await this.supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);
      
      if (error) {
        console.error('Error loading message reactions:', error);
        return {};
      }
      
      // Group reactions by message_id
      const reactionsByMessage: Record<string, any[]> = {};
      (data || []).forEach(reaction => {
        if (!reactionsByMessage[reaction.message_id]) {
          reactionsByMessage[reaction.message_id] = [];
        }
        reactionsByMessage[reaction.message_id].push(reaction);
      });
      
      return reactionsByMessage;
    } catch (error) {
      console.error('Error in getMessageReactions:', error);
      return {};
    }
  }

  // Get message attachments for a batch of messages
  async getMessageAttachments(messageIds: string[]): Promise<Record<string, any[]>> {
    if (!messageIds.length) return {};
    
    try {
      const { data, error } = await this.supabase
        .from('attachments')
        .select('*')
        .in('message_id', messageIds);
      
      if (error) {
        console.error('Error loading message attachments:', error);
        return {};
      }
      
      // Group attachments by message_id
      const attachmentsByMessage: Record<string, any[]> = {};
      (data || []).forEach(attachment => {
        if (!attachmentsByMessage[attachment.message_id]) {
          attachmentsByMessage[attachment.message_id] = [];
        }
        attachmentsByMessage[attachment.message_id].push(attachment);
      });
      
      return attachmentsByMessage;
    } catch (error) {
      console.error('Error in getMessageAttachments:', error);
      return {};
    }
  }

  // Get reply message details for messages that have reply_to_message_id
  async getReplyMessageDetails(messageIds: string[]): Promise<Record<string, any>> {
    if (!messageIds.length) return {};
    
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('id, message_text, sender_id, created_at')
        .in('id', messageIds);
      
      if (error) {
        console.error('Error loading reply message details:', error);
        return {};
      }
      
      // Create lookup map
      const replyDetails: Record<string, any> = {};
      (data || []).forEach(msg => {
        replyDetails[msg.id] = msg;
      });
      
      return replyDetails;
    } catch (error) {
      console.error('Error in getReplyMessageDetails:', error);
      return {};
    }
  }

  // Get chat messages (now loads from Supabase with seq-based ordering and pagination)
  async getChatMessages(
    chatId: string, 
    beforeSeq?: number, 
    limit: number = 50
  ): Promise<{ messages: SimpleMessage[]; error: Error | null; hasMore: boolean }> {
    const userId = this.currentAccount.id;
    try {
      // Don't use cache for paginated queries (they need fresh data)
      if (!beforeSeq) {
        // Check cache first for initial load
        const cachedMessages = this.chatMessages.get(chatId);
        if (cachedMessages) {
          return { messages: cachedMessages, error: null, hasMore: false };
        }
      }
      
      const chat = this.chats.get(chatId);
      if (!chat) {
        console.error('getChatMessages: Chat not found in cache for ID:', chatId);
        return { messages: [], error: new Error('Chat not found'), hasMore: false };
      }

      // Build query with keyset pagination
      // TEMPORARY: Simplified query to fix hanging issue
      let query = this.supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .is('deleted_at', null);
      
      // Add keyset pagination filter
      if (beforeSeq !== undefined) {
        query = query.lt('seq', beforeSeq);
      }
      
      // Order by seq (deterministic ordering), falling back to created_at for legacy messages
      // Fetch one extra to check if there are more
      query = query.order('seq', { ascending: false, nullsFirst: false })
                   .order('created_at', { ascending: false })
                   .limit(limit + 1);
      
      const { data: messagesData, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error loading messages from Supabase:', fetchError);
        return { messages: [], error: fetchError, hasMore: false };
      }

      // Check if there are more messages
      const hasMore = messagesData && messagesData.length > limit;
      const messagesDataToDisplay = messagesData ? messagesData.slice(0, limit) : [];
      
      // Messages come in DESC order (newest first), reverse for display (oldest first)
      const orderedData = [...messagesDataToDisplay].reverse();
      
      // Extract IDs for parallel loading of related data
      const messageIds = orderedData.map(msg => msg.id);
      const replyToIds = orderedData
        .filter(msg => msg.reply_to_message_id)
        .map(msg => msg.reply_to_message_id);
      
      // Load related data in parallel (much faster than joins)
      const [reactionsData, attachmentsData, replyDetailsData] = await Promise.all([
        this.getMessageReactions(messageIds),
        this.getMessageAttachments(messageIds), 
        this.getReplyMessageDetails(replyToIds)
      ]);
      
      // Convert Supabase messages to SimpleMessage format with enriched data
      const messages: SimpleMessage[] = orderedData.map(msg => {
        // Get sender info from chat participants
        const sender = chat.participants.find(p => p.id === msg.sender_id);
        
        // Update latest seq tracking
        if (msg.seq && (!this.chatLatestSeq.has(chatId) || msg.seq > this.chatLatestSeq.get(chatId)!)) {
          this.chatLatestSeq.set(chatId, msg.seq);
        }
        
        // Get related data for this message
        const reactions = reactionsData[msg.id] || [];
        const attachments = attachmentsData[msg.id] || [];
        const replyDetail = replyDetailsData[msg.reply_to_message_id];
        
        return {
          id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          sender_name: sender?.name || (msg.sender_id === userId ? 'You' : 'Other'),
          sender_profile_pic: sender?.profile_pic || undefined,
          text: msg.message_text || '',
          created_at: msg.created_at,
          seq: msg.seq || undefined,
          client_generated_id: msg.client_generated_id || undefined,
          status: msg.status || undefined,
          reply_to_message_id: msg.reply_to_message_id || null,
          reply_to_message: replyDetail ? {
            id: replyDetail.id,
            chat_id: msg.chat_id,
            sender_id: replyDetail.sender_id,
            sender_name: chat.participants.find(p => p.id === replyDetail.sender_id)?.name || 'Unknown',
            sender_profile_pic: chat.participants.find(p => p.id === replyDetail.sender_id)?.profile_pic || undefined,
            text: replyDetail.message_text || '',
            created_at: replyDetail.created_at
          } : null,
          media_urls: msg.media_urls || undefined,
          attachments: attachments,
          reactions: reactions,
          deleted_at: msg.deleted_at || null
        };
      });

      // Cache only the initial load (not paginated results)
      if (!beforeSeq) {
        this.chatMessages.set(chatId, messages);
        // Update in-memory chat with messages from Supabase
        chat.messages = messages;
      }
      
      return { messages, error: null, hasMore };
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      return { messages: [], error: error instanceof Error ? error : new Error('Unknown error'), hasMore: false };
    }
  }

  // Delete a chat
  async deleteChat(chatId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Delete from Supabase
      const { error: deleteError } = await this.supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (deleteError) {
        console.error('Error deleting chat from Supabase:', deleteError);
        return { success: false, error: deleteError };
      }

      // Remove from in-memory cache
      this.chats.delete(chatId);
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteChat:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Add reaction to a message
  async addReaction(messageId: string, userId: string, emoji: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji });
      return { error };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Remove reaction from a message
  async removeReaction(messageId: string, userId: string, emoji: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('message_reactions')
        .delete()
        .match({ message_id: messageId, user_id: userId, emoji });
      return { error };
    } catch (error) {
      console.error('Error removing reaction:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Soft delete a message
  async deleteMessage(messageId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .match({ id: messageId, sender_id: userId });
      return { error };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Send a message (now IDEMPOTENT with client_generated_id and offline queue support)
  async sendMessage(
    chatId: string, 
    messageText: string,
    replyToMessageId?: string,
    mediaUrls?: string[]
  ): Promise<{ message: SimpleMessage | null; error: Error | null }> {
    const senderId = this.currentAccount.id;
    try {
      // Check if offline - add to queue instead
      if (!isOnline()) {
        const clientGenId = crypto.randomUUID();
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const pending: PendingMessage = {
          chatId,
          senderId,
          text: messageText,
          clientGenId,
          replyToId: replyToMessageId,
          mediaUrls,
          retries: 0,
          lastAttempt: Date.now(),
          tempId
        };
        
        this.addToPendingQueue(pending);
        
        // Return optimistic message for UI
        const optimisticMessage: SimpleMessage = {
          id: tempId,
          chat_id: chatId,
          sender_id: senderId,
          sender_name: 'You',
          text: messageText,
          created_at: new Date().toISOString(),
          client_generated_id: clientGenId,
          status: 'sent',
          reply_to_message_id: replyToMessageId || null,
          media_urls: mediaUrls,
          reactions: [],
          deleted_at: null
        };
        
        return { message: optimisticMessage, error: null };
      }
      
      let chat = this.chats.get(chatId);
      if (!chat) {
        // Chat not in cache, try to load it
        const { chat: loadedChat, error: loadError } = await this.getChatById(chatId);
        if (loadError || !loadedChat) {
          console.error('SimpleChatService: Failed to load chat:', loadError);
          return { message: null, error: new Error('Chat not found and could not be loaded') };
        }
        chat = loadedChat;
      }

      // Generate client_generated_id for idempotency
      const clientGenId = crypto.randomUUID();
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create optimistic message for instant UI feedback
      const optimisticMessage: SimpleMessage = {
        id: tempId,
        chat_id: chatId,
        sender_id: senderId,
        sender_name: 'You',
        sender_profile_pic: undefined,
        text: messageText,
        created_at: new Date().toISOString(),
        client_generated_id: clientGenId, // NEW
        status: 'sent', // NEW
        reply_to_message_id: replyToMessageId || null,
        media_urls: mediaUrls || undefined,
        reactions: [],
        deleted_at: null
      };

      // Add optimistic message immediately for instant sender feedback
      chat.messages.push(optimisticMessage);
      chat.last_message = messageText;
      chat.last_message_at = optimisticMessage.created_at;
      
      // Update the message cache immediately for instant UI updates
      const cachedMessages = this.chatMessages.get(chatId) || [];
      cachedMessages.push(optimisticMessage);
      this.chatMessages.set(chatId, cachedMessages);
      
      // Trigger immediate UI update for the sender - SINGLETON: Only one callback should exist
      const callbacks = this.messageCallbacks.get(chatId);
      console.log(`🔍 SimpleChatService - Sending optimistic message - Chat: ${chatId} - Message ID: ${optimisticMessage.id} - Callbacks: ${callbacks?.size || 0}`);
      if (callbacks && callbacks.size > 0) {
        // SINGLETON: Should only be one callback, but iterate just in case
        let callbackIndex = 0;
        callbacks.forEach((callback, subId) => {
          console.log(`🔍 SimpleChatService - Executing SINGLETON optimistic callback #${callbackIndex + 1} (ID: ${subId}) for chat: ${chatId} - Message ID: ${optimisticMessage.id}`);
          callback(optimisticMessage);
          callbackIndex++;
        });
        
        // Warn if we have more than one callback (shouldn't happen with singleton)
        if (callbacks.size > 1) {
          console.warn(`🔍 SimpleChatService - WARNING: Multiple callbacks detected (${callbacks.size}) - singleton should prevent this!`);
        }
      }

      // Save message to Supabase with idempotency key
      const { data: messageData, error: insertError } = await this.supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          message_text: messageText,
          client_generated_id: clientGenId, // NEW: Idempotency key
          status: 'sent', // NEW: Initial status
          reply_to_message_id: replyToMessageId || null,
          media_urls: mediaUrls || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        // Check if this is an idempotency conflict (duplicate client_generated_id)
        if (insertError.code === '23505' && insertError.message?.includes('client_generated_id')) {
          console.log('SimpleChatService: Idempotency conflict detected, fetching existing message');
          
          // Fetch the existing message
          const { data: existing, error: fetchError } = await this.supabase
            .from('chat_messages')
            .select('*')
            .eq('sender_id', senderId)
            .eq('client_generated_id', clientGenId)
            .single();
          
          if (!fetchError && existing) {
            // Replace optimistic message with real message
            const realMessage: SimpleMessage = {
              id: existing.id,
              chat_id: chatId,
              sender_id: senderId,
              sender_name: 'You',
              text: messageText,
              created_at: existing.created_at,
              seq: existing.seq,
              client_generated_id: clientGenId,
              status: existing.status || 'sent',
              reply_to_message_id: existing.reply_to_message_id,
              media_urls: existing.media_urls,
              reactions: [],
              deleted_at: existing.deleted_at
            };
            
            // Replace in cache
            const messageIndex = chat.messages.findIndex(m => m.id === optimisticMessage.id);
            if (messageIndex > -1) {
              chat.messages[messageIndex] = realMessage;
            }
            
            const cacheIndex = cachedMessages.findIndex(m => m.id === optimisticMessage.id);
            if (cacheIndex > -1) {
              cachedMessages[cacheIndex] = realMessage;
              this.chatMessages.set(chatId, cachedMessages);
            }
            
            // Mark as processed to prevent duplicate from realtime
            this.dedupeStore.add(realMessage.id);
            this.dedupeStore.add(createCompositeKey(chatId, senderId, clientGenId));
            
            return { message: realMessage, error: null };
          }
        }
        
        console.error('Error saving message to Supabase:', insertError);
        
        // Add to pending queue for retry
        const pending: PendingMessage = {
          chatId,
          senderId,
          text: messageText,
          clientGenId,
          replyToId: replyToMessageId,
          mediaUrls,
          retries: 0,
          lastAttempt: Date.now(),
          tempId
        };
        this.addToPendingQueue(pending);
        
        return { message: optimisticMessage, error: insertError };
      }

      // Replace optimistic message with real message
      const realMessage: SimpleMessage = {
        id: messageData.id,
        chat_id: chatId,
        sender_id: senderId,
        sender_name: 'You',
        sender_profile_pic: undefined,
        text: messageText,
        created_at: messageData.created_at,
        seq: messageData.seq, // NEW
        client_generated_id: clientGenId, // NEW
        status: messageData.status || 'sent', // NEW
        reply_to_message_id: messageData.reply_to_message_id || null,
        media_urls: messageData.media_urls || undefined,
        reactions: [],
        deleted_at: messageData.deleted_at || null
      };
      
      // Update latest seq tracking
      if (realMessage.seq) {
        this.chatLatestSeq.set(chatId, realMessage.seq);
      }
      
      // Replace optimistic message with real message
      const messageIndex = chat.messages.findIndex(m => m.id === optimisticMessage.id);
      if (messageIndex > -1) {
        chat.messages[messageIndex] = realMessage;
      }
      
      const cacheIndex = cachedMessages.findIndex(m => m.id === optimisticMessage.id);
      if (cacheIndex > -1) {
        cachedMessages[cacheIndex] = realMessage;
        this.chatMessages.set(chatId, cachedMessages);
      }

      // Mark this message as processed to prevent duplicate from subscription
      this.dedupeStore.add(realMessage.id);
      this.dedupeStore.add(createCompositeKey(chatId, senderId, clientGenId));
      
      return { message: realMessage, error: null };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      // Add to pending queue for retry on any error
      if (error instanceof Error && error.message.includes('network')) {
        const pending: PendingMessage = {
          chatId,
          senderId,
          text: messageText,
          clientGenId: crypto.randomUUID(),
          replyToId: replyToMessageId,
          mediaUrls,
          retries: 0,
          lastAttempt: Date.now(),
          tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        this.addToPendingQueue(pending);
      }
      
      return { message: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // ===== CONNECTION MANAGEMENT FUNCTIONS =====

  // Check if two users are connected
  async areUsersConnected(userId1: string, userId2: string): Promise<{ connected: boolean; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .rpc('are_users_connected', {
          user1_id: userId1,
          user2_id: userId2
        });

      if (error) {
        console.error('Error checking connection status:', error);
        return { connected: false, error };
      }

      return { connected: data || false, error: null };
    } catch (error) {
      console.error('Error in areUsersConnected:', error);
      return { connected: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get connection status between two users
  async getConnectionStatus(userId1: string, userId2: string): Promise<{ status: string; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_connection_status', {
          user1_id: userId1,
          user2_id: userId2
        });

      if (error) {
        console.error('Error getting connection status:', error);
        return { status: 'none', error };
      }

      return { status: data || 'none', error: null };
    } catch (error) {
      console.error('Error in getConnectionStatus:', error);
      return { status: 'none', error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Add a connection (send friend request)
  async addConnection(userId: string, connectedUserId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('connections')
        .insert({
          user1_id: userId,
          user2_id: connectedUserId,
          status: 'pending'
        });

      if (error) {
        console.error('Error adding connection:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in addConnection:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Accept a connection (accept friend request)
  async acceptConnection(userId: string, connectedUserId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('user1_id', connectedUserId)
        .eq('user2_id', userId);

      if (error) {
        console.error('Error accepting connection:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in acceptConnection:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Remove a connection (unfriend)
  async removeConnection(userId: string, connectedUserId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Remove both directions of the connection
      const { error: error1 } = await this.supabase
        .from('connections')
        .delete()
        .eq('user1_id', userId)
        .eq('user2_id', connectedUserId);

      const { error: error2 } = await this.supabase
        .from('connections')
        .delete()
        .eq('user1_id', connectedUserId)
        .eq('user2_id', userId);

      if (error1 || error2) {
        console.error('Error removing connection:', error1 || error2);
        return { success: false, error: error1 || error2 };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in removeConnection:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get user's connections (friends) - bidirectional
  async getUserConnections(userId: string): Promise<{ connections: any[]; error: Error | null }> {
    try {
      
      const { data, error } = await this.supabase
        .rpc('get_user_bidirectional_connections', {
          user_id: userId,
          status_filter: 'accepted'
        });


      if (error) {
        console.error('Error getting user connections:', error);
        return { connections: [], error };
      }

      return { connections: data || [], error: null };
    } catch (error) {
      console.error('Error in getUserConnections:', error);
      return { connections: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get mutual connections count
  async getMutualConnectionsCount(userId1: string, userId2: string): Promise<{ count: number; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_mutual_connections_count', {
          user1_id: userId1,
          user2_id: userId2
        });

      if (error) {
        console.error('Error getting mutual connections count:', error);
        return { count: 0, error };
      }

      return { count: data || 0, error: null };
    } catch (error) {
      console.error('Error in getMutualConnectionsCount:', error);
      return { count: 0, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get mutual connections (up to limit)
  async getMutualConnections(userId1: string, userId2: string, limit: number = 3): Promise<{ connections: any[]; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_mutual_connections', {
          user1_id: userId1,
          user2_id: userId2,
          limit_count: limit
        });

      if (error) {
        console.error('Error getting mutual connections:', error);
        return { connections: [], error };
      }

      return { connections: data || [], error: null };
    } catch (error) {
      console.error('Error in getMutualConnections:', error);
      return { connections: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Hide a chat (for when users are no longer connected)
  async hideChat(chatId: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Add a hidden flag to chat_participants for this user
      const { error } = await this.supabase
        .from('chat_participants')
        .update({ hidden: true })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error hiding chat:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in hideChat:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Show a chat (for when users reconnect)
  async showChat(chatId: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Remove the hidden flag from chat_participants for this user
      const { error } = await this.supabase
        .from('chat_participants')
        .update({ hidden: false })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error showing chat:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in showChat:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Update group profile (name, bio, photo)
  async updateGroupProfile(chatId: string, updates: {
    name?: string;
    bio?: string;
    photo?: string | null;
  }): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('chats')
        .update({
          name: updates.name,
          bio: updates.bio,
          photo: updates.photo
        })
        .eq('id', chatId)
        .eq('type', 'group');

      if (error) {
        console.error('Error updating group profile:', error);
        return { success: false, error };
      }

      // Clear cache for this chat to force refresh
      this.clearChatCache(chatId);

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateGroupProfile:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Attachment methods
  async saveAttachments(messageId: string, attachments: Array<{
    file_url: string;
    file_type: 'image' | 'video';
    file_size: number;
    thumbnail_url?: string;
    width?: number;
    height?: number;
  }>): Promise<void> {
    try {
      const attachmentRecords = attachments.map(att => ({
        message_id: messageId,
        file_url: att.file_url,
        file_type: att.file_type,
        file_size: att.file_size,
        thumbnail_url: att.thumbnail_url,
        width: att.width,
        height: att.height
      }));
      
      const { error } = await this.supabase
        .from('attachments')
        .insert(attachmentRecords);
        
      if (error) {
        console.error('Supabase error in saveAttachments:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Error in saveAttachments:', error);
      throw error;
    }
  }

  async getMessageAttachments(messageIds: string[]): Promise<Map<string, MediaAttachment[]>> {
    try {
      const { data, error } = await this.supabase
        .from('attachments')
        .select('*')
        .in('message_id', messageIds);
        
      if (error) {
        console.error('Supabase error in getMessageAttachments:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Group by message_id
      const grouped = new Map<string, MediaAttachment[]>();
      data?.forEach(att => {
        if (!grouped.has(att.message_id)) grouped.set(att.message_id, []);
        grouped.get(att.message_id)!.push(att);
      });
      
      return grouped;
    } catch (error) {
      console.error('Error in getMessageAttachments:', error);
      throw error;
    }
  }

  async getChatMedia(chatId: string): Promise<MediaAttachment[]> {
    try {
      const { data, error } = await this.supabase
        .from('attachments')
        .select('*, chat_messages!inner(chat_id, created_at)')
        .eq('chat_messages.chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Supabase error in getChatMedia:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getChatMedia:', error);
      throw error;
    }
  }
}

// Legacy singleton export - DEPRECATED: Use chatService from AuthContext instead
// This is kept only for backward compatibility during migration
export const simpleChatService = (() => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('SimpleChatService: Supabase client not available');
  }
  // Create a temporary account object - this will be replaced by AuthContext injection
  const tempAccount = {
    id: 'temp',
    name: 'Legacy',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return new SimpleChatService(client, tempAccount);
})();
