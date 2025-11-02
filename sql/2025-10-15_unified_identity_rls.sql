-- ============================================================================
-- RLS POLICY UPDATES FOR UNIFIED IDENTITY
-- All policies now use auth.uid() directly (no account_identities lookup)
-- ============================================================================

BEGIN;

-- ============================================================================
-- ACCOUNTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users access own data" ON accounts;
DROP POLICY IF EXISTS "Accounts publicly readable" ON accounts;
DROP POLICY IF EXISTS "Users update own account" ON accounts;

-- Read: All accounts are publicly readable
CREATE POLICY "accounts_select_all" 
ON accounts FOR SELECT 
USING (true);

-- Insert: Users can create their own account
CREATE POLICY "accounts_insert_own" 
ON accounts FOR INSERT 
WITH CHECK (id = auth.uid());

-- Update: Users can only update their own account
CREATE POLICY "accounts_update_own" 
ON accounts FOR UPDATE 
USING (id = auth.uid());

-- Delete: Users can only delete their own account
CREATE POLICY "accounts_delete_own" 
ON accounts FOR DELETE 
USING (id = auth.uid());

-- ============================================================================
-- CHAT_PARTICIPANTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users view their own chat participations" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON chat_participants;

CREATE POLICY "chat_participants_select_own" 
ON chat_participants FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "chat_participants_insert_own" 
ON chat_participants FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_participants_update_own" 
ON chat_participants FOR UPDATE 
USING (user_id = auth.uid());

-- ============================================================================
-- CHAT_MESSAGES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users view their chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;

-- Read: Users can see messages in chats they participate in
CREATE POLICY "chat_messages_select_participant" 
ON chat_messages FOR SELECT 
USING (
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

-- Insert: Users can send messages to chats they participate in
CREATE POLICY "chat_messages_insert_participant" 
ON chat_messages FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

-- Update: Users can only soft-delete their own messages
CREATE POLICY "chat_messages_update_own" 
ON chat_messages FOR UPDATE 
USING (sender_id = auth.uid());

-- ============================================================================
-- CONNECTIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users view their connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;

CREATE POLICY "connections_select_own" 
ON connections FOR SELECT 
USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "connections_insert_own" 
ON connections FOR INSERT 
WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "connections_update_own" 
ON connections FOR UPDATE 
USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============================================================================
-- BUSINESS_ACCOUNTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Public business readable" ON business_accounts;
DROP POLICY IF EXISTS "Users manage own businesses" ON business_accounts;

CREATE POLICY "business_accounts_select_own" 
ON business_accounts FOR SELECT 
USING (owner_account_id = auth.uid());

CREATE POLICY "business_accounts_insert_own" 
ON business_accounts FOR INSERT 
WITH CHECK (owner_account_id = auth.uid());

CREATE POLICY "business_accounts_update_own" 
ON business_accounts FOR UPDATE 
USING (owner_account_id = auth.uid());

CREATE POLICY "business_accounts_delete_own" 
ON business_accounts FOR DELETE 
USING (owner_account_id = auth.uid());

COMMIT;

