-- Create event_galleries table
CREATE TABLE IF NOT EXISTS event_galleries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id) -- One gallery per listing
);

-- Create event_gallery_items table
CREATE TABLE IF NOT EXISTS event_gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID NOT NULL REFERENCES event_galleries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add has_gallery column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS has_gallery BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_galleries_listing_id ON event_galleries(listing_id);
CREATE INDEX IF NOT EXISTS idx_event_gallery_items_gallery_id ON event_gallery_items(gallery_id);
CREATE INDEX IF NOT EXISTS idx_event_gallery_items_user_id ON event_gallery_items(user_id);

-- Enable Row Level Security
ALTER TABLE event_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gallery_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_galleries
-- Anyone can view galleries for public listings
CREATE POLICY "Anyone can view event galleries" ON event_galleries
  FOR SELECT USING (true);

-- Only listing hosts can create galleries (will be done via service role or trigger)
-- For now, allow authenticated users to create (will be restricted in application logic)
CREATE POLICY "Authenticated users can create galleries" ON event_galleries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only listing hosts can update galleries
CREATE POLICY "Hosts can update their listing galleries" ON event_galleries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = event_galleries.listing_id 
      AND listings.host_id = auth.uid()
    )
  );

-- RLS Policies for event_gallery_items
-- Anyone can view gallery items
CREATE POLICY "Anyone can view gallery items" ON event_gallery_items
  FOR SELECT USING (true);

-- Only attendees (participants or hosts) can add photos
CREATE POLICY "Attendees can add photos to galleries" ON event_gallery_items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM event_galleries eg
      INNER JOIN listings l ON l.id = eg.listing_id
      WHERE eg.id = event_gallery_items.gallery_id
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

-- Users can delete their own photos (for future implementation)
CREATE POLICY "Users can delete their own gallery photos" ON event_gallery_items
  FOR DELETE USING (user_id = auth.uid());

