-- Fix the phone identity to use the correct auth_user_id
-- The phone identity was created with the email user ID, but phone auth creates a different user ID

-- 1. First, let's see the current phone identity
SELECT 'current_phone_identity' as status, * 
FROM account_identities 
WHERE method = 'phone' AND identifier = '+61466310826';

-- 2. Update the phone identity to use the phone auth user ID
-- This links the phone number to the correct Supabase auth user
UPDATE account_identities 
SET auth_user_id = '7a841545-1ad2-4ba4-8739-6bb6bd0326dc'
WHERE method = 'phone' AND identifier = '+61466310826';

-- 3. Verify the update worked
SELECT 'updated_phone_identity' as status, * 
FROM account_identities 
WHERE method = 'phone' AND identifier = '+61466310826';

-- 4. Show all identities for the account to verify everything is correct
SELECT 'all_account_identities' as status, * 
FROM account_identities 
WHERE account_id = '2967a33a-69f7-4e8b-97c9-5fc0bea60180'
ORDER BY created_at;
