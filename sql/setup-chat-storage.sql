-- Setup Supabase Storage for Chat Media
-- This script creates a storage bucket for chat media (photos/videos)

-- 1. Create the chat-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  false, -- Private bucket - we'll use signed URLs
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for the chat-media bucket

-- Policy: Users can upload files to chat-media bucket
DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-media' AND
    auth.uid() IS NOT NULL
  );

-- Policy: Users can view files they uploaded or files in chats they participate in
DROP POLICY IF EXISTS "Users can view chat media" ON storage.objects;
CREATE POLICY "Users can view chat media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-media' AND
    (
      auth.uid() = owner OR
      EXISTS (
        SELECT 1 FROM chat_messages cm
        JOIN chat_participants cp ON cm.chat_id = cp.chat_id
        WHERE cm.media_urls @> ARRAY[storage.objects.name]
        AND cp.user_id = auth.uid()
      )
    )
  );

-- Policy: Users can delete files they uploaded
DROP POLICY IF EXISTS "Users can delete their chat media" ON storage.objects;
CREATE POLICY "Users can delete their chat media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-media' AND
    auth.uid() = owner
  );

-- Policy: Users can update files they uploaded
DROP POLICY IF EXISTS "Users can update their chat media" ON storage.objects;
CREATE POLICY "Users can update their chat media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'chat-media' AND
    auth.uid() = owner
  );

-- 3. Enable realtime for storage.objects (if not already enabled)
-- Note: This is usually enabled by default, but we'll make sure
ALTER PUBLICATION supabase_realtime ADD TABLE storage.objects;

-- Verification queries (optional - comment out in production)
-- SELECT * FROM storage.buckets WHERE id = 'chat-media';
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
