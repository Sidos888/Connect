# AI Development Guidelines for Connect

## 1) Mission & Outcomes

Connect delivers clarity, warmth, and accessibility through fast mobile UX. The app enables personal profile management (`/menu`, `/settings`), business operations (`/business/[id]`), and social connections (`/chat`, `/my-life`) with a focus on mobile-first design and seamless authentication flow.

## 2) Stack Truths

**Framework**: Next.js 15 with App Router, TypeScript, Tailwind CSS v4, Capacitor 7 for mobile
**Routing**: App Router structure in `src/app/` with route groups `(personal)` and `(business)`
**Import Alias**: `@/*` maps to `./src/*` (configured in `tsconfig.json`)
**Fonts**: Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`) loaded in `src/app/layout.tsx`
**Global Styles**: `src/app/globals.css` with Tailwind v4 `@import "tailwindcss"`
**Layout Wrappers**: `AppShellWrapper` → `AppShell` → `MobileBottomNavigation` + `TopNavigation`

**Current Tree**:
```
src/
├── app/
│   ├── (personal)/          # Personal user routes
│   ├── (business)/          # Business user routes  
│   ├── globals.css          # Tailwind + custom CSS
│   └── layout.tsx           # Root layout with fonts
├── components/              # Reusable components
└── lib/                     # Auth, store, utilities
```

## 3) Non-Negotiables (Hard Rules)

**Styling**: No inline CSS; Tailwind + custom components only. Reference `tailwind.config.ts` for brand color `#FF6600` and `src/app/globals.css` for custom utilities.

**Design Tokens**: Use CSS custom properties from `src/app/globals.css`:
- Colors: `--color-brand: #FF6600`, `--color-primary: #FF6600`, `--color-muted: #f5f5f5`
- Neutral scale: `--color-neutral-50` through `--color-neutral-900`
- Utilities: `.text-brand`, `.bg-brand`, `.ring-brand`, `.tab-active`

**Accessibility**: WCAG AA compliance with focus rings `focus:outline-none focus-visible:ring-2 ring-brand`, contrast pairs using neutral scale, and proper ARIA labels (see `src/app/(personal)/menu/page.tsx` examples).

**Navigation**: No scope/nav changes unless requested. Current tabs: Menu, My Life, Chat, Notifications, Settings (rendered in `src/components/layout/MobileBottomNavigation.tsx`).

**Auth/Data Safety**: No secrets in code; use environment variables via `src/lib/supabaseClient.ts`. Database policy: SQL migrations in root directory (e.g., `create-profiles-table.sql`), Supabase config in `supabase/config.toml`.

## 4) Design System Usage

**Custom Components**: `Button` (4 variants), `Input`, `TextArea`, `ImagePicker`, `Avatar`, `LoadingSpinner` in `src/components/`
**Composition**: 8px grid spacing, `rounded-md` radius, `shadow-sm` shadows, brand color for primary actions
**Examples**:
```tsx
// Button with brand color (src/components/Button.tsx)
<Button variant="primary" className="bg-brand text-white hover:opacity-90">

// Form field with label (src/components/Input.tsx)  
<Input label="Name" className="w-full rounded-md border border-neutral-200">

// Profile card spacing (src/app/(personal)/menu/page.tsx)
<div className="space-y-4 p-6 bg-white rounded-lg shadow-sm">
```

## 5) Brand Elements

**Current**: No specific brand decorative elements beyond the orange brand color (`#FF6600`) and custom components. The design system relies on clean, minimal styling with focus on functionality and mobile-first UX.

## 6) Page Patterns

**Hero**: Full-width with safe area padding, centered content, brand color accents
**List/Cards**: `space-y-4` for vertical rhythm, `rounded-lg shadow-sm` for cards
**Forms**: Labels with `text-sm text-neutral-600`, helper text with `text-xs text-gray-500`, inline errors with red text
**States**: Loading with `LoadingSpinner`, empty with `EmptyState`, errors with red text and retry buttons

**Real Examples**:
- Hero: `src/app/(personal)/my-life/page.tsx`
- Cards: `src/components/my-life/MiniEventCard.tsx`
- Forms: `src/app/(personal)/menu/page.tsx` (EditProfileView)

## 7) Accessibility Checklist (repo-specific)

**Keyboard**: Tab order follows visual hierarchy, focus visible with `focus-visible:ring-2 ring-brand`
**ARIA**: Use `aria-label` for icon buttons, `aria-describedby` for form helpers
**Contrast**: Brand `#FF6600` on white (4.5:1), neutral-600 on neutral-100 (4.5:1)
**Focus Style**: `focus:outline-none focus-visible:ring-2 ring-brand` (see `src/app/(personal)/menu/page.tsx`)

## 8) Performance & SEO

**Images**: Use `ImagePicker` component with `img` tags (ESLint disabled), no `next/image` currently
**Metadata**: Set in `src/app/layout.tsx` with `title` and `description`
**Targets**: No specific Lighthouse targets documented
**Gap to Address**: Implement `next/image` optimization, add sitemap.xml and robots.txt

## 9) Code Quality

**ESLint**: `eslint.config.mjs` with Next.js rules, TypeScript warnings for `any`, unused vars, hooks
**TypeScript**: Strict mode enabled, `@/*` path mapping
**Import Convention**: `@/components/Button`, `@/lib/authContext`
**Component Size**: Keep under 200 lines, split into smaller components when needed
**File Structure**: Components in `src/components/`, pages in `src/app/`, utilities in `src/lib/`

## 10) PR Requirements

**Scope**: Small, focused diffs with 2-bullet rationale
**Screenshots**: 360px (mobile), 768px (tablet), 1280px (desktop)
**Checklist**: Tokens used, Tailwind only, a11y pass, no console errors, mobile tested
**Migrations**: Link to SQL files when database changes made

## 11) Acceptance Criteria Template

```markdown
- [ ] Uses design tokens from globals.css
- [ ] Tailwind classes only, no inline styles  
- [ ] Focus rings visible on interactive elements
- [ ] ARIA labels on icon buttons
- [ ] Mobile-first responsive design
- [ ] No console errors
- [ ] Tested on iOS simulator
- [ ] ESLint passes
```

## 12) Examples (from this repo)

**Button with brand token**:
```tsx
// src/components/Button.tsx
<button className="bg-brand text-white hover:opacity-90 focus-visible:ring-2 ring-brand">
```

**Form field with helper and error**:
```tsx
// src/app/(personal)/menu/page.tsx
<Input 
  label="Name"
  className="w-full text-base border-gray-200 focus:border-gray-400 focus:ring-gray-400"
  aria-describedby="name-helper"
/>
{error && <div className="text-red-600 text-sm">{error}</div>}
```

**Card with spacing and shadow**:
```tsx
// src/components/my-life/MiniEventCard.tsx
<div className="p-4 bg-white rounded-lg shadow-sm space-y-2">
```

---

## How to use this doc

**For AI agents**: Pin AI_GUIDELINES.md + DESIGN_PRINCIPLES.md + tokens + .cursor/rules.json, then run roles in this order per task: Design Director → Auditor → Implementer. Keep changes within scope; produce plan → diffs → brief rationale → a11y notes → acceptance checklist.

## Gaps to Address

1. **Image Optimization**: Implement `next/image` with proper sizing and lazy loading
2. **SEO Files**: Add `sitemap.xml` and `robots.txt` to `public/`
3. **Lighthouse Targets**: Define performance benchmarks in README
4. **Design Tokens File**: Extract CSS custom properties to `src/styles/tokens.json`
