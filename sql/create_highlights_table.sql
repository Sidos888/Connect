-- Create user_highlights table
CREATE TABLE IF NOT EXISTS user_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_highlights_user_id ON user_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_highlights_created_at ON user_highlights(created_at DESC);

-- Enable RLS
ALTER TABLE user_highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all highlights (public)
CREATE POLICY "Users can view all highlights"
  ON user_highlights FOR SELECT
  USING (true);

-- Users can insert their own highlights
CREATE POLICY "Users can insert their own highlights"
  ON user_highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own highlights
CREATE POLICY "Users can update their own highlights"
  ON user_highlights FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own highlights
CREATE POLICY "Users can delete their own highlights"
  ON user_highlights FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_highlights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_highlights_updated_at
  BEFORE UPDATE ON user_highlights
  FOR EACH ROW
  EXECUTE FUNCTION update_user_highlights_updated_at();

