-- Fix RLS policies to allow phone authentication to work properly
-- The issue is that phone auth creates a new user session that can't see the existing identity records

-- 1. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('account_identities', 'accounts')
ORDER BY tablename, policyname;

-- 2. Drop existing restrictive policies that might be blocking cross-auth access
DROP POLICY IF EXISTS "Users can view their own identities" ON account_identities;
DROP POLICY IF EXISTS "Users can insert their own identities" ON account_identities;

-- 3. Create more permissive policies that allow identity linking across auth methods
CREATE POLICY "Allow identity lookups" ON account_identities
    FOR SELECT USING (true); -- Allow all authenticated users to read identities for linking

CREATE POLICY "Allow identity creation" ON account_identities
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); -- Allow any authenticated user to create identities

-- 4. Test the phone identity lookup that should work now
SELECT 
    'test_phone_lookup' as test_type,
    ai.account_id,
    a.name,
    a.profile_pic
FROM account_identities ai
JOIN accounts a ON ai.account_id = a.id
WHERE ai.method = 'phone' AND ai.identifier = '+61466310826';

-- 5. Verify policies are updated
SELECT 
    'updated_policies' as status,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'account_identities'
ORDER BY policyname;
