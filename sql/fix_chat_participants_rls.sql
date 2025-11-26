-- Fix RLS policy for chat_participants to allow users to see all participants in their chats
-- This will fix the "Unknown User" issue by allowing proper participant visibility

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own chat participants" ON chat_participants;

-- Create a new policy that allows users to see ALL participants in chats they're part of
CREATE POLICY "Users can view all participants in their chats" ON chat_participants
FOR SELECT TO authenticated
USING (
  -- Allow if the user is a participant in this chat
  EXISTS (
    SELECT 1 FROM chat_participants cp2 
    WHERE cp2.chat_id = chat_participants.chat_id 
    AND cp2.user_id = auth.uid()
  )
);

-- Also ensure the policy allows users to see their own participant records
CREATE POLICY "Users can view their own participant records" ON chat_participants
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON chat_participants TO authenticated;

-- Optional: Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_user_lookup 
ON chat_participants(chat_id, user_id);

























