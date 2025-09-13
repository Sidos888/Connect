-- Set up RLS policies for existing avatars bucket
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

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

-- 4. Verify the bucket exists and check policies
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- 5. List current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
