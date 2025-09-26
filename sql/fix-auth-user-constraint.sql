-- Fix the UNIQUE constraint issue that prevents multiple identities per user
-- This allows users to have both email AND phone authentication methods

-- 1. First, let's see the current constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'account_identities')
AND contype = 'u'; -- unique constraints only

-- 2. Drop the problematic UNIQUE constraint on auth_user_id
-- This constraint prevents users from having multiple identity methods
ALTER TABLE account_identities 
DROP CONSTRAINT IF EXISTS account_identities_auth_user_id_key;

-- 3. Verify the constraint is gone
SELECT 
    'after_fix' as status,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'account_identities')
AND contype = 'u';

-- 4. Test that we can now insert multiple identities for the same user
-- (This is just a test - you can run this to verify it works)
-- INSERT INTO account_identities (account_id, auth_user_id, method, identifier) VALUES 
-- ('2967a33a-69f7-4e8b-97c9-5fc0bea60180', '2967a33a-69f7-4e8b-97c9-5fc0bea60180', 'phone', '+61466310826');

-- 5. Show all identities for your user to verify
SELECT * FROM account_identities WHERE auth_user_id = '2967a33a-69f7-4e8b-97c9-5fc0bea60180';
