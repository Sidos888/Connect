-- Fix chat_participants RLS to allow seeing all participants in user's chats
-- This is needed for the ChatService to fetch participant names and profile pics

-- Drop the restrictive policy
DROP POLICY IF EXISTS "chat_participants_select_own" ON chat_participants;

-- Create a more permissive policy that allows users to see all participants in their chats
CREATE POLICY "chat_participants_select_chat_members" 
ON chat_participants FOR SELECT 
TO authenticated
USING (
  -- Allow viewing all participants in chats where the user is a member
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

-- Keep the other policies as they are
-- INSERT, UPDATE, DELETE policies remain restrictive for security














