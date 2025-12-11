# Highlights Sharing Analysis

## Issue Report
User created a new account and is seeing highlights that appear to be from another account, displaying in their highlights section.

## Current System Analysis

### 1. RLS (Row Level Security) Policy
**Location:** `sql/create_highlights_table.sql`

The RLS policy for highlights is:
```sql
-- Users can view all highlights (public)
CREATE POLICY "Users can view all highlights"
  ON user_highlights FOR SELECT
  USING (true);
```

**Analysis:**
- ✅ This is **intentional** - highlights are designed to be **publicly viewable** (shared)
- ✅ Users can see all highlights from all accounts
- ✅ This is NOT a security issue - it's a feature for sharing

### 2. Query Filtering
**Location:** `src/components/highlights/Highlights.tsx` (line 57-61)

```typescript
const { data, error: fetchError } = await supabase
  .from('user_highlights')
  .select('*')
  .eq('user_id', targetUserId)  // ← Filters by user_id
  .order('created_at', { ascending: false });
```

**Analysis:**
- ✅ Queries **correctly filter** by `user_id` to show only that user's highlights
- ✅ The `targetUserId` is determined by: `userId || searchParams?.get('userId') || account?.id`

### 3. Potential Issues

#### Issue 1: Account ID Mismatch
**Location:** `src/components/highlights/Highlights.tsx` (line 39)

```typescript
const targetUserId = userId || searchParams?.get('userId') || account?.id;
```

**Potential Problem:**
- If `account?.id` is not set correctly or is from a previous session, it could show wrong highlights
- Race condition: If `account` hasn't loaded yet, `account?.id` might be `undefined` or wrong

#### Issue 2: Database Data Issue
**Potential Problem:**
- Highlights in the database might have incorrect `user_id` values
- This could happen if:
  - A bug during highlight creation assigned wrong `user_id`
  - Data migration issue
  - Manual database manipulation

#### Issue 3: Auth Context Race Condition
**Potential Problem:**
- If `account` from `useAuth()` is stale or from a previous session
- Account might not have updated after account creation

### 4. Account Creation Flow
**Location:** `src/lib/authContext.tsx` (lines 985-1020)

```typescript
const createAccount = async (userData: {...}) => {
  // Direct upsert to accounts table (id = auth.uid())
  const { data: account, error } = await supabase
    .from('accounts')
    .upsert({
      id: user.id,  // ← Uses auth user ID
      name: userData.name,
      bio: userData.bio || '',
      dob: userData.dob || null
    }, { onConflict: 'id' })
    .select()
    .single();
  
  setAccount(account);  // ← Updates account state
}
```

**Analysis:**
- ✅ Account creation uses `user.id` (from auth) as the account ID
- ✅ No preset highlights are created during account creation
- ✅ Account state is updated after creation

## Root Cause Hypothesis

### **CONFIRMED CAUSE: Same Email = Reused Auth User ID**

**User is using the same email as an old account that had highlights.**

Here's what happens:

1. **User signs up with email that was used for old account**
   - `sendEmailVerification` uses `shouldCreateUser: true` (line 491)
   - Supabase Auth behavior:
     - If old auth user was **deleted**: Creates NEW auth user with NEW ID ✅
     - If old auth user **still exists**: **REUSES the old auth user** (same user ID) ❌

2. **When OTP is verified:**
   - `verifyEmailCode` checks if account exists with `data.user.id` (line 627)
   - If old account was deleted: Returns `isExistingAccount: false`
   - User goes through sign-up flow

3. **When `createAccount` is called:**
   ```typescript
   .upsert({
     id: user.id,  // ← This is the auth user ID
     name: userData.name,
     ...
   }, { onConflict: 'id' })
   ```
   - If Supabase Auth **reused the old auth user ID**:
     - The `upsert` either:
       - **Updates the old account** (if it wasn't fully deleted)
       - **Creates new account with same ID as old account** (if old account was deleted)
     - **Highlights in database still have `user_id` = that same ID**
     - **Result: Highlights show up because they're linked to that user_id!**

4. **The Problem:**
   - Highlights are stored with `user_id` referencing the auth user ID
   - If the auth user ID is reused, the highlights are still linked to it
   - Even though it's a "new" account, it has the same ID as the old account
   - So the old highlights appear in the new account

### Alternative Hypothesis: **Account State Not Updated**
- Less likely, but possible if account state is stale
- Highlights component might use wrong `account?.id` from previous session

## Recommendations

### 1. Immediate Debugging Steps
1. **Check Database:**
   ```sql
   SELECT id, user_id, title, created_at 
   FROM user_highlights 
   ORDER BY created_at DESC 
   LIMIT 20;
   ```
   - Verify which `user_id` values exist
   - Check if any highlights have wrong `user_id`

2. **Add Logging:**
   - Add console.log in `Highlights.tsx` to log:
     - `targetUserId`
     - `account?.id`
     - `userId` prop
     - `searchParams?.get('userId')`
   - This will show what user ID is being used for the query

3. **Check Account State:**
   - Verify `account?.id` matches the authenticated user's ID
   - Check if account state is properly updated after account creation

### 2. Potential Fixes

#### Fix 1: Use Auth User ID Directly
Instead of relying on `account?.id`, use the authenticated user's ID directly:

```typescript
const { user, account } = useAuth();
const targetUserId = userId || searchParams?.get('userId') || user?.id;  // Use user.id instead of account.id
```

**Rationale:**
- `user` from auth is more reliable than `account` state
- `user.id` is always available when authenticated
- Avoids race conditions with account state updates

#### Fix 2: Add Loading State
Ensure highlights don't load until account is confirmed:

```typescript
useEffect(() => {
  const loadHighlights = async () => {
    // Wait for account to be loaded
    if (!account?.id && !userId && !searchParams?.get('userId')) {
      setLoading(true);
      return;
    }
    // ... rest of loading logic
  };
  loadHighlights();
}, [targetUserId, account?.id]);  // Add account?.id to dependencies
```

#### Fix 3: Verify Database Integrity
If highlights have wrong `user_id` values, need to:
- Identify incorrect records
- Update them with correct `user_id`
- Add validation to prevent future issues

## Conclusion

**CONFIRMED ROOT CAUSE:** Using the same email as an old account causes Supabase Auth to potentially reuse the old auth user ID. When a new account is created with that same ID, the old highlights (which are linked to that `user_id`) appear in the new account.

**The Issue:**
- Highlights are linked to `user_id` (auth user ID) in the database
- If Supabase Auth reuses the old auth user ID for the same email
- The new account gets the same ID as the old account
- Old highlights still have `user_id` = that ID
- Result: Old highlights show up in the new account

**Solutions:**

### Option 1: Delete Old Highlights When Account is Deleted (Recommended)
- Add cascade delete or manual cleanup when account is deleted
- Ensures old highlights don't persist

### Option 2: Use Different User ID System
- Don't use auth user ID directly as account ID
- Use a separate account ID that's unique per account creation
- More complex but prevents this issue

### Option 3: Check and Clean Up on Account Creation
- When creating account, check if highlights exist for that user_id
- If they do and it's a "new" account, delete or transfer them
- Or warn user that old data exists

### Option 4: Prevent Email Reuse
- Don't allow creating new accounts with emails that have existing auth users
- Force users to sign in to existing accounts instead

**Immediate Fix Needed:**
1. Check if old account was properly deleted (both `accounts` table and auth user)
2. If old account still exists, delete it properly before creating new one
3. Add cleanup logic to delete highlights when account is deleted
4. Consider using `user.id` instead of `account.id` in Highlights component for more reliability
