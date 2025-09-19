-- Test the exact query that FAST CHECK should be running
-- This will help us see if there's a permissions or data issue

-- 1. Test the identity lookup (Step 1 of FAST CHECK)
SELECT 
    'step1_identity_lookup' as test_step,
    account_id,
    auth_user_id,
    method,
    identifier
FROM account_identities
WHERE method = 'phone' AND identifier = '+61466310826';

-- 2. Test the account lookup (Step 2 of FAST CHECK) 
SELECT 
    'step2_account_lookup' as test_step,
    id,
    name,
    bio,
    profile_pic,
    connect_id
FROM accounts
WHERE id = '2967a33a-69f7-4e8b-97c9-5fc0bea60180';

-- 3. Test the combined query that should work
SELECT 
    'combined_query' as test_step,
    ai.account_id,
    a.name,
    a.bio,
    a.profile_pic,
    a.connect_id
FROM account_identities ai
JOIN accounts a ON ai.account_id = a.id
WHERE ai.method = 'phone' AND ai.identifier = '+61466310826';

-- 4. Test what the app should see with current RLS policies
-- This simulates what the app sees when signed in as the phone user
SET LOCAL "request.jwt.claims" = '{"sub": "7a841545-1ad2-4ba4-8739-6bb6bd0326dc"}';

SELECT 
    'rls_test_phone_user' as test_step,
    *
FROM account_identities
WHERE method = 'phone' AND identifier = '+61466310826';

RESET LOCAL;
