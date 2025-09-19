-- COMPLETE CLEAN SLATE: Remove all authentication data for fresh testing
-- This will give you a completely clean system to test from scratch

-- 1. Remove all account identities (must be first due to foreign key)
DELETE FROM account_identities;

-- 2. Remove all accounts
DELETE FROM accounts;

-- 3. Clean up any orphaned auth users (optional - be careful with this)
-- DELETE FROM auth.users; -- Uncomment only if you want to remove Supabase auth users too

-- 4. Verify everything is completely clean
SELECT 
    'CLEAN_SLATE_VERIFICATION' as status,
    'account_identities' as table_name,
    COUNT(*) as remaining_records
FROM account_identities
UNION ALL
SELECT 
    'CLEAN_SLATE_VERIFICATION' as status,
    'accounts' as table_name,
    COUNT(*) as remaining_records
FROM accounts;

-- 5. Show what auth users still exist (if any)
SELECT 
    'AUTH_USERS_REMAINING' as status,
    id,
    email,
    phone,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- You should see:
-- account_identities: 0 records
-- accounts: 0 records
-- This confirms a completely clean slate for testing!
