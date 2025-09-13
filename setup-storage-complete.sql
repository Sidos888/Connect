-- Complete Supabase Storage setup for avatars
-- Run this in your Supabase SQL Editor

-- 1. Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for the avatars bucket

-- Policy 1: Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy 3: Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 4. Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'avatars';
