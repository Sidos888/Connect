# Signing-Out Page Freeze Analysis

## The Problem

The signing-out page is freezing and not completing the sign-out flow.

## Log Analysis

### What's Happening:

1. **Navigation succeeds:**
   ```
   🧭 NavigationService: Navigating to /signing-out
   ✅ NavigationService: Navigation via router (client-side)
   ```

2. **Page loads:**
   ```
   🔄 SigningOutPage Route: MODULE LOADED
   🔄 SigningOutPage Route: Page component rendering
   🔄 SigningOutPage Route: Component mounted
   ```

3. **Sign-out starts:**
   ```
   🔄 SigningOutPage Route: Starting sign-out process
   🔄 SigningOutPage Route: Step 1 - Calling signOut()
   👋 NewAuthContext: Starting sign out process...
   ```

4. **Sign-out completes:**
   ```
   🔐 Auth state change: SIGNED_OUT No session
   🔄 NewAuthContext: Event: SIGNED_OUT
   ```

5. **PROBLEM: Component re-renders and starts sign-out AGAIN:**
   ```
   🔄 SigningOutPage Route: Page component rendering  // Re-render!
   🔄 SigningOutPage Route: Starting sign-out process  // Starts again!
   🔄 SigningOutPage Route: Step 1 - Calling signOut()  // Calls again!
   👋 NewAuthContext: Starting sign out process...  // Duplicate!
   ```

## Root Cause

### The Issue: useEffect Dependency Loop

**Current Code:**
```typescript
useEffect(() => {
  if (!mounted) return;
  
  const performSignOut = async () => {
    await signOut();
    // ... rest of logic
  };
  
  performSignOut();
}, [mounted, signOut, queryClient]); // ❌ PROBLEM: signOut and queryClient in dependencies
```

**What Happens:**
1. Component mounts → `mounted` becomes `true`
2. useEffect runs → Starts sign-out
3. Sign-out completes → AuthContext updates
4. AuthContext update → Component re-renders
5. Re-render → `signOut` function reference might change (or React thinks it did)
6. useEffect sees dependency change → Runs again
7. Starts another sign-out → Loop continues

**Why It Freezes:**
- The sign-out process starts multiple times
- Each sign-out clears localStorage/sessionStorage
- The component keeps re-rendering
- The async flow gets interrupted
- Never reaches "Step 2", "Step 3", etc.

## The Fix

### Solution: Use a Ref to Track Execution

**Problem:** useEffect dependencies cause re-execution
**Solution:** Use a ref to ensure sign-out only runs once

**Fixed Code:**
```typescript
const hasStartedRef = useRef(false);

useEffect(() => {
  if (!mounted || hasStartedRef.current) return;
  
  hasStartedRef.current = true; // Mark as started
  
  const performSignOut = async () => {
    try {
      await signOut();
      queryClient.clear();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('redirecting');
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.replace('/explore');
    } catch (error) {
      // error handling
    }
  };
  
  performSignOut();
}, [mounted]); // ✅ Only depend on mounted, not signOut/queryClient
```

**Why This Works:**
1. `hasStartedRef` persists across re-renders
2. Once set to `true`, useEffect won't run again
3. Removed `signOut` and `queryClient` from dependencies (they're stable)
4. Only depends on `mounted` (which only changes once)

## Alternative: Use Empty Dependency Array

**Option 2:**
```typescript
useEffect(() => {
  if (!mounted) return;
  
  const performSignOut = async () => {
    // ... sign-out logic
  };
  
  performSignOut();
}, [mounted]); // Only mounted, not signOut/queryClient
```

**Why This Works:**
- `signOut` and `queryClient` are stable references from hooks
- They don't need to be in dependencies
- Only `mounted` changes, and only once

## Summary

**The Problem:**
- useEffect runs multiple times due to dependency changes
- Each run starts a new sign-out process
- Creates a loop that prevents completion

**The Fix:**
- Use a ref to track if sign-out has started
- Remove `signOut` and `queryClient` from dependencies
- Only depend on `mounted` state

**Result:**
- Sign-out runs exactly once
- Flow completes: Step 1 → Step 2 → Step 3 → Redirect
- No freezing, no loops

