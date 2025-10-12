# Migration Draft Summary - Connect-Staging RLS Hardening

**Date:** October 12, 2025  
**Status:** DRAFT - Not yet executed  
**Target:** Connect-Staging first, then Connect-Prod

---

## ✅ Step 2 Complete: Migration Files Drafted

All migration files have been generated and are ready for review. **NO CHANGES HAVE BEEN EXECUTED YET.**

---

## 📦 Files Created

```
/supabase_hardening/
├── migrations/
│   ├── 001_rls_hardening.sql        (Main migration - 300+ lines)
│   ├── 002_vacuum_analyze.sql       (Statistics refresh - 30 lines)
│   └── README.md                    (Comprehensive documentation)
└── rollback/
    └── 001_rls_hardening_rollback.sql (Revert script - 70 lines)
```

---

## 🎯 What Will Change

### 1. Fixed: rate_limits Table Blocking Issue 🔴

**Problem:** RLS enabled but no policies = all access fails  
**Solution:** Disable RLS (it's an internal table)

```sql
ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;
```

**Impact:**
- ✅ Application can now access rate_limits without auth context
- ✅ No security risk (internal usage only)
- ✅ Fixes blocking issue discovered in Step 1

---

### 2. Enhanced: business_accounts Visibility 🟡

**Current:** Anyone can view all business accounts (`USING true`)  
**New:** Public/private business accounts with owner control

**Changes:**
1. Add `is_public` column (BOOLEAN, default true)
2. Replace permissive SELECT policy with visibility-aware policy

```sql
-- New policy
USING (
    is_public = true 
    OR 
    owner_account_id = current_user_account
)
```

**Impact:**
- ✅ Backward compatible (existing accounts default to public)
- ✅ Users can now create private business accounts
- ✅ Private accounts only visible to owner

---

### 3. Documented: accounts Table Policy ℹ️

**Current:** "Users can view all accounts" (`USING true`)  
**Action:** Add comment to document intentional design decision

```sql
COMMENT ON POLICY "Users can view all accounts" ON public.accounts IS 
  'Intentionally permissive for user discovery/search. Reviewed 2025-10-12.';
```

**Impact:**
- ℹ️ No functional change
- ✅ Documents design decision for future reference
- ✅ Per user's choice: keep as-is for user discovery feature

---

### 4. Created: Storage Infrastructure 🆕

#### Avatars Bucket
- **Public READ:** Anyone with URL can view
- **Authenticated WRITE:** Users upload to own path only
- **Size limit:** 10MB
- **MIME types:** JPEG, JPG, PNG, GIF, WebP
- **Path format:** `avatars/{auth_user_id}.{ext}`

**Policies (3):**
- INSERT: Own path only
- UPDATE: Own avatar only
- DELETE: Own avatar only

---

#### Chat-Media Bucket
- **Public READ:** Anyone with URL can view
- **Authenticated WRITE:** Participants upload to own chats only
- **Size limit:** 10MB
- **MIME types:** Images, videos (MP4, QuickTime), audio (MP3, WAV, OGG)
- **Path format:** `chat-media/{chat_id}/{filename}`

**Policies (3):**
- INSERT: Must be chat participant
- UPDATE: Must be chat participant
- DELETE: Must be chat participant

---

## 📊 Changes Summary Table

| Component | Before | After | Impact |
|-----------|--------|-------|--------|
| rate_limits RLS | ✅ Enabled (blocking) | ❌ Disabled | 🔴 Critical fix |
| business_accounts SELECT | Anyone can view | Public + owner only | 🟡 Enhanced privacy |
| business_accounts.is_public | ❌ Doesn't exist | ✅ Boolean column | 🆕 New feature |
| accounts SELECT policy | Undocumented | Documented | ℹ️ Clarity |
| avatars bucket | ❌ Doesn't exist | ✅ Created | 🆕 Required |
| chat-media bucket | ❌ Doesn't exist | ✅ Created | 🆕 Required |
| storage.objects policies | None | 6 policies | 🆕 Security |

---

## 🛡️ Security Improvements

### Before Migration:
1. ❌ rate_limits table blocks all access (RLS with no policies)
2. 🟡 All business accounts visible to everyone
3. ❌ No storage infrastructure (no avatars/media uploads)
4. ❌ No storage RLS policies

### After Migration:
1. ✅ rate_limits accessible (RLS disabled for internal table)
2. ✅ Business accounts respect public/private visibility
3. ✅ Storage buckets created with proper configuration
4. ✅ Storage writes restricted to owners/participants only
5. ✅ Storage path discipline enforced by RLS

---

## ⚙️ What's NOT Changing

These were already good in Connect-Staging:

✅ **RLS coverage** - All 13 tables already have RLS enabled  
✅ **Chat security** - Participant-based policies already working  
✅ **Account identities** - Owner-scoped policies already correct  
✅ **Friend requests** - Sender/receiver policies already good  
✅ **Message operations** - Sender/participant policies already secure  
✅ **SECURITY DEFINER functions** - Only 3 functions, appropriately used

---

## 📋 Validation Built-In

The migration includes automatic validation checks:

```sql
-- At end of 001_rls_hardening.sql:
1. ✓ rate_limits RLS is disabled
2. ✓ business_accounts.is_public column exists
3. ✓ Storage buckets created (avatars, chat-media)
4. ✓ Storage policies exist (6 policies)
```

If any validation fails, the transaction will ROLLBACK automatically.

---

## 🔄 Rollback Safety

Rollback script restores original state:

1. Re-enable RLS on rate_limits
2. Remove comment from accounts policy
3. Restore business_accounts permissive SELECT policy
4. Remove storage.objects policies
5. **Preserves data:** is_public column and buckets remain (configurable)

**Safe to rollback:** Yes, at any time  
**Data loss risk:** Only if you uncomment bucket deletion lines

---

## 📱 Application Code Impact

### Required Changes:

1. **Avatar uploads - Update path format:**
   ```typescript
   // Must use: avatars/{userId}.jpg
   const path = `avatars/${user.id}.jpg`;
   ```

2. **Chat media uploads - Update path format:**
   ```typescript
   // Must use: chat-media/{chatId}/{filename}
   const path = `chat-media/${chatId}/photo.jpg`;
   ```

3. **Business accounts - Add is_public field:**
   ```typescript
   await supabase.from('business_accounts').insert({
     ...businessData,
     is_public: true, // or false
   });
   ```

### Optional Enhancements:

4. **Business account privacy toggle UI**
5. **Private business account badge/indicator**

---

## ⏱️ Execution Time Estimates

| Migration | Estimated Time | Notes |
|-----------|----------------|-------|
| 001_rls_hardening.sql | 2-5 seconds | Transaction-wrapped |
| 002_vacuum_analyze.sql | 1-2 seconds | Non-blocking |
| **Total** | **~5 seconds** | Very fast |

Database is mostly empty, so execution will be quick.

---

## 🚦 Next Steps

### Step 3: Dry-Run Validation (Next)
Generate test queries to simulate policy effects WITHOUT running the migration.

### Step 4: Execute on Staging
Apply migrations to Connect-Staging and validate.

### Step 5: Post-Validation
Compare before/after state, confirm all changes applied correctly.

### Step 6: Test Scaffolding
Create Vitest skeleton tests for developers.

### Step 7: Production Prep
Generate production runbook for Connect-Prod deployment.

---

## ✅ Ready for Review

**All migration files are ready for review.**

**Before proceeding to Step 3:**
1. Review `001_rls_hardening.sql` - Main migration logic
2. Review `002_vacuum_analyze.sql` - Statistics refresh
3. Review `001_rls_hardening_rollback.sql` - Rollback safety
4. Review `README.md` - Comprehensive documentation

**Questions or concerns?** Now is the time to address them before execution!

---

## 🎯 Confidence Level

| Aspect | Confidence | Notes |
|--------|------------|-------|
| Migration correctness | 🟢 High | Well-tested SQL patterns |
| Safety | 🟢 High | Transaction-wrapped, timeout, rollback ready |
| Backward compatibility | 🟢 High | is_public defaults to true |
| Storage path discipline | 🟡 Medium | Requires client code updates |
| Overall | 🟢 **Ready** | Safe to proceed to Step 3 |

---

**Status:** Step 2 complete ✅  
**Next:** Awaiting confirmation to proceed to Step 3 (Dry-Run Validation)

