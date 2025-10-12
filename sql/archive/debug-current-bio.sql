-- Debug: Check current bio data in Supabase
-- Run this to see what bio is actually stored in the database

-- 1. Check all accounts and their bios
SELECT 
    id,
    name,
    bio,
    LENGTH(bio) as bio_length,
    updated_at,
    created_at
FROM accounts 
ORDER BY updated_at DESC;

-- 2. Check account identities to see which account belongs to your phone
SELECT 
    ai.method,
    ai.identifier,
    ai.account_id,
    a.name,
    a.bio,
    LENGTH(a.bio) as bio_length
FROM account_identities ai
JOIN accounts a ON ai.account_id = a.id
WHERE ai.identifier IN ('+61466310826', '61466310826', '466310826')
ORDER BY ai.created_at DESC;

-- 3. Check your specific account by ID (from logs: 0c1b1b23-3d0b-48c2-9df3-b87e7bac1c33)
SELECT 
    'SPECIFIC_ACCOUNT' as query_type,
    id,
    name,
    bio,
    LENGTH(bio) as bio_length,
    profile_pic,
    connect_id,
    updated_at
FROM accounts 
WHERE id = '0c1b1b23-3d0b-48c2-9df3-b87e7bac1c33';

-- This will show you exactly what bio data is stored in Supabase right now
