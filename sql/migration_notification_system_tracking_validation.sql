-- ==============================================================================
-- Validation: Notification System Tracking Migration
-- Purpose: Verify that migration was applied correctly
-- Usage: Run this after applying migration_notification_system_tracking.sql
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Verify Columns Exist
-- ==============================================================================

SELECT 
  'Accounts Table Columns' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'accounts' 
      AND column_name = 'last_inbox_view_at'
    ) THEN '✓ last_inbox_view_at exists'
    ELSE '✗ last_inbox_view_at missing'
  END as last_inbox_view_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'accounts' 
      AND column_name = 'last_notifications_page_view_at'
    ) THEN '✓ last_notifications_page_view_at exists'
    ELSE '✗ last_notifications_page_view_at missing'
  END as last_notifications_page_view_at;

SELECT 
  'Notification Table Columns' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'listing_invites' 
      AND column_name = 'opened_at'
    ) THEN '✓ listing_invites.opened_at exists'
    ELSE '✗ listing_invites.opened_at missing'
  END as listing_invites_opened_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'friend_requests' 
      AND column_name = 'opened_at'
    ) THEN '✓ friend_requests.opened_at exists'
    ELSE '✗ friend_requests.opened_at missing'
  END as friend_requests_opened_at;

-- ==============================================================================
-- STEP 2: Verify Indexes Exist
-- ==============================================================================

SELECT 
  'Indexes' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_accounts_last_inbox_view_at'
    ) THEN '✓ idx_accounts_last_inbox_view_at exists'
    ELSE '✗ idx_accounts_last_inbox_view_at missing'
  END as inbox_index,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_accounts_last_notifications_page_view_at'
    ) THEN '✓ idx_accounts_last_notifications_page_view_at exists'
    ELSE '✗ idx_accounts_last_notifications_page_view_at missing'
  END as notifications_index,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_listing_invites_opened_at'
    ) THEN '✓ idx_listing_invites_opened_at exists'
    ELSE '✗ idx_listing_invites_opened_at missing'
  END as listing_invites_index,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_friend_requests_opened_at'
    ) THEN '✓ idx_friend_requests_opened_at exists'
    ELSE '✗ idx_friend_requests_opened_at missing'
  END as friend_requests_index;

-- ==============================================================================
-- STEP 3: Test Column Data Types
-- ==============================================================================

SELECT 
  'Column Data Types' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('accounts', 'listing_invites', 'friend_requests')
  AND column_name IN (
    'last_inbox_view_at', 
    'last_notifications_page_view_at', 
    'opened_at'
  )
ORDER BY table_name, column_name;

-- ==============================================================================
-- STEP 4: Test Sample Queries (Should Not Error)
-- ==============================================================================

-- Test querying accounts with new columns
SELECT 
  id,
  name,
  last_inbox_view_at,
  last_notifications_page_view_at
FROM accounts
LIMIT 1;

-- Test querying listing_invites with new column
SELECT 
  id,
  listing_id,
  invitee_id,
  status,
  opened_at
FROM listing_invites
LIMIT 1;

-- Test querying friend_requests with new column
SELECT 
  id,
  sender_id,
  receiver_id,
  status,
  opened_at
FROM friend_requests
LIMIT 1;

-- ==============================================================================
-- Expected Results:
-- ==============================================================================
-- All checks should show ✓ (checkmarks)
-- All columns should have data_type = 'timestamp with time zone'
-- All columns should have is_nullable = 'YES'
-- Sample queries should execute without errors
-- ==============================================================================

