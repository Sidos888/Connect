-- ==============================================================================
-- Migration: Notification System Functions
-- Purpose: Add SQL functions for counting unread chats and notifications
-- Status: Ready to apply
-- Dependencies: Requires migration_notification_system_tracking.sql to be applied first
-- ==============================================================================

-- ==============================================================================
-- FUNCTION 1: Get Unread Chats Count
-- ==============================================================================
-- Counts how many chats have unread messages (for badge display)
-- Uses last_inbox_view_at to determine if user has viewed inbox since new messages arrived

CREATE OR REPLACE FUNCTION get_unread_chats_count(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_last_inbox_view TIMESTAMPTZ;
  v_unread_chats_count BIGINT;
BEGIN
  -- Get user's last inbox view timestamp
  SELECT last_inbox_view_at INTO v_last_inbox_view
  FROM accounts
  WHERE id = p_user_id;
  
  -- Count chats with messages after last_inbox_view (or all if never viewed)
  IF v_last_inbox_view IS NULL THEN
    -- Never viewed inbox - count all chats with unread messages
    SELECT COUNT(DISTINCT cm.chat_id) INTO v_unread_chats_count
    FROM chat_messages cm
    INNER JOIN chat_participants cp ON cm.chat_id = cp.chat_id
    WHERE cp.user_id = p_user_id
      AND cm.sender_id <> p_user_id
      AND cm.deleted_at IS NULL
      AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at);
  ELSE
    -- Count chats with new messages since last inbox view
    SELECT COUNT(DISTINCT cm.chat_id) INTO v_unread_chats_count
    FROM chat_messages cm
    INNER JOIN chat_participants cp ON cm.chat_id = cp.chat_id
    WHERE cp.user_id = p_user_id
      AND cm.sender_id <> p_user_id
      AND cm.deleted_at IS NULL
      AND cm.created_at > v_last_inbox_view
      AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at);
  END IF;
  
  RETURN COALESCE(v_unread_chats_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_chats_count(UUID) TO authenticated;

-- ==============================================================================
-- FUNCTION 2: Mark Inbox as Viewed
-- ==============================================================================
-- Updates user's last_inbox_view_at timestamp when chats page is viewed
-- This removes the badge from chats icon

CREATE OR REPLACE FUNCTION mark_inbox_as_viewed(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE accounts
  SET last_inbox_view_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_inbox_as_viewed(UUID) TO authenticated;

-- ==============================================================================
-- FUNCTION 3: Get Unread Notifications Count (Generalized - All Types)
-- ==============================================================================
-- Counts all unread notifications across all types (listing invites, friend requests, etc.)
-- Uses last_notifications_page_view_at to determine if user has viewed notifications page

CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_last_page_view TIMESTAMPTZ;
  v_listing_invites_count BIGINT;
  v_friend_requests_count BIGINT;
  v_total_count BIGINT;
BEGIN
  -- Get user's last notifications page view timestamp
  SELECT last_notifications_page_view_at INTO v_last_page_view
  FROM accounts
  WHERE id = p_user_id;
  
  -- Count unread listing invites (created after last page view, or all if never viewed)
  IF v_last_page_view IS NULL THEN
    -- Never viewed notifications page - count all pending invites
    SELECT COUNT(*) INTO v_listing_invites_count
    FROM listing_invites
    WHERE invitee_id = p_user_id
      AND status = 'pending';
  ELSE
    -- Count invites created after last page view
    SELECT COUNT(*) INTO v_listing_invites_count
    FROM listing_invites
    WHERE invitee_id = p_user_id
      AND status = 'pending'
      AND created_at > v_last_page_view;
  END IF;
  
  -- Count unread friend requests (created after last page view, or all if never viewed)
  IF v_last_page_view IS NULL THEN
    -- Never viewed notifications page - count all pending requests
    SELECT COUNT(*) INTO v_friend_requests_count
    FROM friend_requests
    WHERE receiver_id = p_user_id
      AND status = 'pending';
  ELSE
    -- Count requests created after last page view
    SELECT COUNT(*) INTO v_friend_requests_count
    FROM friend_requests
    WHERE receiver_id = p_user_id
      AND status = 'pending'
      AND created_at > v_last_page_view;
  END IF;
  
  -- Total unread notifications (all types)
  v_total_count := COALESCE(v_listing_invites_count, 0) + COALESCE(v_friend_requests_count, 0);
  
  RETURN v_total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_notifications_count(UUID) TO authenticated;

-- ==============================================================================
-- FUNCTION 4: Mark Notifications Page as Viewed
-- ==============================================================================
-- Updates user's last_notifications_page_view_at timestamp when notifications page is viewed
-- This removes badges from both menu and bell icons

CREATE OR REPLACE FUNCTION mark_notifications_page_as_viewed(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update user's last notifications page view timestamp
  -- This marks all notifications as "viewed" for badge purposes
  UPDATE accounts
  SET last_notifications_page_view_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_notifications_page_as_viewed(UUID) TO authenticated;

-- ==============================================================================
-- FUNCTION 5: Mark Listing Invite Card as Opened (Optional - for card-level indicators)
-- ==============================================================================
-- Updates opened_at timestamp when individual listing invite card is opened
-- This allows cards to show red circles if opened_at IS NULL

CREATE OR REPLACE FUNCTION mark_listing_invite_card_opened(p_invite_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE listing_invites
  SET opened_at = NOW()
  WHERE id = p_invite_id
    AND invitee_id = p_user_id
    AND opened_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_listing_invite_card_opened(UUID, UUID) TO authenticated;

-- ==============================================================================
-- FUNCTION 6: Mark Friend Request Card as Opened (Optional - for card-level indicators)
-- ==============================================================================
-- Updates opened_at timestamp when individual friend request card is opened
-- This allows cards to show red circles if opened_at IS NULL

CREATE OR REPLACE FUNCTION mark_friend_request_card_opened(p_request_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE friend_requests
  SET opened_at = NOW()
  WHERE id = p_request_id
    AND receiver_id = p_user_id
    AND opened_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_friend_request_card_opened(UUID, UUID) TO authenticated;

-- ==============================================================================
-- Verification
-- ==============================================================================

-- Verify functions were created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_unread_chats_count'
  ) THEN
    RAISE EXCEPTION 'Function get_unread_chats_count was not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'mark_inbox_as_viewed'
  ) THEN
    RAISE EXCEPTION 'Function mark_inbox_as_viewed was not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_unread_notifications_count'
  ) THEN
    RAISE EXCEPTION 'Function get_unread_notifications_count was not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'mark_notifications_page_as_viewed'
  ) THEN
    RAISE EXCEPTION 'Function mark_notifications_page_as_viewed was not created';
  END IF;
  
  RAISE NOTICE '✓ All functions created successfully';
END$$;

