-- Debug: Where is the phone number +61466310826 stored?
-- Let's check all possible locations in Supabase

-- 1. Check account_identities table (most likely location)
SELECT 'account_identities' as table_name, * 
FROM account_identities 
WHERE identifier LIKE '%466310826%';

-- 2. Check accounts table (in case phone is stored there)
SELECT 'accounts' as table_name, id, name, bio, dob, profile_pic, connect_id, created_at 
FROM accounts;

-- 3. Check if there are any accounts at all
SELECT 'accounts_count' as info, COUNT(*) as total_accounts FROM accounts;

-- 4. Check if there are any account_identities at all
SELECT 'identities_count' as info, COUNT(*) as total_identities FROM account_identities;

-- 5. Check all identities (to see what's actually there)
SELECT 'all_identities' as table_name, * 
FROM account_identities 
ORDER BY created_at DESC;

-- 6. Check auth.users table (Supabase built-in auth table)
SELECT 'auth_users' as table_name, id, email, phone, created_at, updated_at
FROM auth.users
WHERE phone LIKE '%466310826%' OR email = 'sidfarquharson@gmail.com';

-- 7. Check all auth users
SELECT 'all_auth_users' as table_name, id, email, phone, created_at
FROM auth.users
ORDER BY created_at DESC;

-- 8. Check if there are any constraints or indexes that might cause conflicts
SELECT 
    'constraints' as info,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN ('account_identities', 'accounts')
);

-- 9. Check for any triggers that might be interfering
SELECT 
    'triggers' as info,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('account_identities', 'accounts');
