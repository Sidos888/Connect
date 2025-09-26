-- Fix truncated phone number for Sid Farquharson
-- Current: +6146631082 (missing last digit)
-- Correct: +61466310826

UPDATE profiles 
SET phone = '+61466310826' 
WHERE full_name = 'Sid Farquharson' 
  AND email = 'sidfarquharson@gmail.com' 
  AND phone = '+6146631082';

-- Verify the update
SELECT id, full_name, email, phone 
FROM profiles 
WHERE full_name = 'Sid Farquharson';
