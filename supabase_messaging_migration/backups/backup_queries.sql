-- ==============================================================================
-- Backup Queries for Production Messaging Tables
-- ==============================================================================
-- Purpose: Document current state before migration
-- Target: Connect-Prod (rxlqtyfhsocxnsnnnlwl)
-- Date: 2025-10-12
-- ==============================================================================

-- ==============================================================================
-- METADATA SNAPSHOT
-- ==============================================================================

-- Current table row counts
SELECT 
  'chats' as table_name, 
  COUNT(*) as row_count 
FROM chats
UNION ALL
SELECT 
  'chat_participants', 
  COUNT(*) 
FROM chat_participants
UNION ALL
SELECT 
  'chat_messages', 
  COUNT(*) 
FROM chat_messages;

-- Current schema for chat_participants (pre-migration)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chat_participants'
ORDER BY ordinal_position;

-- Current indexes on chat_messages (pre-migration)
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'chat_messages'
ORDER BY indexname;

-- Current function signatures (pre-migration)
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'assign_message_seq',
    'mark_messages_as_read',
    'mark_messages_as_delivered',
    'get_unread_count',
    'get_latest_seq'
  )
ORDER BY routine_name;

-- ==============================================================================
-- DATA VALIDATION (Pre-Migration State)
-- ==============================================================================

-- Verify NO NULL values in chat_participants (safety check)
SELECT 
  COUNT(*) as null_chat_ids
FROM chat_participants
WHERE chat_id IS NULL;
-- Expected: 0

SELECT 
  COUNT(*) as null_user_ids
FROM chat_participants
WHERE user_id IS NULL;
-- Expected: 0

-- Verify all messages have seq
SELECT 
  COUNT(*) as total_messages,
  COUNT(seq) as messages_with_seq,
  COUNT(*) - COUNT(seq) as messages_missing_seq
FROM chat_messages;
-- Expected: 183, 183, 0

-- ==============================================================================
-- EXPORT DATA (if needed for full backup)
-- ==============================================================================

-- Note: For full data backup, use Supabase Dashboard → Database → Backups
-- or run pg_dump from command line:
--
-- pg_dump -h db.rxlqtyfhsocxnsnnnlwl.supabase.co \
--   -U postgres \
--   -t public.chats \
--   -t public.chat_participants \
--   -t public.chat_messages \
--   -t public.message_reactions \
--   -t public.attachments \
--   > prod_messaging_backup_20251012.sql
--
-- ==============================================================================

-- Sample data snapshots (for comparison after migration)
SELECT * FROM chats LIMIT 5;
SELECT * FROM chat_participants LIMIT 10;
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 10;

-- ==============================================================================
-- CONSTRAINTS AND FOREIGN KEYS
-- ==============================================================================

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('chats', 'chat_participants', 'chat_messages')
ORDER BY tc.table_name, tc.constraint_type;

-- ==============================================================================
-- DONE
-- ==============================================================================
-- Backup queries completed. Review results before proceeding with migration.

