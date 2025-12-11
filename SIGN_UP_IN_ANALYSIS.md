# Sign Up/In System Analysis

## Question
What happens when a user inputs an email or phone number that's currently not in the system? Does it create a new account titled 'User' or does it display the sign up page?

## Answer
**The system automatically creates a new account titled 'User' during the OTP verification process. It does NOT display a sign-up page at that point - instead, it creates the account automatically and then redirects to the onboarding page.**

## Detailed Flow Analysis

### 1. Initial OTP Request (Email/Phone Entry)

When a user enters an email or phone number in `LoginModal`:

**Location:** `src/components/auth/LoginModal.tsx`
- `handleEmailSubmit()` calls `sendEmailVerification(email)` (line 311)
- `handlePhoneSubmit()` calls `sendPhoneVerification(phone)` (line 250)

**Location:** `src/lib/authContext.tsx`
- `sendEmailVerification()` (line 421) uses `supabase.auth.signInWithOtp()` with `shouldCreateUser: true` (line 450)
- `sendPhoneVerification()` (line 474) uses `supabase.auth.signInWithOtp()` with `shouldCreateUser: true` (line 508)

**Key Point:** `shouldCreateUser: true` means Supabase will automatically create a new auth user if one doesn't exist when the OTP is sent.

### 2. OTP Verification Process

After the user enters the verification code:

**Location:** `src/components/auth/LoginModal.tsx`
- `handleVerifyCode()` (line 335) calls either:
  - `verifyEmailCode(email, code)` (line 354)
  - `verifyPhoneCode(phone, code)` (line 349)

**Location:** `src/lib/authContext.tsx`

#### For Email (`verifyEmailCode` - lines 526-611):
1. Verifies OTP with Supabase (line 533)
2. **Checks if account exists** in `accounts` table (lines 552-556)
3. **If account doesn't exist:**
   - **Automatically creates new account** with `name: 'User'` (lines 574-592):
     ```typescript
     const { data: newAccount, error: createError } = await supabase
       .from('accounts')
       .insert({ 
         id: data.user.id,
         name: 'User'  // ← Default name is 'User'
       })
     ```
4. Returns `isExistingAccount: false` for new accounts (line 590)

#### For Phone (`verifyPhoneCode` - lines 614-699):
- Same flow as email - automatically creates account with `name: 'User'` if it doesn't exist (lines 662-679)

### 3. Post-Verification Redirect

**Location:** `src/components/auth/LoginModal.tsx` - `handleVerifyCode()` (lines 368-400)

After verification:
- **If existing account:** Redirects to `/my-life` (line 390)
- **If new account:** Redirects to `/onboarding` (line 399)

**Key Point:** New users are NOT shown a sign-up page at this point. The account is already created with name 'User', and they're redirected to onboarding.

### 4. AccountCheckModal (SignUpModal Flow)

**Location:** `src/components/auth/SignUpModal.tsx`

When using `SignUpModal` (different from `LoginModal`):
- After OTP verification, shows `AccountCheckModal` (line 384)
- `AccountCheckModal` checks if account exists
- **If account doesn't exist:** Shows the sign-up form (lines 1468-2032) where user can enter:
  - First Name, Last Name
  - Date of Birth
  - Email/Phone (pre-filled from verification)
  - Profile Picture
  - Bio

**However:** Even in this flow, if the user was verified via OTP, an auth user was already created, and potentially an account with name 'User' was auto-created during verification.

## Summary

### Current Behavior:
1. ✅ **Automatically creates auth user** when OTP is sent (due to `shouldCreateUser: true`)
2. ✅ **Automatically creates account with name 'User'** during OTP verification if account doesn't exist
3. ✅ **Redirects to `/onboarding`** for new users (LoginModal flow)
4. ❌ **Does NOT display sign-up page** at the point of entry - account is auto-created first

### Code Locations:
- **Auto-account creation:** `src/lib/authContext.tsx` lines 574-592 (email) and 662-679 (phone)
- **Default name:** `'User'` (hardcoded in both locations)
- **Redirect logic:** `src/components/auth/LoginModal.tsx` lines 392-400

### Potential Issues:
1. Users get an account with generic name 'User' before they can set their actual name
2. No explicit sign-up page shown - account is created automatically
3. User must go through onboarding to set their real name

## Recommendations

If you want to change this behavior:

1. **Option A: Show sign-up page BEFORE creating account**
   - Set `shouldCreateUser: false` when sending OTP
   - Only create account after user completes sign-up form
   - Requires handling "user not found" errors from Supabase

2. **Option B: Keep auto-creation but improve UX**
   - Still auto-create account with 'User' name
   - Make onboarding mandatory and prominent
   - Add validation to prevent users from proceeding without setting real name

3. **Option C: Hybrid approach**
   - Check if user exists before sending OTP
   - If new user: show sign-up form first, then send OTP
   - If existing user: send OTP immediately
