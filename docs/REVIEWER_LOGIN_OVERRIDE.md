# Apple Reviewer Login Override

## Overview

This is a **temporary** login override system that allows Apple reviewers to log in using email/password instead of OTP magic links. This code **MUST be removed** after App Store approval.

## How It Works

### Detection
The system detects review builds using:
1. **Environment Variable**: `NEXT_PUBLIC_REVIEW_BUILD=true` (set in build config for review builds)
2. **User Agent**: Checks for "TestFlight" in the user agent string
3. **Email Match**: Only activates when email is exactly `reviewer@connectos.app`

### Credentials
- **Email**: `reviewer@connectos.app`
- **Password**: `SomethingStrong123!`

### Behavior
- **Review Builds**: When the reviewer email is entered, a password field appears
- **Normal Users**: All other users continue using OTP magic links (unchanged)
- **Production**: This code does NOT affect production builds

## Files Modified

### 1. `src/lib/reviewerAuth.ts` (NEW FILE)
Utility functions for detecting review builds and reviewer email.

**To Remove**: Delete this entire file.

### 2. `src/lib/authContext.tsx`
- Added `signInWithPassword` method to interface (line 34)
- Added `signInWithPassword` implementation (around line 1151)
- Added to context value (line 1238)

**To Remove**: 
- Remove lines 33-35 (interface)
- Remove lines with `// START REVIEWER OVERRIDE` through `// END REVIEWER OVERRIDE` (implementation)
- Remove from context value object

### 3. `src/components/auth/LoginModal.tsx`
- Added imports for reviewer auth utilities (line 10)
- Added password state and refs (around line 30)
- Added review mode detection useEffect (around line 70)
- Modified `handleEmailSubmit` to check for reviewer email (around line 236)
- Added password input field (around line 680)

**To Remove**:
- Remove import statement
- Remove password-related state variables
- Remove review mode detection useEffect
- Remove reviewer login logic from `handleEmailSubmit`
- Remove password input field from JSX

## Setup for Review Builds

### Option 1: Environment Variable (Recommended)
Add to your build configuration for TestFlight/Review builds:
```bash
NEXT_PUBLIC_REVIEW_BUILD=true
```

### Option 2: User Agent Detection (Automatic)
The system automatically detects TestFlight builds via user agent.

## Testing

### Test Reviewer Login
1. Build app for TestFlight/Review
2. Open login modal
3. Enter: `reviewer@connectos.app`
4. Password field should appear
5. Enter password: `SomethingStrong123!`
6. Click "Continue"
7. Should log in and redirect to `/my-life`

### Test Normal Users
1. Enter any other email
2. Password field should NOT appear
3. OTP flow should work normally

## Supabase Setup

**IMPORTANT**: You must create the reviewer account in Supabase:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Email: `reviewer@connectos.app`
4. Password: `SomethingStrong123!`
5. Auto Confirm User: ✅ (checked)
6. Save

## Removal After Approval

### Quick Removal Checklist

1. ✅ Delete `src/lib/reviewerAuth.ts`
2. ✅ Remove reviewer code from `src/lib/authContext.tsx` (marked with comments)
3. ✅ Remove reviewer code from `src/components/auth/LoginModal.tsx` (marked with comments)
4. ✅ Delete reviewer account from Supabase (optional, but recommended)
5. ✅ Remove `NEXT_PUBLIC_REVIEW_BUILD` from build config
6. ✅ Test normal OTP login still works
7. ✅ Commit removal

### Search for All Reviewer Code
```bash
grep -r "START REVIEWER OVERRIDE" src/
grep -r "reviewer@connectos.app" src/
grep -r "isReviewBuild" src/
grep -r "isReviewerEmail" src/
```

## Security Notes

- ✅ Only works in review builds (environment variable or TestFlight detection)
- ✅ Only activates for exact email match: `reviewer@connectos.app`
- ✅ Does NOT affect production builds
- ✅ Does NOT affect normal users
- ⚠️ **MUST be removed after approval** - this is temporary code

## Troubleshooting

### Password field doesn't appear
- Check that `NEXT_PUBLIC_REVIEW_BUILD=true` is set OR
- Verify you're running in TestFlight (check user agent)
- Verify email is exactly `reviewer@connectos.app` (case-insensitive)

### Login fails
- Verify reviewer account exists in Supabase
- Check password is exactly `SomethingStrong123!`
- Check Supabase logs for authentication errors

### Normal users affected
- This should NOT happen - verify review build detection is working
- Check that `isReviewBuild()` returns `false` in production

