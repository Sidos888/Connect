-- ==============================================================================
-- Migration: Notification System Tracking
-- Purpose: Add page-level and card-level tracking for chats and notifications
-- Status: Ready to apply
-- Rollback: See ROLLBACK section at end of file
-- ==============================================================================
-- 
-- This migration adds:
-- 1. Page-level tracking for chats inbox (last_inbox_view_at)
-- 2. Page-level tracking for notifications page (last_notifications_page_view_at)
-- 3. Card-level tracking for individual notifications (opened_at)
--
-- All columns are nullable and safe to add (no data loss)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- STEP 1: Add Page-Level Tracking to Accounts Table
-- ==============================================================================
-- These timestamps track when user last viewed the chats inbox and notifications page
-- Used to determine if badges should be shown (badges disappear when page is viewed)

-- Add last_inbox_view_at for chats inbox tracking
ALTER TABLE accounts 
  ADD COLUMN IF NOT EXISTS last_inbox_view_at TIMESTAMPTZ;

-- Add last_notifications_page_view_at for notifications page tracking
ALTER TABLE accounts 
  ADD COLUMN IF NOT EXISTS last_notifications_page_view_at TIMESTAMPTZ;

-- Create indexes for performance (partial indexes for NULL values)
CREATE INDEX IF NOT EXISTS idx_accounts_last_inbox_view_at 
  ON accounts(last_inbox_view_at) 
  WHERE last_inbox_view_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_last_notifications_page_view_at 
  ON accounts(last_notifications_page_view_at) 
  WHERE last_notifications_page_view_at IS NOT NULL;

RAISE NOTICE '✓ Added page-level tracking columns to accounts table';

-- ==============================================================================
-- STEP 2: Add Card-Level Tracking to Notification Tables
-- ==============================================================================
-- These timestamps track when individual notification cards were opened
-- Used to show red circles on cards even after page is viewed

-- Add opened_at to listing_invites table
ALTER TABLE listing_invites 
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

-- Add opened_at to friend_requests table
ALTER TABLE friend_requests 
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

-- Create indexes for performance (partial indexes for unread notifications)
CREATE INDEX IF NOT EXISTS idx_listing_invites_opened_at 
  ON listing_invites(invitee_id, opened_at) 
  WHERE status = 'pending' AND opened_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_friend_requests_opened_at 
  ON friend_requests(receiver_id, opened_at) 
  WHERE status = 'pending' AND opened_at IS NULL;

RAISE NOTICE '✓ Added card-level tracking columns to notification tables';

-- ==============================================================================
-- STEP 3: Verification
-- ==============================================================================

-- Verify accounts columns were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' 
    AND column_name = 'last_inbox_view_at'
  ) THEN
    RAISE EXCEPTION 'Column last_inbox_view_at was not added to accounts table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' 
    AND column_name = 'last_notifications_page_view_at'
  ) THEN
    RAISE EXCEPTION 'Column last_notifications_page_view_at was not added to accounts table';
  END IF;
  
  RAISE NOTICE '✓ Verified accounts columns exist';
END$$;

-- Verify notification table columns were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listing_invites' 
    AND column_name = 'opened_at'
  ) THEN
    RAISE EXCEPTION 'Column opened_at was not added to listing_invites table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'friend_requests' 
    AND column_name = 'opened_at'
  ) THEN
    RAISE EXCEPTION 'Column opened_at was not added to friend_requests table';
  END IF;
  
  RAISE NOTICE '✓ Verified notification table columns exist';
END$$;

-- Verify indexes were created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_accounts_last_inbox_view_at'
  ) THEN
    RAISE EXCEPTION 'Index idx_accounts_last_inbox_view_at was not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_accounts_last_notifications_page_view_at'
  ) THEN
    RAISE EXCEPTION 'Index idx_accounts_last_notifications_page_view_at was not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_listing_invites_opened_at'
  ) THEN
    RAISE EXCEPTION 'Index idx_listing_invites_opened_at was not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_friend_requests_opened_at'
  ) THEN
    RAISE EXCEPTION 'Index idx_friend_requests_opened_at was not created';
  END IF;
  
  RAISE NOTICE '✓ Verified all indexes exist';
END$$;

COMMIT;

-- ==============================================================================
-- ROLLBACK
-- ==============================================================================
-- To rollback this migration, run the following:
--
-- BEGIN;
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_accounts_last_inbox_view_at;
-- DROP INDEX IF EXISTS idx_accounts_last_notifications_page_view_at;
-- DROP INDEX IF EXISTS idx_listing_invites_opened_at;
-- DROP INDEX IF EXISTS idx_friend_requests_opened_at;
--
-- -- Drop columns
-- ALTER TABLE accounts DROP COLUMN IF EXISTS last_inbox_view_at;
-- ALTER TABLE accounts DROP COLUMN IF EXISTS last_notifications_page_view_at;
-- ALTER TABLE listing_invites DROP COLUMN IF EXISTS opened_at;
-- ALTER TABLE friend_requests DROP COLUMN IF EXISTS opened_at;
--
-- COMMIT;
--
-- ==============================================================================

