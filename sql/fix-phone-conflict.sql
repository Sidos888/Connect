-- Fix the specific phone number conflict
-- This removes the duplicate phone identity that's causing the 409 error

-- First, let's see what phone identities exist for +61466310826
SELECT 
    id,
    account_id,
    auth_user_id,
    method,
    identifier,
    created_at
FROM account_identities 
WHERE method = 'phone' AND identifier = '+61466310826'
ORDER BY created_at DESC;

-- Remove the phone identity that's causing conflicts
-- This will allow you to create a new one
DELETE FROM account_identities 
WHERE method = 'phone' AND identifier = '+61466310826';

-- Verify it's gone
SELECT COUNT(*) as remaining_phone_identities
FROM account_identities 
WHERE method = 'phone' AND identifier = '+61466310826';
