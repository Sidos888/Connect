# Auth State Race Condition - Summary for Engineer

## System Status

**✅ Working:**
- Sign-out orchestration completes successfully (all steps 1-6)
- Router navigation works (client-side, no full reload)
- Explore page component executes after redirect (`FUNCTION CALLED` log appears)
- Explore page renders content (not just bottom nav)

## Current Issue

**Problem:** Explore page displays in **signed-in state** immediately after sign-out redirect, even though user is actually signed out. After manual page reload, it correctly shows signed-out state.

**Logs Evidence:**
- Sign-out completes: `✅ AuthService: Sign-out process completed`
- Auth state changes: `🔐 Auth state change: SIGNED_OUT No session` ✅
- Router navigation: `✅ NavigationService: Navigation via router (client-side)` ✅
- Explore page executes: `🔍 Explore Page: FUNCTION CALLED - Component is executing` ✅
- **But:** `🔍 Explore Page: After useAuth {"hasUser":true,"hasAccount":true}` ❌ (Should be false)
- **And:** `🔍 Explore Page: Rendering {"hasUser":true,"hasAccount":true,"currentAccount":"Sid Farquharson"}` ❌

## Root Cause

**Race Condition:** Router navigation happens immediately after cleanup, but AuthContext state hasn't propagated yet. The SIGNED_OUT event fires asynchronously from Supabase, but AuthContext's internal state update (setting `user` to `null`) hasn't completed when the explore page renders.

**Timeline:**
1. `signOut()` completes - Supabase session cleared, storage cleared
2. Step 3 waits 1 second for "state propagation"
3. SIGNED_OUT event fires from Supabase
4. Step 6 navigates to `/explore` via router (immediate, client-side)
5. Explore page component executes
6. `useAuth()` hook reads AuthContext - **still shows user** (context state hasn't updated yet)
7. Explore page renders with signed-in state
8. AuthContext eventually updates to SIGNED_OUT, but explore page doesn't re-render or re-renders incorrectly

## Why Manual Reload Works

After manual reload:
- Full page reload occurs
- AuthContext re-initializes from scratch
- Checks Supabase session (no session exists)
- Correctly shows signed-out state immediately

## Solution Options

### Option 1: Wait for AuthContext State Update
Add additional delay or actively wait for AuthContext to update (check if `useAuth().user` is null) before navigating. This ensures AuthContext state has propagated.

### Option 2: Explicitly Clear AuthContext in signOut()
In `signOut()`, directly call AuthContext methods to set user to null immediately, not just rely on Supabase SIGNED_OUT event to trigger the update. This ensures synchronous state clearing.

### Option 3: Explore Page Checks Sign-Out Flag
On explore page mount, if `sessionStorage.getItem('fromSigningOut')` exists, force signed-out state (ignore AuthContext) until AuthContext confirms. This provides immediate correct state.

### Option 4: Combine Options 2 + 3
Explicitly clear AuthContext state in `signOut()` AND have explore page check the `fromSigningOut` flag as a fallback. This provides both immediate clearing and defensive rendering.

## Recommended Approach

**Option 4 (Combined):** 
1. In `signOut()`, explicitly clear AuthContext state immediately (call `setUser(null)`, `setAccount(null)`) - don't wait for Supabase event
2. Keep `sessionStorage.setItem('fromSigningOut', 'true')` (already done)
3. On explore page, if `fromSigningOut` flag exists, force signed-out state until AuthContext confirms
4. This ensures immediate correct state with AuthContext update as confirmation

## Constraint

We want to keep the AuthService orchestration pattern as-is (service-level flow outside React lifecycle). The fix should be:
- Either in `signOut()` to explicitly clear AuthContext state
- Or in explore page to handle the race condition defensively
- Or both for maximum reliability

## Goal

Ensure explore page shows signed-out state immediately after redirect, not after a manual reload. The page should render correctly on first render, not require a second render or reload.

