-- =====================================================================
-- Migration: 002_vacuum_analyze.sql
-- Description: Refresh table statistics for query planner
-- Date: October 12, 2025
-- Target: Connect-Staging
-- Safety: Non-blocking, read-only on data
-- =====================================================================

-- =====================================================================
-- VACUUM ANALYZE - Refresh Statistics
-- =====================================================================
-- Purpose: Update pg_stat_user_tables statistics for accurate query planning
-- Note: VACUUM (ANALYZE) is non-blocking and safe to run on production

-- Tables that showed no statistics in discovery
VACUUM (ANALYZE) public.account_identities;
VACUUM (ANALYZE) public.accounts;
VACUUM (ANALYZE) public.attachments;
VACUUM (ANALYZE) public.auth_audit_log;
VACUUM (ANALYZE) public.business_accounts;
VACUUM (ANALYZE) public.chat_messages;
VACUUM (ANALYZE) public.chat_participants;
VACUUM (ANALYZE) public.chats;
VACUUM (ANALYZE) public.connections;
VACUUM (ANALYZE) public.current_session_accounts;
VACUUM (ANALYZE) public.friend_requests;
VACUUM (ANALYZE) public.message_reactions;
VACUUM (ANALYZE) public.rate_limits;

-- =====================================================================
-- Verification
-- =====================================================================
-- Check that statistics have been updated

DO $$
DECLARE
    tables_analyzed integer;
BEGIN
    SELECT COUNT(*) INTO tables_analyzed
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND last_analyze IS NOT NULL;
    
    RAISE NOTICE '✓ Statistics updated for % tables', tables_analyzed;
END $$;

-- =====================================================================
-- Completion Notes
-- =====================================================================
-- Statistics refresh completed
-- Query planner now has accurate row counts and distribution data
-- No data modifications were made
-- =====================================================================

