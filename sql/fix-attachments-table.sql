-- Fix attachments table foreign key reference
-- The attachments table should reference chat_messages, not messages

-- First, drop the existing attachments table if it exists
DROP TABLE IF EXISTS attachments CASCADE;

-- Create the corrected attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL, -- 'image' or 'video'
  file_size BIGINT,
  thumbnail_url TEXT, -- for videos
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attachments
CREATE POLICY "Users can view attachments for messages in their chats" ON attachments
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM chat_messages 
      WHERE chat_id IN (
        SELECT chat_id FROM chat_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert attachments for their own messages" ON attachments
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM chat_messages 
      WHERE sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments for their own messages" ON attachments
  FOR DELETE USING (
    message_id IN (
      SELECT id FROM chat_messages 
      WHERE sender_id = auth.uid()
    )
  );

-- Enable realtime for attachments
ALTER TABLE attachments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE attachments;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
