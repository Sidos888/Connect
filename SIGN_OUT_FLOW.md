# 🔄 Sign-Out Flow - Systematic Approach

## ✅ **The Solution: Dedicated Signing-Out Page**

Instead of fighting race conditions, we use a dedicated `/signing-out` page that:
1. Shows immediately when sign-out is clicked
2. Handles all cleanup in the background
3. Displays for 3 seconds total
4. Then redirects to `/explore`

## 📋 **Complete Sign-Out Requirements**

### **Step 1: Navigate to `/signing-out` (Instant)**
- User clicks "Log Out" → Confirms → **Immediately navigate to `/signing-out`**
- No delays, no async operations in menu page
- Clean separation of concerns

### **Step 2: `/signing-out` Page Displays (3 seconds)**
- Shows loading screen: "Signing out..." → "Redirecting..."
- **In background, performs:**

#### **2a. Clear Supabase Session**
- Call `signOut()` from authContext
- This clears:
  - Supabase auth session
  - Access tokens
  - Refresh tokens

#### **2b. Clear React State**
- Set `user` to `null`
- Set `account` to `null`
- Set `loading` to `false`

#### **2c. Clear Real-time Subscriptions**
- Unsubscribe from all Supabase realtime channels
- Clean up realtime listeners

#### **2d. Clear Zustand Store**
- Call `clearAll()` to clear all store state
- Set `personalProfile` to `null`
- Remove persisted storage key (`app-store`)

#### **2e. Clear Browser Storage**
- `localStorage.clear()` - removes all local storage
- `sessionStorage.clear()` - removes all session storage
- Remove specific keys: `app-store`, `supabase.auth.token`

#### **2f. Wait for System Cleanup**
- Wait 1 second after `signOut()` completes
- Ensures all async operations finish
- Allows React state to fully clear

#### **2g. Final Delay**
- Wait 1 more second before redirect
- Total: ~3 seconds (signOut + 1s + 1s)

### **Step 3: Navigate to `/explore`**
- After 3 seconds, `window.location.replace('/explore')`
- Full page reload ensures clean state
- Explore page should render with signed-out view

## 🎯 **Why This Works**

1. **No Race Conditions**: Signing-out page is isolated, no ProtectedRoute/Guard interference
2. **Clean Separation**: Menu page just navigates, signing-out page handles cleanup
3. **Predictable Timing**: 3 seconds is enough for all cleanup + good UX
4. **Full Page Reload**: Ensures explore page loads fresh with clean state

## 📝 **Files Modified**

1. **`src/app/(personal)/menu/page.tsx`**
   - `confirmSignOut()` now just navigates to `/signing-out`
   - Removed all async delays and cleanup logic

2. **`src/components/auth/SigningOutPage.tsx`**
   - Handles all sign-out logic
   - Shows loading screen for 3 seconds
   - Then redirects to `/explore`

3. **`src/app/(personal)/guard.tsx`**
   - Already allows `/signing-out` route (no redirect)

4. **`src/components/auth/ProtectedRoute.tsx`**
   - Already allows `/signing-out` route (no redirect)

## ✅ **Expected Flow**

```
User clicks "Log Out" 
  → Confirms 
  → Navigate to /signing-out (instant)
  → Signing-out page shows "Signing out..." (1s)
  → Status changes to "Redirecting..." (1s)
  → Navigate to /explore (after 3s total)
  → Explore page renders with signed-out view
```

## 🔍 **What to Check After Sign-Out**

1. ✅ Supabase session is cleared (no tokens)
2. ✅ React state is cleared (user = null, account = null)
3. ✅ Zustand store is cleared (personalProfile = null)
4. ✅ localStorage is cleared
5. ✅ sessionStorage is cleared
6. ✅ Explore page renders correctly
7. ✅ User sees non-signed-in UI (login button, etc.)

