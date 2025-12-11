# Auth State Race Condition Fix - Implementation Complete

## Problem

After router navigation to `/explore` following sign-out, the explore page rendered with stale AuthContext state (user and account still non-null) even though Supabase had already emitted SIGNED_OUT. This caused the explore page to briefly show signed-in UI until a manual reload.

## Solution Implemented

### 1. Expose AuthContext Setters Globally

**In `src/lib/authContext.tsx`:**
- Added `useEffect` to expose `setUser`, `setAccount`, and `setLoading` on `window.__authContextSetters`
- This allows AuthService to access these setters synchronously
- Cleanup function removes the setters when component unmounts

```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    (window as any).__authContextSetters = {
      setUser,
      setAccount,
      setLoading
    };
    console.log('🔧 AuthContext: Exposed setters globally for AuthService');
    
    return () => {
      delete (window as any).__authContextSetters;
    };
  }
}, [setUser, setAccount, setLoading]);
```

### 2. Clear AuthContext State Synchronously in signOut()

**In `src/lib/services/authService.ts`:**
- Added Step 0 (before Zustand clearing) to synchronously clear AuthContext state
- Calls `setUser(null)`, `setAccount(null)`, and `setLoading(false)` immediately
- This ensures AuthContext state is cleared before router navigation

```typescript
// 0. Clear AuthContext state FIRST (synchronously, before anything else)
// This eliminates race conditions where router navigation happens before AuthContext updates
if (typeof window !== 'undefined') {
  try {
    const setters = (window as any).__authContextSetters;
    if (setters && typeof setters.setUser === 'function' && typeof setters.setAccount === 'function') {
      console.log('🧹 AuthService: Clearing AuthContext state synchronously...');
      setters.setUser(null);
      setters.setAccount(null);
      if (typeof setters.setLoading === 'function') {
        setters.setLoading(false);
      }
      console.log('✅ AuthService: AuthContext state cleared synchronously');
    }
  } catch (contextError) {
    console.error('⚠️ AuthService: Error clearing AuthContext state:', contextError);
  }
}
```

### 3. Safety Net in Explore Page

**In `src/app/explore/page.tsx`:**
- Added check for `fromSigningOut` sessionStorage flag
- Created `effectiveUser` and `effectiveAccount` that force null if flag exists
- Updated all rendering logic to use effective values instead of raw user/account
- This provides a safety net in case AuthContext clearing doesn't work

```typescript
// Safety net: If coming from sign-out, force signed-out state until AuthContext confirms
const isFromSigningOut = typeof window !== 'undefined' && sessionStorage.getItem('fromSigningOut') === 'true';
const effectiveUser = isFromSigningOut ? null : user;
const effectiveAccount = isFromSigningOut ? null : account;
```

**Updated rendering logic:**
- `currentAccount` calculation uses `effectiveAccount`
- Button click handlers use `effectiveUser`
- Profile modal checks use `effectiveUser`
- All user/account checks use effective values

## Architecture Preserved

- ✅ AuthService orchestration pattern unchanged (service-level flow outside React lifecycle)
- ✅ Only added synchronous state clearing before navigation
- ✅ Safety net in explore page as defensive measure
- ✅ No changes to orchestration flow structure

## Expected Behavior

1. Sign-out orchestration starts
2. **AuthContext state cleared synchronously** (Step 0) ✅
3. Zustand store cleared
4. React Query cache cleared
5. Supabase sign-out (fire-and-forget)
6. Storage cleared
7. Wait for state propagation
8. Navigate to `/explore` via router
9. Explore page renders with **signed-out state immediately** ✅
10. Safety net ensures correct state even if AuthContext clearing fails

## Testing

Ready for iOS testing. The explore page should now:
- Show signed-out state immediately after redirect
- Not require manual reload to show correct state
- Handle race conditions gracefully with safety net

