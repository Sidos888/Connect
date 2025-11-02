-- Migration: participant profiles RPC and optional group photo column
-- Safe, idempotent: uses IF NOT EXISTS where possible

-- 1) Optional group avatar column
ALTER TABLE IF EXISTS chats ADD COLUMN IF NOT EXISTS photo TEXT;

-- 2) RPC to fetch participant display profiles for chats the caller belongs to
CREATE OR REPLACE FUNCTION get_chat_participant_profiles(p_chat_ids uuid[])
RETURNS TABLE (
  chat_id uuid,
  account_id uuid,
  name text,
  profile_pic text
) SECURITY DEFINER SET search_path = public AS $$
  SELECT cp.chat_id,
         a.id AS account_id,
         a.name,
         a.profile_pic
  FROM chat_participants cp
  JOIN account_identities ai ON ai.auth_user_id = cp.user_id
  JOIN accounts a ON a.id = ai.account_id
  WHERE cp.chat_id = ANY(p_chat_ids)
    AND cp.chat_id IN (
      SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
    );
$$ LANGUAGE sql STABLE;

-- 3) Grant execute to authenticated users
REVOKE ALL ON FUNCTION get_chat_participant_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_chat_participant_profiles(uuid[]) TO authenticated;


