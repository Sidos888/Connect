-- COMPLETE RESET - Use this to start completely fresh
-- Run this in Supabase SQL Editor

-- 1. Delete all account identities
DELETE FROM account_identities;

-- 2. Delete all accounts  
DELETE FROM accounts;

-- 3. Delete all auth users (this removes authentication)
DELETE FROM auth.users;

-- 4. Verify everything is clean
SELECT 'account_identities' as table_name, COUNT(*) as count FROM account_identities
UNION ALL
SELECT 'accounts' as table_name, COUNT(*) as count FROM accounts  
UNION ALL
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users;

-- All counts should be 0

