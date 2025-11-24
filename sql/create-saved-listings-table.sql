-- Create saved_listings table to track user-saved listings
CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id ON saved_listings(listing_id);

-- Enable Row Level Security
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own saved listings
CREATE POLICY "Users can view their own saved listings" ON saved_listings
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own saved listings
CREATE POLICY "Users can insert their own saved listings" ON saved_listings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own saved listings
CREATE POLICY "Users can delete their own saved listings" ON saved_listings
  FOR DELETE USING (user_id = auth.uid());

