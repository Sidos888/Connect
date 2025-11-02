-- ============================================================================
-- Messaging System v2: Phase 3 - Performance & Quality Optimizations
-- Created: 2025-10-15
-- ============================================================================
-- This migration optimizes RLS policies for performance at scale
-- ============================================================================

-- ============================================================================
-- Optimize RLS Policies - Wrap auth.uid() in SELECT for InitPlan optimization
-- ============================================================================

-- CHAT_MESSAGES: Optimize SELECT policy
DROP POLICY IF EXISTS "Users can view messages in their chats" ON chat_messages;

CREATE POLICY "Users can view messages in their chats"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = (SELECT auth.uid())
  )
);

-- CHAT_PARTICIPANTS: Optimize SELECT policy
DROP POLICY IF EXISTS "Users can view their chat participants" ON chat_participants;

CREATE POLICY "Users can view their chat participants"
ON chat_participants
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = (SELECT auth.uid())
  )
);

-- CHATS: Optimize SELECT policy
DROP POLICY IF EXISTS "Users can view their chats" ON chats;

CREATE POLICY "Users can view their chats"
ON chats
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = (SELECT auth.uid())
  )
);

-- CHATS: Optimize UPDATE policy
DROP POLICY IF EXISTS "Users can update their chats" ON chats;

CREATE POLICY "Users can update their chats"
ON chats
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- Clean up duplicate/legacy policies
-- ============================================================================

-- Remove legacy cm_access policy (replaced by granular policies)
DROP POLICY IF EXISTS "cm_access" ON chat_messages;

-- Remove legacy cp_access policy (replaced by granular policies)
DROP POLICY IF EXISTS "cp_access" ON chat_participants;

-- ============================================================================
-- Add missing indexes for optimal query performance
-- ============================================================================

-- Index for connections lookups
CREATE INDEX IF NOT EXISTS idx_connections_user1 
ON connections(user1_id);

CREATE INDEX IF NOT EXISTS idx_connections_user2 
ON connections(user2_id);

-- Index for chats created_by lookups
CREATE INDEX IF NOT EXISTS idx_chats_created_by 
ON chats(created_by);

-- ============================================================================
-- Verification Queries (commented out)
-- ============================================================================

-- Verify optimized policies
-- SELECT tablename, policyname, 
--   CASE 
--     WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'NEEDS_OPTIMIZATION'
--     ELSE 'OK'
--   END as status
-- FROM pg_policies 
-- WHERE tablename IN ('chat_messages', 'chat_participants', 'chats')
-- ORDER BY tablename, policyname;

-- Verify indexes
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE tablename IN ('chat_messages', 'chat_participants', 'chats', 'connections', 'account_identities')
-- AND schemaname = 'public'
-- ORDER BY tablename, indexname;

