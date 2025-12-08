-- Add support for multiple photos and custom date/time to user_highlights table
-- This migration adds:
-- 1. photo_urls TEXT[] - Array of photo URLs (for multiple photos)
-- 2. highlight_date TIMESTAMPTZ - Custom date/time for the highlight

-- Add photo_urls column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_highlights' AND column_name = 'photo_urls'
  ) THEN
    ALTER TABLE user_highlights 
      ADD COLUMN photo_urls TEXT[];
  END IF;
END $$;

-- Add highlight_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_highlights' AND column_name = 'highlight_date'
  ) THEN
    ALTER TABLE user_highlights 
      ADD COLUMN highlight_date TIMESTAMPTZ;
  END IF;
END $$;

-- Create index for highlight_date for better query performance
CREATE INDEX IF NOT EXISTS idx_user_highlights_highlight_date 
  ON user_highlights(highlight_date DESC);

-- Note: image_url column remains for backward compatibility
-- New highlights should use photo_urls array, with image_url set to the first photo

