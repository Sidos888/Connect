# Staging → Production Workflow Guide

Your proper development workflow is now set up! Here's how to use it.

---

## 🏗️ Your Infrastructure

### 🧪 Connect-Staging (mohctrsopquwoyfweadl)
**Purpose**: Testing and development  
**URL**: https://mohctrsopquwoyfweadl.supabase.co  
**Data**: Fake test data (safe to break/reset)  
**Cost**: $10/month  
**Use for**: Daily coding, testing migrations, experimenting

### 🏭 Connect-Production (rxlqtyfhsocxnsnnnlwl)
**Purpose**: Real users  
**URL**: https://rxlqtyfhsocxnsnnnlwl.supabase.co  
**Data**: Real users, real messages, real connections  
**Cost**: Included in Pro  
**Use for**: Deployed apps (iOS, Android, Vercel)

---

## 📁 Setup Your Environment Files (One-time, 2 minutes)

### Step 1: Copy credentials

From `SUPABASE_CREDENTIALS.md` (I just created it):

```bash
# Create .env.staging
echo "NEXT_PUBLIC_SUPABASE_URL=https://mohctrsopquwoyfweadl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGN0cnNvcHF1d295ZndlYWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzM3OTQsImV4cCI6MjA3NTgwOTc5NH0.RUrQzVE1s7gkMkIfI5yixpx5sdZVg186tQQ4GfLrMh4" > .env.staging

# Create .env.production  
echo "NEXT_PUBLIC_SUPABASE_URL=https://rxlqtyfhsocxnsnnnlwl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bHF0eWZoc29jeG5zbm5ubHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDE0MzEsImV4cCI6MjA3MjM3NzQzMX0.oMDgv8sj7GvoDsSw6RVt0XEezQTQj2l609JJBg43eTg" > .env.production

# For daily work, use staging
cp .env.staging .env.local
```

### Step 2: Delete credentials file (security)

```bash
rm SUPABASE_CREDENTIALS.md  # Delete after copying
```

---

## 🔄 Daily Development Workflow

### Scenario: Adding a New Feature

**Day 1: Develop and Test on Staging**

```bash
# 1. Make sure you're using staging
cp .env.staging .env.local

# 2. Start dev server
npm run dev
# → localhost:3000 connects to STAGING (mohctrsopquwoyfweadl)

# 3. Code your feature
# Edit files, test in browser

# 4. If you need database changes:
#    - Write migration SQL file (e.g., sql/add_new_feature.sql)
#    - Apply to STAGING via Supabase dashboard
#    - OR tell me and I'll apply via MCP

# 5. Test thoroughly on localhost
#    - Send messages, test feature
#    - Try edge cases
#    - Check for bugs

# 6. Run automated tests
npm run test:run

# 7. Commit when satisfied
git add -A
git commit -m "feat: new feature"
git push origin main
```

**Day 2: Deploy to Production**

```bash
# 1. Apply SAME migration to PRODUCTION database
#    - Supabase dashboard (rxlqtyfhsocxnsnnnlwl) → SQL Editor
#    - OR tell me and I'll apply via MCP

# 2. Vercel auto-deploys from main branch
#    - Uses .env.production variables (you set once in Vercel)
#    - Connects to PRODUCTION database
#    - Live in ~2 minutes

# 3. Monitor for issues
#    - Check Supabase logs
#    - Watch error rates
#    - Test with real account

# 4. If issues: Rollback
git revert HEAD
git push origin main
# → Vercel redeploys previous version
```

---

## 📱 Mobile Apps (iOS/Android)

### Development Builds:
```typescript
// capacitor.config.ts or env config
// Use STAGING for testing
const config = {
  supabaseUrl: 'https://mohctrsopquwoyfweadl.supabase.co',
  supabaseAnonKey: 'eyJhbGci...' // staging key
};
```

### Production Builds:
```typescript
// Use PRODUCTION for App Store/Play Store
const config = {
  supabaseUrl: 'https://rxlqtyfhsocxnsnnnlwl.supabase.co',
  supabaseAnonKey: 'eyJhbGci...' // production key
};
```

---

## 🎯 When to Use Which Environment

### Use STAGING (mohctrsopquwoyfweadl) for:
- ✅ Daily coding on localhost
- ✅ Testing new features
- ✅ Trying risky migrations
- ✅ Auth refactor testing ← **You're doing this now!**
- ✅ Experimenting
- ✅ Breaking things

### Use PRODUCTION (rxlqtyfhsocxnsnnnlwl) for:
- ✅ Deployed web app (Vercel)
- ✅ iOS app (App Store builds)
- ✅ Android app (Play Store builds)
- ✅ Real user traffic
- ❌ NOT for testing (unless very confident)

---

## 🔧 Example: Testing Auth Refactor

**You're doing auth refactor in another window:**

```bash
# 1. Point to STAGING
cp .env.staging .env.local

# 2. Work on auth changes
#    - Edit authService.ts
#    - Create auth migrations
#    - Test login/signup/reset

# 3. Apply auth migrations to STAGING first
#    - Test with fake accounts
#    - Break login? No problem, it's staging!

# 4. When auth works perfectly on staging:
#    - Apply migrations to PRODUCTION
#    - Deploy code to production
#    - Real users get the improved auth ✅
```

---

## 🚨 Important Rules

### ❌ NEVER:
- Apply untested migrations to production
- Code directly against production
- Skip staging for "quick fixes"
- Push to production on Friday night (give yourself recovery time)

### ✅ ALWAYS:
- Test on staging first
- Keep staging schema in sync with production
- Backup before major migrations
- Monitor production after deployments
- Have rollback plan ready

---

## 💾 Keeping Staging in Sync

**Periodically refresh staging data** (monthly or after major production changes):

```bash
# Option A: Reset staging to match production schema
# (I can help with this via Supabase MCP)

# Option B: Manual SQL export/import
# Export from production → Import to staging
```

---

## 📊 Cost Breakdown

| Environment | Project | Cost | Purpose |
|------------|---------|------|---------|
| Staging | mohctrsopquwoyfweadl | $10/month | Testing |
| Production | rxlqtyfhsocxnsnnnlwl | $15/month* | Real users |
| **Total** | | **$25/month** | Professional setup |

*Estimate based on Pro plan + usage

---

## ✅ You're All Set!

**Your setup is now PROFESSIONAL-GRADE:**
- ✅ Separate staging and production
- ✅ Safe testing environment
- ✅ Proper deployment workflow
- ✅ Bulletproof messaging on both

**Next steps:**
1. Copy credentials from SUPABASE_CREDENTIALS.md to .env files
2. Delete SUPABASE_CREDENTIALS.md (security)
3. Test messaging on staging
4. Continue auth refactor on staging
5. Deploy both to production when ready

---

**Questions? Just ask!**

