-- Add profile_visibility column to accounts table
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private'));

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_accounts_profile_visibility ON accounts(profile_visibility);

-- Update existing accounts to have private visibility by default
UPDATE accounts
SET profile_visibility = 'private'
WHERE profile_visibility IS NULL;

