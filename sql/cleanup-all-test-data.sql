-- Clean up all test data for fresh start
-- Run this in Supabase SQL Editor

-- 1. Delete all account identities (this removes the email/phone links)
DELETE FROM account_identities;

-- 2. Delete all accounts (this removes the profile data)
DELETE FROM accounts;

-- 3. Delete all auth users (this removes the authentication records)
-- Note: This requires admin privileges in Supabase
DELETE FROM auth.users;

-- 4. Reset sequences (optional - ensures clean IDs)
-- ALTER SEQUENCE accounts_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT 'account_identities' as table_name, COUNT(*) as count FROM account_identities
UNION ALL
SELECT 'accounts' as table_name, COUNT(*) as count FROM accounts
UNION ALL
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users;

