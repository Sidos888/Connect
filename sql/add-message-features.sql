-- Add Message Interactions Features
-- This migration adds support for:
-- 1. Message reactions (emoji reactions on messages)
-- 2. Message replies (threading/quoting messages)
-- 3. Media attachments (photos/videos)
-- 4. Soft delete (marking messages as deleted)

-- 1. Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- 2. Add new columns to chat_messages table
-- Check if columns don't exist before adding them
DO $$ 
BEGIN
  -- Add reply_to_message_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'reply_to_message_id'
  ) THEN
    ALTER TABLE chat_messages 
      ADD COLUMN reply_to_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;
  END IF;

  -- Add media_urls column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE chat_messages 
      ADD COLUMN media_urls TEXT[];
  END IF;

  -- Add deleted_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE chat_messages 
      ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index for reply lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to_message_id);

-- 3. Enable RLS for message_reactions table
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for message_reactions

-- Policy: Users can view reactions in chats they participate in
DROP POLICY IF EXISTS "Users can view reactions in their chats" ON message_reactions;
CREATE POLICY "Users can view reactions in their chats" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm 
      JOIN chat_participants cp ON cm.chat_id = cp.chat_id 
      WHERE cm.id = message_reactions.message_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Policy: Users can add reactions to messages in their chats
DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
CREATE POLICY "Users can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_messages cm 
      JOIN chat_participants cp ON cm.chat_id = cp.chat_id 
      WHERE cm.id = message_reactions.message_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own reactions
DROP POLICY IF EXISTS "Users can delete their own reactions" ON message_reactions;
CREATE POLICY "Users can delete their own reactions" ON message_reactions
  FOR DELETE USING (user_id = auth.uid());

-- 5. Enable realtime for message_reactions table
ALTER TABLE message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- Verification queries (optional - comment out in production)
-- SELECT tablename, schemaname FROM pg_tables WHERE tablename = 'message_reactions';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name IN ('reply_to_message_id', 'media_urls', 'deleted_at');

