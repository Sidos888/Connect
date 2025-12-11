# LoginModal State Persistence After Sign-Out - Fix

## Issue Description

After signing out, when clicking the account card to open the login/signup page, the LoginModal shows:
- **Step:** `verify` (should be `phone` or `email`)
- **Phone Number:** Previously entered phone number (should be empty)
- **Verification Method:** `phone` (should reset)

This happens because LoginModal preserves state when the modal closes, which is intentional for the verification flow (allows VerificationModal to remain visible if modal briefly closes/reopens). However, this causes issues after sign-out.

## Root Cause

### The Problem Flow:

1. **User goes through verification:**
   - Enters phone number: `466310826`
   - Step changes to: `verify`
   - VerificationModal shows

2. **User signs out:**
   - Auth state cleared ✅
   - LoginModal component state **NOT cleared** ❌
   - `step` still = `'verify'`
   - `phoneNumber` still = `'466310826'`

3. **User opens login modal again:**
   - `useEffect` sees `step === 'verify'` (line 115)
   - Logic says "preserve verify step" (line 130)
   - Shows VerificationModal with old phone number ❌

### Code Issue:

**File:** `src/components/auth/LoginModal.tsx` (lines 102-143)

```typescript
useEffect(() => {
  if (isOpen) {
    // Only reset step if we're not already in verify step
    if (step !== 'verify') {
      // Reset to default step
    } else {
      // If we're in verify step, preserve it ❌ PROBLEM
      console.log('🔐 LoginModal: Modal opened but step is verify, preserving verify step');
    }
  }
}, [isOpen, isMobile]);
```

**Problem:** When `step === 'verify'`, it preserves the state even if the user has signed out.

## Solution

### Fix #1: Check User State When Modal Opens

When modal opens, if user is signed out AND step is 'verify', force a complete reset:

```typescript
// CRITICAL FIX: If user is signed out and we're in verify step, reset everything
if (!user && step === 'verify') {
  console.log('🔐 LoginModal: User signed out but step is verify - forcing complete reset');
  setStep(isMobile ? 'phone' : 'email');
  setPhoneNumber('');
  setEmail('');
  // ... reset all state
}
```

### Fix #2: Reset State When User Signs Out

Add a separate `useEffect` that watches for user sign-out and resets state:

```typescript
// Reset state when user signs out (even if modal is closed)
useEffect(() => {
  if (!user && (step === 'verify' || step === 'account-check' || phoneNumber || email)) {
    // Reset all state
  }
}, [user, isMobile]);
```

## Implementation

### Changes Made:

1. **Updated modal open logic** (lines 105-143):
   - Added check: If `!user && step === 'verify'`, force complete reset
   - This ensures fresh state when modal opens after sign-out

2. **Added sign-out detection** (new useEffect):
   - Watches `user` state
   - When user becomes `null`, resets all LoginModal state
   - Prevents stale state from persisting

## Expected Behavior After Fix

### Before Fix:
- Sign out → Open login modal → Shows VerificationModal with old phone number ❌

### After Fix:
- Sign out → LoginModal state automatically resets
- Open login modal → Shows fresh phone/email input (no pre-filled data) ✅

## Testing

Test scenarios:
1. ✅ Sign out → Open login modal → Should show fresh phone/email input
2. ✅ Go through verification → Sign out → Open login modal → Should show fresh input
3. ✅ Go through verification → Close modal → Reopen (while signed in) → Should preserve verify step (existing behavior)
4. ✅ Sign out → Open login modal → Enter new phone/email → Should work normally

## Files Modified

- `src/components/auth/LoginModal.tsx`
  - Updated `useEffect` for modal open (lines 105-143)
  - Added new `useEffect` for sign-out detection

## Notes

- The fix maintains backward compatibility:
  - If user is signed in and step is 'verify', state is preserved (existing behavior)
  - Only resets when user is signed out
- The fix is defensive:
  - Checks both when modal opens AND when user signs out
  - Ensures state is always fresh after sign-out
