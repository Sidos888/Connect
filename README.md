This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Airbnb-Style Layout System

This app features a clean, modern layout inspired by Airbnb's design:

### Layout Features:
- **Top Navigation Bar**: Horizontal navigation with logo, main sections, and user menu
- **Full-Width Content**: Clean, spacious content areas with consistent max-width constraints
- **Responsive Design**: Adapts seamlessly from mobile to desktop
- **Unified Navigation**: Same navigation pattern across all screen sizes

### Navigation Structure:
- **Main Sections**: Explore, My Life, Chat accessible from top nav
- **User Menu**: Dropdown with account settings, help, and logout
- **Menu Page**: Accessible via top nav menu button or user dropdown

### Adding Navigation Items

To add a new main navigation item:

1. Update the `navigationItems` array in `/src/components/layout/TopNavigation.tsx`:

```tsx
import { NewIcon } from "lucide-react";

const navigationItems = [
  // ... existing items
  { href: "/new-section", label: "New Section", icon: NewIcon },
];
```

2. The new item will automatically appear in both desktop and mobile navigation

### Page Layout Structure

All pages follow this consistent structure:

```tsx
export default function MyPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Page Title</h1>
      </div>
      
      {/* Page content */}
      <div className="space-y-6">
        {/* Content sections */}
      </div>
    </div>
  );
}
```

This ensures consistent spacing, typography, and responsive behavior across the entire app.

### Supabase (optional)

1. Create a Supabase project and copy the project URL and anon key.
2. Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

3. Future DB schema (not required in this MVP):

```
-- profiles
-- id uuid primary key references auth.users(id)
-- name text, bio text, avatar_url text

-- orgs (businesses)
-- id uuid primary key, owner_id uuid references auth.users(id)
-- name text, bio text, logo_url text, created_at timestamptz default now()
```

When env vars are present, the client will be available via `lib/supabaseClient.ts`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
Deploy test on Thu Sep 11 09:11:07 ACST 2025
