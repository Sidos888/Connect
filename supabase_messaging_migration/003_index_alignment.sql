-- ==============================================================================
-- Migration 003: Index Alignment (Cross-environment sync)
-- ==============================================================================
-- Purpose: Add reply_to index to staging to match production
-- Target: Connect-Staging (mohctrsopquwoyfweadl)
-- Status: Ready to apply
-- Safety: High - Only adds performance index
-- Estimated Time: < 30 seconds
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- STEP 1: Add reply_to index to staging
-- ==============================================================================
-- This index exists in production but is missing in staging
-- Improves performance for queries involving reply threads

CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to
  ON chat_messages(reply_to_message_id);

RAISE NOTICE '✓ Added idx_chat_messages_reply_to index';

-- ==============================================================================
-- STEP 2: Verify index
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'chat_messages' 
    AND indexname = 'idx_chat_messages_reply_to'
  ) THEN
    RAISE NOTICE '✓ reply_to index verified successfully';
  ELSE
    RAISE WARNING 'reply_to index not created';
  END IF;
END$$;

COMMIT;

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================
-- Migration completed successfully!
-- Staging indexes now match production

