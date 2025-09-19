-- Clean up duplicate phone identities that might be causing 409 conflicts
-- This script removes duplicate phone identities, keeping only the most recent one

-- First, let's see what duplicate phone identities exist
SELECT 
    method,
    identifier,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at DESC) as identity_ids,
    array_agg(account_id ORDER BY created_at DESC) as account_ids
FROM account_identities 
WHERE method = 'phone'
GROUP BY method, identifier 
HAVING COUNT(*) > 1;

-- Remove older duplicate phone identities, keeping only the most recent one
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY method, identifier ORDER BY created_at DESC) as rn
    FROM account_identities 
    WHERE method = 'phone'
)
DELETE FROM account_identities 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Show remaining phone identities after cleanup
SELECT * FROM account_identities WHERE method = 'phone' ORDER BY created_at DESC;
