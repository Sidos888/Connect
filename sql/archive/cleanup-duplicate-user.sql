-- Delete the duplicate "User" profile that was just created
-- This profile has phone 6146631082 (without +) and empty email

DELETE FROM profiles 
WHERE full_name = 'User' 
  AND email IS NULL 
  AND phone = '6146631082';

-- Verify the cleanup
SELECT id, full_name, email, phone 
FROM profiles 
WHERE phone LIKE '%466310%'
ORDER BY created_at DESC;
