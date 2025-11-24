-- ============================================================================
-- PROPER RLS FIX FOR CHAT SYSTEM
-- ============================================================================
-- This fixes the "Unknown User" issue by allowing users to see all participants
-- in chats they're part of, while maintaining security.

-- ============================================================================
-- STEP 1: Fix chat_participants RLS
-- ============================================================================

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "chat_participants_select_own" ON chat_participants;

-- Create a proper policy that allows users to see all participants in their chats
CREATE POLICY "chat_participants_select_chat_members" 
ON chat_participants FOR SELECT 
TO authenticated
USING (
  -- Allow viewing all participants in chats where the user is a member
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

-- Keep INSERT/UPDATE/DELETE policies restrictive for security
-- (These should already exist and be correct)

-- ============================================================================
-- STEP 2: Ensure accounts table is accessible for participant details
-- ============================================================================

-- Verify accounts table has proper SELECT policy
-- (Should already exist: "accounts_select_all" policy)

-- ============================================================================
-- STEP 3: Add performance indexes for the new query pattern
-- ============================================================================

-- Index for the RLS policy lookup
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id 
ON chat_participants(user_id);

-- Index for chat_id lookups
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id 
ON chat_participants(chat_id);

-- Composite index for the RLS policy
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_chat 
ON chat_participants(user_id, chat_id);

-- ============================================================================
-- STEP 4: Verify the fix works
-- ============================================================================

-- Test query that should now work:
-- SELECT cp.*, a.name, a.profile_pic 
-- FROM chat_participants cp
-- JOIN accounts a ON cp.user_id = a.id
-- WHERE cp.chat_id IN (
--   SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
-- );
















