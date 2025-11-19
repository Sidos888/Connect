-- Fix chat_list_optimized view to properly extract participant data
-- The current view has a logic error - it only gets current user's data then filters it out

-- Drop the existing view
DROP VIEW IF EXISTS chat_list_optimized CASCADE;

-- Create the corrected view
CREATE OR REPLACE VIEW chat_list_optimized AS
WITH user_chats AS (
  -- First, get all chats for the current user
  SELECT DISTINCT cp.chat_id
  FROM chat_participants cp
  WHERE cp.user_id = auth.uid()
),
chat_participants_data AS (
  -- Get ALL participants for each of the user's chats (including other users)
  SELECT 
    cp.chat_id,
    json_agg(
      json_build_object(
        'id', a.id,
        'name', a.name,
        'profile_pic', a.profile_pic
      )
    ) FILTER (WHERE a.id != auth.uid()) as other_participants
  FROM chat_participants cp
  INNER JOIN accounts a ON a.id = cp.user_id
  INNER JOIN user_chats uc ON uc.chat_id = cp.chat_id
  GROUP BY cp.chat_id
),
last_messages_data AS (
  -- Get last message for each chat
  SELECT 
    chat_id,
    json_build_object(
      'id', id,
      'text', content,
      'created_at', created_at,
      'sender_id', sender_id
    ) as last_message
  FROM (
    SELECT 
      chat_id,
      id,
      content,
      created_at,
      sender_id,
      ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at DESC) as rn
    FROM chat_messages
    WHERE deleted_at IS NULL
  ) ranked_messages
  WHERE rn = 1
)
SELECT 
  c.id as chat_id,
  c.type as chat_type,
  c.name as chat_name,
  c.photo as chat_photo,
  c.last_message_at,
  c.created_at,
  COALESCE(cpd.other_participants, '[]'::json) as other_participants,
  lmd.last_message
FROM chats c
INNER JOIN user_chats uc ON uc.chat_id = c.id
LEFT JOIN chat_participants_data cpd ON cpd.chat_id = c.id
LEFT JOIN last_messages_data lmd ON lmd.chat_id = c.id
ORDER BY c.last_message_at DESC NULLS LAST;

-- Grant permissions
GRANT SELECT ON chat_list_optimized TO authenticated;

-- Add RLS policy
CREATE POLICY "Users can view their chat list" ON chat_list_optimized
FOR SELECT TO authenticated
USING (true);














