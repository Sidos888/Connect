# Supabase Storage Setup for Chat Media

## Issue
The chat media functionality requires a `chat-media` storage bucket in Supabase. If you're seeing errors like "Failed to load image" or "Bucket not found", you need to create and configure this bucket.

## Solution

### 1. Create the Storage Bucket
1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `chat-media`
5. Set it as **Public bucket** (important for image access)
6. Click **Create bucket**

### 2. Configure Bucket Policies
After creating the bucket, set up Row Level Security policies:

```sql
-- Enable RLS on the bucket
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload to chat-media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-media' AND 
    auth.role() = 'authenticated'
  );

-- Policy: Allow public access to view files (for public bucket)
CREATE POLICY "Allow public access to chat-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-media');

-- Policy: Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files from chat-media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 3. Alternative: Use SQL Editor
You can also run this in the SQL Editor:

```sql
-- Create the bucket via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true);

-- Set up policies
CREATE POLICY "Allow authenticated uploads to chat-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to chat-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-media');
```

## Current Behavior

### Without Storage Bucket:
- ✅ Chat functionality works normally
- ✅ Text messages work fine
- ✅ Media uploads use local URLs (temporary, will be lost on page refresh)
- ✅ Images display in preview (using local URLs)
- ⚠️ Images won't persist after page refresh
- ⚠️ Images won't be accessible to other users

### With Storage Bucket:
- ✅ All chat functionality works
- ✅ Media uploads work fully
- ✅ Images persist and are accessible
- ✅ Images are accessible to other users
- ✅ Full media sharing functionality

## Testing
After setup, try uploading an image. You should see in the console:
- "Upload successful, generated public URL: [URL]"
- No more "Failed to load image" errors
- Images display properly in the preview

## Troubleshooting
If you still see issues:
1. Check that the bucket is set as **Public**
2. Verify the bucket policies are correctly applied
3. Check the browser console for any remaining errors
4. Ensure your Supabase project has the correct API keys configured
