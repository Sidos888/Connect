-- Rollback Migration: Revert RLS Authentication Mapping
-- Purpose: Restore original RLS policies that use auth.uid() directly
-- Use this if fix_rls_auth_mapping.sql causes issues

BEGIN;

-- ==============================================================================
-- STEP 1: Restore chat_messages RLS Policies
-- ==============================================================================

-- Drop new policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to chats they participate in" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- Restore original policies using auth.uid()
CREATE POLICY "Users can view messages in their chats" ON chat_messages
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to chats they participate in" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (sender_id = auth.uid());

-- ==============================================================================
-- STEP 2: Restore chat_participants RLS Policies
-- ==============================================================================

-- Drop new policies
DROP POLICY IF EXISTS "Users can view their chat participations" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chats they're invited to" ON chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON chat_participants;
DROP POLICY IF EXISTS "Users can leave chats" ON chat_participants;

-- Restore original policies using auth.uid()
CREATE POLICY "Users can view their chat participations" ON chat_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join chats they're invited to" ON chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON chat_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave chats" ON chat_participants
  FOR DELETE USING (user_id = auth.uid());

-- ==============================================================================
-- STEP 3: Restore chats RLS Policies
-- ==============================================================================

-- Drop new policies
DROP POLICY IF EXISTS "Users can view chats they participate in" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can update chats they created or participate in" ON chats;

-- Restore original policies using auth.uid()
CREATE POLICY "Users can view chats they participate in" ON chats
  FOR SELECT USING (
    id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update chats they created or participate in" ON chats
  FOR UPDATE USING (
    created_by = auth.uid() OR
    id IN (
      SELECT chat_id FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

-- ==============================================================================
-- STEP 4: Drop Helper Function
-- ==============================================================================

DROP FUNCTION IF EXISTS auth_account_id();

COMMIT;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Verify policies are restored
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('chat_messages', 'chat_participants', 'chats')
ORDER BY tablename, policyname;

-- Verify helper function is removed
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'auth_account_id';

