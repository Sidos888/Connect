-- Simple Authentication Fix
-- Go back to a simple system that actually works

-- 1. CREATE A SIMPLE PROFILES TABLE (like your original design)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    profile_pic TEXT,
    connect_id TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DISABLE RLS FOR NOW (we can add it back later when it's working)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. CREATE INDEXES
CREATE INDEX IF NOT EXISTS profiles_connect_id_idx ON profiles(connect_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles(phone);

-- 4. TEST INSERT
INSERT INTO profiles (id, name, bio, connect_id, email) 
VALUES (gen_random_uuid(), 'Test User', 'Test Bio', 'testuser_123', 'test@example.com')
RETURNING *;

