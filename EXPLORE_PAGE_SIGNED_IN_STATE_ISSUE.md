# Explore Page Signed-In State Issue - Analysis

## The Problem

After signing out, the explore page displays the **signed-in state** instead of the **signed-out state**, even though the user is actually signed out (confirmed by closing/reopening app).

## Log Analysis

### Timeline of Events:

1. **Sign-out starts:**
   ```
   Menu page: confirmSignOut - Fire and forget pattern
   🔐 AuthService: Starting sign-out process...
   ```

2. **Navigation happens IMMEDIATELY:**
   ```
   ✅ NavigationService: Navigation via router (client-side)
   ```

3. **Explore page renders:**
   ```
   🔍 Explore Page: FUNCTION CALLED - Component is executing
   🔍 Explore Page: After useAuth {"hasUser":true,"hasAccount":true} ❌
   🔍 Explore Page: Rendering {"hasUser":true,"currentAccount":"Sid Farquharson"} ❌
   ```
   **PROBLEM: Still has user data!**

4. **THEN Supabase sign-out completes (AFTER render):**
   ```
   🔐 Auth state change: SIGNED_OUT No session
   🔄 NewAuthContext: Event: SIGNED_OUT
   🔄 NewAuthContext: Has session: false
   ```

## Root Cause: Race Condition

### The Issue:

1. **`authService.signOut()` is called (fire-and-forget)**
   - Clears Zustand store ✅
   - Clears React Query cache ✅
   - Calls `supabase.auth.signOut()` (fire-and-forget, not awaited) ⚠️
   - Clears browser storage ✅

2. **Navigation happens IMMEDIATELY**
   - `navigationService.navigateToExplore()` called right after
   - Router navigates to `/explore` (client-side, no reload)

3. **Explore page renders IMMEDIATELY**
   - Component executes ✅
   - Calls `useAuth()` hook
   - **AuthContext still has user data** ❌
   - Why? Because `supabase.auth.signOut()` hasn't completed yet
   - Supabase's `onAuthStateChange` hasn't fired yet
   - AuthContext hasn't updated to `SIGNED_OUT` state

4. **Explore page renders with signed-in state**
   - `hasUser: true` ❌
   - `hasAccount: true` ❌
   - `currentAccount: "Sid Farquharson"` ❌
   - Shows signed-in UI (avatar, profile button, etc.)

5. **THEN Supabase sign-out completes**
   - `supabase.auth.signOut()` promise resolves
   - Supabase's `onAuthStateChange` fires with `SIGNED_OUT`
   - AuthContext updates to `SIGNED_OUT` state
   - But explore page already rendered with signed-in state

### Why AuthContext Still Has User Data:

**AuthContext updates reactively:**
- It listens to Supabase's `onAuthStateChange` event
- When `supabase.auth.signOut()` is called, it's async
- The `onAuthStateChange` callback fires AFTER sign-out completes
- But navigation happens BEFORE sign-out completes
- So AuthContext hasn't updated yet when explore page renders

### The Flow:

```
1. authService.signOut() called
   ↓
2. supabase.auth.signOut() called (fire-and-forget, async)
   ↓
3. Navigation happens IMMEDIATELY (doesn't wait)
   ↓
4. Explore page renders
   ↓
5. useAuth() returns user data (AuthContext hasn't updated yet)
   ↓
6. Explore page renders with signed-in state ❌
   ↓
7. THEN supabase.auth.signOut() completes
   ↓
8. onAuthStateChange fires with SIGNED_OUT
   ↓
9. AuthContext updates to SIGNED_OUT
   ↓
10. But explore page already rendered with signed-in state
```

## Why It Works After App Restart

When you close and reopen the app:
1. App initializes fresh
2. Supabase session is already cleared (from previous sign-out)
3. `getInitialSession()` returns no session
4. AuthContext starts with `SIGNED_OUT` state
5. Explore page renders with signed-out state ✅

## The Exact Issue

**Race condition between:**
- Navigation (happens immediately)
- Supabase sign-out (happens asynchronously)
- AuthContext update (happens after sign-out completes)

**Result:**
- Explore page renders before AuthContext updates
- Shows signed-in state even though sign-out is in progress
- AuthContext updates later, but page already rendered

## Summary

**The problem:** Navigation happens before Supabase sign-out completes, so AuthContext still has user data when explore page renders.

**The fix:** Either:
1. Clear AuthContext state synchronously before navigation, OR
2. Wait for Supabase sign-out to complete before navigating

**Current behavior:** Fire-and-forget sign-out + immediate navigation = race condition

**Expected behavior:** Sign-out completes → AuthContext updates → Then navigate → Explore page renders with signed-out state

