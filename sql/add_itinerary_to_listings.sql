-- Add itinerary column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS itinerary jsonb;

-- Add comment to describe the column
COMMENT ON COLUMN listings.itinerary IS 'Array of itinerary items with title, summary, location, startDate, endDate, and photo';

