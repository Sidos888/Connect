-- Migration 03: Realtime Publication Configuration
-- Purpose: Ensure all chat tables are properly configured for realtime subscriptions
-- Status: PENDING - Apply after migration_02
-- Dependencies: migration_01, migration_02

-- ==============================================================================
-- STEP 1: Enable REPLICA IDENTITY FULL for realtime with RLS
-- ==============================================================================

-- REPLICA IDENTITY FULL is required for Supabase Realtime to work with RLS policies
-- This allows realtime to see all columns when evaluating RLS policies on subscriptions

ALTER TABLE chats REPLICA IDENTITY FULL;
ALTER TABLE chat_participants REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE message_reactions REPLICA IDENTITY FULL;
ALTER TABLE attachments REPLICA IDENTITY FULL;

-- ==============================================================================
-- STEP 2: Add tables to supabase_realtime publication
-- ==============================================================================

-- The supabase_realtime publication controls which tables broadcast changes
-- Using IF NOT EXISTS equivalent (ADD TABLE doesn't error if already added)

DO $$
BEGIN
  -- Add chats table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE chats;
    RAISE NOTICE 'Added chats to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'chats already in realtime publication';
  END;
  
  -- Add chat_participants table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
    RAISE NOTICE 'Added chat_participants to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'chat_participants already in realtime publication';
  END;
  
  -- Add chat_messages table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    RAISE NOTICE 'Added chat_messages to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'chat_messages already in realtime publication';
  END;
  
  -- Add message_reactions table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
    RAISE NOTICE 'Added message_reactions to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'message_reactions already in realtime publication';
  END;
  
  -- Add attachments table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE attachments;
    RAISE NOTICE 'Added attachments to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'attachments already in realtime publication';
  END;
END$$;

-- ==============================================================================
-- STEP 3: Verify realtime configuration
-- ==============================================================================

-- Check REPLICA IDENTITY settings
SELECT 
  schemaname,
  tablename,
  replica_identity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('chats', 'chat_participants', 'chat_messages', 'message_reactions', 'attachments')
ORDER BY tablename;

-- Check publication configuration
SELECT 
  pt.pubname,
  pt.schemaname,
  pt.tablename
FROM pg_publication_tables pt
WHERE pt.pubname = 'supabase_realtime'
  AND pt.schemaname = 'public'
  AND pt.tablename IN ('chats', 'chat_participants', 'chat_messages', 'message_reactions', 'attachments')
ORDER BY pt.tablename;

-- Count expected vs actual tables in publication
DO $$
DECLARE
  expected_count INT := 5;
  actual_count INT;
BEGIN
  SELECT COUNT(*) INTO actual_count
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename IN ('chats', 'chat_participants', 'chat_messages', 'message_reactions', 'attachments');
  
  IF actual_count = expected_count THEN
    RAISE NOTICE 'SUCCESS: All % chat tables are in realtime publication', expected_count;
  ELSE
    RAISE WARNING 'WARNING: Expected % tables in publication, found %', expected_count, actual_count;
  END IF;
END$$;

-- ==============================================================================
-- STEP 4: Test realtime events (optional manual test)
-- ==============================================================================

-- After running this migration, you can test realtime events by:
-- 1. Opening a Supabase Realtime inspector or client subscription
-- 2. Running the following insert in the SQL editor:
--
-- INSERT INTO chat_messages (chat_id, sender_id, message_text)
-- SELECT 
--   (SELECT id FROM chats LIMIT 1),
--   (SELECT user_id FROM chat_participants LIMIT 1),
--   'Realtime test message at ' || NOW()::TEXT;
--
-- 3. Verify the event is received in realtime
-- 4. Clean up: DELETE FROM chat_messages WHERE message_text LIKE 'Realtime test message%';

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS
-- ==============================================================================
-- If you need to rollback this migration, run the following commands:
--
-- -- Remove tables from publication
-- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS attachments;
-- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS message_reactions;
-- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS chat_messages;
-- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS chat_participants;
-- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS chats;
--
-- -- Reset REPLICA IDENTITY to DEFAULT (optional, usually not needed)
-- -- ALTER TABLE chats REPLICA IDENTITY DEFAULT;
-- -- ALTER TABLE chat_participants REPLICA IDENTITY DEFAULT;
-- -- ALTER TABLE chat_messages REPLICA IDENTITY DEFAULT;
-- -- ALTER TABLE message_reactions REPLICA IDENTITY DEFAULT;
-- -- ALTER TABLE attachments REPLICA IDENTITY DEFAULT;
--
-- ==============================================================================
-- NOTES
-- ==============================================================================
-- - REPLICA IDENTITY FULL increases WAL size slightly but is required for RLS
-- - All chat-related tables should be in the publication for consistent realtime
-- - Realtime subscriptions will now receive INSERT, UPDATE, DELETE events
-- - Client subscriptions still respect RLS policies
-- - This migration is idempotent and safe to run multiple times

