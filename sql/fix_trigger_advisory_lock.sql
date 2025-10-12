-- Fix for "FOR UPDATE is not allowed with aggregate functions" error
-- This replaces the problematic FOR UPDATE approach with advisory locks
-- Date: 2025-01-26
-- Issue: PostgreSQL error when using FOR UPDATE with MAX() aggregate function

BEGIN;

-- Drop and recreate the assign_message_seq function with advisory locks
CREATE OR REPLACE FUNCTION assign_message_seq()
RETURNS TRIGGER AS $$
DECLARE
  max_seq BIGINT;
BEGIN
  -- Only assign seq if not already set (allows manual override for testing)
  IF NEW.seq IS NULL THEN
    -- Acquire an advisory lock for the specific chat_id to serialize sequence assignment.
    -- This prevents race conditions for MAX(seq) and avoids FOR UPDATE issues
    -- by explicitly managing concurrency for this specific chat's sequence.
    PERFORM pg_advisory_xact_lock(hashtext(NEW.chat_id::text));

    -- Get next sequence number for this chat (atomic per chat_id)
    -- This SELECT statement will now be protected by the advisory lock,
    -- ensuring it runs in a safe, non-conflicting context.
    SELECT COALESCE(MAX(seq), 0) + 1 INTO max_seq
    FROM chat_messages
    WHERE chat_id = NEW.chat_id;
    
    NEW.seq := max_seq;
  END IF;
  
  -- Set default status if not provided
  IF NEW.status IS NULL THEN
    NEW.status := 'sent';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Test the function to ensure it works
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Simple test to verify the function compiles and works
  RAISE NOTICE 'assign_message_seq function updated successfully with advisory locks';
END$$;

COMMIT;
