# Messaging System Migration Guide

## Overview

This migration aligns the Connect-Prod and Connect-Staging Supabase projects to ensure consistent messaging functionality. The migration is **safe, non-destructive, and reversible**.

## 🎯 What This Fixes

- ✅ `this.withRetry is not a function` errors
- ✅ `Error loading conversations: {}` issues  
- ✅ Message ordering inconsistencies
- ✅ Data integrity gaps (nullable foreign keys)
- ✅ Performance improvements (missing indexes)

## 📋 Pre-Migration Checklist

- [ ] Read this entire README
- [ ] Review all SQL files in this directory
- [ ] Ensure you have Supabase access to both projects
- [ ] Notify team of brief maintenance window (optional)
- [ ] Keep rollback.sql ready (just in case)

## 🚀 Execution Steps

### Step 1: Apply Schema Alignment to Production (2 minutes)

**Target:** Connect-Prod (rxlqtyfhsocxnsnnnlwl)

1. Open Supabase Dashboard → Connect-Prod → SQL Editor
2. Copy contents of `001_schema_alignment.sql`
3. Paste and execute
4. Verify you see success messages:
   ```
   ✓ Successfully added NOT NULL constraints
   ✓ Added idx_chat_messages_sender_id index
   ✓ NOT NULL constraints verified
   ✓ sender_id index verified
   ```

**What this does:**
- Adds NOT NULL constraints to `chat_participants.chat_id` and `user_id`
- Adds missing `sender_id` index for better performance
- Improves data integrity

**If errors occur:** Check error message. Most likely cause would be NULL data (but we verified there isn't any).

---

### Step 2: Validate Production (2 minutes)

Run validation queries from `004_validation.sql` in Connect-Prod SQL Editor.

**Critical checks:**
1. All messages should have `seq` values ✓
2. `chat_participants.chat_id` and `user_id` should be NOT NULL ✓
3. All 5 functions should exist ✓
4. Indexes should exist ✓

**Expected results:**
- Total messages: 183
- Messages with seq: 183
- Functions count: 5
- All status checks show: ✓ PASS

---

### Step 3: Apply Function Updates to Staging (1 minute)

**Target:** Connect-Staging (mohctrsopquwoyfweadl)

1. Open Supabase Dashboard → Connect-Staging → SQL Editor
2. Copy contents of `002_function_updates_staging.sql`
3. Paste and execute
4. Verify success messages:
   ```
   ✓ Updated mark_messages_as_read function
   ✓ Added get_unread_count function
   ✓ All functions verified
   ```

**What this does:**
- Updates `mark_messages_as_read()` to return count
- Adds missing `get_unread_count()` function
- Aligns staging with production function signatures

---

### Step 4: Apply Index Alignment to Staging (1 minute)

**Target:** Connect-Staging (mohctrsopquwoyfweadl)

1. Stay in Connect-Staging SQL Editor
2. Copy contents of `003_index_alignment.sql`
3. Paste and execute
4. Verify success messages:
   ```
   ✓ Added idx_chat_messages_reply_to index
   ✓ reply_to index verified
   ```

---

### Step 5: Validate Staging (2 minutes)

Run validation queries from `004_validation.sql` in Connect-Staging SQL Editor.

**All checks should pass** (same as production validation).

---

### Step 6: Test Frontend (5 minutes)

Your localhost is already configured to use Connect-Prod (you set this earlier).

1. **Restart dev server** (important for env vars to reload):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test conversation loading:**
   - Navigate to `/chat`
   - Verify conversations load without errors
   - Check browser console - should see no `withRetry` errors

3. **Test messaging:**
   - Open a conversation
   - Send a message
   - Verify it appears correctly
   - Check message ordering

4. **Test realtime:**
   - Open same conversation in two browser tabs
   - Send message from one tab
   - Verify it appears in other tab

**Expected results:**
- ✅ Conversations load successfully
- ✅ Messages appear in correct order
- ✅ No console errors
- ✅ Realtime updates work

---

## 🔄 If Something Goes Wrong

### Option 1: Rollback Production Schema
```sql
-- Run this in Connect-Prod SQL Editor
BEGIN;
ALTER TABLE chat_participants ALTER COLUMN chat_id DROP NOT NULL;
ALTER TABLE chat_participants ALTER COLUMN user_id DROP NOT NULL;
DROP INDEX IF EXISTS idx_chat_messages_sender_id;
COMMIT;
```

### Option 2: Full Rollback
See `rollback.sql` for complete rollback script.

### Option 3: Contact Support
If issues persist:
1. Check Supabase logs (Dashboard → Logs)
2. Check browser console for errors
3. Review validation query results
4. Check `rollback.sql` for undo operations

---

## ✅ Success Criteria

Migration is successful when:

1. ✅ All validation queries pass
2. ✅ Conversations load in localhost
3. ✅ Messages send and receive correctly
4. ✅ No console errors about `withRetry`
5. ✅ Realtime updates work
6. ✅ Both environments show identical schema

---

## 📊 Migration Summary

### Production Changes
- Added NOT NULL constraints to `chat_participants`
- Added `idx_chat_messages_sender_id` index
- **No data modified**
- **No breaking changes**

### Staging Changes  
- Updated `mark_messages_as_read()` function signature
- Added `get_unread_count()` function
- Added `idx_chat_messages_reply_to` index
- **No data modified**
- **No breaking changes**

---

## 🎉 Post-Migration

After successful migration:

1. ✅ Both environments aligned
2. ✅ Messaging system fully functional
3. ✅ Better data integrity
4. ✅ Improved performance
5. ✅ Feature flags can be safely enabled

Optional next steps:
- Enable feature flags in `src/lib/featureFlags.ts`
- Monitor Supabase logs for any issues
- Run validation queries periodically

---

## 📝 Files in This Directory

- `README.md` - This file
- `MIGRATION_SUMMARY.md` - Detailed technical analysis
- `001_schema_alignment.sql` - Production schema fixes
- `002_function_updates_staging.sql` - Staging function updates
- `003_index_alignment.sql` - Staging index alignment
- `004_validation.sql` - Verification queries
- `rollback.sql` - Emergency rollback script

---

## ⏱️ Estimated Timeline

- Step 1 (Prod schema): 2 minutes
- Step 2 (Prod validation): 2 minutes
- Step 3 (Staging functions): 1 minute
- Step 4 (Staging indexes): 1 minute
- Step 5 (Staging validation): 2 minutes
- Step 6 (Frontend testing): 5 minutes
- **Total: ~13 minutes**

---

## 🔒 Safety Features

- ✅ All migrations are idempotent (can run multiple times)
- ✅ No data is deleted or modified
- ✅ All changes are schema-only
- ✅ Full rollback script provided
- ✅ Validation at every step
- ✅ Transaction-wrapped operations

---

**Ready to begin?** Start with Step 1 above! 🚀

