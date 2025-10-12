# Production Deployment Runbook - Connect-Prod

**Migration:** RLS Hardening  
**Target:** Connect-Prod (rxlqtyfhsocxnsnnnlwl)  
**Estimated Time:** 5-10 seconds  
**Risk Level:** LOW (tested on staging, backward compatible)

---

## Pre-Deployment Checklist

### 1. Verify Staging Success ✅
- [ ] Staging migration completed successfully
- [ ] All validation checks passed on staging
- [ ] No errors in staging execution log
- [ ] Storage buckets created and working

###2. Environment Verification
- [ ] **Confirm target project:** rxlqtyfhsocxnsnnnlwl (Connect-Prod)
- [ ] **NOT staging:** mohctrsopquwoyfweadl
- [ ] Database status: ACTIVE_HEALTHY
- [ ] No ongoing maintenance windows

### 3. Backup Verification
- [ ] Automatic Supabase backups enabled
- [ ] Recent backup available (within 24 hours)
- [ ] Backup restoration tested (if required by policy)

### 4. Application Readiness
- [ ] Application code updated for storage paths
- [ ] Avatar upload code uses `avatars/{userId}.jpg` format
- [ ] Chat media upload code uses `chat-media/{chatId}/*` format
- [ ] Business account code includes `is_public` field

### 5. Team Readiness
- [ ] Deployment window scheduled (low-traffic time)
- [ ] Team members notified
- [ ] Support team on standby
- [ ] Rollback plan reviewed

### 6. Monitoring Setup
- [ ] Application logs monitoring active
- [ ] Database performance monitoring active
- [ ] Error tracking enabled
- [ ] Alert thresholds configured

---

## Deployment Window Requirements

**Recommended time:** Low-traffic period (e.g., 2-4 AM local time)  
**Duration:** 5-10 minutes total (including validation)  
**Downtime:** None expected (zero-downtime migration)  
**User impact:** Minimal (no breaking changes)

---

## Execution Steps

### Step 1: Final Pre-Flight Check (2 minutes)

```bash
# Verify you're connected to PRODUCTION
supabase projects list

# Confirm project ID: rxlqtyfhsocxnsnnnlwl
# Confirm name: Connect-Prod
```

**STOP if project is not Connect-Prod!**

---

### Step 2: Apply Migration 001 (5 seconds)

```bash
# Navigate to project directory
cd /Users/sid/Desktop/Connect

# Apply RLS hardening migration
supabase mcp apply_migration \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --name "001_rls_hardening" \
  --file ./supabase_hardening/migrations/001_rls_hardening.sql
```

**Expected output:**
```
{"success":true}
```

**If error occurs:**
1. STOP immediately
2. Note the error message
3. Do NOT proceed
4. Execute rollback (see Rollback Section)

---

### Step 3: Apply Migration 002 - VACUUM ANALYZE (1-2 seconds)

```bash
# Refresh table statistics (individual commands)
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "VACUUM (ANALYZE) public.accounts;"

supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "VACUUM (ANALYZE) public.business_accounts;"

supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "VACUUM (ANALYZE) public.chat_messages;"

# Continue for other tables as needed
```

**Expected output:**
```
[] (empty result is success)
```

---

### Step 4: Post-Deployment Validation (2 minutes)

#### Validation Check 1: rate_limits RLS Status

```bash
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'rate_limits';
  "
```

**Expected result:**
```json
[{"tablename":"rate_limits","rowsecurity":false}]
```
✅ **PASS** if `rowsecurity = false`  
❌ **FAIL** if `rowsecurity = true` → Execute rollback

---

#### Validation Check 2: business_accounts.is_public Column

```bash
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'business_accounts' 
      AND column_name = 'is_public';
  "
```

**Expected result:**
```json
[{"column_name":"is_public","data_type":"boolean","column_default":"true"}]
```
✅ **PASS** if column exists  
❌ **FAIL** if not found → Execute rollback

---

#### Validation Check 3: Storage Buckets

```bash
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "
    SELECT id, name, public, file_size_limit
    FROM storage.buckets
    WHERE id IN ('avatars', 'chat-media');
  "
```

**Expected result:**
```json
[
  {"id":"avatars","name":"avatars","public":true,"file_size_limit":10485760},
  {"id":"chat-media","name":"chat-media","public":true,"file_size_limit":10485760}
]
```
✅ **PASS** if 2 buckets exist  
❌ **FAIL** if missing → Execute rollback

---

#### Validation Check 4: Storage Policies Count

```bash
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "
    SELECT COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname LIKE 'Users can%';
  "
```

**Expected result:**
```json
[{"policy_count":6}]
```
✅ **PASS** if count = 6  
❌ **FAIL** if count != 6 → Execute rollback

---

#### Validation Check 5: business_accounts Policy

```bash
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'business_accounts'
      AND policyname = 'Users can view public or owned business accounts';
  "
```

**Expected result:**
```json
[{"policyname":"Users can view public or owned business accounts"}]
```
✅ **PASS** if policy exists  
❌ **FAIL** if not found → Execute rollback

---

### Step 5: Application Smoke Tests (3 minutes)

#### Test 1: Avatar Upload
```bash
# Using your application
# 1. Log in as test user
# 2. Upload avatar
# 3. Verify upload succeeds
# 4. Check file path: avatars/{userId}.jpg
```

✅ **PASS** if upload succeeds  
❌ **FAIL** if upload fails → Check error, may need rollback

---

#### Test 2: Chat Media Upload
```bash
# Using your application
# 1. Log in as test user
# 2. Navigate to chat
# 3. Upload image/video
# 4. Verify upload succeeds
# 5. Check file path: chat-media/{chatId}/*
```

✅ **PASS** if upload succeeds  
❌ **FAIL** if upload fails → Check error, may need rollback

---

#### Test 3: Business Account Visibility
```bash
# Using your application or SQL query
# 1. Create private business account (is_public=false)
# 2. Verify owner can see it
# 3. Verify other users cannot see it
```

✅ **PASS** if privacy logic works  
❌ **FAIL** if visibility incorrect → May need policy adjustment

---

### Step 6: Monitor Application (15 minutes)

- [ ] Check application error logs
- [ ] Monitor database performance metrics
- [ ] Watch for RLS policy violations
- [ ] Verify no user-reported issues

**If issues detected:** Proceed to Rollback Section

---

## Rollback Procedure

### When to Rollback

Execute rollback if:
- ❌ Migration execution failed
- ❌ Any validation check failed
- ❌ Application errors increased significantly
- ❌ Users reporting access issues
- ❌ Storage uploads failing

### Rollback Steps

#### Step 1: Execute Rollback Script

```bash
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --file ./supabase_hardening/rollback/001_rls_hardening_rollback.sql
```

**Expected output:**
```
{"success":true}
```

---

#### Step 2: Verify Rollback Success

```bash
# Check rate_limits RLS is re-enabled
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "
    SELECT rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'rate_limits';
  "
```

**Expected:** `rowsecurity = true`

```bash
# Check old business_accounts policy restored
supabase mcp execute_sql \
  --project-id rxlqtyfhsocxnsnnnlwl \
  --query "
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'business_accounts'
      AND policyname = 'Users can view business accounts';
  "
```

**Expected:** Policy exists

---

#### Step 3: Test Application

- Verify application functioning normally
- Check error logs cleared
- Confirm user access restored

---

#### Step 4: Post-Rollback Actions

1. **Document the issue:**
   - What failed?
   - Error messages
   - Affected users
   
2. **Analyze root cause:**
   - Review staging vs production differences
   - Check migration logic
   - Identify fix needed
   
3. **Plan remediation:**
   - Fix migration script
   - Re-test on staging
   - Schedule new deployment

---

## Communication Plan

### Pre-Deployment Announcement

**To:** Development team, support team  
**When:** 1 hour before deployment  
**Message:**
```
RLS hardening migration deploying to production in 1 hour.
- Expected duration: 5-10 minutes
- No downtime expected
- New features: Avatar/media uploads, business account privacy
- Monitor for any issues
```

---

### Post-Deployment Announcement (Success)

**To:** All teams  
**When:** After validation complete  
**Message:**
```
✅ RLS hardening migration completed successfully.
- All validation checks passed
- New features live: Avatar/media uploads, business account privacy
- No issues detected
- Monitoring continues for 24 hours
```

---

### Post-Deployment Announcement (Rollback)

**To:** All teams  
**When:** Immediately after rollback  
**Message:**
```
⚠️ RLS hardening migration rolled back.
- Issue encountered: [describe]
- System restored to previous state
- No user impact expected
- Root cause analysis in progress
- New deployment date TBD
```

---

## Success Criteria

Migration considered successful if:
- ✅ All validation checks pass
- ✅ Application smoke tests pass
- ✅ No increase in error rate
- ✅ No user-reported issues
- ✅ Monitoring shows normal behavior

---

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor application logs for 24 hours
- [ ] Review database performance metrics
- [ ] Check for any RLS policy violations
- [ ] Confirm no user complaints

### Short-term (Week 1)
- [ ] Analyze storage usage (avatar/media uploads)
- [ ] Review business account privacy adoption
- [ ] Monitor query performance
- [ ] Update documentation if needed

### Long-term (Month 1)
- [ ] Review RLS policy effectiveness
- [ ] Analyze security improvements
- [ ] Plan next optimization phase
- [ ] Document lessons learned

---

## Contact Information

**Primary Contact:** [Your name/team]  
**Escalation:** [Manager/lead]  
**Emergency Rollback Authority:** [Designated person]  
**On-call Engineer:** [Name/number]

---

## Appendix

### Migration Files
- Migration: `/supabase_hardening/migrations/001_rls_hardening.sql`
- Rollback: `/supabase_hardening/rollback/001_rls_hardening_rollback.sql`
- VACUUM: `/supabase_hardening/migrations/002_vacuum_analyze.sql`

### Documentation
- Execution log (staging): `/supabase_hardening/execution_log.md`
- Validation report: `/supabase_hardening/VALIDATION_REPORT.md`
- Changelog: `/supabase_hardening/CHANGELOG.md`

### Test Scaffolds
- Business accounts: `/supabase_hardening/tests/rls/business_accounts.rls.spec.ts`
- Storage policies: `/supabase_hardening/tests/rls/storage.policies.spec.ts`

---

**Runbook Version:** 1.0  
**Last Updated:** October 12, 2025  
**Tested On:** Connect-Staging (mohctrsopquwoyfweadl)  
**Ready For:** Connect-Prod (rxlqtyfhsocxnsnnnlwl)

