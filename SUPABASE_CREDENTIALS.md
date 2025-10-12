# Supabase Project Credentials

**⚠️ IMPORTANT: These are sensitive credentials!**
- Do NOT commit this file to Git
- Keep this file secure
- Delete after you've copied to `.env` files

---

## 🆕 Staging Project (For Testing)

**Project Name**: Connect-Staging  
**Project ID**: mohctrsopquwoyfweadl  
**Region**: ap-southeast-2  
**URL**: https://mohctrsopquwoyfweadl.supabase.co

**Anon Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGN0cnNvcHF1d295ZndlYWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzM3OTQsImV4cCI6MjA3NTgwOTc5NH0.RUrQzVE1s7gkMkIfI5yixpx5sdZVg186tQQ4GfLrMh4
```

---

## 🏭 Production Project (Your Real Users)

**Project Name**: Connect-Production  
**Project ID**: rxlqtyfhsocxnsnnnlwl  
**Region**: ap-southeast-2  
**URL**: https://rxlqtyfhsocxnsnnnlwl.supabase.co

**Anon Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bHF0eWZoc29jeG5zbm5ubHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDE0MzEsImV4cCI6MjA3MjM3NzQzMX0.oMDgv8sj7GvoDsSw6RVt0XEezQTQj2l609JJBg43eTg
```

---

## 📝 How to Use These

### Step 1: Create .env.staging (for local development)

```bash
# Create the file
touch .env.staging

# Add these lines:
NEXT_PUBLIC_SUPABASE_URL=https://mohctrsopquwoyfweadl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGN0cnNvcHF1d295ZndlYWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzM3OTQsImV4cCI6MjA3NTgwOTc5NH0.RUrQzVE1s7gkMkIfI5yixpx5sdZVg186tQQ4GfLrMh4
```

### Step 2: Create .env.production (for Vercel)

```bash
# Create the file
touch .env.production

# Add these lines:
NEXT_PUBLIC_SUPABASE_URL=https://rxlqtyfhsocxnsnnnlwl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bHF0eWZoc29jeG5zbm5ubHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDE0MzEsImV4cCI6MjA3MjM3NzQzMX0.oMDgv8sj7GvoDsSw6RVt0XEezQTQj2l609JJBg43eTg
```

### Step 3: Create .env.local (for daily work)

```bash
# For local development, use STAGING
cp .env.staging .env.local
```

### Step 4: Verify .gitignore

Ensure these lines are in `.gitignore`:
```
.env
.env.local
.env.staging
.env.production
*.env.local
```

---

## 🎯 Daily Workflow

### Local Development (Daily):
```bash
# Your .env.local points to STAGING
npm run dev
# → Opens localhost:3000
# → Connects to STAGING database (mohctrsopquwoyfweadl)
# → Safe to test, break things
```

### Production Deployment:
```bash
# In Vercel dashboard, set environment variables:
NEXT_PUBLIC_SUPABASE_URL = https://rxlqtyfhsocxnsnnnlwl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = (production key from above)

# Then git push → Vercel auto-deploys → Uses production database
```

---

## ⚠️ Security Notes

1. **Never commit .env files** (except .env.example)
2. **Rotate keys if exposed** (can do in Supabase dashboard)
3. **Use different keys for staging/prod** (already done ✅)
4. **Keep this file secure** (delete after copying to .env files)

---

**Created**: Current  
**Status**: Ready to use  
**Action**: Copy to .env files and DELETE THIS FILE

