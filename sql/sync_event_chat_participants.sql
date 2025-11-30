-- ============================================================================
-- Automatic Event Chat Participant Sync
-- ============================================================================
-- This trigger automatically syncs listing_participants with chat_participants
-- for event chats. When someone is added to listing_participants, they are
-- automatically added to the event chat (if it exists).
-- ============================================================================

-- Function to sync a participant to event chat
CREATE OR REPLACE FUNCTION sync_participant_to_event_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_event_chat_id UUID;
BEGIN
  -- Get the event_chat_id for this listing
  SELECT event_chat_id INTO v_event_chat_id
  FROM listings
  WHERE id = NEW.listing_id
    AND event_chat_id IS NOT NULL;
  
  -- If listing has an event chat, add participant to it
  IF v_event_chat_id IS NOT NULL THEN
    -- Insert participant into event chat (ignore if already exists)
    INSERT INTO chat_participants (chat_id, user_id, role, joined_at, last_read_at)
    VALUES (
      v_event_chat_id,
      NEW.user_id,
      CASE WHEN NEW.role = 'host' THEN 'admin' ELSE 'member' END,
      COALESCE(NEW.joined_at, NOW()),
      NOW()
    )
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync when participant is added
DROP TRIGGER IF EXISTS trigger_sync_participant_to_event_chat ON listing_participants;
CREATE TRIGGER trigger_sync_participant_to_event_chat
  AFTER INSERT ON listing_participants
  FOR EACH ROW
  EXECUTE FUNCTION sync_participant_to_event_chat();

-- Function to sync existing participants when event chat is created
CREATE OR REPLACE FUNCTION sync_existing_participants_to_event_chat()
RETURNS TRIGGER AS $$
BEGIN
  -- If event_chat_id is being set (and wasn't set before)
  IF NEW.event_chat_id IS NOT NULL AND (OLD.event_chat_id IS NULL OR OLD.event_chat_id != NEW.event_chat_id) THEN
    -- Add all existing participants to the event chat
    INSERT INTO chat_participants (chat_id, user_id, role, joined_at, last_read_at)
    SELECT 
      NEW.event_chat_id,
      lp.user_id,
      CASE WHEN lp.role = 'host' THEN 'admin' ELSE 'member' END,
      COALESCE(lp.joined_at, NOW()),
      NOW()
    FROM listing_participants lp
    WHERE lp.listing_id = NEW.id
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync existing participants when event chat is created/enabled
DROP TRIGGER IF EXISTS trigger_sync_existing_participants_to_event_chat ON listings;
CREATE TRIGGER trigger_sync_existing_participants_to_event_chat
  AFTER UPDATE OF event_chat_id ON listings
  FOR EACH ROW
  WHEN (NEW.event_chat_id IS NOT NULL)
  EXECUTE FUNCTION sync_existing_participants_to_event_chat();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_participant_to_event_chat() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_existing_participants_to_event_chat() TO authenticated;

