-- Migration 02: Triggers and Functions for Message Sequencing and Lifecycle
-- Purpose: Atomic seq assignment, delivery lifecycle management
-- Status: PENDING - Apply after migration_01
-- Dependencies: migration_01_add_seq_and_status.sql

-- ==============================================================================
-- FUNCTION 1: Assign sequential message numbers per chat
-- ==============================================================================

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

-- Add trigger to auto-assign seq on insert
DROP TRIGGER IF EXISTS trg_assign_seq ON chat_messages;
CREATE TRIGGER trg_assign_seq
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION assign_message_seq();

-- ==============================================================================
-- FUNCTION 2: Mark messages as read (lifecycle management)
-- ==============================================================================

CREATE OR REPLACE FUNCTION mark_messages_as_read(p_chat_id UUID, p_user_id UUID)
RETURNS TABLE(updated_count BIGINT) AS $$
DECLARE
  v_updated_count BIGINT;
BEGIN
  -- Update all unread messages in this chat (except user's own messages)
  UPDATE chat_messages
  SET status = 'read'
  WHERE chat_id = p_chat_id
    AND sender_id <> p_user_id
    AND status <> 'read'
    AND deleted_at IS NULL; -- Don't update deleted messages
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Update participant's last_read_at timestamp
  UPDATE chat_participants
  SET last_read_at = NOW()
  WHERE chat_id = p_chat_id
    AND user_id = p_user_id;
  
  -- Return count of updated messages
  RETURN QUERY SELECT v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;

-- ==============================================================================
-- FUNCTION 3: Mark messages as delivered (lifecycle management)
-- ==============================================================================

CREATE OR REPLACE FUNCTION mark_messages_as_delivered(p_chat_id UUID, p_receiver_id UUID)
RETURNS TABLE(updated_count BIGINT) AS $$
DECLARE
  v_updated_count BIGINT;
BEGIN
  -- Update all sent (but not yet delivered) messages in this chat
  -- Only update messages not sent by the receiver
  UPDATE chat_messages
  SET status = 'delivered'
  WHERE chat_id = p_chat_id
    AND sender_id <> p_receiver_id
    AND status = 'sent' -- Only update messages still in 'sent' state
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Return count of updated messages
  RETURN QUERY SELECT v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_messages_as_delivered(UUID, UUID) TO authenticated;

-- ==============================================================================
-- FUNCTION 4: Get unread message count (helper for UI)
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_unread_count(p_chat_id UUID, p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_last_read_at TIMESTAMPTZ;
  v_unread_count BIGINT;
BEGIN
  -- Get user's last read timestamp
  SELECT last_read_at INTO v_last_read_at
  FROM chat_participants
  WHERE chat_id = p_chat_id AND user_id = p_user_id;
  
  -- If no last_read_at, count all messages from others
  IF v_last_read_at IS NULL THEN
    SELECT COUNT(*) INTO v_unread_count
    FROM chat_messages
    WHERE chat_id = p_chat_id
      AND sender_id <> p_user_id
      AND deleted_at IS NULL;
  ELSE
    -- Count messages after last_read_at
    SELECT COUNT(*) INTO v_unread_count
    FROM chat_messages
    WHERE chat_id = p_chat_id
      AND sender_id <> p_user_id
      AND created_at > v_last_read_at
      AND deleted_at IS NULL;
  END IF;
  
  RETURN COALESCE(v_unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_count(UUID, UUID) TO authenticated;

-- ==============================================================================
-- FUNCTION 5: Get latest seq for a chat (helper for pagination)
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_latest_seq(p_chat_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_max_seq BIGINT;
BEGIN
  SELECT MAX(seq) INTO v_max_seq
  FROM chat_messages
  WHERE chat_id = p_chat_id;
  
  RETURN COALESCE(v_max_seq, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_seq(UUID) TO authenticated;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Test the seq assignment trigger
DO $$
DECLARE
  test_chat_id UUID;
  test_user_id UUID;
  test_msg_id UUID;
  assigned_seq BIGINT;
BEGIN
  -- Get a test chat and user (if exists)
  SELECT id INTO test_chat_id FROM chats LIMIT 1;
  SELECT user_id INTO test_user_id FROM chat_participants WHERE chat_id = test_chat_id LIMIT 1;
  
  IF test_chat_id IS NOT NULL AND test_user_id IS NOT NULL THEN
    -- Insert a test message
    INSERT INTO chat_messages (chat_id, sender_id, message_text)
    VALUES (test_chat_id, test_user_id, 'Test message for seq trigger')
    RETURNING id, seq INTO test_msg_id, assigned_seq;
    
    RAISE NOTICE 'Test message created with seq: %', assigned_seq;
    
    -- Clean up test message
    DELETE FROM chat_messages WHERE id = test_msg_id;
    RAISE NOTICE 'Test message cleaned up';
  ELSE
    RAISE NOTICE 'No test data available, skipping trigger test';
  END IF;
END$$;

-- List all functions created
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
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
-- ROLLBACK INSTRUCTIONS
-- ==============================================================================
-- If you need to rollback this migration, run the following commands:
--
-- -- Drop trigger
-- DROP TRIGGER IF EXISTS trg_assign_seq ON chat_messages;
--
-- -- Drop functions
-- DROP FUNCTION IF EXISTS assign_message_seq();
-- DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID);
-- DROP FUNCTION IF EXISTS mark_messages_as_delivered(UUID, UUID);
-- DROP FUNCTION IF EXISTS get_unread_count(UUID, UUID);
-- DROP FUNCTION IF EXISTS get_latest_seq(UUID);
--
-- ==============================================================================
-- NOTES
-- ==============================================================================
-- - The assign_message_seq() function uses advisory locks to prevent race conditions
-- - All functions use SECURITY DEFINER to bypass RLS (but still respect it internally)
-- - Functions are granted to 'authenticated' role only
-- - The trigger automatically assigns seq and default status on insert

