# Row Level Security (RLS) Summary
**Project:** Connect-Staging  
**Audit Date:** October 12, 2025  
**Auditor:** Supabase MCP Audit Tool

---

## Executive Summary

- **Total Public Schema Tables:** 10
- **RLS Enabled:** 9 tables (90%)
- **RLS Disabled:** 1 table (10%)
- **Total RLS Policies:** 36 (public schema)
- **Storage RLS Policies:** 8 (storage.objects)

---

## Public Schema Tables - RLS Status

| Table Name | RLS Enabled | Policy Count | Notes |
|------------|-------------|--------------|-------|
| ✅ account_identities | YES | 4 | Full CRUD coverage |
| ✅ accounts | YES | 4 | Full CRUD coverage |
| ✅ attachments | YES | 4 | Full CRUD coverage |
| ⚠️ **business_accounts** | **NO** | **0** | **⚠️ MISSING RLS - User data exposed** |
| ✅ chat_messages | YES | 4 | Full CRUD coverage |
| ✅ chat_participants | YES | 4 | Full CRUD coverage |
| ✅ chats | YES | 4 | Full CRUD coverage |
| ✅ connections | YES | 4 | Full CRUD coverage |
| ✅ friend_requests | YES | 4 | Full CRUD coverage |
| ✅ message_reactions | YES | 4 | Full CRUD coverage |

---

## ⚠️ Security Concerns

### 1. Missing RLS on `business_accounts`

**Risk Level:** HIGH  
**Impact:** Any authenticated user can view/modify all business accounts

**Current State:**
- Table contains business account data (name, photo, bio, owner_account_id)
- No RLS policies configured
- Trigger exists to limit accounts per owner (`trg_limit_business_accounts`)
- Foreign key constraint to `accounts.id`

**Recommendation:**
Enable RLS and add policies similar to other user-data tables:
```sql
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

-- Policy examples
CREATE POLICY "Users can view business accounts"
  ON public.business_accounts FOR SELECT
  USING (true); -- Adjust based on visibility requirements

CREATE POLICY "Users can manage their own business accounts"
  ON public.business_accounts FOR ALL
  USING (owner_account_id = auth.uid());
```

---

## Policy Analysis

### Policy Pattern Observed

All RLS-enabled tables follow a consistent pattern:
- **4 policies per table** (SELECT, INSERT, UPDATE, DELETE)
- **Role:** `{authenticated}` - requires logged-in users
- **Qualifier:** `true` - allows all authenticated users full access
- **Permissive mode:** All policies are PERMISSIVE

### ⚠️ Warning: Overly Permissive Policies

**Current Implementation:**
All policies have `qual = 'true'` and `with_check = 'true'`, meaning:
- Any authenticated user can read **ALL** rows from **ALL** tables
- Any authenticated user can insert/update/delete **ANY** row

**Security Issue:**
- User A can read/modify User B's private messages
- User A can delete User B's account
- User A can modify User B's connections
- User A can read all chat messages system-wide

**Recommendation:**
Implement proper row-level filtering based on ownership/participation:

```sql
-- Example: Restrict chat_messages to participants only
CREATE POLICY "Users can only see messages in their chats"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_messages.chat_id
        AND cp.user_id = (SELECT id FROM public.accounts WHERE auth_user_id = auth.uid())
    )
  );

-- Example: Users can only update their own accounts
CREATE POLICY "Users can only update their own account"
  ON public.accounts FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
```

---

## Storage Schema RLS

### storage.objects
✅ RLS Enabled with 8 policies:

| Policy Name | Command | Bucket Focus |
|-------------|---------|--------------|
| Authenticated users can upload avatars | INSERT | avatars |
| Authenticated users can view avatars | SELECT | avatars |
| Users can delete their own avatars | DELETE | avatars |
| Users can update their own avatars | UPDATE | avatars |
| Users can upload chat media | INSERT | chat-media |
| Users can view chat media | SELECT | chat-media |
| Users can delete their chat media | DELETE | chat-media |
| Users can update their chat media | UPDATE | chat-media |

**Note:** All policies use role `{public}` which allows both authenticated and anonymous access. Review if anonymous access is intentional.

---

## Additional Tables Not in Public Schema

### Auth Schema
- All auth.* tables have built-in Supabase RLS (managed by system)
- auth.users: 18 users
- auth.sessions: 87 active sessions
- auth.identities: Email (8) + Phone (10) providers

### Storage Schema
✅ All storage tables have RLS enabled:
- storage.buckets
- storage.buckets_analytics
- storage.migrations
- storage.objects
- storage.prefixes
- storage.s3_multipart_uploads
- storage.s3_multipart_uploads_parts

---

## Recommendations Summary

### 🔴 Critical (Immediate Action Required)
1. **Enable RLS on `business_accounts`** - User data currently exposed
2. **Review and tighten all `qual = true` policies** - Currently allowing universal access

### 🟡 High Priority
3. Implement ownership-based policies for:
   - `accounts` (users can only modify their own)
   - `chat_messages` (restrict to chat participants)
   - `chat_participants` (restrict to involved users)
   - `connections` (restrict to connected users)
   - `friend_requests` (restrict to sender/receiver)

4. Review storage.objects policies using `{public}` role - determine if anonymous access is intentional

### 🟢 Best Practices
5. Add DELETE policies that prevent accidental data loss
6. Consider audit logging for sensitive operations
7. Document policy logic in comments
8. Test policies with different user roles

---

## RLS Coverage Breakdown

| Category | Tables | RLS Enabled | Coverage |
|----------|--------|-------------|----------|
| Public Schema | 10 | 9 | 90% |
| Storage Schema | 7 | 7 | 100% |
| Auth Schema | 17 | 17 | 100% (system-managed) |
| **Overall** | **34** | **33** | **97%** |

---

**End of RLS Summary Report**

