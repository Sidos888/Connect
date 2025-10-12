-- COMPLETE CLEANUP SCRIPT FOR SID FARQUHARSON
-- This will remove ALL traces of Sid's accounts and prepare for fresh start

-- Step 1: Delete all profiles related to Sid Farquharson
DELETE FROM profiles 
WHERE full_name ILIKE '%sid%' 
   OR email ILIKE '%sidfarquharson%'
   OR phone IN ('+61466310826', '61466310826', '466310826', '0466310826')
   OR id IN ('48b8f14c-c524-46cf-863f-0420d7288238', '6f01sd62-f99c-49eb-b6ac-eb7217efc777', '6f015d62-f99c-49eb-b6ac-eb7217efc777');

-- Step 2: Clean up any remaining profiles with "User" name that might be duplicates
DELETE FROM profiles 
WHERE full_name = 'User' 
   AND (email = '' OR email IS NULL)
   AND created_at > '2025-09-18';  -- Only recent "User" profiles

-- Step 3: Verify cleanup
SELECT 'Remaining profiles:' as status;
SELECT id, full_name, email, phone, created_at 
FROM profiles 
WHERE full_name ILIKE '%sid%' 
   OR email ILIKE '%sidfarquharson%'
   OR phone IN ('+61466310826', '61466310826', '466310826', '0466310826')
   OR full_name = 'User';

-- Step 4: Check if cleanup was successful
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ CLEANUP SUCCESSFUL - Ready for fresh account!'
    ELSE '❌ Some accounts remain - check above results'
  END as cleanup_status
FROM profiles 
WHERE full_name ILIKE '%sid%' 
   OR email ILIKE '%sidfarquharson%'
   OR phone IN ('+61466310826', '61466310826', '466310826', '0466310826');
