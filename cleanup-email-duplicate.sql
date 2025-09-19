-- CLEANUP EMAIL DUPLICATE PROFILE
-- Remove the duplicate profile created by email authentication

-- Step 1: Delete the duplicate profile with the email auth user ID
DELETE FROM profiles 
WHERE id = '6212e537-e25d-46ba-940d-b4af0e12350a'
  AND full_name = 'User';  -- Only delete if it's the empty "User" profile

-- Step 2: Verify cleanup
SELECT 'Remaining profiles after cleanup:' as status;
SELECT id, full_name, email, phone, created_at 
FROM profiles 
WHERE full_name ILIKE '%sid%' 
   OR email ILIKE '%sidfarquharson%'
   OR id IN ('6212e537-e25d-46ba-940d-b4af0e12350a', 'c578db0d-ba3e-467c-86cc-2018b35dd9bf')
ORDER BY created_at DESC;

-- Step 3: Check if cleanup was successful
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ SUCCESS - Only one Sid Farquharson profile remains!'
    ELSE '❌ Multiple profiles still exist - manual cleanup needed'
  END as cleanup_status
FROM profiles 
WHERE full_name ILIKE '%sid%' 
   OR email ILIKE '%sidfarquharson%';
