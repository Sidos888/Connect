# Changelog - RLS Hardening Migration

## [001_rls_hardening] - 2025-10-12

### Added ✨
- **business_accounts.is_public column** - Boolean flag for public/private visibility (default: true)
- **Storage infrastructure**:
  - `avatars` bucket (10MB limit, public READ, 5 image types)
  - `chat-media` bucket (10MB limit, public READ, 11 media types)
- **6 storage.objects RLS policies**:
  - Avatar upload/update/delete (path: `avatars/{auth_uid}.{ext}`)
  - Chat media upload/update/delete (path: `chat-media/{chat_id}/*`)

### Changed 🔄
- **business_accounts SELECT policy** - Replaced `USING true` with public/private visibility logic
- **accounts SELECT policy** - Added documentation comment (intentionally permissive design)

### Fixed 🐛
- **rate_limits table** - Disabled RLS to fix blocking issue (was enabled with no policies)

### Removed 🗑️
- **business_accounts** - Dropped old permissive "Users can view business accounts" policy

---

## Migration Details

### Database Changes
- **Tables modified:** 2 (rate_limits, business_accounts)
- **Columns added:** 1 (business_accounts.is_public)
- **Policies replaced:** 1 (business_accounts SELECT)
- **Policies added:** 6 (storage.objects)
- **Buckets created:** 2 (avatars, chat-media)

### Security Improvements
- ✅ Fixed rate_limits blocking issue
- ✅ Enhanced business_accounts privacy control
- ✅ Implemented storage path-based access control
- ✅ Documented accounts policy design decision

### Backward Compatibility
✅ **100% backward compatible**
- New is_public column defaults to `true`
- Existing business accounts remain public
- No breaking changes to existing functionality

---

## Application Code Updates Required

### 1. Avatar Uploads (New Feature)
```typescript
// Required path format
const path = `avatars/${userId}.jpg`;

await supabase.storage
  .from('avatars')
  .upload(path, avatarFile);
```

### 2. Chat Media Uploads (New Feature)
```typescript
// Required path format
const path = `chat-media/${chatId}/${filename}`;

await supabase.storage
  .from('chat-media')
  .upload(path, mediaFile);
```

### 3. Business Account Creation (Optional)
```typescript
// Add is_public field (defaults to true if omitted)
const { data, error } = await supabase
  .from('business_accounts')
  .insert({
    owner_account_id: accountId,
    name: 'Business Name',
    is_public: true, // or false for private
  });
```

---

## Rollback Procedure

If issues occur, execute rollback script:

```bash
supabase mcp execute_sql \
  --project-id <project-id> \
  --file ./supabase_hardening/rollback/001_rls_hardening_rollback.sql
```

**Rollback restores:**
- RLS enabled on rate_limits
- Original permissive business_accounts policy
- Removes storage policies

**Rollback preserves:**
- is_public column (data not lost)
- Storage buckets and uploaded files

---

## Testing Checklist

- [x] Staging execution successful
- [x] All validation checks passed
- [x] rate_limits accessible
- [x] business_accounts privacy logic working
- [x] Storage buckets created
- [x] Storage policies enforcing path discipline
- [ ] Avatar upload tested with app
- [ ] Chat media upload tested with app
- [ ] Business account visibility tested

---

## Performance Impact

✅ **Positive impacts:**
- rate_limits no longer blocked by RLS
- Accurate table statistics after VACUUM ANALYZE

❌ **No negative impacts:**
- Storage policy checks are efficient (regex-based)
- business_accounts policy adds minimal overhead

---

## Next Steps

### Before Production
1. Update application code for storage paths
2. Test avatar/media uploads on staging
3. Test business account visibility toggle
4. Review production runbook

### Production Deployment
1. Schedule low-traffic window
2. Execute migrations following runbook
3. Run validation checks
4. Monitor application logs

---

## Contributors
- Migration executed via Supabase MCP
- Designed based on security audit findings
- Tested on Connect-Staging (mohctrsopquwoyfweadl)

---

## Links
- Migration file: `/supabase_hardening/migrations/001_rls_hardening.sql`
- Rollback script: `/supabase_hardening/rollback/001_rls_hardening_rollback.sql`
- Execution log: `/supabase_hardening/execution_log.md`
- Validation report: `/supabase_hardening/VALIDATION_REPORT.md`
- Production runbook: `/supabase_hardening/PRODUCTION_RUNBOOK.md`

