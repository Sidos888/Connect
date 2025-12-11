-- Create shown_completion_screens table to track which completion screens have been shown to users
-- This ensures completion screens only display once per finished event, even after sign-out/sign-in or app reload
CREATE TABLE IF NOT EXISTS shown_completion_screens (
  user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shown_completion_screens_user_id ON shown_completion_screens(user_id);
CREATE INDEX IF NOT EXISTS idx_shown_completion_screens_listing_id ON shown_completion_screens(listing_id);

-- Enable Row Level Security
ALTER TABLE shown_completion_screens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own shown completion screens
CREATE POLICY "Users can view their own shown completion screens" ON shown_completion_screens
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own shown completion screens
CREATE POLICY "Users can insert their own shown completion screens" ON shown_completion_screens
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own shown completion screens (for cleanup if needed)
CREATE POLICY "Users can delete their own shown completion screens" ON shown_completion_screens
  FOR DELETE USING (user_id = auth.uid());
