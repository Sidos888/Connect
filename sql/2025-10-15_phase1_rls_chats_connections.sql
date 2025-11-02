-- ============================================================================
-- Messaging System v2: Phase 1.3 - RLS for chats and connections
-- Created: 2025-10-15
-- ============================================================================
-- Update RLS policies for chats and connections to use app_current_account_id()
-- ============================================================================

-- ============================================================================
-- CHATS TABLE RLS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "chats_access" ON chats;

-- Users can view chats they're participants in
CREATE POLICY "Users can view their chats"
ON chats
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can create chats
CREATE POLICY "Users can create chats"
ON chats
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = app_current_account_id()
);

-- Users can update chats they're participants in
CREATE POLICY "Users can update their chats"
ON chats
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- CONNECTIONS TABLE RLS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "connections_access" ON connections;

-- Users can view their own connections
CREATE POLICY "Users can view their connections"
ON connections
FOR SELECT
TO authenticated
USING (
  user1_id = app_current_account_id() 
  OR user2_id = app_current_account_id()
);

-- Users can create connections they're part of
CREATE POLICY "Users can create connections"
ON connections
FOR INSERT
TO authenticated
WITH CHECK (
  user1_id = app_current_account_id()
);

-- Users can update their own connections
CREATE POLICY "Users can update their connections"
ON connections
FOR UPDATE
TO authenticated
USING (
  user1_id = app_current_account_id() 
  OR user2_id = app_current_account_id()
)
WITH CHECK (
  user1_id = app_current_account_id() 
  OR user2_id = app_current_account_id()
);

-- Users can delete their own connections
CREATE POLICY "Users can delete their connections"
ON connections
FOR DELETE
TO authenticated
USING (
  user1_id = app_current_account_id() 
  OR user2_id = app_current_account_id()
);

