-- ==============================================================================
-- Migration 001: Schema Alignment for Connect-Prod
-- ==============================================================================
-- Purpose: Add NOT NULL constraints and missing indexes to production
-- Target: Connect-Prod (rxlqtyfhsocxnsnnnlwl)
-- Status: Ready to apply
-- Safety: High - Only adds constraints (no data changes)
-- Estimated Time: < 1 minute
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- STEP 1: Add NOT NULL constraints to chat_participants
-- ==============================================================================
-- This ensures data integrity by preventing orphaned participant records
-- Safe because current prod data has no NULL values in these columns

DO $$
BEGIN
  -- Check if any NULL values exist before applying constraint
  IF EXISTS (SELECT 1 FROM chat_participants WHERE chat_id IS NULL OR user_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot apply NOT NULL constraint: NULL values found in chat_participants';
  END IF;
  
  -- Apply constraints
  ALTER TABLE chat_participants 
    ALTER COLUMN chat_id SET NOT NULL;
  
  ALTER TABLE chat_participants 
    ALTER COLUMN user_id SET NOT NULL;
  
  RAISE NOTICE 'Successfully added NOT NULL constraints to chat_participants';
END$$;

-- ==============================================================================
-- STEP 2: Add missing sender_id index
-- ==============================================================================
-- This index improves query performance for sender-based lookups
-- Already exists in staging, adding to prod for parity

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id 
  ON chat_messages(sender_id);

RAISE NOTICE 'Added idx_chat_messages_sender_id index';

-- ==============================================================================
-- STEP 3: Verify changes
-- ==============================================================================

-- Verify NOT NULL constraints
DO $$
DECLARE
  chat_id_nullable TEXT;
  user_id_nullable TEXT;
BEGIN
  SELECT is_nullable INTO chat_id_nullable
  FROM information_schema.columns
  WHERE table_name = 'chat_participants' AND column_name = 'chat_id';
  
  SELECT is_nullable INTO user_id_nullable
  FROM information_schema.columns
  WHERE table_name = 'chat_participants' AND column_name = 'user_id';
  
  IF chat_id_nullable = 'NO' AND user_id_nullable = 'NO' THEN
    RAISE NOTICE '✓ NOT NULL constraints verified successfully';
  ELSE
    RAISE WARNING 'NOT NULL constraints not applied correctly';
  END IF;
END$$;

-- Verify index exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'chat_messages' 
    AND indexname = 'idx_chat_messages_sender_id'
  ) THEN
    RAISE NOTICE '✓ sender_id index verified successfully';
  ELSE
    RAISE WARNING 'sender_id index not created';
  END IF;
END$$;

COMMIT;

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS
-- ==============================================================================
-- If you need to rollback, run:
--
-- BEGIN;
-- ALTER TABLE chat_participants ALTER COLUMN chat_id DROP NOT NULL;
-- ALTER TABLE chat_participants ALTER COLUMN user_id DROP NOT NULL;
-- DROP INDEX IF EXISTS idx_chat_messages_sender_id;
-- COMMIT;
--
-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================
-- If you see this message, migration completed successfully!
-- Next: Run 004_validation.sql to verify all changes

