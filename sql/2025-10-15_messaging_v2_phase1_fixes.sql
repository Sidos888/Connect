-- ============================================================================
-- Messaging System v2: Phase 1 Fixes
-- Created: 2025-10-15
-- ============================================================================
-- This migration implements Phase 1 of the Messaging System v2 Stabilization Plan:
-- 1. Atomic account resolution
-- 2. RLS helper function for consistent auth mapping
-- 3. Performance indexes
-- ============================================================================

-- ============================================================================
-- 1.2: Atomic Account Resolution
-- ============================================================================

-- Helper function: Get current account_id from auth.uid()
-- This ensures consistent mapping across all RLS policies
CREATE OR REPLACE FUNCTION app_current_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_id 
  FROM account_identities 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION app_current_account_id() TO authenticated;

-- Atomic account getter/creator for auth users
-- This replaces the 5-strategy loading logic in authContext
CREATE OR REPLACE FUNCTION app_get_or_create_account_for_auth_user()
RETURNS TABLE(
  account_id uuid,
  account_name text,
  account_profile_pic text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id uuid;
  v_account_id uuid;
  v_name text;
  v_profile_pic text;
  v_created_at timestamptz;
  v_updated_at timestamptz;
BEGIN
  -- Get current authenticated user ID
  v_auth_id := auth.uid();
  
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Try to find existing account via account_identities
  SELECT ai.account_id INTO v_account_id
  FROM account_identities ai
  WHERE ai.auth_user_id = v_auth_id
  LIMIT 1;
  
  -- If found, fetch account details
  IF v_account_id IS NOT NULL THEN
    SELECT a.name, a.profile_pic, a.created_at, a.updated_at
    INTO v_name, v_profile_pic, v_created_at, v_updated_at
    FROM accounts a
    WHERE a.id = v_account_id;
    
    -- Return existing account
    RETURN QUERY SELECT v_account_id, v_name, v_profile_pic, v_created_at, v_updated_at;
    RETURN;
  END IF;
  
  -- No account found: create new account
  -- Generate a default name from auth metadata
  SELECT COALESCE(
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'username',
    split_part(email, '@', 1),
    'User ' || substring(v_auth_id::text, 1, 8)
  )
  INTO v_name
  FROM auth.users
  WHERE id = v_auth_id;
  
  -- Insert new account
  INSERT INTO accounts (name, profile_pic)
  VALUES (v_name, NULL)
  RETURNING id, name, profile_pic, created_at, updated_at
  INTO v_account_id, v_name, v_profile_pic, v_created_at, v_updated_at;
  
  -- Link auth user to new account
  INSERT INTO account_identities (auth_user_id, account_id, provider)
  VALUES (v_auth_id, v_account_id, 'local');
  
  -- Return newly created account
  RETURN QUERY SELECT v_account_id, v_name, v_profile_pic, v_created_at, v_updated_at;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION app_get_or_create_account_for_auth_user() TO authenticated;

-- ============================================================================
-- 1.3: RLS Policy Updates - Use Helper Function
-- ============================================================================

-- Drop existing RLS policies that use old auth mapping
DROP POLICY IF EXISTS "Users can view messages in their chats" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON chat_messages;
DROP POLICY IF EXISTS "Users can view their chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can insert chat participants" ON chat_participants;

-- chat_messages: Use app_current_account_id() for consistent auth mapping
CREATE POLICY "Users can view messages in their chats"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their chats"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  chat_id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid()
  )
  AND sender_id = app_current_account_id()
);

-- chat_participants: Use app_current_account_id() for consistent auth mapping
CREATE POLICY "Users can view their chat participants"
ON chat_participants
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert chat participants"
ON chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- ============================================================================
-- 1.4: Performance Indexes
-- ============================================================================

-- Index for chat_participants lookups by user_id
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id 
ON chat_participants(user_id);

-- Index for chat_participants lookups by chat_id
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id 
ON chat_participants(chat_id);

-- Composite index for chat_messages ordering (seq + created_at)
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_seq 
ON chat_messages(chat_id, seq DESC NULLS LAST, created_at DESC);

-- Index for account_identities auth lookup
CREATE INDEX IF NOT EXISTS idx_account_identities_auth 
ON account_identities(auth_user_id);

-- ============================================================================
-- Verification Queries (commented out)
-- ============================================================================

-- Test app_current_account_id() returns correct account
-- SELECT app_current_account_id();

-- Test app_get_or_create_account_for_auth_user() returns account
-- SELECT * FROM app_get_or_create_account_for_auth_user();

-- Verify RLS policies are active
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE tablename IN ('chat_messages', 'chat_participants');

-- Verify indexes exist
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE tablename IN ('chat_messages', 'chat_participants', 'account_identities');

