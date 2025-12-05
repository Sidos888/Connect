-- Create user_moments table for custom timeline moments
CREATE TABLE IF NOT EXISTS user_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  moment_type TEXT NOT NULL, -- 'preschool', 'primary-school', 'first-job', etc.
  category TEXT NOT NULL, -- 'education', 'career', 'relationships', 'life-changes', 'experiences', 'other'
  title TEXT NOT NULL,
  summary TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  photo_urls TEXT[], -- Array of photo URLs
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_moments_user_id ON user_moments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moments_start_date ON user_moments(start_date DESC);

-- Enable RLS
ALTER TABLE user_moments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own moments
CREATE POLICY "users_view_own_moments" ON user_moments
  FOR SELECT USING (user_id = auth.uid());

-- Users can view moments of accounts with public visibility OR friends
CREATE POLICY "users_view_friends_moments" ON user_moments
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM accounts WHERE profile_visibility = 'public'
    )
    OR
    user_id IN (
      SELECT CASE 
        WHEN user1_id = auth.uid() THEN user2_id
        WHEN user2_id = auth.uid() THEN user1_id
      END
      FROM connections
      WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
        AND status = 'accepted'
    )
  );

-- Users can insert their own moments
CREATE POLICY "users_insert_own_moments" ON user_moments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own moments
CREATE POLICY "users_update_own_moments" ON user_moments
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own moments
CREATE POLICY "users_delete_own_moments" ON user_moments
  FOR DELETE USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_user_moments_updated_at
  BEFORE UPDATE ON user_moments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

