-- =====================================================================
-- Migration: 001_rls_hardening.sql
-- Description: Fix RLS issues and set up storage buckets for Connect
-- Date: October 12, 2025
-- Target: Connect-Staging
-- Safety: Transaction-wrapped with timeout
-- =====================================================================

BEGIN;
SET LOCAL statement_timeout = '15s';

-- =====================================================================
-- SECTION 1: Fix rate_limits table RLS blocking issue
-- =====================================================================
-- Problem: RLS is enabled but no policies exist, blocking all access
-- Solution: Disable RLS since this is an internal rate-limiting table

ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;

-- =====================================================================
-- SECTION 2: Accounts table - KEEP AS-IS (user discovery feature)
-- =====================================================================
-- Current: "Users can view all accounts" with USING true
-- Decision: Intentionally permissive for user discovery/search
-- Action: NO CHANGES (document only)

COMMENT ON POLICY "Users can view all accounts" ON public.accounts IS 
  'Intentionally permissive to allow user discovery and search features. Reviewed 2025-10-12.';

-- =====================================================================
-- SECTION 3: Business accounts - Add public/private visibility
-- =====================================================================
-- Current: "Users can view business accounts" with USING true
-- Decision: Add is_public flag and restrict visibility

-- 3a. Add is_public column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'business_accounts' 
          AND column_name = 'is_public'
    ) THEN
        ALTER TABLE public.business_accounts 
        ADD COLUMN is_public boolean DEFAULT true;
        
        COMMENT ON COLUMN public.business_accounts.is_public IS 
          'Whether this business account is publicly visible. Default true for backward compatibility.';
    END IF;
END $$;

-- 3b. Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view business accounts" ON public.business_accounts;

-- 3c. Create new visibility-aware SELECT policy
CREATE POLICY "Users can view public or owned business accounts" 
ON public.business_accounts
FOR SELECT
TO public
USING (
    is_public = true 
    OR 
    owner_account_id IN (
        SELECT ai.account_id 
        FROM public.account_identities ai 
        WHERE ai.auth_user_id = auth.uid()
    )
);

COMMENT ON POLICY "Users can view public or owned business accounts" ON public.business_accounts IS 
  'Users can view: (1) their own business accounts, or (2) public business accounts. Private accounts only visible to owner.';

-- =====================================================================
-- SECTION 4: Storage Buckets Setup
-- =====================================================================
-- Create avatars and chat-media buckets with proper configuration

-- 4a. Avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true, -- public READ
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 4b. Chat-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-media',
    'chat-media',
    true, -- public READ
    10485760, -- 10MB limit
    ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/x-msvideo',
        'audio/mpeg', 'audio/wav', 'audio/ogg'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/x-msvideo',
        'audio/mpeg', 'audio/wav', 'audio/ogg'
    ];

-- =====================================================================
-- SECTION 5: Storage.objects RLS Policies
-- =====================================================================
-- Restrict INSERT/UPDATE/DELETE to authenticated users with path discipline
-- Keep public READ (bucket visibility handles this)

-- 5a. Avatars policies
-- SELECT: already public via bucket.public = true
-- INSERT: authenticated users, own account path only
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|gif|webp)$')
);

-- UPDATE: authenticated users, own avatar only
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|gif|webp)$')
);

-- DELETE: authenticated users, own avatar only
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|gif|webp)$')
);

-- 5b. Chat-media policies
-- SELECT: already public via bucket.public = true
-- INSERT: authenticated users in their chats
CREATE POLICY "Users can upload chat media to their chats"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-media' 
    AND (
        -- Path format: chat-media/{chat_id}/...
        -- User must be participant in that chat
        (regexp_match(name, '^chat-media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.*'))[1]::uuid 
        IN (
            SELECT cp.chat_id 
            FROM public.chat_participants cp 
            WHERE cp.user_id = auth.uid()
        )
    )
);

-- UPDATE: authenticated users, their chat media only
CREATE POLICY "Users can update chat media in their chats"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'chat-media' 
    AND (
        (regexp_match(name, '^chat-media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.*'))[1]::uuid 
        IN (
            SELECT cp.chat_id 
            FROM public.chat_participants cp 
            WHERE cp.user_id = auth.uid()
        )
    )
);

-- DELETE: authenticated users, their chat media only  
CREATE POLICY "Users can delete chat media in their chats"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-media' 
    AND (
        (regexp_match(name, '^chat-media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.*'))[1]::uuid 
        IN (
            SELECT cp.chat_id 
            FROM public.chat_participants cp 
            WHERE cp.user_id = auth.uid()
        )
    )
);

-- =====================================================================
-- VALIDATION QUERIES (for post-migration verification)
-- =====================================================================

-- Verify rate_limits RLS is disabled
DO $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'rate_limits';
    
    IF rls_enabled THEN
        RAISE EXCEPTION 'rate_limits RLS should be disabled but is still enabled';
    END IF;
    
    RAISE NOTICE '✓ rate_limits RLS successfully disabled';
END $$;

-- Verify business_accounts has is_public column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'business_accounts' 
          AND column_name = 'is_public'
    ) THEN
        RAISE EXCEPTION 'business_accounts.is_public column was not created';
    END IF;
    
    RAISE NOTICE '✓ business_accounts.is_public column exists';
END $$;

-- Verify storage buckets exist
DO $$
DECLARE
    avatars_exists boolean;
    chat_media_exists boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'avatars') INTO avatars_exists;
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'chat-media') INTO chat_media_exists;
    
    IF NOT avatars_exists THEN
        RAISE EXCEPTION 'avatars bucket was not created';
    END IF;
    
    IF NOT chat_media_exists THEN
        RAISE EXCEPTION 'chat-media bucket was not created';
    END IF;
    
    RAISE NOTICE '✓ Storage buckets created successfully';
END $$;

-- Verify storage policies exist
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname LIKE 'Users can%';
    
    IF policy_count < 6 THEN
        RAISE EXCEPTION 'Expected at least 6 storage policies, found %', policy_count;
    END IF;
    
    RAISE NOTICE '✓ Storage policies created: % policies', policy_count;
END $$;

COMMIT;

-- =====================================================================
-- Migration completed successfully
-- =====================================================================
-- Next steps:
-- 1. Run validation queries above
-- 2. Test avatar uploads with correct path format
-- 3. Test chat-media uploads as chat participants
-- 4. Verify business account visibility respects is_public flag
-- =====================================================================

