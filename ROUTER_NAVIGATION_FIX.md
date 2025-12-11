# Router Navigation Fix - Final Redirect After Sign-Out

## Problem

After sign-out orchestration completes, the redirect to `/explore` was using `window.location.replace('/explore')` for reliability. This caused a full page reload, which in Next.js App Router static export + Capacitor environment prevented the explore page component function from executing, even though the module loaded.

## Solution

Changed the final redirect in `runSignOutFlow()` Step 6 to use **router-based navigation** instead of `window.location.replace()`.

### Change Made

**Before:**
```typescript
navigationService.navigateToExplore(false); // false = use window.location
```

**After:**
```typescript
navigationService.navigateToExplore(true); // true = prefer router, fallback to window.location if needed
```

### Why This Works

1. **Router is available**: The router is set earlier in the app lifecycle (in `menu/page.tsx` before sign-out) via `navigationService.setRouter(router)`

2. **Client-side navigation**: Router navigation avoids full page reloads, allowing React components to execute properly

3. **Fallback safety**: The `NavigationService` already has logic to fallback to `window.location` if router is unavailable, so we maintain reliability

4. **No hydration issues**: Client-side navigation doesn't trigger the hydration problems that full page reloads cause with static export + Capacitor

### Architecture

The `NavigationService` already implements the smart navigation pattern:
- **Preferred**: Router navigation (client-side, no reload) ✅
- **Fallback**: `window.location` (full reload) - only if router unavailable

This change simply uses the preferred method, which should work since the router is set before sign-out.

## Expected Behavior

1. Sign-out orchestration completes
2. `runSignOutFlow()` Step 6 executes
3. `navigationService.navigateToExplore(true)` called
4. Router navigation executes (client-side, no reload)
5. Explore page component function executes properly
6. Explore page renders with signed-out state and listings

## Testing

Ready for iOS testing. The explore page component should now execute and render content after sign-out redirect.

