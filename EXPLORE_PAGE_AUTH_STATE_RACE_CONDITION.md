# Explore Page Auth State Race Condition - Issue Report

## System Status Update

**✅ What's Working:**
1. Sign-out orchestration completes successfully
2. Router navigation is now working (client-side, no full reload)
3. Explore page component **DOES execute** after redirect (`FUNCTION CALLED` log appears)
4. Explore page renders content (not just bottom nav)

## Current Issue

**Problem:** Explore page displays in **signed-in state** immediately after sign-out redirect, even though user is signed out. After manual page reload, it correctly shows signed-out state.

### Logs Analysis

**Sign-Out Flow (Working):**
```
✅ AuthService: Sign-out process completed (always resolves)
🔄 AuthService: Step 3 - Waiting for state propagation (1 second)
🔐 Auth state change: SIGNED_OUT No session ✅
🔄 AuthService: Step 4 - Updating status to redirecting
🔄 AuthService: Step 6 - Redirecting to /explore (router-based)
✅ NavigationService: Navigation via router (client-side) ✅
```

**Explore Page Rendering (Issue):**
```
🔍 Explore Page: FUNCTION CALLED - Component is executing ✅
🔍 Explore Page: After useAuth {"hasUser":true,"hasAccount":true} ❌ (Should be false)
🔍 Explore Page: Rendering {"hasUser":true,"hasAccount":true,"currentAccount":"Sid Farquharson"} ❌
```

**Root Cause:**
Race condition between:
1. Router navigation (happens immediately after cleanup)
2. AuthContext state update (SIGNED_OUT event fires, but context state hasn't propagated yet)

The explore page renders with **stale auth state** from AuthContext before it updates to reflect the sign-out.

### Technical Details

**Timeline:**
1. `signOut()` completes - Supabase session cleared, storage cleared
2. `Step 3` waits 1 second for state propagation
3. `SIGNED_OUT` event fires from Supabase
4. `Step 6` navigates to `/explore` via router (immediate, client-side)
5. Explore page component executes
6. `useAuth()` hook reads AuthContext - **still shows user** (context hasn't updated yet)
7. Explore page renders with signed-in state
8. AuthContext eventually updates to `SIGNED_OUT`, but explore page may not re-render or re-renders incorrectly

**The Problem:**
- Router navigation is **too fast** - happens before AuthContext state propagates
- The 1-second wait in Step 3 is for "state propagation", but AuthContext update happens asynchronously after the SIGNED_OUT event
- Explore page reads stale auth state on first render

### Why Manual Reload Works

After manual reload:
- Full page reload
- AuthContext re-initializes
- Checks Supabase session (no session exists)
- Correctly shows signed-out state

## Solution Options

### Option 1: Wait for AuthContext to Update
Add additional delay or wait for AuthContext to actually update before navigating. Check if `useAuth().user` is null before proceeding.

### Option 2: Force AuthContext Re-check on Explore Page
On explore page mount, if coming from sign-out, force a re-check of auth state before rendering.

### Option 3: Clear AuthContext State Explicitly
In `signOut()`, explicitly clear AuthContext state (set user to null) before navigating, not just rely on Supabase event.

### Option 4: Use Session Storage Flag
Set a flag in sessionStorage during sign-out, explore page checks this flag and forces signed-out state until AuthContext updates.

## Recommended Approach

**Option 3 + Option 4 Combined:**
1. In `signOut()`, explicitly clear AuthContext state immediately (not wait for Supabase event)
2. Set `sessionStorage.setItem('fromSigningOut', 'true')` (already done)
3. On explore page, if `fromSigningOut` flag exists, force signed-out state until AuthContext confirms
4. This ensures immediate correct state, with AuthContext update as confirmation

## Summary for Engineer

Sign-out orchestration and router navigation are working. The explore page component executes and renders. However, there's a race condition: router navigation happens immediately after cleanup, but AuthContext state hasn't propagated yet (SIGNED_OUT event fires asynchronously). The explore page renders with stale auth state (signed-in) on first render, then AuthContext updates later. We need to either: (1) wait for AuthContext to update before navigating, (2) explicitly clear AuthContext state in signOut() before navigating, or (3) have explore page check a sign-out flag and force signed-out state until AuthContext confirms. The goal is to ensure explore page shows signed-out state immediately after redirect, not after a manual reload.

