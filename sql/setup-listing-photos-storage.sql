-- Setup Supabase Storage for Listing Photos
-- This script creates a storage bucket for listing photos

-- 1. Create the listing-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
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

-- 2. Create RLS policies for the listing-photos bucket

-- Policy: Authenticated users can upload listing photos
DROP POLICY IF EXISTS "Users can upload listing photos" ON storage.objects;
CREATE POLICY "Users can upload listing photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-photos' AND
    auth.uid() IS NOT NULL
  );

-- Policy: Public access to view listing photos
DROP POLICY IF EXISTS "Public can view listing photos" ON storage.objects;
CREATE POLICY "Public can view listing photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-photos');

-- Policy: Users can update their own listing photos
DROP POLICY IF EXISTS "Users can update their listing photos" ON storage.objects;
CREATE POLICY "Users can update their listing photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'listing-photos' AND
    auth.uid() IS NOT NULL
  );

-- Policy: Users can delete their own listing photos
DROP POLICY IF EXISTS "Users can delete their listing photos" ON storage.objects;
CREATE POLICY "Users can delete their listing photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-photos' AND
    auth.uid() IS NOT NULL
  );


