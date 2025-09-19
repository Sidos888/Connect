-- Test direct insert to verify tables work
-- This will help us determine if the issue is with the tables themselves

-- 1. TEST INSERT INTO ACCOUNTS TABLE
INSERT INTO accounts (name, bio, connect_id) 
VALUES ('Test User', 'Test Bio', 'testuser_123456')
RETURNING *;

-- 2. CHECK IF THE INSERT WORKED
SELECT * FROM accounts WHERE name = 'Test User';

-- 3. TEST INSERT INTO ACCOUNT_IDENTITIES (if accounts insert works)
-- INSERT INTO account_identities (account_id, auth_user_id, method, identifier)
-- VALUES (
--     (SELECT id FROM accounts WHERE name = 'Test User' LIMIT 1),
--     'test-auth-user-id',
--     'email', 
--     'test@example.com'
-- )
-- RETURNING *;

