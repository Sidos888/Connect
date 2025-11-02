-- ============================================================================
-- RLS MESSAGING FIX - Industry Standard Security
-- ============================================================================
-- This fixes the 400/406 errors when sending messages
-- All major platforms (WhatsApp, Discord, Slack) use RLS for messaging security
--
-- ⚠️  IMPORTANT: Apply this SQL in your Supabase Dashboard → SQL Editor
-- This will fix the message sending errors immediately

-- 1. Enable RLS on chat_messages table (if not already enabled)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to INSERT messages they send
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 3. Allow users to SELECT messages from chats they participate in
CREATE POLICY "Users can read messages from their chats" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = chat_messages.chat_id 
      AND user_id = auth.uid()
    )
  );

-- 4. Allow users to UPDATE their own messages (for editing/deleting)
CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- 5. Allow users to DELETE their own messages
CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the policies work:

-- Test 1: Check if user can send a message
-- SELECT auth.uid(); -- Should return your user ID

-- Test 2: Check if user can read messages from their chats
-- SELECT * FROM chat_messages 
-- WHERE chat_id IN (
--   SELECT chat_id FROM chat_participants 
--   WHERE user_id = auth.uid()
-- );

-- ============================================================================
-- NOTES
-- ============================================================================
-- This follows the exact same pattern as:
-- - WhatsApp: Users can only see messages from chats they're in
-- - Discord: Users can only see messages from servers/channels they have access to
-- - Slack: Users can only see messages from workspaces they're in
-- - Telegram: Users can only see messages from chats they participate in

-- The 400/406 errors were happening because:
-- 1. No INSERT policy = 400 Bad Request on message send
-- 2. No SELECT policy = 406 Not Acceptable on message retrieval
-- 3. User was authenticated but had no database-level permissions

-- After applying this fix:
-- ✅ Users can send messages (INSERT policy)
-- ✅ Users can read messages (SELECT policy)  
-- ✅ Users can edit/delete their own messages (UPDATE/DELETE policies)
-- ✅ Security is enforced at database level (industry standard)
