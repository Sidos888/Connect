-- Enable Realtime for Chat Messages
-- This fixes the issue where messages don't appear instantly for the receiver
-- STATUS: ✅ APPLIED on 2025-01-09 to Connect-Staging (rxlqtyfhsocxnsnnnlwl)

-- 1. Enable REPLICA IDENTITY FULL for all chat tables
-- This is required for Supabase Realtime to work with RLS policies
ALTER TABLE chats REPLICA IDENTITY FULL;
ALTER TABLE chat_participants REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- 2. Add tables to the supabase_realtime publication
-- This enables realtime events for INSERTs, UPDATEs, and DELETEs
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Verify the setup
SELECT schemaname, tablename, replica_identity 
FROM pg_tables 
WHERE tablename IN ('chats', 'chat_participants', 'chat_messages');

-- Check publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

