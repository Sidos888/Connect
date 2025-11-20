# Static Export Navigation Pattern - Critical Rules

## ⚠️ CRITICAL: Never Use `window.location.href` for Internal Navigation

**Why?**
- `window.location.href` causes a **full page reload**
- This **resets React state** and **auth context**
- Results in: sign-in screen → blank page → content (bad UX)
- This is the root cause of the "3 dot sign-in then blank page" issue

## ✅ Always Use Query Parameter Routes for Dynamic Content

### Pattern: `/resource?id=xxx` (NOT `/resource/[id]`)

**Why?**
- Query parameter routes are **static routes** (no `generateStaticParams()` needed)
- `router.push()` works perfectly (no RSC navigation attempts)
- No auth state resets
- Smooth client-side navigation

### Examples

**✅ CORRECT - Query Parameter Route:**
```typescript
// Route: /profile?id=xxx
router.push(`/profile?id=${userId}`);
```

**❌ WRONG - Dynamic Route:**
```typescript
// Route: /profile/[id]
router.push(`/profile/${userId}`); // Causes RSC errors
window.location.href = `/profile/${userId}`; // Causes auth reset
```

**✅ CORRECT - Query Parameter Route:**
```typescript
// Route: /listing?id=xxx
router.push(`/listing?id=${listingId}`);
```

**❌ WRONG - Dynamic Route:**
```typescript
// Route: /listing/[id]
router.push(`/listing/${listingId}`); // Causes RSC errors
window.location.href = `/listing/${listingId}`; // Causes auth reset
```

## Implementation Pattern

### 1. Create Query Parameter Route

```typescript
// src/app/profile/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import ProfileClientWrapper from './[id]/ProfileClientWrapper';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  
  if (!userId) {
    return <div>No user ID provided</div>;
  }
  
  return <ProfileClientWrapper userId={userId} />;
}
```

### 2. Navigate Using Query Parameters

```typescript
// ✅ CORRECT
router.push(`/profile?id=${userId}`);

// ❌ WRONG - Don't use dynamic routes
router.push(`/profile/${userId}`);
window.location.href = `/profile/${userId}`;
```

## Routes That Use This Pattern

### ✅ Query Parameter Routes (Work Perfectly)
- `/listing?id=xxx` - Listings
- `/profile?id=xxx` - Profiles
- `/menu?view=xxx` - Menu views
- `/chat?chat=xxx` - Chat selection

### ❌ Dynamic Routes (Avoid for Navigation)
- `/profile/[id]` - Legacy, kept for backwards compatibility
- `/listing/[id]` - Legacy, kept for backwards compatibility
- `/business/[id]` - Business pages (pre-generated)

## When to Use Each

### Use Query Parameters When:
- ✅ Content is dynamic (user-generated IDs)
- ✅ Route needs to work from multiple contexts
- ✅ Navigation happens frequently
- ✅ You need smooth client-side navigation

### Use Dynamic Routes When:
- ✅ Content is pre-generated (known IDs)
- ✅ Route is only accessed via direct URL
- ✅ You can use `generateStaticParams()` with all possible IDs

## Prevention Checklist

Before adding navigation to a dynamic route:

1. ✅ **Check if route uses `[id]` or similar dynamic segments**
2. ✅ **If yes, create query parameter version (`/resource?id=xxx`)**
3. ✅ **Use `router.push()` with query parameters**
4. ✅ **Never use `window.location.href` for internal navigation**
5. ✅ **Test navigation doesn't show sign-in screen**

## Common Mistakes

### ❌ Mistake 1: Using `window.location.href` for Dynamic Routes
```typescript
// BAD - Causes auth reset
window.location.href = `/profile/${userId}`;
```

### ❌ Mistake 2: Using `router.push()` with Dynamic Routes
```typescript
// BAD - Causes RSC errors
router.push(`/profile/${userId}`);
```

### ✅ Correct: Query Parameter Route
```typescript
// GOOD - Works perfectly
router.push(`/profile?id=${userId}`);
```

## Summary

**Rule of Thumb:**
- **Dynamic content** → Use query parameters (`?id=xxx`)
- **Pre-generated content** → Use dynamic routes (`/[id]`)
- **Never use `window.location.href`** for internal navigation
- **Always use `router.push()`** with query parameters

**This prevents:**
- ❌ Sign-in screen flashes
- ❌ Blank pages
- ❌ Auth state resets
- ❌ RSC navigation errors

