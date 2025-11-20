# Protected Route Pattern - Documentation

## Problem
When creating new pages in the `(personal)` route group, if they are not wrapped with `ProtectedRoute`, users will see:
1. A sign-in page first
2. Then a blank page

This happens because the page is accessible but not properly protected, causing authentication state issues.

## Solution
**ALWAYS wrap client-side pages with `ProtectedRoute` component** when they require authentication.

## Pattern

### ✅ Correct Pattern (Server Component Wrapper + ProtectedRoute)

```typescript
// page.tsx (Server Component - no "use client")
import ClientComponentWrapper from './ClientComponentWrapper';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: PageProps) {
  return (
    <ProtectedRoute 
      title="Page Title" 
      description="Log in / sign up to access this page" 
      buttonText="Log in"
    >
      <ClientComponentWrapper />
    </ProtectedRoute>
  );
}
```

```typescript
// ClientComponentWrapper.tsx (Client Component - has "use client")
"use client";

import { useParams } from 'next/navigation';
// ... other imports

export default function ClientComponentWrapper() {
  const params = useParams();
  const id = params?.id as string | undefined;
  
  // Your component logic here
  return (
    // Your JSX
  );
}
```

## Examples in Codebase

### ✅ Good Examples:
1. **Listing Detail Page**: `src/app/(personal)/my-life/listing/[id]/page.tsx`
   - Wraps `ListingDetailPageClient` with `ProtectedRoute`

2. **Create Listing Page**: `src/app/(personal)/my-life/create/page.tsx`
   - Wraps `CreateListingPageContent` with `ProtectedRoute`

3. **My Life Page**: `src/app/(personal)/my-life/page.tsx`
   - Wraps `MyLifeLayout` with `ProtectedRoute`

### ❌ Common Mistakes:
- Creating a page without `ProtectedRoute` wrapper
- Forgetting to add `ProtectedRoute` when creating new dynamic routes
- Not using the wrapper pattern for static exports

## Checklist for New Pages

When creating a new page in `(personal)` route group:

- [ ] Create a server component wrapper (`page.tsx`) that exports `generateStaticParams()` if it's a dynamic route
- [ ] Wrap the client component with `ProtectedRoute`
- [ ] Create a separate client component file (`*Wrapper.tsx` or `*Client.tsx`) with `"use client"` directive
- [ ] Test that the page shows content (not sign-in screen) when user is authenticated
- [ ] Test that the page shows sign-in screen when user is not authenticated

## Why This Pattern?

1. **Static Export Compatibility**: Next.js static exports require `generateStaticParams()` for dynamic routes, but it cannot be in a client component
2. **Authentication Protection**: `ProtectedRoute` ensures only authenticated users can access the page
3. **Consistent UX**: Users see proper sign-in prompts instead of blank pages
4. **Separation of Concerns**: Server component handles routing/params, client component handles UI/interactivity

## Navigation Pattern

### ✅ Use Query Parameter Routes with `router.push()`

**CRITICAL RULE: For dynamic content, ALWAYS use query parameter routes**, NOT dynamic routes (`/[id]`).

**Why?**
- Dynamic routes (`/[id]`) require `generateStaticParams()` for static exports
- `router.push()` with dynamic routes tries to fetch RSC payloads (fails)
- `window.location.href` causes full page reload (resets auth state)
- Query parameter routes work perfectly with `router.push()`

**Correct Pattern:**
```typescript
// ✅ GOOD - Query parameter route (static route)
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push(`/listing?id=${listingId}`);
router.push(`/profile?id=${userId}`);
```

**Incorrect Patterns:**
```typescript
// ❌ BAD - Dynamic route with router.push (RSC errors)
router.push(`/listing/${listingId}`);
router.push(`/profile/${userId}`);

// ❌ BAD - Dynamic route with window.location (auth reset)
window.location.href = `/listing/${listingId}`;
window.location.href = `/profile/${userId}`;
```

**Exception:** Only use `window.location.href` when:
- Navigating to a completely different domain
- You explicitly need a full page reload
- Navigating outside the app (e.g., external links)

**See:** `docs/STATIC_EXPORT_NAVIGATION_PATTERN.md` for complete guide

### Passing Params to Client Components

When using dynamic routes with static exports:

1. **Server component receives params** from Next.js
2. **Pass params as props** to client component
3. **Don't use `useParams()` in client component** if params are already passed as props

```typescript
// ✅ GOOD - Pass params as props
// page.tsx (server)
export default function Page({ params }: { params: { id: string } }) {
  return <ClientComponent listingId={params.id} />;
}

// ClientComponent.tsx (client)
export default function ClientComponent({ listingId }: { listingId: string }) {
  // Use listingId directly, don't call useParams()
}
```

## Related Files

- `src/components/auth/ProtectedRoute.tsx` - The protection component
- `src/app/(personal)/guard.tsx` - Route-level guard (complements ProtectedRoute)
- `src/app/(personal)/layout.tsx` - Layout wrapper for personal routes

