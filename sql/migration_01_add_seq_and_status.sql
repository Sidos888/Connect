-- Migration 01: Add seq, client_generated_id, and status columns
-- Purpose: Enable deterministic ordering, idempotency, and delivery lifecycle tracking
-- Status: PENDING - Apply to staging first, then production
-- Rollback: See ROLLBACK section at end of file

-- ==============================================================================
-- STEP 1: Add new columns to chat_messages
-- ==============================================================================

-- Add seq column for deterministic per-chat ordering
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS seq BIGINT;

-- Add client_generated_id for idempotency (prevent duplicate sends)
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS client_generated_id UUID;

-- Add status for delivery lifecycle tracking
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent','delivered','read'));

-- ==============================================================================
-- STEP 2: Create unique indexes for data integrity
-- ==============================================================================

-- Unique per-chat sequence (enforces deterministic ordering)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_chat_messages_chat_id_seq'
  ) THEN
    CREATE UNIQUE INDEX uq_chat_messages_chat_id_seq
      ON chat_messages(chat_id, seq)
      WHERE seq IS NOT NULL; -- Partial index for gradual migration
  END IF;
END$$;

-- Idempotency guard (prevent duplicate sends from same client)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_chat_messages_client_generated'
  ) THEN
    CREATE UNIQUE INDEX uq_chat_messages_client_generated
      ON chat_messages(sender_id, client_generated_id)
      WHERE client_generated_id IS NOT NULL; -- Partial index for gradual migration
  END IF;
END$$;

-- ==============================================================================
-- STEP 3: Create performance indexes
-- ==============================================================================

-- Index for keyset pagination (ORDER BY seq DESC)
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id_seq_desc
  ON chat_messages(chat_id, seq DESC)
  WHERE deleted_at IS NULL; -- Only index non-deleted messages

-- Index for delivery status queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_status
  ON chat_messages(chat_id, status)
  WHERE deleted_at IS NULL AND status != 'read'; -- Optimize for unread/undelivered

-- Index for read receipt calculations
CREATE INDEX IF NOT EXISTS idx_chat_participants_last_read
  ON chat_participants(chat_id, last_read_at);

-- ==============================================================================
-- STEP 4: Backfill seq for existing messages
-- ==============================================================================

-- NOTE: This backfill is done in a single transaction for simplicity.
-- For large tables (>100K messages), consider batching this operation.
-- Run in a separate maintenance window if table is very large.

DO $$
DECLARE
  total_messages BIGINT;
  batch_size INT := 10000;
  processed INT := 0;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_messages FROM chat_messages WHERE seq IS NULL;
  
  RAISE NOTICE 'Starting backfill of % messages', total_messages;
  
  -- Backfill in batches to avoid long-running transactions
  WHILE EXISTS (SELECT 1 FROM chat_messages WHERE seq IS NULL LIMIT 1) LOOP
    WITH ordered AS (
      SELECT id, chat_id,
             ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at, id) AS rn
      FROM chat_messages
      WHERE seq IS NULL
      LIMIT batch_size
    )
    UPDATE chat_messages m
    SET seq = o.rn
    FROM ordered o
    WHERE m.id = o.id;
    
    GET DIAGNOSTICS processed = ROW_COUNT;
    RAISE NOTICE 'Backfilled % messages', processed;
    
    -- Small delay to avoid overwhelming the database
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  RAISE NOTICE 'Backfill complete!';
END$$;

-- ==============================================================================
-- STEP 5: Verify migration
-- ==============================================================================

-- Check that all messages now have seq
DO $$
DECLARE
  null_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO null_count FROM chat_messages WHERE seq IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING 'Warning: % messages still have NULL seq', null_count;
  ELSE
    RAISE NOTICE 'Success: All messages have seq assigned';
  END IF;
END$$;

-- Show sample data
SELECT 
  chat_id,
  COUNT(*) as message_count,
  MIN(seq) as min_seq,
  MAX(seq) as max_seq,
  COUNT(DISTINCT seq) as unique_seqs
FROM chat_messages
GROUP BY chat_id
ORDER BY message_count DESC
LIMIT 5;

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS
-- ==============================================================================
-- If you need to rollback this migration, run the following commands:
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_chat_participants_last_read;
-- DROP INDEX IF EXISTS idx_chat_messages_status;
-- DROP INDEX IF EXISTS idx_chat_messages_chat_id_seq_desc;
-- DROP INDEX IF EXISTS uq_chat_messages_client_generated;
-- DROP INDEX IF EXISTS uq_chat_messages_chat_id_seq;
--
-- -- Drop columns (WARNING: This will lose data!)
-- ALTER TABLE chat_messages DROP COLUMN IF EXISTS status;
-- ALTER TABLE chat_messages DROP COLUMN IF EXISTS client_generated_id;
-- ALTER TABLE chat_messages DROP COLUMN IF EXISTS seq;
--
-- ==============================================================================
-- NOTES
-- ==============================================================================
-- - This migration is backwards-compatible with existing code
-- - Old code will continue to work (will just ignore new columns)
-- - New code should check for NULL seq and fall back to created_at ordering
-- - The partial indexes allow gradual adoption without breaking existing queries

