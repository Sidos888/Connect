-- ============================================================================
-- FIX CHAT_PARTICIPANTS RLS TO ALLOW VIEWING ALL PARTICIPANTS IN USER'S CHATS
-- WITHOUT CAUSING INFINITE RECURSION
-- ============================================================================

BEGIN;

-- Drop ALL existing policies on chat_participants
DROP POLICY IF EXISTS "Users view their own chat participations" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_select_own" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_own" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_update_own" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete_own" ON chat_participants;
DROP POLICY IF EXISTS "Users can view all participants in their chats" ON chat_participants;
DROP POLICY IF EXISTS "Users can view their own participant records" ON chat_participants;

-- Create a helper function to check if user is in a chat
-- This avoids recursion by querying the table directly without RLS
CREATE OR REPLACE FUNCTION is_user_in_chat(chat_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_id = chat_uuid AND user_id = user_uuid
  );
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_user_in_chat TO authenticated;

-- Create new policies that use the helper function to avoid recursion
CREATE POLICY "chat_participants_select_if_in_chat" 
ON chat_participants FOR SELECT 
TO authenticated
USING (
  -- Allow viewing all participants in chats where the user is a member
  is_user_in_chat(chat_id, auth.uid())
);

CREATE POLICY "chat_participants_insert_own" 
ON chat_participants FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_participants_update_own" 
ON chat_participants FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id_user_id 
ON chat_participants(chat_id, user_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id 
ON chat_participants(user_id);

COMMIT;






















