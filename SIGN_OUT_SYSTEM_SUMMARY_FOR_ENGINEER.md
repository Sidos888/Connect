# Sign-Out System Issue - Summary for Systems Engineer

## Technical Context

**Stack:** Next.js 16 App Router with static export (`output: 'export'`) for Capacitor iOS app. Using Supabase for auth, Zustand for state, React Query for data fetching, and Next.js router for navigation.

## The Problem

After implementing a dedicated `/signing-out` page (following WeChat/Facebook pattern), the sign-out process freezes after Step 1. The async `performSignOut` function executes `await signOut()` successfully (clears Zustand store, localStorage, sessionStorage, and Supabase session), but when AuthContext updates (user becomes null), React re-renders the component and the async function doesn't continue executing Steps 2-6 (React Query cache clear, delays, status updates, redirect). The page freezes on "Signing out..." message.

## Current Implementation

**Menu page:** Navigates to `/signing-out` immediately using Next.js router (client-side navigation).

**Signing-out page:** Uses `useEffect` with a `hasStartedRef` to prevent multiple executions. The async function `performSignOut` should: (1) await `signOut()` from AuthContext, (2) clear React Query cache, (3) wait 1s, (4) update status to "redirecting", (5) wait 1s more, (6) redirect to `/explore` via `window.location.replace()`.

## What's Happening

Logs show: Step 1 completes (`await signOut()` finishes, AuthContext updates to `user: null`), component re-renders due to AuthContext change, then Steps 2-6 never execute. The async function appears to be interrupted by the re-render and doesn't resume execution.

## Attempted Solutions

1. **Service layer pattern** - Moved sign-out logic to `AuthService` singleton (works, but navigation timing issue remains)
2. **Client-side navigation** - Using Next.js router instead of `window.location` (works for navigation, but async interruption persists)
3. **useRef guard** - Added `hasStartedRef` to prevent useEffect re-execution (prevents duplicate starts, but doesn't fix async interruption)
4. **Dependency array fix** - Removed `signOut` and `queryClient` from useEffect dependencies (prevents dependency loop, but async still interrupted)

## The Core Issue

React async execution interruption: When `signOut()` completes and updates AuthContext, React re-renders the component. This re-render appears to interrupt the async `performSignOut` function's execution, preventing it from continuing after the `await signOut()` call. The function doesn't throw an error—it simply stops executing.

## Questions for Systems Engineer

1. How can we ensure an async function continues execution after a component re-render in React?
2. Is there a pattern for handling async operations that need to complete even when components re-render due to context updates?
3. Should we use a different approach (e.g., state machine, refs to track async state, or moving the async logic outside React's lifecycle)?
4. Are there known issues with Next.js App Router + static export that could cause async interruption?
5. Would using `useLayoutEffect` or a different hook pattern help?
6. Should we restructure to avoid the AuthContext update triggering a re-render during async execution?

## Current State

- Navigation to signing-out page: ✅ Working
- Page rendering: ✅ Working  
- Step 1 (signOut): ✅ Working
- AuthContext update: ✅ Working
- Steps 2-6 execution: ❌ Not executing (interrupted by re-render)
- Redirect to explore: ❌ Never reached

## Desired Outcome

A reliable sign-out flow that: (1) navigates to signing-out page, (2) performs complete cleanup (Supabase, Zustand, React Query, storage), (3) waits for state propagation, (4) shows "Redirecting..." status, (5) navigates to explore page with clean signed-out state—all without freezing or interruption.

