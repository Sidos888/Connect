-- Fixed avatars bucket setup (run this in Supabase SQL Editor)
-- This should work with standard permissions

-- 1. First, let's check if the bucket exists
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- 2. If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Check if RLS is enabled on storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. If RLS is not enabled, enable it
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow authenticated users to manage avatars" ON storage.objects;

CREATE POLICY "Allow authenticated users to manage avatars" 
ON storage.objects
FOR ALL 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 6. Verify everything worked
SELECT * FROM storage.buckets WHERE id = 'avatars';
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
