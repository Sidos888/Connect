# AccountCheckModal Showing "Creating Account" Instead of Sign-Up Form

## Issue Description

When a user enters OTP for an unregistered email, AccountCheckModal shows "Creating Account" / "Welcome Back" page instead of the sign-up form.

## Root Cause Analysis

### What Happens:

1. ✅ User enters email and OTP is sent
2. ✅ User enters OTP code
3. ✅ OTP verification succeeds - user is authenticated in Supabase Auth
4. ✅ `verifyEmailCode` correctly identifies `isExistingAccount: false`
5. ✅ LoginModal sets step to `account-check`
6. ✅ AccountCheckModal opens
7. ✅ AccountCheckModal checks database - no account found (correct)
8. ❌ AccountCheckModal calls `checkUserExists`
9. ❌ `checkUserExists` calls `checkExistingAccount`
10. ❌ `checkExistingAccount` tries to send OTP with `shouldCreateUser: false`
11. ❌ Since user just verified OTP, Supabase allows this (email exists in Auth)
12. ❌ Returns `{ exists: true, account: null }`
13. ❌ `checkUserExists` returns `{ exists: true, userData: null }`
14. ❌ AccountCheckModal sets `userExists = true` (line 389)
15. ❌ UI shows "Welcome Back" page instead of sign-up form (line 1419)

### The Problem:

**File:** `src/lib/authContext.tsx` (line 756-768)
```typescript
// Try to send OTP to see if email exists (this will fail if user doesn't exist)
const { error } = await supabase.auth.signInWithOtp({
  email: email,
  options: { 
    shouldCreateUser: false // This will fail if user doesn't exist
  }
});

if (!error) {
  // OTP was sent successfully, meaning email exists
  console.log('✅ AuthContext: Email exists (OTP sent successfully)');
  return { exists: true, account: null, error: null };
}
```

**After OTP verification:**
- User is authenticated in Supabase Auth
- Email exists in Auth (because OTP was just verified)
- But no account record exists in `accounts` table
- `checkExistingAccount` checks Auth, not the `accounts` table
- Returns `exists: true` even though there's no account

## Fix Applied

**File:** `src/components/auth/AccountCheckModal.tsx` (line 332-340)

Added early return to skip `checkUserExists` when we already know there's no account:

```typescript
// CRITICAL FIX: After OTP verification, if we have a user but no account,
// we already know it's a new user. Don't call checkUserExists which incorrectly
// checks if email exists in Supabase Auth (it does after OTP verification).
// The database checks above already confirmed there's no account record.
if (user && !account) {
  console.log('AccountCheckModal: ✅ User authenticated but no account found - treating as new user');
  console.log('AccountCheckModal: Skipping checkUserExists (would incorrectly return exists=true after OTP)');
  clearTimeout(timeoutId);
  setUserExists(false);
  setExistingUser(null);
  setInitialAccountCheck(false);
  setAccountCheckInProgress(false);
  return;
}
```

**Also added fallback fix** (line 388-395):

```typescript
// CRITICAL: If checkUserExists says user exists but no userData, it means
// the email exists in Supabase Auth but no account record. This happens after OTP.
// Treat as new user (needs to complete sign-up).
if (exists && !userData) {
  console.log('AccountCheckModal: ⚠️ Email exists in Auth but no account record - treating as new user');
  setUserExists(false);
  setExistingUser(null);
} else {
  setUserExists(exists);
  setExistingUser(userData || null);
}
```

## How It Works Now

1. After OTP verification, user is authenticated but no account exists
2. AccountCheckModal checks database - no account found
3. **NEW:** Checks if `user && !account` - if true, skips `checkUserExists` and goes straight to sign-up form
4. **FALLBACK:** If `checkUserExists` is called and returns `exists: true` but `userData: null`, treats as new user

## Result

- ✅ New users see sign-up form immediately
- ✅ No incorrect "Welcome Back" page
- ✅ No "Creating Account" message
- ✅ User can complete sign-up form
