-- Verify the phone identity fix is correct and debug the FAST CHECK issue

-- 1. Check what the FAST CHECK is looking for
-- It should find: method='phone' AND identifier='+61466310826'
SELECT 
    'fast_check_target' as query_type,
    * 
FROM account_identities 
WHERE method = 'phone' AND identifier = '+61466310826';

-- 2. Check what auth_user_id it should have
-- Should be: 7a841545-1ad2-4ba4-8739-6bb6bd0326dc (the phone auth user)
SELECT 
    'phone_identity_check' as query_type,
    *
FROM account_identities 
WHERE method = 'phone' 
AND identifier = '+61466310826' 
AND auth_user_id = '7a841545-1ad2-4ba4-8739-6bb6bd0326dc';

-- 3. Show the account that should be found
SELECT 
    'linked_account' as query_type,
    a.*
FROM accounts a
JOIN account_identities ai ON a.id = ai.account_id
WHERE ai.method = 'phone' AND ai.identifier = '+61466310826';

-- 4. Test the exact query that FAST CHECK runs
SELECT 
    'fast_check_simulation' as query_type,
    account_id,
    accounts
FROM account_identities
LEFT JOIN accounts ON accounts.id = account_identities.account_id
WHERE account_identities.method = 'phone' 
AND account_identities.identifier = '+61466310826';
