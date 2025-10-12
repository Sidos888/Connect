-- ==============================================================================
-- Validation Queries for Messaging System Migration
-- ==============================================================================
-- Purpose: Verify all migrations applied successfully
-- Usage: Run these queries on both Connect-Prod and Connect-Staging after migration
-- ==============================================================================

-- ==============================================================================
-- 1. VERIFY NOT NULL CONSTRAINTS (Production only)
-- ==============================================================================
SELECT 
  table_name, 
  column_name, 
  is_nullable,
  CASE 
    WHEN is_nullable = 'NO' THEN '✓ PASS'
    ELSE '✗ FAIL - Should be NOT NULL'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chat_participants'
  AND column_name IN ('chat_id', 'user_id')
ORDER BY column_name;

-- ==============================================================================
-- 2. VERIFY ALL MESSAGES HAVE SEQ VALUES
-- ==============================================================================
SELECT 
  COUNT(*) as total_messages,
  COUNT(seq) as messages_with_seq,
  COUNT(*) - COUNT(seq) as messages_missing_seq,
  MIN(seq) as min_seq,
  MAX(seq) as max_seq,
  CASE 
    WHEN COUNT(*) = COUNT(seq) THEN '✓ PASS - All messages have seq'
    ELSE '✗ FAIL - ' || (COUNT(*) - COUNT(seq))::TEXT || ' messages missing seq'
  END as status
FROM chat_messages;

-- ==============================================================================
-- 3. VERIFY MESSAGE COLUMNS EXIST
-- ==============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  '✓ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chat_messages'
  AND column_name IN ('seq', 'client_generated_id', 'status', 'deleted_at', 'reply_to_message_id')
ORDER BY column_name;

-- ==============================================================================
-- 4. VERIFY FUNCTIONS EXIST WITH CORRECT SIGNATURES
-- ==============================================================================
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  '✓ EXISTS' as status
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

-- Expected results:
-- - assign_message_seq: trigger
-- - mark_messages_as_read: bigint (TABLE in prod, void is outdated)
-- - mark_messages_as_delivered: bigint (TABLE)
-- - get_unread_count: bigint
-- - get_latest_seq: bigint

-- ==============================================================================
-- 5. VERIFY TRIGGERS EXIST
-- ==============================================================================
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  '✓ EXISTS' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('chat_messages', 'chats', 'chat_participants')
ORDER BY event_object_table, trigger_name;

-- Expected triggers:
-- - trg_assign_seq on chat_messages
-- - trigger_update_chat_last_message_at on chat_messages

-- ==============================================================================
-- 6. VERIFY INDEXES EXIST
-- ==============================================================================
SELECT 
  indexname,
  tablename,
  '✓ EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('chat_messages', 'chat_participants', 'chats')
ORDER BY tablename, indexname;

-- Critical indexes to look for:
-- chat_messages:
--   - uq_chat_messages_chat_id_seq (unique seq per chat)
--   - uq_chat_messages_client_generated (idempotency)
--   - idx_chat_messages_chat_id_seq_desc (performance)
--   - idx_chat_messages_status (performance)
--   - idx_chat_messages_sender_id (performance)
--   - idx_chat_messages_reply_to (performance)
-- chat_participants:
--   - idx_chat_participants_last_read (performance)
--   - chat_participants_chat_id_user_id_key (unique constraint)

-- ==============================================================================
-- 7. VERIFY REPLICA IDENTITY (REALTIME SUPPORT)
-- ==============================================================================
SELECT 
  c.relname AS tablename,
  CASE c.relreplident
    WHEN 'd' THEN '✗ DEFAULT - Should be FULL'
    WHEN 'n' THEN '✗ NOTHING - Should be FULL'
    WHEN 'f' THEN '✓ FULL - Correct for realtime'
    WHEN 'i' THEN 'INDEX - Check if appropriate'
  END AS replica_identity_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('chats', 'chat_participants', 'chat_messages', 'message_reactions', 'attachments')
ORDER BY c.relname;

-- All should be FULL for proper realtime support

-- ==============================================================================
-- 8. VERIFY DATA INTEGRITY
-- ==============================================================================

-- Check for orphaned messages (messages without valid chat)
SELECT 
  COUNT(*) as orphaned_messages,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - No orphaned messages'
    ELSE '✗ FAIL - Found orphaned messages'
  END as status
FROM chat_messages cm
LEFT JOIN chats c ON cm.chat_id = c.id
WHERE c.id IS NULL;

-- Check for orphaned participants (participants without valid chat)
SELECT 
  COUNT(*) as orphaned_participants,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - No orphaned participants'
    ELSE '✗ FAIL - Found orphaned participants'
  END as status
FROM chat_participants cp
LEFT JOIN chats c ON cp.chat_id = c.id
WHERE c.id IS NULL;

-- Check for duplicate seq values per chat (should be impossible with unique constraint)
SELECT 
  chat_id,
  seq,
  COUNT(*) as duplicate_count
FROM chat_messages
WHERE seq IS NOT NULL
GROUP BY chat_id, seq
HAVING COUNT(*) > 1;

-- Should return 0 rows

-- ==============================================================================
-- 9. VERIFY UNIQUE CONSTRAINTS
-- ==============================================================================
SELECT 
  con.conname AS constraint_name,
  att.attname AS column_name,
  tbl.relname AS table_name,
  '✓ EXISTS' as status
FROM pg_constraint con
JOIN pg_class tbl ON tbl.oid = con.conrelid
JOIN pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = ANY(con.conkey)
WHERE tbl.relname IN ('chat_messages', 'chat_participants')
  AND con.contype = 'u' -- unique constraints
ORDER BY tbl.relname, con.conname;

-- Expected unique constraints:
-- - chat_participants_chat_id_user_id_key (prevents duplicate participants)
-- - Partial unique on seq (via index uq_chat_messages_chat_id_seq)
-- - Partial unique on client_generated_id (via index uq_chat_messages_client_generated)

-- ==============================================================================
-- 10. SUMMARY CHECK - RUN THIS LAST
-- ==============================================================================
SELECT 
  'Migration Validation Summary' as check_type,
  (SELECT COUNT(*) FROM chat_messages) as total_messages,
  (SELECT COUNT(seq) FROM chat_messages) as messages_with_seq,
  (SELECT COUNT(DISTINCT routine_name) FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('assign_message_seq', 'mark_messages_as_read', 'mark_messages_as_delivered', 'get_unread_count', 'get_latest_seq')
  ) as functions_count,
  (SELECT COUNT(*) FROM information_schema.triggers 
   WHERE trigger_schema = 'public' 
   AND event_object_table = 'chat_messages'
  ) as triggers_count,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename = 'chat_messages'
   AND indexname LIKE 'idx_%' OR indexname LIKE 'uq_%'
  ) as indexes_count;

-- Expected results:
-- - total_messages: varies by environment
-- - messages_with_seq: should equal total_messages
-- - functions_count: 5
-- - triggers_count: 2
-- - indexes_count: at least 6

-- ==============================================================================
-- END OF VALIDATION
-- ==============================================================================
-- If all checks show ✓ PASS or ✓ EXISTS, migration was successful!

