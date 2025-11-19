/**
 * OfflineQueueManager - Handle message sending when offline
 * 
 * Features:
 * - Queue messages when offline
 * - Auto-flush when connection restored
 * - Idempotency via client_generated_id
 * 
 * Usage:
 *   const queue = new OfflineQueueManager();
 *   queue.enqueue({ chatId, content, ... });
 *   await queue.flush(chatService);
 */

export interface PendingMessage {
  chatId: string;
  content: string;
  replyToMessageId?: string;
  clientGeneratedId: string;
  timestamp: string;
}

export class OfflineQueueManager {
  private queue: PendingMessage[] = [];

  /**
   * Add a message to the offline queue
   */
  enqueue(message: PendingMessage): void {
    this.queue.push(message);
    console.log(`📤 OfflineQueue: Enqueued message for chat ${message.chatId} (queue size: ${this.queue.length})`);
  }

  /**
   * Get all pending messages
   */
  getPending(): PendingMessage[] {
    return [...this.queue];
  }

  /**
   * Get pending message count
   */
  getCount(): number {
    return this.queue.length;
  }

  /**
   * Flush the queue - send all pending messages
   * This should be called when connection is restored
   * 
   * @param sendFunction - Function to send a single message
   */
  async flush(sendFunction: (msg: PendingMessage) => Promise<void>): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    console.log(`📤 OfflineQueue: Flushing ${this.queue.length} pending messages`);
    
    const messages = [...this.queue];
    this.queue = []; // Clear queue immediately to prevent duplicates
    
    const results = await Promise.allSettled(
      messages.map(msg => sendFunction(msg))
    );
    
    // Re-queue failed messages
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`📤 OfflineQueue: Failed to send message, re-queuing:`, result.reason);
        this.queue.push(messages[index]);
      }
    });
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;
    
    console.log(`📤 OfflineQueue: Flush complete - ${successCount} sent, ${failCount} failed (queue size: ${this.queue.length})`);
  }

  /**
   * Clear the entire queue
   * Warning: This will lose all pending messages
   */
  clear(): void {
    const count = this.queue.length;
    this.queue = [];
    console.log(`📤 OfflineQueue: Cleared ${count} pending messages`);
  }

  /**
   * Remove a specific message from the queue
   */
  remove(clientGeneratedId: string): boolean {
    const initialSize = this.queue.length;
    this.queue = this.queue.filter(msg => msg.clientGeneratedId !== clientGeneratedId);
    const removed = initialSize !== this.queue.length;
    
    if (removed) {
      console.log(`📤 OfflineQueue: Removed message ${clientGeneratedId}`);
    }
    
    return removed;
  }
}
















