# Supabase Connection Audit - Overview
**Project:** Connect-Staging  
**Project ID:** rxlqtyfhsocxnsnnnlwl  
**Environment:** STAGING  
**Region:** ap-southeast-2 (Australia)  
**Audit Date:** October 12, 2025  
**Database Status:** ACTIVE_HEALTHY

---

## 📊 Executive Summary

### Project Information
- **Project Name:** Connect-Staging
- **Created:** September 2, 2025
- **PostgreSQL Version:** 17.4 (aarch64, 64-bit)
- **WAL Level:** logical (Realtime enabled ✅)
- **Organization ID:** dfptmjwpqosxexcmqttp

### Key Metrics
- **Total Users:** 18 (auth.users)
- **Active Sessions:** 87
- **Database Size:** ~13 MB (top 15 tables)
- **Storage Usage:** 112 MB (90 objects across 2 buckets)
- **Connection Count:** 11 active connections
- **RLS Coverage:** 97% (33/34 tables)

### Health Status
✅ **HEALTHY** - No critical issues detected in:
- Connection pool
- Realtime replication
- Database integrity (no orphaned records)
- Storage configuration

⚠️ **ATTENTION REQUIRED:**
- 1 table without RLS (`business_accounts`)
- Overly permissive RLS policies (all using `qual = true`)
- Long-running idle connections (up to 14+ hours)

---

## 1️⃣ Environment Confirmation

### Database Version
- **PostgreSQL:** 17.4 on aarch64-unknown-linux-gnu
- **Compiler:** gcc (GCC) 13.2.0, 64-bit
- **Supabase Platform Version:** 17.4.1.075

### Installed Extensions (Active)
| Extension | Version | Schema | Purpose |
|-----------|---------|--------|---------|
| plpgsql | 1.0 | pg_catalog | Procedural language |
| pg_stat_statements | 1.11 | extensions | SQL statistics tracking |
| pgcrypto | 1.3 | extensions | Cryptographic functions |
| uuid-ossp | 1.1 | extensions | UUID generation |
| pg_graphql | 1.5.11 | graphql | GraphQL support |
| supabase_vault | 0.3.1 | vault | Secrets management |

**Total Available Extensions:** 77  
**Active Extensions:** 6

---

## 2️⃣ Active Connections Analysis

### Connection Summary
| Role | Connection Count |
|------|------------------|
| supabase_admin | 5 |
| (system/background) | 4 |
| authenticator | 2 |
| **Total** | **11** |

### Connection Details by Type
1. **System Processes (4):**
   - checkpointer
   - background writer
   - walwriter
   - autovacuum launcher

2. **Admin Connections (5):**
   - pg_cron scheduler (job scheduling)
   - pg_net worker (HTTP requests)
   - logical replication launcher
   - postgres_exporter (monitoring)
   - 1 idle connection (13:29 session, ~11.9 hours idle)

3. **Application Connections (2):**
   - 2x PostgREST (authenticator role)
   - Both idle, waiting for client requests

### ⚠️ Long-Running Idle Connections
| PID | Role | App | Idle Duration | Concern |
|-----|------|-----|---------------|---------|
| 881 | authenticator | postgrest | 14.8 hours | Normal (connection pool) |
| 7868 | supabase_admin | - | 11.9 hours | Consider timeout policy |
| 1814 | supabase_admin | postgres_exporter | 41 seconds | Normal (monitoring) |

**Note:** Long idle connections are typical for persistent connection pools. No idle-in-transaction sessions detected (good!).

---

## 3️⃣ Connection Pool Diagnostics

### Query Performance
- ✅ **No long-running queries** (>30 seconds)
- ✅ **No blocked processes**
- ✅ **No idle-in-transaction sessions** (>60 seconds)

### Wait Events Distribution
| Event Type | Event Name | Count | Status |
|------------|------------|-------|--------|
| Client | ClientRead | 4 | ✅ Normal (waiting for client) |
| Extension | Extension | 2 | ✅ Normal (pg_net, pg_cron) |
| Activity | Various | 5 | ✅ Normal (background tasks) |

### Application Breakdown
| Application | Count | Purpose |
|-------------|-------|---------|
| (background) | 6 | System processes |
| postgrest | 2 | API layer |
| postgres_exporter | 1 | Metrics collection |
| pg_net 0.19.5 | 1 | HTTP client |
| pg_cron scheduler | 1 | Scheduled jobs |

**Assessment:** Connection pool is healthy with no bottlenecks or contention.

---

## 4️⃣ Realtime & Replication Health

### Realtime Publications
**2 active publications:**

#### Publication: `supabase_realtime`
Enabled tables (6):
- ✅ public.attachments (FULL replica identity)
- ✅ public.chat_messages (FULL replica identity)
- ✅ public.chat_participants (FULL replica identity)
- ✅ public.chats (FULL replica identity)
- ✅ public.message_reactions (FULL replica identity)
- ✅ storage.objects (DEFAULT replica identity)

#### Publication: `supabase_realtime_messages_publication`
Partitioned realtime tables (7):
- realtime.messages_2025_10_08 through messages_2025_10_14

### Replica Identity Settings
- **FULL (5 tables):** All Realtime chat/messaging tables ✅
- **DEFAULT (28 tables):** Standard tables (uses primary key)

### WAL Configuration
- **wal_level:** logical ✅
- **Status:** Properly configured for Realtime subscriptions

**Assessment:** Realtime configuration is optimal. FULL replica identity on chat tables ensures all column changes are captured.

---

## 5️⃣ Auth Subsystem

### User Statistics
| Metric | Count |
|--------|-------|
| Total Users | 18 |
| Active Sessions | 87 |
| Email Identities | 8 |
| Phone Identities | 10 |

### User Confirmation Status
| Email Confirmed | Phone Confirmed | Count |
|-----------------|-----------------|-------|
| ❌ | ❌ | 6 (unconfirmed) |
| ✅ | ✅ | 8 (fully verified) |
| ✅ | ❌ | 4 (email only) |

### Auth Providers Enabled
1. ✅ **Email** (8 users)
2. ✅ **Phone** (10 users)

**Note:** No OAuth providers detected (Google, Apple, GitHub, etc.)

### Auth Configuration
- **Sessions Table:** ✅ Exists (87 rows)
- **JWT Settings:** Not exposed via pg_settings (managed by Supabase platform)
- **Session Retention:** Default Supabase settings apply

**Assessment:** Auth system is healthy. Consider enabling additional OAuth providers for better UX.

---

## 6️⃣ RLS (Row Level Security) Summary

### Coverage Overview
- **Public Schema:** 9/10 tables (90%)
- **Storage Schema:** 7/7 tables (100%)
- **Auth Schema:** 17/17 tables (100%, system-managed)
- **Overall:** 33/34 tables (97%)

### ⚠️ Critical Finding: Missing RLS
**Table:** `public.business_accounts`
- RLS Disabled
- Contains user business account data
- Currently accessible to all authenticated users
- **Action Required:** Enable RLS immediately

### ⚠️ Security Concern: Overly Permissive Policies
**36 policies in public schema** all follow this pattern:
```sql
qual: 'true'
with_check: 'true'
role: {authenticated}
```

**Impact:**
- Any authenticated user can read ALL records from ALL tables
- Any authenticated user can modify/delete ANY record
- User A can read User B's private messages
- User A can modify User B's profile

**See `rls_summary.md` for detailed analysis and recommendations.**

---

## 7️⃣ Database Usage Metrics

### Top 10 Largest Tables
| Rank | Schema | Table | Total Size | Rows | Notes |
|------|--------|-------|------------|------|-------|
| 1 | public | accounts | 10 MB | 0* | High index overhead |
| 2 | auth | audit_log_entries | 1.2 MB | 175 | Auth events |
| 3 | auth | refresh_tokens | 304 KB | 177 | Active tokens |
| 4 | auth | flow_state | 296 KB | 48 | OAuth flows |
| 5 | realtime | subscription | 240 KB | 0 | Realtime clients |
| 6 | storage | objects | 232 KB | 18 | File metadata |
| 7 | auth | users | 224 KB | 18 | User accounts |
| 8 | auth | sessions | 216 KB | 87 | Active sessions |
| 9 | public | chat_messages | 208 KB | 183 | Message history |
| 10 | public | chat_participants | 120 KB | 18 | Chat membership |

*Note: `n_live_tup = 0` may indicate recent VACUUM or stat collection timing. Actual row count likely >0.

### Index Analysis

#### Top 10 Largest Indexes
| Schema | Table | Index | Size |
|--------|-------|-------|------|
| auth | audit_log_entries | audit_log_entries_pkey | 168 KB |
| auth | audit_log_entries | audit_logs_instance_id_idx | 56 KB |
| auth | flow_state | idx_auth_code | 56 KB |
| auth | mfa_amr_claims | session_id_auth_method_pkey | 40 KB |
| auth | refresh_tokens | refresh_tokens_updated_at_idx | 40 KB |

#### Tables with >5 Indexes
| Schema | Table | Index Count | Notes |
|--------|-------|-------------|-------|
| auth | users | 11 | Standard Supabase auth indexes |
| public | chat_messages | 8 | Heavily indexed for performance |
| auth | refresh_tokens | 7 | Token lookup optimization |
| storage | objects | 7 | Storage performance |
| auth | mfa_factors | 6 | MFA support |
| public | account_identities | 6 | Identity lookups |

#### Missing Primary Keys
✅ **None detected** - All tables have primary keys

**Assessment:** Index usage is appropriate. High index counts on frequently-queried tables (users, chat_messages) support read performance.

---

## 8️⃣ Triggers & Functions

### Trigger Summary
**14 triggers** across public and storage schemas:

#### Public Schema (6 triggers)
| Table | Trigger | Event | Function |
|-------|---------|-------|----------|
| accounts | update_accounts_updated_at | UPDATE | update_updated_at_column() |
| business_accounts | trg_limit_business_accounts | INSERT | limit_business_accounts() |
| business_accounts | update_business_accounts_updated_at | UPDATE | update_updated_at_column() |
| chat_messages | trg_assign_seq | INSERT | assign_message_seq() |
| chat_messages | trigger_update_chat_last_message_at | INSERT | update_chat_last_message_at() |
| friend_requests | trigger_create_connection | UPDATE | create_connection_on_accept() |

**Purpose:**
- Auto-update timestamps
- Enforce business logic (3 business accounts per owner)
- Assign sequential message IDs
- Auto-create connections when friend requests are accepted

#### Storage Schema (8 triggers)
Standard Supabase storage triggers for bucket/object management.

### Function Inventory

#### SECURITY DEFINER Functions (⚠️ Elevated Privileges)
**Public Schema (7 functions):**
1. `get_account_by_auth_user` - Maps auth user to account
2. `get_account_by_identifier` - Lookup by email/phone
3. `get_latest_seq` - Message sequence management
4. `get_unread_count` - Unread message counter
5. `mark_messages_as_delivered` - Status updates
6. `mark_messages_as_read` - Status updates
7. `rl_allow` - Rate limiting

**Storage Schema (7 functions):**
- Standard Supabase storage management functions

**Total Functions:** 52 across public, auth, and storage schemas

**Assessment:** SECURITY DEFINER functions are appropriately used for operations requiring elevated privileges. Function count is reasonable for the application complexity.

---

## 9️⃣ Storage Buckets

### Bucket Configuration
| Bucket | Public | Size Limit | Objects | Total Size | Created |
|--------|--------|------------|---------|------------|---------|
| **avatars** | ✅ Public | None | 61 | 77 MB | Sep 13, 2025 |
| **chat-media** | ✅ Public | 10 MB/file | 29 | 35 MB | Oct 10, 2025 |

### Storage Policies
**storage.objects** has 8 RLS policies:
- ✅ Avatar upload/view/update/delete
- ✅ Chat media upload/view/update/delete

**⚠️ Note:** All policies use role `{public}`, allowing anonymous access. Verify this is intentional.

### Allowed MIME Types (chat-media)
- Images: jpeg, jpg, png, gif, webp
- Videos: mp4, quicktime, x-msvideo

**Assessment:** Storage is well-configured with appropriate file size limits. Consider restricting anonymous access if not required.

---

## 🔟 Data Integrity Checks

### Duplicate Detection
✅ **No duplicates found** in `account_identities` (method + identifier)

### Orphaned Records
| Check | Result | Status |
|-------|--------|--------|
| account_identities → accounts | 0 orphans | ✅ Clean |
| connections → accounts | 0 orphans | ✅ Clean |
| chat_participants → accounts/chats | 0 orphans | ✅ Clean |
| chat_messages → chats/accounts | 0 orphans | ✅ Clean |

**Assessment:** Excellent data integrity. Foreign key constraints are working correctly. No cleanup required.

---

## 📈 Performance Observations

### Strengths
1. ✅ No long-running queries
2. ✅ No blocked processes
3. ✅ Appropriate indexing strategy
4. ✅ Clean data (no orphans)
5. ✅ Realtime properly configured
6. ✅ Connection pool healthy

### Recommendations
1. 🟡 Monitor `accounts` table size (10 MB with 0 rows suggests heavy indexing)
2. 🟡 Consider connection timeout policy for long-idle admin connections
3. 🟡 Review `auth.audit_log_entries` retention (175 rows = 1.2 MB)
4. 🟢 Database size is small and performant for current scale

---

## 🚨 Security Findings & Recommendations

### 🔴 CRITICAL (Immediate Action)
1. **Enable RLS on `business_accounts`**
   - Risk: User data exposed to all authenticated users
   - Action: Run migration to enable RLS + add policies
   
2. **Tighten RLS Policies**
   - Risk: Current `qual = true` allows universal access
   - Action: Implement ownership/participation-based filtering
   - See `rls_summary.md` for policy examples

### 🟡 HIGH PRIORITY
3. **Review Storage Public Access**
   - Risk: Storage policies use `{public}` role (anonymous access)
   - Action: Verify if anonymous access is intentional
   
4. **Implement Policy-Level Auditing**
   - Add logging for sensitive operations (account modifications, deletions)
   
5. **Auth Provider Expansion**
   - Consider adding OAuth (Google, Apple) for better UX

### 🟢 BEST PRACTICES
6. Session management monitoring (currently 87 sessions for 18 users is high)
7. Set up automated RLS policy testing
8. Document custom functions and their security implications
9. Regular audit log review (auth.audit_log_entries)

---

## 📁 Audit Deliverables

### Generated Files
```
/supabase_audit/
├── overview.md (this file)
├── rls_summary.md (detailed RLS analysis)
└── raw/
    ├── connections.csv (11 connections)
    ├── rls_policies.csv (44 policies)
    ├── tables.csv (15 largest tables)
    ├── indexes.csv (10 largest indexes)
    ├── buckets.csv (2 storage buckets)
    ├── triggers.csv (14 triggers)
    └── functions.csv (52 functions)
```

### Data Redaction
- No user emails or phone numbers exported
- No secrets or API keys included
- All queries read-only (SELECT only)

---

## ✅ Audit Completion Checklist

- [x] Environment confirmed (PostgreSQL 17.4, ap-southeast-2)
- [x] Connections analyzed (11 active, all healthy)
- [x] Connection pool assessed (no bottlenecks)
- [x] Realtime health verified (FULL replica identity configured)
- [x] Auth system inspected (18 users, 87 sessions)
- [x] RLS coverage measured (97%, 1 table needs RLS)
- [x] Database usage profiled (13 MB, well-indexed)
- [x] Triggers/functions cataloged (14 triggers, 52 functions)
- [x] Storage buckets reviewed (2 buckets, 112 MB)
- [x] Data integrity validated (no orphans, no duplicates)
- [x] Reports generated (2 MD + 7 CSV files)

---

## 🎯 Next Steps

### Immediate (This Week)
1. Enable RLS on `business_accounts`
2. Review and update RLS policies to restrict access by ownership
3. Verify storage bucket public access is intentional

### Short-term (This Month)
4. Implement automated RLS policy tests
5. Set up monitoring for connection pool metrics
6. Review session-to-user ratio (87:18)

### Long-term (This Quarter)
7. Document all custom functions
8. Consider OAuth provider integration
9. Establish regular audit schedule (quarterly)

---

**Audit Status:** ✅ COMPLETE  
**Overall Grade:** B+ (Good foundation, critical security improvements needed)  
**Next Audit Recommended:** January 2026 or post-production deployment

---

**End of Audit Report**

