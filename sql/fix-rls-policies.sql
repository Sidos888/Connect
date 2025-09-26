-- Fix RLS Policies for Account Creation
-- The current policies are too restrictive and blocking inserts

-- 1. DROP THE RESTRICTIVE INSERT POLICY
DROP POLICY IF EXISTS "Users can insert their own account" ON accounts;

-- 2. CREATE A MORE PERMISSIVE INSERT POLICY
-- Allow authenticated users to create accounts
CREATE POLICY "Authenticated users can create accounts" ON accounts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. ALSO FIX THE ACCOUNT_IDENTITIES POLICY
DROP POLICY IF EXISTS "Users can insert their own identities" ON account_identities;

CREATE POLICY "Authenticated users can create identities" ON account_identities
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth_user_id = auth.uid());

-- 4. VERIFY THE POLICIES
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('accounts', 'account_identities')
ORDER BY tablename, policyname;

