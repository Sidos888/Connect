-- Setup Supabase Storage for Event Galleries
-- This script creates a storage bucket for event gallery photos

-- 1. Create the event-galleries storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-galleries',
  'event-galleries',
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
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Create RLS policies for the event-galleries bucket

-- Policy: Attendees (participants or hosts) can upload gallery photos
DROP POLICY IF EXISTS "Attendees can upload gallery photos" ON storage.objects;
CREATE POLICY "Attendees can upload gallery photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-galleries' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      -- Check if user is a host or participant of the listing
      SELECT 1 FROM event_galleries eg
      INNER JOIN listings l ON l.id = eg.listing_id
      WHERE eg.id::text = (storage.foldername(name))[1]
      AND (
        l.host_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM listing_participants lp
          WHERE lp.listing_id = l.id
          AND lp.user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Public access to view gallery photos
DROP POLICY IF EXISTS "Public can view gallery photos" ON storage.objects;
CREATE POLICY "Public can view gallery photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-galleries');

-- Policy: Users can update their own gallery photos
DROP POLICY IF EXISTS "Users can update their gallery photos" ON storage.objects;
CREATE POLICY "Users can update their gallery photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-galleries' AND
    auth.uid() = owner
  );

-- Policy: Users can delete their own gallery photos
DROP POLICY IF EXISTS "Users can delete their gallery photos" ON storage.objects;
CREATE POLICY "Users can delete their gallery photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-galleries' AND
    auth.uid() = owner
  );

