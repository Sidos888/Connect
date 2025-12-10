# Option 3: Dedicated Signing-Out Page - Implementation Plan

## Current State Analysis

### ✅ What's Working:
- New logs appear: `Menu page: confirmSignOut called - Starting bulletproof sign-out`
- Step 1 executes: `Menu page: Step 1 - Calling signOut()`
- Sign-out cleanup works correctly

### ❌ What's Still Breaking:
- Step 2 & Step 3 logs missing (code stops after Step 1)
- Router navigation fails silently
- Falls back to `window.location.replace('/explore')`
- Full page reload → Component function doesn't execute
- Explore page remains blank

## Solution: Dedicated Signing-Out Page

### Why This Will Work:
1. **Simple, isolated page** → Always executes (no complex state)
2. **No router navigation** → Uses `window.location.replace()` directly
3. **Clean separation** → Menu page just navigates, signing-out page handles everything
4. **Works around Next.js limitation** → Simple page avoids hydration issues

## Implementation Steps

### Step 1: Update Menu Page `confirmSignOut`

**Location:** `src/app/(personal)/menu/page.tsx`

**Change:**
- Remove all async sign-out logic
- Remove router navigation attempts
- Remove React Query cache clearing
- **Simply navigate to `/signing-out` immediately**

**New Code:**
```typescript
const confirmSignOut = async () => {
  console.log('Menu page: confirmSignOut called - Navigating to signing-out page');
  setShowSignOutConfirm(false);
  
  // Show signing-out overlay immediately
  setIsSigningOut(true);
  isSigningOutGlobal = true;
  
  // Navigate immediately - no async operations
  // Signing-out page will handle all cleanup
  if (typeof window !== 'undefined') {
    window.location.replace('/signing-out');
  }
};
```

**Why:**
- Clean separation of concerns
- No race conditions
- Signing-out page handles all cleanup
- Immediate navigation (better UX)

### Step 2: Update Signing-Out Page

**Location:** `src/app/signing-out/page.tsx` and `src/components/auth/SigningOutPage.tsx`

**Changes:**
1. **Call `signOut()`** from authContext
2. **Clear React Query cache**
3. **Wait for cleanup** (2-3 seconds total)
4. **Redirect to `/explore`** with `window.location.replace()`

**New SigningOutPage Component:**
```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

export default function SigningOutPage() {
  console.log('🔄 SigningOutPage: Component rendering');
  
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'signing-out' | 'redirecting'>('signing-out');
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    console.log('🔄 SigningOutPage: Starting sign-out process');
    
    const performSignOut = async () => {
      try {
        // Step 1: Sign out (clears auth, localStorage, etc.)
        console.log('🔄 SigningOutPage: Step 1 - Calling signOut()');
        await signOut();
        
        // Step 2: Clear React Query cache
        console.log('🔄 SigningOutPage: Step 2 - Clearing React Query cache');
        queryClient.clear();
        
        // Step 3: Wait for state propagation
        console.log('🔄 SigningOutPage: Step 3 - Waiting for cleanup');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 4: Show redirecting status
        setStatus('redirecting');
        console.log('🔄 SigningOutPage: Step 4 - Status changed to redirecting');
        
        // Step 5: Final delay before redirect
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 6: Redirect to explore
        console.log('🔄 SigningOutPage: Step 5 - Redirecting to /explore');
        if (typeof window !== 'undefined') {
          window.location.replace('/explore');
        }
      } catch (error) {
        console.error('🔄 SigningOutPage: Error during sign-out:', error);
        // Even on error, redirect after delay
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.replace('/explore');
          }
        }, 2000);
      }
    };

    performSignOut();
  }, [signOut, queryClient]);
  
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[99999]" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#ffffff'
    }}>
      {/* Connect Logo - Centered with subtle pulse animation */}
      <div className="flex items-center justify-center animate-pulse">
        <Image
          src="/connect-logo.png"
          alt="Connect Logo"
          width={240}
          height={240}
          className="object-contain"
          priority
          style={{
            maxWidth: '240px',
            maxHeight: '240px',
            width: 'auto',
            height: 'auto'
          }}
        />
      </div>
      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {status === 'signing-out' ? 'Signing out...' : 'Redirecting...'}
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          {status === 'signing-out' 
            ? 'Please wait while we sign you out' 
            : 'Taking you to explore'}
        </p>
      </div>
    </div>
  );
}
```

**Update Route Page:**
```typescript
"use client";

import SigningOutPage from "@/components/auth/SigningOutPage";

export default function Page() {
  console.log('🔄 SigningOutPage Route: Page component rendering');
  
  return <SigningOutPage />;
}
```

### Step 3: Ensure Signing-Out Page is Public

**Location:** Check if `/signing-out` route is accessible without auth

**Verify:**
- Route should be in public routes list (if using route protection)
- No `ProtectedRoute` wrapper
- No `Guard` component blocking it

### Step 4: Update Explore Page (Optional Enhancement)

**Location:** `src/app/explore/page.tsx`

**Optional:** Add detection for signing-out navigation to force remount:
```typescript
React.useEffect(() => {
  // Check if coming from signing-out page
  const referrer = document.referrer;
  if (referrer.includes('/signing-out') || sessionStorage.getItem('fromSigningOut')) {
    console.log('🔍 Explore Page: Detected navigation from signing-out page');
    sessionStorage.removeItem('fromSigningOut');
    // Force remount if needed
    window.location.reload();
  }
}, []);
```

## Expected Flow

1. **User clicks "Log Out"** → Confirms → `confirmSignOut()` called
2. **Menu page** → Immediately navigates to `/signing-out` (no async operations)
3. **Signing-out page loads** → Component renders immediately
4. **Signing-out page** → Shows "Signing out..." with logo
5. **Background cleanup:**
   - Calls `signOut()` → Clears auth, storage, etc.
   - Clears React Query cache
   - Waits 1 second for cleanup
6. **Status changes** → "Redirecting..."
7. **Waits 1 more second** → Total ~2-3 seconds
8. **Redirects** → `window.location.replace('/explore')`
9. **Explore page loads** → Should render with signed-out state

## Why This Will Work

1. **Simple page** → No complex state, always executes
2. **No router navigation** → Direct `window.location.replace()` works
3. **Clean separation** → Menu just navigates, signing-out handles cleanup
4. **Proper timing** → 2-3 seconds ensures all cleanup completes
5. **Visual feedback** → User sees "Signing out..." → "Redirecting..."

## Testing Checklist

After implementation:
- [ ] Sign-out button navigates to `/signing-out` immediately
- [ ] Signing-out page renders (logo + "Signing out..." text)
- [ ] Status changes to "Redirecting..." after ~1 second
- [ ] Redirects to `/explore` after ~2-3 seconds total
- [ ] Explore page renders fully (not just bottom nav)
- [ ] Signed-out state displays correctly (login button visible)
- [ ] No console errors
- [ ] Works on both web and mobile (Capacitor)

## Files to Modify

1. `src/app/(personal)/menu/page.tsx` - Simplify `confirmSignOut()`
2. `src/components/auth/SigningOutPage.tsx` - Add sign-out logic
3. `src/app/signing-out/page.tsx` - Simplify route page
4. (Optional) `src/app/explore/page.tsx` - Add signing-out detection

## Estimated Time

- Implementation: 15-20 minutes
- Testing: 10-15 minutes
- **Total: ~30 minutes**

## Next Steps

1. Implement Step 1 (update menu page)
2. Implement Step 2 (update signing-out page)
3. Test the flow
4. If explore page still doesn't render, add Step 4 (explore page detection)

