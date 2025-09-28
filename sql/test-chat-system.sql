-- Test Chat System
-- This script tests the chat functionality with sample data

-- 1. Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('chats', 'chat_participants', 'chat_messages')
ORDER BY table_name;

-- 2. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('chats', 'chat_participants', 'chat_messages');

-- 3. Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('chats', 'chat_participants', 'chat_messages')
ORDER BY tablename, policyname;

-- 4. Check if we have any users to test with
SELECT 
  id,
  email,
  created_at
FROM auth.users 
LIMIT 5;

-- 5. Check if we have any accounts to test with
SELECT 
  id,
  name,
  created_at
FROM accounts 
LIMIT 5;

-- 6. Check if we have any connections to test with
SELECT 
  id,
  user1_id,
  user2_id,
  created_at
FROM connections 
LIMIT 5;
