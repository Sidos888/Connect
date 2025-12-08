-- Setup Supabase Storage for Highlight Photos
-- This script creates a storage bucket for highlight photos

-- 1. Create the highlights-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'highlights-photos',
  'highlights-photos',
  true, -- Public bucket for easy access
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ]
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];

-- 2. Create RLS policies for the highlights-photos bucket

-- Policy: Authenticated users can upload highlight photos
DROP POLICY IF EXISTS "Users can upload highlight photos" ON storage.objects;
CREATE POLICY "Users can upload highlight photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'highlights-photos' AND
    auth.uid() IS NOT NULL
  );

-- Policy: Public access to view highlight photos
DROP POLICY IF EXISTS "Public can view highlight photos" ON storage.objects;
CREATE POLICY "Public can view highlight photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'highlights-photos');

-- Policy: Users can update their own highlight photos
DROP POLICY IF EXISTS "Users can update their highlight photos" ON storage.objects;
CREATE POLICY "Users can update their highlight photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'highlights-photos' AND
    auth.uid() IS NOT NULL
  );

-- Policy: Users can delete their own highlight photos
DROP POLICY IF EXISTS "Users can delete their highlight photos" ON storage.objects;
CREATE POLICY "Users can delete their highlight photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'highlights-photos' AND
    auth.uid() IS NOT NULL
  );

