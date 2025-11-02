-- ============================================================================
-- UNIFIED IDENTITY MIGRATION
-- Migrates from accounts.id → auth.users.id via account_identities bridge
-- to direct accounts.id = auth.users.id (WhatsApp/Instagram pattern)
-- ============================================================================

BEGIN;

-- Step 1: Create new accounts table with auth.users.id as primary key
CREATE TABLE accounts_new (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bio text,
  dob date,
  profile_pic text,
  connect_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Migrate data (accounts.id → auth_user_id from account_identities)
-- Use earliest identity (first auth method) as canonical ID
INSERT INTO accounts_new (id, name, bio, dob, profile_pic, connect_id, created_at, updated_at)
SELECT 
  ai.auth_user_id as id,
  a.name,
  a.bio,
  a.dob,
  a.profile_pic,
  a.connect_id,
  a.created_at,
  a.updated_at
FROM accounts a
INNER JOIN (
  -- Get first identity per account (earliest created_at)
  SELECT DISTINCT ON (account_id) 
    account_id, 
    auth_user_id
  FROM account_identities
  ORDER BY account_id, created_at ASC
) ai ON a.id = ai.account_id;

-- Step 3: Update foreign key references in all dependent tables

-- 3a. chat_participants.user_id
UPDATE chat_participants cp
SET user_id = (
  SELECT ai.auth_user_id 
  FROM account_identities ai 
  WHERE ai.account_id = cp.user_id 
  LIMIT 1
);

-- 3b. chat_messages.sender_id
UPDATE chat_messages cm
SET sender_id = (
  SELECT ai.auth_user_id 
  FROM account_identities ai 
  WHERE ai.account_id = cm.sender_id 
  LIMIT 1
);

-- 3c. connections.user1_id
UPDATE connections c
SET user1_id = (
  SELECT ai.auth_user_id 
  FROM account_identities ai 
  WHERE ai.account_id = c.user1_id 
  LIMIT 1
)
WHERE user1_id IS NOT NULL;

-- 3d. connections.user2_id
UPDATE connections c
SET user2_id = (
  SELECT ai.auth_user_id 
  FROM account_identities ai 
  WHERE ai.account_id = c.user2_id 
  LIMIT 1
)
WHERE user2_id IS NOT NULL;

-- 3e. friend_requests.sender_id
UPDATE friend_requests fr
SET sender_id = (
  SELECT ai.auth_user_id 
  FROM account_identities ai 
  WHERE ai.account_id = fr.sender_id 
  LIMIT 1
)
WHERE sender_id IS NOT NULL;

-- 3f. friend_requests.receiver_id
UPDATE friend_requests fr
SET receiver_id = (
  SELECT ai.auth_user_id 
  FROM account_identities ai 
  WHERE ai.account_id = fr.receiver_id 
  LIMIT 1
)
WHERE receiver_id IS NOT NULL;

-- 3g. business_accounts.owner_account_id
UPDATE business_accounts ba
SET owner_account_id = (
  SELECT ai.auth_user_id 
  FROM account_identities ai 
  WHERE ai.account_id = ba.owner_account_id 
  LIMIT 1
)
WHERE owner_account_id IS NOT NULL;

-- Step 4: Drop old tables and rename new table
DROP TABLE IF EXISTS accounts CASCADE;
ALTER TABLE accounts_new RENAME TO accounts;

-- Step 5: Recreate foreign key constraints
ALTER TABLE chat_participants
  DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey,
  ADD CONSTRAINT chat_participants_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey,
  ADD CONSTRAINT chat_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE connections
  DROP CONSTRAINT IF EXISTS connections_user1_id_fkey,
  ADD CONSTRAINT connections_user1_id_fkey 
    FOREIGN KEY (user1_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE connections
  DROP CONSTRAINT IF EXISTS connections_user2_id_fkey,
  ADD CONSTRAINT connections_user2_id_fkey 
    FOREIGN KEY (user2_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE friend_requests
  DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey,
  ADD CONSTRAINT friend_requests_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE friend_requests
  DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey,
  ADD CONSTRAINT friend_requests_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE business_accounts
  DROP CONSTRAINT IF EXISTS business_accounts_owner_account_id_fkey,
  ADD CONSTRAINT business_accounts_owner_account_id_fkey 
    FOREIGN KEY (owner_account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Step 6: Drop views and tables that depend on account_identities
DROP VIEW IF EXISTS current_session_accounts CASCADE;
DROP TABLE IF EXISTS account_identities CASCADE;

-- Step 7: Recreate indexes
CREATE INDEX idx_accounts_connect_id ON accounts(connect_id) WHERE connect_id IS NOT NULL;
CREATE INDEX idx_accounts_updated_at ON accounts(updated_at);

-- Step 8: Recreate current_session_accounts view (simplified for new schema)
CREATE VIEW current_session_accounts AS 
SELECT id as account_id 
FROM accounts 
WHERE id = auth.uid();

-- Step 9: Clean up orphaned auth.users (8 users without accounts)
-- These are test/abandoned signups with no data
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM accounts);

COMMIT;

