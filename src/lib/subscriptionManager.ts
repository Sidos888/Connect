import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

/**
 * SubscriptionManager - Centralized realtime channel management
 * 
 * Guarantees:
 * - No subscription leaks (all channels tracked)
 * - Clean cleanup on logout/unmount
 * - Diagnostic visibility (getActiveCount)
 * 
 * Usage:
 *   const manager = new SubscriptionManager(supabase);
 *   manager.subscribe('chat-123', channel);
 *   manager.unsubscribeAll(); // On logout
 */
export class SubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    console.log('📡 SubscriptionManager: Initialized');
  }

  /**
   * Subscribe to a realtime channel with a unique key
   * If a channel with the same key exists, it will be unsubscribed first
   */
  subscribe(key: string, channel: RealtimeChannel): void {
    // Clean up existing channel if it exists
    if (this.channels.has(key)) {
      console.log(`📡 SubscriptionManager: Replacing existing subscription for ${key}`);
      this.unsubscribe(key);
    }

    this.channels.set(key, channel);
    console.log(`📡 SubscriptionManager: Subscribed to ${key} (total: ${this.channels.size})`);
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(key: string): void {
    const channel = this.channels.get(key);
    if (channel) {
      try {
        this.supabase.removeChannel(channel);
        this.channels.delete(key);
        console.log(`📡 SubscriptionManager: Unsubscribed from ${key} (remaining: ${this.channels.size})`);
      } catch (error) {
        console.error(`📡 SubscriptionManager: Error unsubscribing from ${key}:`, error);
      }
    }
  }

  /**
   * Unsubscribe from all channels
   * Critical for preventing memory leaks on logout/unmount
   */
  unsubscribeAll(): void {
    console.log(`📡 SubscriptionManager: Unsubscribing from all ${this.channels.size} channels`);
    
    const keys = Array.from(this.channels.keys());
    for (const key of keys) {
      this.unsubscribe(key);
    }
    
    // Double-check cleanup
    if (this.channels.size > 0) {
      console.warn(`📡 SubscriptionManager: Warning - ${this.channels.size} channels remain after cleanup`);
      this.channels.clear();
    }
    
    console.log('✅ SubscriptionManager: All channels cleaned up');
  }

  /**
   * Get count of active subscriptions
   * Useful for debugging and diagnostics
   */
  getActiveCount(): number {
    return this.channels.size;
  }

  /**
   * Get list of active subscription keys
   * Useful for debugging
   */
  getActiveKeys(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if a specific subscription exists
   */
  hasSubscription(key: string): boolean {
    return this.channels.has(key);
  }
}
