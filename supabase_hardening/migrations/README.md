

# RLS Hardening Migrations - Connect

**Date:** October 12, 2025  
**Target Environment:** Connect-Staging (then Connect-Prod)  
**Status:** Ready for execution

---

## Overview

This migration package fixes security issues discovered in the Supabase audit and sets up storage infrastructure for the Connect application.

### What Changed

1. **Fixed `rate_limits` table blocking issue**
   - Disabled RLS (internal table, no user access needed)
   
2. **Enhanced `business_accounts` visibility**
   - Added `is_public` column (default: true)
   - New policy: users can view public OR owned business accounts
   
3. **Documented `accounts` table policy**
   - Confirmed intentionally permissive for user discovery
   - Added policy comment for future reference
   
4. **Created storage infrastructure**
   - Created `avatars` bucket (public READ, 10MB limit)
   - Created `chat-media` bucket (public READ, 10MB limit)
   - Added 6 RLS policies for storage.objects

---

## Migration Files

### 001_rls_hardening.sql
**Purpose:** Fix RLS issues and create storage buckets  
**Execution time:** ~2-5 seconds  
**Safety:** Transaction-wrapped, 15s timeout  
**Rollback:** Yes (see rollback folder)

**Changes:**
- Disables RLS on `rate_limits`
- Adds `is_public` column to `business_accounts`
- Updates business accounts SELECT policy
- Creates `avatars` and `chat-media` storage buckets
- Adds 6 storage.objects policies for upload/update/delete

**Validation:**
- Built-in validation queries run at end of migration
- Checks RLS status, columns, buckets, and policies

---

### 002_vacuum_analyze.sql
**Purpose:** Refresh table statistics for query planner  
**Execution time:** ~1-2 seconds  
**Safety:** Non-blocking, no data changes  
**Rollback:** Not needed (statistics only)

**Changes:**
- Runs VACUUM (ANALYZE) on 13 public schema tables
- Updates pg_stat_user_tables statistics

---

## Policy Logic

### rate_limits
- **RLS:** Disabled
- **Reason:** Internal rate-limiting table, no direct user access
- **Impact:** Application can now read/write rate limits without auth context

---

### accounts
- **SELECT:** "Users can view all accounts" - `USING true`
- **Status:** Intentionally permissive
- **Reason:** Enables user discovery and search features
- **Reviewed:** October 12, 2025

---

### business_accounts

#### Before:
```sql
-- SELECT: USING true (anyone can view all)
```

#### After:
```sql
-- SELECT: USING (is_public = true OR owner_account_id = current_user)
-- Users can view:
--   1. Their own business accounts (public or private)
--   2. Other users' PUBLIC business accounts only
```

**New column:**
- `is_public BOOLEAN DEFAULT true`
- Existing rows will be public by default (backward compatible)
- Set to `false` to make business account private (owner-only)

---

### Storage Buckets

#### avatars
- **Visibility:** Public READ (anyone can view)
- **File size:** 10MB max
- **MIME types:** image/jpeg, image/jpg, image/png, image/gif, image/webp
- **Path format:** `avatars/{auth_user_id}.{ext}`

**Policies:**
- INSERT: Authenticated users, own path only
- UPDATE: Authenticated users, own avatar only
- DELETE: Authenticated users, own avatar only

**Example paths:**
- ✅ `avatars/abc123.jpg` (if auth.uid() = 'abc123')
- ❌ `avatars/xyz789.jpg` (if auth.uid() = 'abc123')

---

#### chat-media
- **Visibility:** Public READ (anyone can view)
- **File size:** 10MB max
- **MIME types:** images, videos (mp4, quicktime), audio (mp3, wav, ogg)
- **Path format:** `chat-media/{chat_id}/{filename}`

**Policies:**
- INSERT: Authenticated users, participant in chat only
- UPDATE: Authenticated users, participant in chat only
- DELETE: Authenticated users, participant in chat only

**Example paths:**
- ✅ `chat-media/chat-uuid-123/photo.jpg` (if user is participant in chat-uuid-123)
- ❌ `chat-media/chat-uuid-456/photo.jpg` (if user is NOT participant)

---

## How to Execute

### On Connect-Staging (First)

```bash
# 1. Apply main hardening migration
supabase mcp apply_migration \
  --project-id mohctrsopquwoyfweadl \
  --name "001_rls_hardening" \
  --file ./supabase_hardening/migrations/001_rls_hardening.sql

# 2. Refresh statistics
supabase mcp execute_sql \
  --project-id mohctrsopquwoyfweadl \
  --file ./supabase_hardening/migrations/002_vacuum_analyze.sql
```

---

### On Connect-Prod (After Staging Validation)

```bash
# 1. Apply main hardening migration
supabase mcp apply_migration \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --name "001_rls_hardening" \
  --file ./supabase_hardening/migrations/001_rls_hardening.sql

# 2. Refresh statistics
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --file ./supabase_hardening/migrations/002_vacuum_analyze.sql
```

---

## Testing Locally

### Test business_accounts visibility

```sql
-- As user A, create a private business account
INSERT INTO public.business_accounts (owner_account_id, name, is_public)
VALUES (
  (SELECT account_id FROM account_identities WHERE auth_user_id = auth.uid()),
  'Private Business',
  false
);

-- As user B, try to view it (should fail)
SELECT * FROM public.business_accounts WHERE name = 'Private Business';
-- Expected: Empty result (RLS blocks)

-- As user A, should see own private business
SELECT * FROM public.business_accounts WHERE name = 'Private Business';
-- Expected: 1 row
```

---

### Test avatar upload

```typescript
// Upload avatar (should succeed if path matches auth.uid())
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`avatars/${user.id}.jpg`, file);

// Try to upload to another user's path (should fail)
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`avatars/other-user-id.jpg`, file);
// Expected: Error - RLS policy violation
```

---

### Test chat-media upload

```typescript
// Upload to chat you're a participant in (should succeed)
const { data, error } = await supabase.storage
  .from('chat-media')
  .upload(`chat-media/${chatId}/image.jpg`, file);

// Try to upload to chat you're NOT in (should fail)
const { data, error } = await supabase.storage
  .from('chat-media')
  .upload(`chat-media/other-chat-id/image.jpg`, file);
// Expected: Error - RLS policy violation
```

---

## Rollback Procedure

If migration causes issues:

```bash
# Execute rollback script
supabase mcp execute_sql \
  --project-id <project-id> \
  --file ./supabase_hardening/rollback/001_rls_hardening_rollback.sql
```

**What rollback does:**
- Re-enables RLS on `rate_limits`
- Restores business_accounts permissive policy
- Removes storage policies
- **Does NOT delete storage buckets or is_public column** (preserves data)

**Full rollback (destructive):**
- Edit rollback script to uncomment bucket deletion lines
- Uncomment is_public column drop

---

## Validation Queries

After migration, run these to verify success:

```sql
-- 1. Check rate_limits RLS is disabled
SELECT relrowsecurity 
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'rate_limits';
-- Expected: false

-- 2. Check business_accounts has is_public column
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'business_accounts' AND column_name = 'is_public';
-- Expected: 1 row

-- 3. Check storage buckets exist
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('avatars', 'chat-media');
-- Expected: 2 rows

-- 4. Check storage policies exist
SELECT COUNT(*) 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'Users can%';
-- Expected: 6

-- 5. Test business account visibility
-- (requires test users - see Testing Locally section)
```

---

## Application Code Updates Needed

### 1. Avatar Uploads

Update avatar upload path format:

```typescript
// OLD (if different)
const path = `${userId}/avatar.jpg`;

// NEW (required)
const path = `avatars/${userId}.jpg`;
```

---

### 2. Chat Media Uploads

Update chat media upload path format:

```typescript
// Required format
const path = `chat-media/${chatId}/${filename}`;

// Example
const path = `chat-media/${chat.id}/photo-${Date.now()}.jpg`;
```

---

### 3. Business Account Creation

Add `is_public` field to business account creation:

```typescript
const { data, error } = await supabase
  .from('business_accounts')
  .insert({
    owner_account_id: accountId,
    name: businessName,
    is_public: true, // or false for private
    // ... other fields
  });
```

---

### 4. Business Account Visibility Toggle

Allow users to change visibility:

```typescript
// Toggle business account visibility
const { data, error } = await supabase
  .from('business_accounts')
  .update({ is_public: !currentVisibility })
  .eq('id', businessAccountId);
```

---

## Security Considerations

### Public Bucket READ
Both `avatars` and `chat-media` buckets have public READ enabled. This means:
- ✅ Anyone with the URL can view files (no signed URLs needed)
- ✅ Simplifies client code and reduces API calls
- ⚠️ Files are not truly private (URL is access control)
- ✅ Writes are still restricted by RLS (only owners/participants can upload)

**If you need private files:**
- Set `bucket.public = false`
- Generate signed URLs for access
- Update client code to use signed URLs

---

### Storage Path Discipline

**Critical:** Client code MUST follow path formats exactly:
- Avatars: `avatars/{auth_user_id}.{ext}`
- Chat media: `chat-media/{chat_id}/{filename}`

RLS policies enforce these patterns. Incorrect paths will be rejected.

---

## Production Deployment Checklist

Before applying to Connect-Prod:

- [ ] Migration tested on Connect-Staging
- [ ] Validation queries passed
- [ ] Avatar uploads tested (correct path format)
- [ ] Chat media uploads tested (participant check works)
- [ ] Business account visibility tested (public/private logic)
- [ ] Application code updated for new path formats
- [ ] Rollback script tested on staging
- [ ] Backup of Connect-Prod database created
- [ ] Low-traffic deployment window scheduled
- [ ] Team notified of deployment
- [ ] Monitoring/alerting active

---

## Support & Questions

**Files generated:**
- `001_rls_hardening.sql` - Main migration
- `002_vacuum_analyze.sql` - Statistics refresh
- `001_rls_hardening_rollback.sql` - Rollback script
- `README.md` - This file

**See also:**
- `/supabase_hardening/discovery_before/` - Pre-migration state
- `/supabase_hardening/discovery_after/` - Post-migration state (after execution)
- `PRODUCTION_RUNBOOK.md` - Detailed deployment guide (generated after validation)

---

**Status:** Ready for staging execution  
**Next Step:** Apply to Connect-Staging and validate

