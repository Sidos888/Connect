# Removing Apple Reviewer Login System After Approval

This document outlines how to remove the temporary Apple Reviewer login system after your app is approved by Apple.

## Files to Remove/Modify

### 1. Delete These Files Entirely:
- `src/components/auth/ReviewerLoginPage.tsx`
- `src/lib/reviewerAuth.ts`

### 2. Remove Code Blocks from These Files:

#### `src/components/layout/AppShell.tsx`
Remove these lines (around line 15-16 and 81-88):
```typescript
// START REVIEWER OVERRIDE
import ReviewerLoginPage from "@/components/auth/ReviewerLoginPage";
import { isReviewBuild } from "@/lib/reviewerAuth";
// END REVIEWER OVERRIDE

// ... later in the file ...

// START REVIEWER OVERRIDE
// Show reviewer login page FIRST if in review build and not logged in
// This must happen BEFORE any other route logic to ensure it shows first
const isReview = isReviewBuild();
if (isReview && !user && !loading) {
  return <ReviewerLoginPage />;
}
// END REVIEWER OVERRIDE
```

#### `src/lib/authContext.tsx`
Remove the `signInWithPassword` method and related code:
- Remove `signInWithPassword` from the `AuthContextType` interface
- Remove the `signInWithPassword` function implementation (marked with `// START REVIEWER OVERRIDE` and `// END REVIEWER OVERRIDE`)
- Remove `signInWithPassword` from the context value object

### 3. Clean Up Supabase
- Go to Supabase Dashboard → Authentication → Users
- Delete the `reviewer@connectos.app` user account

## Quick Removal Checklist

- [ ] Delete `src/components/auth/ReviewerLoginPage.tsx`
- [ ] Delete `src/lib/reviewerAuth.ts`
- [ ] Remove reviewer imports from `src/components/layout/AppShell.tsx`
- [ ] Remove reviewer check logic from `src/components/layout/AppShell.tsx`
- [ ] Remove `signInWithPassword` from `src/lib/authContext.tsx`
- [ ] Delete `reviewer@connectos.app` user from Supabase
- [ ] Test that normal login flow works
- [ ] Test that the app loads normally without reviewer system

## Estimated Time
**5-10 minutes** - All reviewer code is clearly marked with `// START REVIEWER OVERRIDE` and `// END REVIEWER OVERRIDE` comments, making it easy to find and remove.

## Notes
- The reviewer system is completely isolated and doesn't affect normal user flows
- All reviewer code is clearly marked for easy identification
- No database schema changes needed
- No environment variables to clean up (unless you set `NEXT_PUBLIC_REVIEW_BUILD`)

