-- =====================================================================
-- Rollback: 001_rls_hardening_rollback.sql
-- Description: Restore Connect-Staging to pre-hardening state
-- Date: October 12, 2025
-- Target: Connect-Staging
-- Use: Only if migration 001 causes issues
-- =====================================================================

BEGIN;
SET LOCAL statement_timeout = '15s';

-- =====================================================================
-- SECTION 1: Restore rate_limits RLS (re-enable)
-- =====================================================================
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- SECTION 2: Remove comment from accounts policy (no functional change)
-- =====================================================================
COMMENT ON POLICY "Users can view all accounts" ON public.accounts IS NULL;

-- =====================================================================
-- SECTION 3: Restore business_accounts original policy
-- =====================================================================

-- Drop new visibility-aware policy
DROP POLICY IF EXISTS "Users can view public or owned business accounts" 
ON public.business_accounts;

-- Recreate original permissive policy
CREATE POLICY "Users can view business accounts"
ON public.business_accounts
FOR SELECT
TO public
USING (true);

-- Note: is_public column remains (data not lost)
-- To fully rollback, drop column:
-- ALTER TABLE public.business_accounts DROP COLUMN IF EXISTS is_public;
-- (Commented out to preserve data - uncomment if full rollback needed)

-- =====================================================================
-- SECTION 4: Remove storage buckets (DESTRUCTIVE - USE WITH CAUTION)
-- =====================================================================
-- WARNING: This will delete all uploaded files in these buckets!
-- Uncomment only if you need a full rollback and have backups

-- DELETE FROM storage.objects WHERE bucket_id = 'avatars';
-- DELETE FROM storage.objects WHERE bucket_id = 'chat-media';
-- DELETE FROM storage.buckets WHERE id IN ('avatars', 'chat-media');

RAISE NOTICE 'NOTICE: Storage buckets not removed. Uncomment lines in rollback script if needed.';

-- =====================================================================
-- SECTION 5: Remove storage.objects policies
-- =====================================================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat media to their chats" ON storage.objects;
DROP POLICY IF EXISTS "Users can update chat media in their chats" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete chat media in their chats" ON storage.objects;

COMMIT;

-- =====================================================================
-- Rollback completed
-- =====================================================================
-- Verification steps:
-- 1. Check rate_limits has RLS enabled again
-- 2. Check business_accounts policy is back to USING true
-- 3. Check storage policies are removed
-- 4. Test application functionality
-- =====================================================================

