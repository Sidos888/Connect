/**
 * Feature Flags Configuration
 * 
 * Centralized feature toggles for gradual rollout and A/B testing.
 * Set flags here to enable/disable features across the app.
 */

export const FEATURE_FLAGS = {
  /**
   * Show delivery status ticks (✓ ✓✓) on messages
   * 
   * When enabled: Shows sent/delivered/read status like WhatsApp
   * When disabled: No visual change to messages (backwards compatible)
   * 
   * Default: false (disable until seq-based system is proven stable)
   */
  SHOW_DELIVERY_STATUS_TICKS: false,
  
  /**
   * Enable keyset pagination for chat history
   * 
   * When enabled: Load older messages by scrolling up
   * When disabled: Load all messages at once (current behavior)
   * 
   * Default: false (implement scroll-up detection first)
   */
  ENABLE_KEYSET_PAGINATION: false,
  
  /**
   * Show pending message queue indicator
   * 
   * When enabled: Show "Sending..." indicator for offline messages
   * When disabled: Messages appear to send immediately (optimistic)
   * 
   * Default: false (enable after testing offline queue)
   */
  SHOW_PENDING_QUEUE_INDICATOR: false,
  
  /**
   * Log realtime subscription events for debugging
   * 
   * When enabled: Console logs for every realtime event
   * When disabled: Quiet operation (production mode)
   * 
   * Default: false (disable in production for performance)
   */
  DEBUG_REALTIME_EVENTS: false,
  
  /**
   * Enable strict seq-based ordering
   * 
   * When enabled: Always sort by seq, ignore messages without seq
   * When disabled: Fallback to created_at for legacy messages
   * 
   * Default: false (keep fallback until all messages have seq)
   */
  STRICT_SEQ_ORDERING: false,
} as const;

/**
 * Get a feature flag value
 * 
 * @param flag - Feature flag name
 * @returns Current flag value
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Type-safe feature flag keys
 */
export type FeatureFlag = keyof typeof FEATURE_FLAGS;

