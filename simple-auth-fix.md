# Simple Authentication Fix

## The Problem
We've created overly complex account merging logic that's causing:
- Duplicate profiles in Supabase
- 409 conflict errors  
- Complex spaghetti code
- Unreliable authentication

## The Simple Solution

**Instead of trying to merge accounts, implement primary authentication method detection:**

1. **Phone authentication attempt** → Check if phone exists in database
   - If exists → "This phone is linked to an account. Please use email authentication."
   - If new → Proceed with phone auth

2. **Email authentication attempt** → Check if email exists in database  
   - If exists → "This email is linked to an account. Please use phone authentication."
   - If new → Proceed with email auth

3. **One method per account** → No more merging, no more duplicates

## Benefits
- ✅ **No duplicate accounts** → One auth method per person
- ✅ **No complex merging** → Simple, clean authentication
- ✅ **No 409 conflicts** → No duplicate key errors
- ✅ **User guidance** → Clear instructions on which method to use
- ✅ **Clean codebase** → Remove complex account merging logic

## Implementation
1. Modify `sendPhoneVerification` to check for existing accounts and redirect to email
2. Modify `sendEmailVerification` to check for existing accounts and redirect to phone  
3. Remove all complex account merging logic
4. Simplify profile loading to single source of truth
