-- Migration: Fix RLS Authentication Mapping
-- Purpose: Create helper function to map auth.uid() to account_id and update all chat RLS policies
-- Status: Ready for production deployment
-- Rollback: See rollback_rls_auth_mapping.sql

-- ==============================================================================
-- STEP 1: Create Helper Function
-- ==============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS auth_account_id();

-- Create function to map auth.uid() to account_id
CREATE OR REPLACE FUNCTION auth_account_id()
RETURNS UUID AS $$
  SELECT account_id 
  FROM account_identities 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auth_account_id() TO authenticated;

-- ==============================================================================
-- STEP 2: Update chat_messages RLS Policies
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to chats they participate in" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- Create new policies using helper function
CREATE POLICY "Users can view messages in their chats" ON chat_messages
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth_account_id()
    )
  );

CREATE POLICY "Users can send messages to chats they participate in" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth_account_id() AND
    chat_id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth_account_id()
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (sender_id = auth_account_id());

CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (sender_id = auth_account_id());

-- ==============================================================================
-- STEP 3: Update chat_participants RLS Policies
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their chat participations" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chats they're invited to" ON chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON chat_participants;
DROP POLICY IF EXISTS "Users can leave chats" ON chat_participants;

-- Create new policies using helper function
CREATE POLICY "Users can view their chat participations" ON chat_participants
  FOR SELECT USING (user_id = auth_account_id());

CREATE POLICY "Users can join chats they're invited to" ON chat_participants
  FOR INSERT WITH CHECK (user_id = auth_account_id());

CREATE POLICY "Users can update their own participation" ON chat_participants
  FOR UPDATE USING (user_id = auth_account_id());

CREATE POLICY "Users can leave chats" ON chat_participants
  FOR DELETE USING (user_id = auth_account_id());

-- ==============================================================================
-- STEP 4: Update chats RLS Policies
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view chats they participate in" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can update chats they created or participate in" ON chats;

-- Create new policies using helper function
CREATE POLICY "Users can view chats they participate in" ON chats
  FOR SELECT USING (
    id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth_account_id()
    )
  );

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (created_by = auth_account_id());

CREATE POLICY "Users can update chats they created or participate in" ON chats
  FOR UPDATE USING (
    created_by = auth_account_id() OR
    id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth_account_id()
    )
  );

-- ==============================================================================
-- STEP 5: Verification Queries
-- ==============================================================================

-- Verify helper function exists
SELECT routine_name, routine_type, data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'auth_account_id';

-- Verify policies are in place
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('chat_messages', 'chat_participants', 'chats')
ORDER BY tablename, policyname;

-- ==============================================================================
-- NOTES
-- ==============================================================================
-- - auth_account_id() function is STABLE and SECURITY DEFINER for optimal performance
-- - All policies now correctly map auth.uid() to account_id via account_identities
-- - This fixes the authentication mismatch between Supabase auth and custom accounts
-- - Rollback script available: rollback_rls_auth_mapping.sql

