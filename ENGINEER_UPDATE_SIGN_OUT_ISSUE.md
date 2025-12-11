# Sign-Out System Update - Current Issue Report

## System Architecture (Engineer's Solution - Implemented)

We've implemented the structural change you recommended:

### ✅ What Was Implemented

1. **AuthService with Full Orchestration** (`src/lib/services/authService.ts`)
   - Added `runSignOutFlow()` method that handles complete sign-out orchestration
   - Status tracking system (`idle` | `signing-out` | `redirecting`)
   - Event listener system (`onStatusChange()`) for UI updates
   - Orchestration lives **outside component lifecycle** (singleton service)

2. **Simplified Signing-Out Page** (`src/app/signing-out/page.tsx`)
   - Removed all orchestration logic from component
   - Now just triggers `authService.runSignOutFlow()` once (fire-and-forget)
   - Subscribes to status updates via `authService.onStatusChange()`
   - Pure "dumb UI" that displays status from service

3. **Flow Structure**
   ```
   Component → Triggers service → Service orchestrates → Component subscribes to status
   ```

### ✅ What's Working

From the logs, we can see:
- ✅ Navigation to `/signing-out` page works
- ✅ Signing-out page component renders
- ✅ `authService.runSignOutFlow()` is triggered
- ✅ Status updates to `signing-out`
- ✅ Zustand store cleared successfully
- ✅ React Query cache cleared successfully
- ✅ Supabase sign-out initiated (`🔐 AuthService: Signing out from Supabase...`)
- ✅ Supabase sign-out completes (`🔐 Auth state change: SIGNED_OUT No session`)

## ❌ Current Issue

### Problem: `signOut()` Method Not Completing

**What the logs show:**
1. `🔐 AuthService: Signing out from Supabase...` ✅
2. `🔐 Auth state change: SIGNED_OUT No session` ✅ (Supabase completed)
3. **MISSING:** `✅ AuthService: Supabase session cleared` ❌
4. **MISSING:** `✅ AuthService: Sign-out completed successfully` ❌
5. **MISSING:** `🔄 AuthService: Step 3 - Waiting for state propagation` ❌

**Result:**
- The `await this.signOut()` call in `runSignOutFlow()` never resolves
- Steps 3-6 of orchestration never execute
- Status never changes to `redirecting`
- Page freezes on "Signing out..." message
- No redirect to `/explore`

### Code Flow (Where It Stops)

```typescript
// In runSignOutFlow():
await this.signOut(); // ← This never completes/resolves

// These never execute:
await new Promise(resolve => setTimeout(resolve, 1000)); // Step 3
this.updateStatus('redirecting'); // Step 4
// ... rest of flow
```

### `signOut()` Method Structure

```typescript
async signOut(): Promise<void> {
  // 1. Clear Zustand store ✅ (completes)
  // 2. Clear React Query cache ✅ (completes)
  // 3. Clear Supabase session ✅ (completes - we see SIGNED_OUT event)
  // 4. Clear browser storage ← Might be hanging here?
  // 5. Emit sign-out event ← Never reached
  // 6. Log completion ← Never reached
}
```

### Hypothesis

The `signOut()` method appears to hang after Supabase sign-out completes. Possible causes:

1. **Storage clearing issue on iOS:**
   - `localStorage.clear()` or `sessionStorage.clear()` might be throwing/hanging on iOS
   - iOS WebView might have restrictions on storage clearing

2. **Async timing issue:**
   - Supabase `signOut()` completes (we see SIGNED_OUT event)
   - But the `await` in `signOut()` method might not be resolving
   - Could be a promise resolution issue

3. **Error being silently swallowed:**
   - An error might be occurring but not being logged
   - The try-catch might be catching but not properly handling

### Logs Evidence

**What we see:**
```
⚡️  [log] - 🔐 AuthService: Signing out from Supabase...
⚡️  [log] - 🔐 Auth state change: SIGNED_OUT No session
⚡️  [log] - 🔐 Auth event: SIGNED_OUT
```

**What we DON'T see (but should):**
```
✅ AuthService: Supabase session cleared
🧹 AuthService: Clearing browser storage...
✅ AuthService: Browser storage cleared
📡 AuthService: Sign-out event emitted
✅ AuthService: Sign-out completed successfully
🔄 AuthService: Step 3 - Waiting for state propagation
```

## Questions for Engineer

1. **Why would `await supabase.auth.signOut()` complete (we see SIGNED_OUT event) but the `await` in our code not resolve?**

2. **Could `localStorage.clear()` or `sessionStorage.clear()` be blocking/hanging on iOS WebView?** Should we wrap these in try-catch or use a different approach?

3. **Is there a better way to ensure `signOut()` always resolves, even if storage clearing fails?**

4. **Should we restructure `signOut()` to be more defensive, or should `runSignOutFlow()` handle errors differently?**

5. **Could the AuthContext update (SIGNED_OUT event) be interfering with the async flow somehow?**

## Current System State

- ✅ Architecture is correct (orchestration outside component lifecycle)
- ✅ Service layer pattern implemented
- ✅ Status tracking and UI subscription working
- ❌ `signOut()` method not completing, blocking entire flow

## Next Steps Needed

Need guidance on:
1. Why `signOut()` promise isn't resolving after Supabase sign-out completes
2. Best practice for ensuring storage clearing doesn't block the flow
3. Whether we need to restructure error handling in `signOut()` method

