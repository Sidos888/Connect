-- CLEAN SLATE: Remove all test data and start fresh
-- This will give you a completely clean authentication system

-- 1. Remove all test identities
DELETE FROM account_identities;

-- 2. Remove all test accounts  
DELETE FROM accounts;

-- 3. Verify everything is clean
SELECT 'identities_remaining' as table_name, COUNT(*) as count FROM account_identities
UNION ALL
SELECT 'accounts_remaining' as table_name, COUNT(*) as count FROM accounts;

-- You should see 0 for both counts - completely clean slate!
