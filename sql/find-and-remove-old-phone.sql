-- Find and remove the old phone data for +61466310826

-- Step 1: Find the phone identity record
SELECT 
    'phone_identity' as type,
    id,
    account_id,
    auth_user_id,
    method,
    identifier,
    created_at
FROM account_identities 
WHERE method = 'phone' AND identifier = '+61466310826';

-- Step 2: Find the associated account (if any)
SELECT 
    'associated_account' as type,
    a.id,
    a.name,
    a.connect_id,
    a.created_at
FROM accounts a
WHERE a.id IN (
    SELECT account_id 
    FROM account_identities 
    WHERE method = 'phone' AND identifier = '+61466310826'
);

-- Step 3: Check if this account has other identity methods (email, etc.)
SELECT 
    'all_identities_for_account' as type,
    ai.*
FROM account_identities ai
WHERE ai.account_id IN (
    SELECT account_id 
    FROM account_identities 
    WHERE method = 'phone' AND identifier = '+61466310826'
);

-- Step 4: Remove ONLY the phone identity (keeps the account and other identities)
DELETE FROM account_identities 
WHERE method = 'phone' AND identifier = '+61466310826';

-- Step 5: Verify the phone identity is gone
SELECT 
    'verification' as type,
    COUNT(*) as remaining_phone_identities
FROM account_identities 
WHERE method = 'phone' AND identifier = '+61466310826';

-- Step 6: Show remaining identities for the account (should still have email, etc.)
SELECT 
    'remaining_identities' as type,
    ai.method,
    ai.identifier,
    ai.created_at
FROM account_identities ai
WHERE ai.account_id IN (
    SELECT DISTINCT account_id 
    FROM account_identities 
    WHERE account_id IS NOT NULL
)
ORDER BY ai.created_at DESC;
