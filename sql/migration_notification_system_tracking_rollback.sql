-- ==============================================================================
-- Rollback: Notification System Tracking Migration
-- Purpose: Remove page-level and card-level tracking columns and indexes
-- Status: Use this if you need to rollback migration_notification_system_tracking.sql
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- STEP 1: Drop Indexes
-- ==============================================================================

DROP INDEX IF EXISTS idx_accounts_last_inbox_view_at;
DROP INDEX IF EXISTS idx_accounts_last_notifications_page_view_at;
DROP INDEX IF EXISTS idx_listing_invites_opened_at;
DROP INDEX IF EXISTS idx_friend_requests_opened_at;

RAISE NOTICE '✓ Dropped indexes';

-- ==============================================================================
-- STEP 2: Drop Columns
-- ==============================================================================

ALTER TABLE accounts DROP COLUMN IF EXISTS last_inbox_view_at;
ALTER TABLE accounts DROP COLUMN IF EXISTS last_notifications_page_view_at;
ALTER TABLE listing_invites DROP COLUMN IF EXISTS opened_at;
ALTER TABLE friend_requests DROP COLUMN IF EXISTS opened_at;

RAISE NOTICE '✓ Dropped columns';

-- ==============================================================================
-- STEP 3: Verification
-- ==============================================================================

-- Verify columns were removed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' 
    AND column_name = 'last_inbox_view_at'
  ) THEN
    RAISE EXCEPTION 'Column last_inbox_view_at still exists in accounts table';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' 
    AND column_name = 'last_notifications_page_view_at'
  ) THEN
    RAISE EXCEPTION 'Column last_notifications_page_view_at still exists in accounts table';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listing_invites' 
    AND column_name = 'opened_at'
  ) THEN
    RAISE EXCEPTION 'Column opened_at still exists in listing_invites table';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'friend_requests' 
    AND column_name = 'opened_at'
  ) THEN
    RAISE EXCEPTION 'Column opened_at still exists in friend_requests table';
  END IF;
  
  RAISE NOTICE '✓ Verified all columns were removed';
END$$;

COMMIT;

RAISE NOTICE '✓ Rollback complete';

