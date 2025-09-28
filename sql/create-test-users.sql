-- Create Test Users for Chat System
-- This script creates test users and connections for testing the chat functionality

-- Note: This script should be run after setting up the chat system
-- Run this in your Supabase SQL editor

-- 1. Create test accounts (these will be linked to auth.users when they sign up)
-- Note: In a real scenario, these would be created through the authentication flow

-- 2. Create test connections between users
-- This assumes you have at least 2 users in your auth.users table
-- You can get user IDs from the auth.users table

-- Example: Create a connection between two test users
-- Replace 'user1-uuid' and 'user2-uuid' with actual user IDs from auth.users
/*
INSERT INTO connections (user1_id, user2_id, status, created_at)
VALUES 
  ('user1-uuid', 'user2-uuid', 'accepted', NOW())
ON CONFLICT (user1_id, user2_id) DO NOTHING;
*/

-- 3. Create a test chat between the users
/*
INSERT INTO chats (type, created_by, created_at)
VALUES ('direct', 'user1-uuid', NOW())
RETURNING id;
*/

-- 4. Add participants to the chat
/*
INSERT INTO chat_participants (chat_id, user_id, joined_at)
VALUES 
  ('chat-uuid', 'user1-uuid', NOW()),
  ('chat-uuid', 'user2-uuid', NOW());
*/

-- 5. Add some test messages
/*
INSERT INTO chat_messages (chat_id, sender_id, message_text, message_type, created_at)
VALUES 
  ('chat-uuid', 'user1-uuid', 'Hello! How are you?', 'text', NOW()),
  ('chat-uuid', 'user2-uuid', 'Hi! I''m doing well, thanks!', 'text', NOW()),
  ('chat-uuid', 'user1-uuid', 'Great to hear! Want to grab coffee sometime?', 'text', NOW());
*/

-- 6. Query to check if everything is set up correctly
SELECT 
  'Chats' as table_name,
  COUNT(*) as count
FROM chats
UNION ALL
SELECT 
  'Chat Participants' as table_name,
  COUNT(*) as count
FROM chat_participants
UNION ALL
SELECT 
  'Chat Messages' as table_name,
  COUNT(*) as count
FROM chat_messages
UNION ALL
SELECT 
  'Connections' as table_name,
  COUNT(*) as count
FROM connections;
