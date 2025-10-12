-- Debug user discovery issues
-- Check if users are properly stored in accounts table and can be discovered

-- Check all users in accounts table
SELECT 
    id, 
    name, 
    bio, 
    profile_pic, 
    connect_id, 
    created_at,
    CASE 
        WHEN name ILIKE '%sid%' THEN '*** SID FOUND ***'
        ELSE ''
    END as is_sid
FROM accounts 
ORDER BY created_at DESC;

-- Check if there are any users with similar names
SELECT 
    id, 
    name, 
    bio, 
    profile_pic, 
    connect_id, 
    created_at
FROM accounts 
WHERE name ILIKE '%sid%' OR name ILIKE '%farquharson%'
ORDER BY created_at DESC;

-- Check recent users (last 10)
SELECT 
    id, 
    name, 
    bio, 
    profile_pic, 
    connect_id, 
    created_at
FROM accounts 
ORDER BY created_at DESC 
LIMIT 10;

-- Test the search functionality
SELECT 
    id, 
    name, 
    bio, 
    profile_pic, 
    connect_id, 
    created_at
FROM accounts 
WHERE name ILIKE '%sid%'
ORDER BY created_at DESC;
