-- ============================================================================
-- Messaging System v2: Rollback Script
-- Created: 2025-10-15
-- ============================================================================
-- This script rolls back all Phase 1 changes to the messaging system.
-- Use this script ONLY if critical issues arise after deploying Phase 1.
-- ============================================================================

-- ============================================================================
-- Rollback RLS Policies (Phase 1.3)
-- ============================================================================

-- CHATS TABLE: Rollback to original "chats_access" policy
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can update their chats" ON chats;

CREATE POLICY "chats_access"
ON chats
FOR ALL
TO authenticated
USING (
  id IN (
    SELECT cp.chat_id
    FROM chat_participants cp
    WHERE cp.user_id = app_current_account_id()
  )
)
WITH CHECK (
  created_by = app_current_account_id()
);

-- CONNECTIONS TABLE: Rollback to original "connections_access" policy
DROP POLICY IF EXISTS "Users can view their connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can update their connections" ON connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON connections;

CREATE POLICY "connections_access"
ON connections
FOR ALL
TO authenticated
USING (
  user1_id = app_current_account_id() 
  OR user2_id = app_current_account_id()
)
WITH CHECK (
  user1_id = app_current_account_id()
);

-- CHAT_MESSAGES TABLE: Rollback to simpler policies (if needed)
-- Note: Keep the improved policies as they are more secure and performant
-- Uncomment below ONLY if absolutely necessary

-- DROP POLICY IF EXISTS "Users can view messages in their chats" ON chat_messages;
-- DROP POLICY IF EXISTS "Users can send messages to their chats" ON chat_messages;
-- CREATE POLICY "chat_messages_access" ON chat_messages FOR ALL TO authenticated USING (chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()));

-- CHAT_PARTICIPANTS TABLE: Rollback to simpler policies (if needed)
-- Note: Keep the improved policies as they are more secure
-- Uncomment below ONLY if absolutely necessary

-- DROP POLICY IF EXISTS "Users can view their chat participants" ON chat_participants;
-- DROP POLICY IF EXISTS "Users can insert chat participants" ON chat_participants;
-- CREATE POLICY "chat_participants_access" ON chat_participants FOR ALL TO authenticated USING (chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()));

-- ============================================================================
-- Rollback Indexes (Phase 1.4)
-- ============================================================================

-- Note: Dropping indexes is safe and can improve rollback speed
-- However, it may impact performance. Consider keeping them unless absolutely necessary.

-- Uncomment to remove indexes:
-- DROP INDEX IF EXISTS idx_chat_participants_user_id;
-- DROP INDEX IF EXISTS idx_chat_participants_chat_id;
-- DROP INDEX IF EXISTS idx_chat_messages_chat_seq;
-- DROP INDEX IF EXISTS idx_account_identities_auth;

-- ============================================================================
-- Rollback Helper Functions (Phase 1.2)
-- ============================================================================

-- Note: Dropping these functions will break the new RLS policies above.
-- Only drop them if you're also rolling back the RLS policies.

-- DROP FUNCTION IF EXISTS app_get_or_create_account_for_auth_user();
-- DROP FUNCTION IF EXISTS app_current_account_id();

-- ============================================================================
-- Post-Rollback Verification
-- ============================================================================

-- After running this rollback, verify the following:
-- 1. Check that RLS policies are restored:
--    SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('chats', 'connections', 'chat_messages', 'chat_participants');

-- 2. Check that indexes still exist (if you chose to keep them):
--    SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('chat_messages', 'chat_participants', 'account_identities');

-- 3. Verify the app still functions correctly by testing:
--    - Signing in
--    - Loading the chat list
--    - Sending a message
--    - Viewing message history

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. This rollback does NOT undo code changes. You must also revert code changes manually.
-- 2. This rollback keeps the helper functions (app_current_account_id, app_get_or_create_account_for_auth_user) 
--    because they are beneficial and non-breaking.
-- 3. This rollback keeps the performance indexes because they only improve performance.
-- 4. Only use this script if absolutely necessary. The Phase 1 changes are designed to be safe and beneficial.

