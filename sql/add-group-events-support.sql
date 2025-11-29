-- Add Group Events Support
-- This migration adds support for group-specific events/listings

-- 1. Add columns to listings table for group chat linking
ALTER TABLE listings ADD COLUMN IF NOT EXISTS group_chat_id UUID REFERENCES chats(id) ON DELETE SET NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS event_chat_id UUID REFERENCES chats(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listings_group_chat_id ON listings(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_listings_event_chat_id ON listings(event_chat_id);

-- 2. Create listing_participants table (for event attendees)
CREATE TABLE IF NOT EXISTS listing_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listing_participants_listing_id ON listing_participants(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_participants_user_id ON listing_participants(user_id);

-- 3. Update chat_messages to support 'listing' message type
ALTER TABLE chat_messages 
  DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;
ALTER TABLE chat_messages 
  ADD CONSTRAINT chat_messages_message_type_check 
  CHECK (message_type IN ('text', 'image', 'file', 'system', 'listing'));

-- 4. Add listing_id to chat_messages (to link listing messages)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_listing_id ON chat_messages(listing_id);

-- 5. Add is_event_chat flag to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_event_chat BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_chats_is_event_chat ON chats(is_event_chat);

-- 6. Enable RLS for listing_participants
ALTER TABLE listing_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_participants
CREATE POLICY "Users can view participants of listings they can see" ON listing_participants
  FOR SELECT USING (
    listing_id IN (
      SELECT id FROM listings 
      WHERE is_public = true OR host_id = auth.uid()
    )
  );

CREATE POLICY "Users can join listings" ON listing_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON listing_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave listings" ON listing_participants
  FOR DELETE USING (user_id = auth.uid());

-- 7. Add trigger to update updated_at for listing_participants
DROP TRIGGER IF EXISTS trigger_update_listing_participants_updated_at ON listing_participants;
CREATE TRIGGER trigger_update_listing_participants_updated_at
  BEFORE UPDATE ON listing_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

