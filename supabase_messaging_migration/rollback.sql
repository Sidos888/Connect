-- ==============================================================================
-- ROLLBACK SCRIPT - Messaging System Migration
-- ==============================================================================
-- Purpose: Emergency rollback if migrations cause issues
-- WARNING: Only use if absolutely necessary
-- ==============================================================================

-- ==============================================================================
-- ROLLBACK FOR PRODUCTION (001_schema_alignment.sql)
-- ==============================================================================

BEGIN;

RAISE NOTICE 'Starting rollback for production schema alignment...';

-- Remove NOT NULL constraints from chat_participants
ALTER TABLE chat_participants 
  ALTER COLUMN chat_id DROP NOT NULL;

ALTER TABLE chat_participants 
  ALTER COLUMN user_id DROP NOT NULL;

RAISE NOTICE '✓ Removed NOT NULL constraints from chat_participants';

-- Drop sender_id index
DROP INDEX IF EXISTS idx_chat_messages_sender_id;

RAISE NOTICE '✓ Dropped idx_chat_messages_sender_id index';

COMMIT;

RAISE NOTICE 'Production rollback completed successfully';

-- ==============================================================================
-- ROLLBACK FOR STAGING (002_function_updates_staging.sql)
-- ==============================================================================
-- Note: Function rollback is usually not necessary as the new signatures
-- are backwards compatible. However, if needed:

/*
BEGIN;

RAISE NOTICE 'Starting rollback for staging function updates...';

-- Revert mark_messages_as_read to void return type
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_chat_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE chat_messages
  SET status = 'read'
  WHERE chat_id = p_chat_id
    AND sender_id <> p_user_id
    AND status <> 'read'
    AND deleted_at IS NULL;
  
  UPDATE chat_participants
  SET last_read_at = NOW()
  WHERE chat_id = p_chat_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop get_unread_count function
DROP FUNCTION IF EXISTS get_unread_count(UUID, UUID);

RAISE NOTICE '✓ Reverted function signatures';

COMMIT;

RAISE NOTICE 'Staging function rollback completed';
*/

-- ==============================================================================
-- ROLLBACK FOR STAGING (003_index_alignment.sql)
-- ==============================================================================

/*
BEGIN;

RAISE NOTICE 'Starting rollback for staging index alignment...';

-- Drop reply_to index
DROP INDEX IF EXISTS idx_chat_messages_reply_to;

RAISE NOTICE '✓ Dropped idx_chat_messages_reply_to index';

COMMIT;

RAISE NOTICE 'Staging index rollback completed';
*/

-- ==============================================================================
-- FULL ROLLBACK (ALL MIGRATIONS)
-- ==============================================================================
-- Uncomment and run this section to rollback everything

/*
BEGIN;

RAISE NOTICE 'Starting FULL rollback of all migrations...';

-- Production rollback
ALTER TABLE chat_participants ALTER COLUMN chat_id DROP NOT NULL;
ALTER TABLE chat_participants ALTER COLUMN user_id DROP NOT NULL;
DROP INDEX IF EXISTS idx_chat_messages_sender_id;

-- Staging rollback
DROP INDEX IF EXISTS idx_chat_messages_reply_to;

RAISE NOTICE '✓ All changes rolled back';

COMMIT;

RAISE NOTICE 'FULL rollback completed successfully';
*/

-- ==============================================================================
-- VERIFICATION AFTER ROLLBACK
-- ==============================================================================
-- Run these queries to verify rollback was successful:

-- Check NOT NULL constraints removed
SELECT 
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_participants'
  AND column_name IN ('chat_id', 'user_id');
-- Should show 'YES' for is_nullable

-- Check indexes removed
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'chat_messages'
  AND indexname IN ('idx_chat_messages_sender_id', 'idx_chat_messages_reply_to');
-- Should return 0 rows for rollback

-- ==============================================================================
-- NOTES
-- ==============================================================================
-- 1. The migration is designed to be safe and non-destructive
-- 2. Rollback should only be needed if unexpected application errors occur
-- 3. All migrations use IF NOT EXISTS / IF EXISTS for safety
-- 4. No data is modified, only schema constraints and indexes
-- 5. Function signature changes are backwards compatible
-- 
-- If you need to rollback:
--   1. Check application logs for specific errors
--   2. Run appropriate rollback section above
--   3. Verify with validation queries
--   4. Contact database admin if issues persist

