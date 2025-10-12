# Staging Environment Setup Guide

This guide explains how to create and configure a Supabase staging environment for testing migrations before applying them to production.

## Why Use a Staging Environment?

- Test database migrations safely without affecting production data
- Validate schema changes and performance impact
- Test application code against new database structure
- Identify and fix issues before they reach users
- Meet best practices for database change management

## Step 1: Create a Staging Supabase Project

### 1.1 Create New Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New project"
3. Choose your organization
4. Project settings:
   - **Name**: `Connect-Staging` (or similar)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Same as production (for consistency)
   - **Pricing Plan**: Free tier is fine for staging

5. Wait for project to be provisioned (~2 minutes)

### 1.2 Note Project Credentials

Once created, save these from the project settings:

- **Project URL**: `https://[PROJECT_REF].supabase.co`
- **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key**: (Only needed for migrations)
- **Database Password**: (From step 1.1)

## Step 2: Copy Production Schema (Initial Setup)

### Option A: Use Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to production project
supabase link --project-ref [PRODUCTION_PROJECT_REF]

# Generate a schema dump
supabase db dump -f staging-schema.sql

# Switch to staging project
supabase link --project-ref [STAGING_PROJECT_REF]

# Apply the schema
supabase db push staging-schema.sql
```

### Option B: Manual SQL Export/Import

1. **Export from Production:**
   - Go to Production project → Settings → Database
   - Scroll to "Connection string"
   - Use `pg_dump` to export schema only:
   ```bash
   pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
     --schema-only \
     --no-owner \
     --no-privileges \
     -f production-schema.sql
   ```

2. **Import to Staging:**
   - Copy the SQL and run in Staging SQL Editor
   - Or use `psql` to import:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@[STAGING_HOST]:5432/postgres" \
     -f production-schema.sql
   ```

### Option C: Replicate via Supabase Dashboard

If you have a small schema:
1. Go to Production → SQL Editor
2. Run: `SELECT * FROM pg_dump_create_script();` (if available)
3. Copy all table creation statements
4. Run in Staging SQL Editor

## Step 3: Configure Environment Variables

Create a `.env.staging` file in your project root:

```env
# Staging Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[STAGING_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: For migration scripts
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Add to `.gitignore`:
```
.env.staging
.env.local
.env.*.local
```

## Step 4: Add Sample Test Data (Optional)

If you want to test with realistic data:

```sql
-- Create test users
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test1@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'test2@example.com');

-- Create test accounts
INSERT INTO accounts (id, name, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test User 1', 'test1@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'Test User 2', 'test2@example.com');

-- Create test chat
INSERT INTO chats (id, type, created_by) VALUES
  ('00000000-0000-0000-0000-000000000001', 'direct', '00000000-0000-0000-0000-000000000001');

-- Add participants
INSERT INTO chat_participants (chat_id, user_id) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Add test messages
INSERT INTO chat_messages (chat_id, sender_id, message_text) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Hello from staging!'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hi! Testing reply.');
```

## Step 5: Apply Migrations to Staging

### 5.1 Run Migrations in Order

```bash
# Connect to staging
supabase link --project-ref [STAGING_PROJECT_REF]

# Apply migrations one by one
supabase db push sql/migration_01_add_seq_and_status.sql
supabase db push sql/migration_02_triggers_and_functions.sql
supabase db push sql/migration_03_realtime_publication.sql
```

Or manually via SQL Editor:
1. Copy contents of `migration_01_add_seq_and_status.sql`
2. Paste into Staging SQL Editor
3. Run and verify output
4. Repeat for migrations 02 and 03

### 5.2 Verify Migration Success

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_messages'
  AND column_name IN ('seq', 'client_generated_id', 'status')
ORDER BY column_name;

-- Check indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'chat_messages'
  AND indexname LIKE '%seq%' OR indexname LIKE '%client_generated%'
ORDER BY indexname;

-- Check functions created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'assign_message_seq',
    'mark_messages_as_read',
    'mark_messages_as_delivered'
  );

-- Check seq backfill
SELECT 
  COUNT(*) as total_messages,
  COUNT(seq) as messages_with_seq,
  COUNT(*) - COUNT(seq) as messages_without_seq
FROM chat_messages;
```

Expected output:
- All new columns should exist
- All indexes should be created
- All functions should be present
- All messages should have seq assigned (messages_without_seq = 0)

## Step 6: Test Application Against Staging

### 6.1 Run Dev Server with Staging

```bash
# Load staging environment
cp .env.staging .env.local

# Start development server
npm run dev

# Open http://localhost:3000
```

### 6.2 Testing Checklist

- [ ] Can log in successfully
- [ ] Can view existing chats
- [ ] Can send new messages
- [ ] Messages appear in correct order (by seq)
- [ ] Idempotency works (try sending same message twice)
- [ ] Real-time updates work
- [ ] Delivery status updates correctly
- [ ] No console errors
- [ ] No database errors in Supabase logs

### 6.3 Performance Testing

```sql
-- Test query performance with new indexes
EXPLAIN ANALYZE
SELECT * FROM chat_messages
WHERE chat_id = '[SOME_CHAT_ID]'
ORDER BY seq DESC
LIMIT 50;

-- Should show index scan on idx_chat_messages_chat_id_seq_desc
-- Execution time should be <10ms for typical chats
```

## Step 7: Soak Test (Load Testing)

If your staging environment has similar data volume to production:

### 7.1 Send Test Messages

```typescript
// Run in browser console on staging
async function stressTest() {
  const chatId = '[YOUR_TEST_CHAT_ID]';
  const results = [];
  
  for (let i = 0; i < 100; i++) {
    const start = Date.now();
    await fetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        chatId,
        text: `Stress test message ${i}`,
      }),
    });
    results.push(Date.now() - start);
  }
  
  const avg = results.reduce((a, b) => a + b) / results.length;
  const p95 = results.sort()[Math.floor(results.length * 0.95)];
  
  console.log(`Average: ${avg}ms, P95: ${p95}ms`);
}

stressTest();
```

### 7.2 Expected Performance

- Average message send: <300ms
- P95 message send: <500ms
- No duplicate messages
- Messages in correct seq order

## Step 8: Apply to Production

Once staging is validated:

### 8.1 Schedule Maintenance Window (Optional)

For large databases, consider:
- Off-peak hours
- Announce to users
- Prepare rollback plan

### 8.2 Apply Migrations

```bash
# Switch to production
supabase link --project-ref [PRODUCTION_PROJECT_REF]

# Backup first (IMPORTANT!)
supabase db dump -f backup-before-migration.sql

# Apply migrations
supabase db push sql/migration_01_add_seq_and_status.sql
supabase db push sql/migration_02_triggers_and_functions.sql
supabase db push sql/migration_03_realtime_publication.sql
```

### 8.3 Verify Production

Run the same verification queries as Step 5.2 in production.

### 8.4 Monitor

- Watch Supabase logs for errors
- Monitor application error rates
- Check message delivery latency
- Verify no duplicate messages

## Step 9: Rollback Procedure (If Needed)

If issues occur in production:

### 9.1 Quick Rollback (Code Only)

```bash
# Revert to previous Git commit
git revert HEAD
git push origin main

# Redeploy application
npm run build
npm run deploy
```

### 9.2 Full Rollback (Database + Code)

```sql
-- Run rollback sections from migration files
-- See "ROLLBACK INSTRUCTIONS" in each migration file

-- migration_03 rollback
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS attachments;
-- ... (see file for complete rollback)

-- migration_02 rollback
DROP TRIGGER IF EXISTS trg_assign_seq ON chat_messages;
-- ... (see file for complete rollback)

-- migration_01 rollback (WARNING: Data loss!)
DROP INDEX IF EXISTS idx_chat_messages_chat_id_seq_desc;
-- ... (see file for complete rollback)
```

### 9.3 Restore from Backup

```bash
# If major issues, restore entire database
supabase db reset --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f backup-before-migration.sql
```

## Tips and Best Practices

1. **Always test on staging first** - Never apply untested migrations to production
2. **Keep staging in sync** - Periodically refresh staging data from production
3. **Document everything** - Keep notes of any manual steps or gotchas
4. **Automate when possible** - Use CI/CD for consistent deployments
5. **Monitor metrics** - Set up alerts for error rates and performance
6. **Have a rollback plan** - Know how to revert before you deploy
7. **Small batches** - Apply migrations in small, incremental steps
8. **Test backfill performance** - Large data migrations need special handling

## Troubleshooting

### Issue: Migration fails with "column already exists"

**Solution**: Migrations use `IF NOT EXISTS` guards. Safe to re-run.

### Issue: Backfill takes too long

**Solution**: Modify migration_01 to use smaller batch sizes or run backfill separately:

```sql
-- In a separate session, monitor progress
SELECT 
  COUNT(*) FILTER (WHERE seq IS NOT NULL) as filled,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE seq IS NOT NULL) / COUNT(*), 2) as percent_complete
FROM chat_messages;
```

### Issue: RLS policies block migration

**Solution**: Migrations use `SECURITY DEFINER` functions to bypass RLS where needed.

### Issue: Realtime events not received

**Solution**: 
1. Check REPLICA IDENTITY: `SELECT replica_identity FROM pg_tables WHERE tablename = 'chat_messages';`
2. Check publication: `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`
3. Restart realtime server (Supabase Dashboard → Database → Extensions → Restart)

## Additional Resources

- [Supabase Migrations Documentation](https://supabase.com/docs/guides/cli/managing-environments)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/ddl-alter.html)
- [Zero-Downtime Migrations](https://www.braintreepayments.com/blog/safe-operations-for-high-volume-postgresql/)

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Review migration output for errors
3. Consult MESSAGING_SYSTEM_ANALYSIS.md
4. Check docs/messaging.md for detailed API reference

