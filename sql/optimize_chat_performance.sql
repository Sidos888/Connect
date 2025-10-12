-- =====================================================
-- Chat Performance Optimization Migration
-- =====================================================
-- This migration adds proper indexes to optimize chat message queries
-- and prevent hanging/timeout issues

BEGIN;

-- 1. Index for chat_messages queries (most important)
-- This covers the main query pattern: chat_id + deleted_at + ordering
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_deleted_seq 
ON chat_messages(chat_id, deleted_at, seq DESC NULLS LAST, created_at DESC) 
WHERE deleted_at IS NULL;

-- 2. Index for message_reactions lookups
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id 
ON message_reactions(message_id);

-- 3. Index for attachments lookups  
CREATE INDEX IF NOT EXISTS idx_attachments_message_id 
ON attachments(message_id);

-- 4. Index for reply_to_message_id lookups (for reply details)
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to 
ON chat_messages(reply_to_message_id) 
WHERE reply_to_message_id IS NOT NULL;

-- 5. Composite index for pagination with seq-based ordering
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_seq_pagination 
ON chat_messages(chat_id, seq DESC NULLS LAST) 
WHERE deleted_at IS NULL AND seq IS NOT NULL;

-- 6. Index for legacy messages (without seq) fallback ordering
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created_fallback 
ON chat_messages(chat_id, created_at DESC) 
WHERE deleted_at IS NULL AND seq IS NULL;

COMMIT;

-- =====================================================
-- Performance Analysis Queries (for monitoring)
-- =====================================================

-- Check if indexes were created successfully:
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename IN ('chat_messages', 'message_reactions', 'attachments')
-- ORDER BY tablename, indexname;

-- Analyze query performance:
-- EXPLAIN ANALYZE SELECT * FROM chat_messages 
-- WHERE chat_id = 'your-chat-id' AND deleted_at IS NULL 
-- ORDER BY seq DESC NULLS LAST, created_at DESC 
-- LIMIT 50;
