-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  capacity INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT true,
  photo_urls TEXT[], -- Array of photo URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_public ON listings(is_public);
CREATE INDEX IF NOT EXISTS idx_listings_start_date ON listings(start_date);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view public listings or their own listings
CREATE POLICY "Users can view public listings or own listings" ON listings
  FOR SELECT USING (
    is_public = true OR host_id = auth.uid()
  );

-- Policy: Users can insert their own listings
CREATE POLICY "Users can insert own listings" ON listings
  FOR INSERT WITH CHECK (
    host_id = auth.uid()
  );

-- Policy: Users can update their own listings
CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (
    host_id = auth.uid()
  );

-- Policy: Users can delete their own listings
CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (
    host_id = auth.uid()
  );

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listings_updated_at();
