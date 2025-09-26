-- New Scalable Authentication System
-- This creates the proper identity linking architecture

-- 1. CREATE ACCOUNTS TABLE (True user profiles)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    dob DATE,
    profile_pic TEXT,
    connect_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE ACCOUNT_IDENTITIES TABLE (Links auth methods to accounts)
CREATE TABLE IF NOT EXISTS account_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method TEXT NOT NULL, -- 'email', 'phone', 'google', 'apple', etc.
    identifier TEXT NOT NULL, -- email address, phone number, etc.
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one auth_user_id can only link to one account
    UNIQUE(auth_user_id),
    -- Ensure one identifier per method (no duplicate emails)
    UNIQUE(method, identifier)
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_identities ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES FOR ACCOUNTS
CREATE POLICY "Users can view their own account" ON accounts
    FOR SELECT USING (
        id IN (
            SELECT ai.account_id 
            FROM account_identities ai 
            WHERE ai.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own account" ON accounts
    FOR UPDATE USING (
        id IN (
            SELECT ai.account_id 
            FROM account_identities ai 
            WHERE ai.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own account" ON accounts
    FOR INSERT WITH CHECK (true); -- Will be controlled by account_identities

-- 5. CREATE RLS POLICIES FOR ACCOUNT_IDENTITIES
CREATE POLICY "Users can view their own identities" ON account_identities
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert their own identities" ON account_identities
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- 6. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_account_identities_auth_user_id ON account_identities(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_account_identities_account_id ON account_identities(account_id);
CREATE INDEX IF NOT EXISTS idx_account_identities_method_identifier ON account_identities(method, identifier);
CREATE INDEX IF NOT EXISTS idx_accounts_connect_id ON accounts(connect_id);

-- 7. CREATE UPDATED_AT TRIGGER FOR ACCOUNTS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. MIGRATION FUNCTION TO MOVE EXISTING PROFILES
CREATE OR REPLACE FUNCTION migrate_existing_profiles()
RETURNS void AS $$
DECLARE
    profile_record RECORD;
    new_account_id UUID;
    user_email TEXT;
    user_phone TEXT;
BEGIN
    -- Loop through all existing profiles
    FOR profile_record IN 
        SELECT * FROM profiles 
    LOOP
        -- Get user details from auth.users
        SELECT email, phone INTO user_email, user_phone
        FROM auth.users 
        WHERE id = profile_record.id;
        
        -- Create new account
        INSERT INTO accounts (name, bio, dob, profile_pic, connect_id, created_at)
        VALUES (
            profile_record.name,
            profile_record.bio,
            profile_record.dob,
            profile_record.profile_pic,
            profile_record.connect_id,
            profile_record.created_at
        )
        RETURNING id INTO new_account_id;
        
        -- Link the auth user to the new account
        INSERT INTO account_identities (account_id, auth_user_id, method, identifier)
        VALUES (new_account_id, profile_record.id, 'auth_user', profile_record.id::text);
        
        -- Add email identity if exists
        IF user_email IS NOT NULL THEN
            INSERT INTO account_identities (account_id, auth_user_id, method, identifier)
            VALUES (new_account_id, profile_record.id, 'email', user_email)
            ON CONFLICT (method, identifier) DO NOTHING;
        END IF;
        
        -- Add phone identity if exists  
        IF user_phone IS NOT NULL THEN
            INSERT INTO account_identities (account_id, auth_user_id, method, identifier)
            VALUES (new_account_id, profile_record.id, 'phone', user_phone)
            ON CONFLICT (method, identifier) DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Migrated profile % to account %', profile_record.id, new_account_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. HELPER FUNCTION TO FIND ACCOUNT BY AUTH USER
CREATE OR REPLACE FUNCTION get_account_by_auth_user(auth_user_uuid UUID)
RETURNS TABLE(
    account_id UUID,
    name TEXT,
    bio TEXT,
    dob DATE,
    profile_pic TEXT,
    connect_id TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.name, a.bio, a.dob, a.profile_pic, a.connect_id, a.created_at, a.updated_at
    FROM accounts a
    JOIN account_identities ai ON a.id = ai.account_id
    WHERE ai.auth_user_id = auth_user_uuid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. HELPER FUNCTION TO FIND ACCOUNT BY IDENTIFIER
CREATE OR REPLACE FUNCTION get_account_by_identifier(method_name TEXT, identifier_value TEXT)
RETURNS TABLE(
    account_id UUID,
    name TEXT,
    bio TEXT,
    dob DATE,
    profile_pic TEXT,
    connect_id TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.name, a.bio, a.dob, a.profile_pic, a.connect_id, a.created_at, a.updated_at
    FROM accounts a
    JOIN account_identities ai ON a.id = ai.account_id
    WHERE ai.method = method_name AND ai.identifier = identifier_value
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

