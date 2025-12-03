-- Function to auto-archive event chats after 7 days of inactivity (once event has ended)
-- This should be run periodically (e.g., via a cron job or scheduled function)

CREATE OR REPLACE FUNCTION archive_old_event_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive event chats where:
  -- 1. is_event_chat = true
  -- 2. is_archived = false (or null)
  -- 3. The associated listing's end_date has passed (event is over)
  -- 4. last_message_at is more than 7 days ago (7 days of inactivity)
  UPDATE chats
  SET 
    is_archived = true,
    archived_at = NOW()
  WHERE 
    is_event_chat = true
    AND (is_archived = false OR is_archived IS NULL)
    AND listing_id IS NOT NULL
    AND listing_id IN (
      SELECT id 
      FROM listings 
      WHERE end_date < NOW()
    )
    AND last_message_at < (NOW() - INTERVAL '7 days');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION archive_old_event_chats() TO authenticated;

COMMENT ON FUNCTION archive_old_event_chats() IS 'Archives event chats after 7 days of inactivity once the event has ended';

