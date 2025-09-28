-- Setup Chat System
-- This script creates the necessary tables and policies for the chat functionality

-- 1. Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
  name TEXT, -- For group chats
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE, -- For listing-specific chats
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- 3. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_created_by ON chats(created_by);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for chats table
CREATE POLICY "Users can view chats they participate in" ON chats
  FOR SELECT USING (
    id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update chats they created" ON chats
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete chats they created" ON chats
  FOR DELETE USING (created_by = auth.uid());

-- 7. Create RLS policies for chat_participants table
CREATE POLICY "Users can view participants of their chats" ON chat_participants
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to chats they created" ON chat_participants
  FOR INSERT WITH CHECK (
    chat_id IN (
      SELECT id FROM chats WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own participation" ON chat_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave chats" ON chat_participants
  FOR DELETE USING (user_id = auth.uid());

-- 8. Create RLS policies for chat_messages table
CREATE POLICY "Users can view messages in their chats" ON chat_messages
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to chats they participate in" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (sender_id = auth.uid());

-- 9. Create function to update last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION update_chat_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats 
  SET last_message_at = NEW.created_at 
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically update last_message_at
DROP TRIGGER IF EXISTS trigger_update_chat_last_message_at ON chat_messages;
CREATE TRIGGER trigger_update_chat_last_message_at
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message_at();

-- 11. Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_chats_updated_at ON chats;
CREATE TRIGGER trigger_update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER trigger_update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
