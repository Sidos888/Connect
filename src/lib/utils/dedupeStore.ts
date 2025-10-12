/**
 * Deduplicate Store
 * 
 * Time-based deduplication store with automatic cleanup.
 * Used to prevent duplicate message processing in realtime subscriptions.
 */

export interface DedupeStoreOptions {
  ttlMs?: number;
  maxSize?: number;
  cleanupIntervalMs?: number;
}

/**
 * Deduplicate store with TTL and LRU eviction
 * 
 * Tracks message IDs and client-generated IDs to prevent duplicates
 * in realtime subscriptions and optimistic updates.
 */
export class DedupeStore {
  private store: Map<string, number>; // key -> timestamp (ms)
  private readonly ttlMs: number;
  private readonly maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(options: DedupeStoreOptions = {}) {
    this.store = new Map();
    this.ttlMs = options.ttlMs ?? 2 * 60 * 1000; // Default: 2 minutes
    this.maxSize = options.maxSize ?? 1000; // Default: 1000 entries
    
    // Start periodic cleanup
    const cleanupIntervalMs = options.cleanupIntervalMs ?? 60 * 1000; // Default: every minute
    if (typeof window !== 'undefined') {
      this.startPeriodicCleanup(cleanupIntervalMs);
    }
  }
  
  /**
   * Add a key to the deduplication store
   * 
   * @param key - Unique identifier (message ID or client-generated ID)
   */
  add(key: string): void {
    const now = Date.now();
    
    // Check if we need to enforce size limit
    if (this.store.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.store.set(key, now);
  }
  
  /**
   * Check if a key exists in the store (and is not expired)
   * 
   * @param key - Key to check
   * @returns true if key exists and has not expired
   */
  has(key: string): boolean {
    const timestamp = this.store.get(key);
    
    if (timestamp === undefined) {
      return false;
    }
    
    // Check if entry has expired
    const now = Date.now();
    const age = now - timestamp;
    
    if (age > this.ttlMs) {
      // Clean up expired entry
      this.store.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove a specific key from the store
   * 
   * @param key - Key to remove
   * @returns true if key was present and removed
   */
  remove(key: string): boolean {
    return this.store.delete(key);
  }
  
  /**
   * Get the size of the store
   */
  size(): number {
    return this.store.size;
  }
  
  /**
   * Clear all entries from the store
   */
  clear(): void {
    this.store.clear();
  }
  
  /**
   * Clean up expired entries
   * Called automatically by periodic cleanup
   * 
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    // Iterate through entries and remove expired ones
    for (const [key, timestamp] of this.store.entries()) {
      const age = now - timestamp;
      
      if (age > this.ttlMs) {
        this.store.delete(key);
        removed++;
      }
    }
    
    return removed;
  }
  
  /**
   * Evict the oldest entries to stay within size limit (LRU)
   * 
   * @param count - Number of entries to evict (default: 10% of maxSize)
   */
  private evictOldest(count?: number): void {
    const evictCount = count ?? Math.ceil(this.maxSize * 0.1); // Evict 10% by default
    
    // Sort entries by timestamp (oldest first)
    const sortedEntries = Array.from(this.store.entries())
      .sort((a, b) => a[1] - b[1]);
    
    // Remove oldest entries
    for (let i = 0; i < Math.min(evictCount, sortedEntries.length); i++) {
      this.store.delete(sortedEntries[i][0]);
    }
  }
  
  /**
   * Start periodic cleanup of expired entries
   */
  private startPeriodicCleanup(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      const removed = this.cleanup();
      if (removed > 0) {
        console.log(`DedupeStore: Cleaned up ${removed} expired entries`);
      }
    }, intervalMs);
    
    // Ensure cleanup stops when window is closed (prevents memory leaks)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.destroy();
      });
    }
  }
  
  /**
   * Stop periodic cleanup and clear the store
   * Call this when the store is no longer needed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
  
  /**
   * Get statistics about the store
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttlMs: number;
    oldestEntryAge: number | null;
    newestEntryAge: number | null;
  } {
    const now = Date.now();
    let oldestAge: number | null = null;
    let newestAge: number | null = null;
    
    for (const timestamp of this.store.values()) {
      const age = now - timestamp;
      
      if (oldestAge === null || age > oldestAge) {
        oldestAge = age;
      }
      
      if (newestAge === null || age < newestAge) {
        newestAge = age;
      }
    }
    
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
      oldestEntryAge: oldestAge,
      newestEntryAge: newestAge
    };
  }
}

/**
 * Create a composite key for deduplication
 * Combines multiple values into a single string key
 * 
 * @param parts - Parts to combine
 * @returns Composite key string
 */
export function createCompositeKey(...parts: (string | number | undefined | null)[]): string {
  return parts
    .filter(p => p !== undefined && p !== null)
    .map(p => String(p))
    .join(':');
}

/**
 * Global dedupe store instance for message deduplication
 * Shared across all chat service instances
 */
export const globalMessageDedupeStore = new DedupeStore({
  ttlMs: 2 * 60 * 1000, // 2 minutes
  maxSize: 1000,
  cleanupIntervalMs: 60 * 1000 // Cleanup every minute
});

