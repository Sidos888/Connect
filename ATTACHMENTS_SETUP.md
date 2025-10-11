# Attachments Table Setup

## Issue
The chat media functionality requires an `attachments` table in the Supabase database. If you're seeing errors like "Failed to load chat media" or "relation 'attachments' does not exist", you need to create this table.

## Solution
Run the SQL script to create the attachments table:

```sql
-- Create attachments table for chat media metadata
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL, -- 'image' or 'video'
  file_size BIGINT,
  thumbnail_url TEXT, -- for videos
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient message-based queries
CREATE INDEX idx_attachments_message ON attachments(message_id);

-- Create index for file type queries (useful for filtering)
CREATE INDEX idx_attachments_file_type ON attachments(file_type);

-- Add RLS policies for attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments for messages in chats they participate in
CREATE POLICY "Users can view attachments in their chats" ON attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN chat_participants cp ON m.chat_id = cp.chat_id
      WHERE m.id = attachments.message_id
      AND cp.user_id = auth.uid()
    )
  );

-- Policy: Users can insert attachments for messages they send
CREATE POLICY "Users can insert attachments for their messages" ON attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = attachments.message_id
      AND m.sender_id = auth.uid()
    )
  );

-- Policy: Users can update attachments for their own messages
CREATE POLICY "Users can update attachments for their messages" ON attachments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = attachments.message_id
      AND m.sender_id = auth.uid()
    )
  );

-- Policy: Users can delete attachments for their own messages
CREATE POLICY "Users can delete attachments for their messages" ON attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = attachments.message_id
      AND m.sender_id = auth.uid()
    )
  );
```

## How to Apply
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the above SQL script
4. Run the script

## Alternative
You can also use the existing SQL file:
```bash
# If you have the Supabase CLI set up
supabase db reset
# Or apply the specific file
psql -f sql/create-attachments-table.sql
```

## Current Behavior
Without the attachments table:
- ✅ Chat functionality works normally
- ✅ Text messages work fine
- ⚠️ Media uploads will be uploaded to storage but not saved to database
- ⚠️ Media gallery/viewer won't work
- ✅ No crashes or errors (graceful fallback implemented)

After creating the attachments table:
- ✅ All chat functionality works
- ✅ Media uploads work fully
- ✅ Media gallery/viewer works
- ✅ Media attachments are properly saved and retrieved
