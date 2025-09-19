-- Let's run these queries one by one to debug the phone number issue

-- Query 1: Check if account_identities table exists and has any data
SELECT COUNT(*) as total_identities FROM account_identities;

-- Query 2: Check if accounts table exists and has any data  
SELECT COUNT(*) as total_accounts FROM accounts;

-- Query 3: Show all account_identities (if any)
SELECT * FROM account_identities ORDER BY created_at DESC;

-- Query 4: Show all accounts (if any)
SELECT * FROM accounts ORDER BY created_at DESC;

-- Query 5: Check auth.users table for the specific phone number
SELECT id, email, phone, created_at FROM auth.users 
WHERE phone LIKE '%466310826%' OR email = 'sidfarquharson@gmail.com';

-- Query 6: Check all auth.users
SELECT id, email, phone, created_at FROM auth.users 
ORDER BY created_at DESC;

-- Query 7: Look for any phone number in account_identities
SELECT * FROM account_identities WHERE method = 'phone';

-- Query 8: Look for the specific phone number anywhere
SELECT * FROM account_identities WHERE identifier = '+61466310826';
