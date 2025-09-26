# Design Principles for Connect

## 1) Design Philosophy

Connect delivers clarity through clean, functional design with warmth and accessibility at its core. Inspired by Shopify's structured simplicity and Airbnb's community-driven warmth, the app prioritizes human connection over flashy features. The design system uses Geist Sans for readability, the vibrant orange brand color (`#FF6600`) for energy and trust, and an 8px spacing rhythm for visual harmony. Every element serves a purpose—no decoration without function.

## 2) Layout & Spacing

**8px Grid System**: All spacing follows multiples of 8px (`space-y-1` = 4px, `space-y-2` = 8px, `space-y-4` = 16px, `space-y-6` = 24px)

**Spacing Rules**:
- Use `space-y-*` for vertical rhythm between stacked elements
- Use `gap-*` for flex/grid containers with consistent spacing
- Section padding: `px-4 py-6` (mobile), `px-6 py-8` (desktop)
- Card padding: `p-4` (mobile), `p-6` (desktop)
- Safe area: `pt-safe-top`, `pb-safe-bottom` for notched devices

**Examples from codebase**:
```tsx
// Vertical rhythm (src/app/(personal)/my-life/page.tsx)
<div className="space-y-8">
  <div className="space-y-4">
    <ProfileStrip />
  </div>
</div>

// Card composition (src/components/my-life/MiniEventCard.tsx)
<div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
```

## 3) Typography

**Font Stack**: Geist Sans (`--font-geist-sans`) for body text, Geist Mono (`--font-mono`) for code
**Size Scale**: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px)
**Weight Usage**: `font-medium` for labels, `font-semibold` for headings, `font-bold` for titles
**Line Height**: Default Tailwind line heights, `line-clamp-1` for truncation

**Examples from codebase**:
```tsx
// Heading hierarchy (src/app/(personal)/menu/page.tsx)
<h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
<h2 className="text-2xl font-bold text-gray-900">Profile</h2>

// Form labels (src/components/Input.tsx)
<span className="text-sm text-neutral-600">{label}</span>
```

## 4) Color & Tokens

**Primary Colors** (from `src/app/globals.css`):
- Brand: `#FF6600` (`--color-brand`, `.text-brand`, `.bg-brand`)
- Background: `#ffffff` (`--background`)
- Foreground: `#111827` (`--foreground`)

**Neutral Scale**:
- `--color-neutral-50`: `#fafafa` (subtle backgrounds)
- `--color-neutral-100`: `#f5f5f5` (card backgrounds)
- `--color-neutral-200`: `#e5e5e5` (borders)
- `--color-neutral-500`: `#737373` (helper text)
- `--color-neutral-600`: `#525252` (labels)
- `--color-neutral-700`: `#404040` (secondary text)
- `--color-neutral-900`: `#171717` (primary text)

**Semantic Colors**:
- Error: `bg-red-600`, `text-red-600`
- Success: `bg-green-600`, `text-green-600`
- Muted: `--color-muted: #f5f5f5`

**Contrast Rules**: Brand orange on white (4.5:1), neutral-600 on neutral-100 (4.5:1)

## 5) Components & Reuse

**Core Building Blocks**:
- `Button` (4 variants: primary, secondary, ghost, destructive)
- `Input` & `TextArea` (with labels and focus states)
- `Avatar` (circular, fallback to initials)
- `LoadingSpinner` (3 sizes: sm, md, lg)
- `EmptyState` (with icon, title, subtitle, action)

**Component Rules**:
- Always use `rounded-md` for consistency
- Apply `shadow-sm` for subtle elevation
- Use `transition-colors` for hover states
- Focus rings: `focus-visible:ring-2 ring-brand`

**Examples from codebase**:
```tsx
// Button variants (src/components/Button.tsx)
<Button variant="primary" className="bg-brand text-white hover:opacity-90">
<Button variant="secondary" className="bg-neutral-100 text-neutral-900">

// Card composition (src/components/my-life/MiniEventCard.tsx)
<div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
```

## 6) Brand Elements

**Current**: Clean, minimal design with orange brand color (`#FF6600`) as the primary accent. No decorative elements beyond functional components.

**Usage Rules**:
- Brand color for primary actions and active states
- Use `.tab-active` class for navigation highlights
- Apply `ring-brand` for focus states
- Keep brand elements purposeful, not decorative

## 7) Forms & Inputs

**Label Rules**: Always use `text-sm text-neutral-600` for labels
**Helper Text**: `text-xs text-gray-500` for guidance
**Error States**: `text-red-600` with `bg-red-50` backgrounds
**Focus States**: `focus:border-gray-500 focus:outline-none` with `focus-visible:ring-2 ring-brand`
**Touch Targets**: Minimum 44px height for mobile (`h-11` or `py-3`)

**Examples from codebase**:
```tsx
// Input with label (src/components/Input.tsx)
<label className="block space-y-1">
  <span className="text-sm text-neutral-600">{label}</span>
  <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-base shadow-sm focus:border-gray-500 focus:outline-none" />
</label>

// Error display (src/app/(personal)/menu/page.tsx)
<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
  <p className="text-sm text-red-600">{error}</p>
</div>
```

## 8) States & Feedback

**Loading**: `LoadingSpinner` component with size variants (sm: 16px, md: 32px, lg: 64px)
**Empty**: `EmptyState` component with icon, title, subtitle, and optional action
**Error**: Red text with subtle background (`text-red-600` + `bg-red-50`)
**Success**: Green text with subtle background (`text-green-600` + `bg-green-50`)

**Modal vs Inline**: Use modals for complex interactions, inline errors for form validation

**Examples from codebase**:
```tsx
// Loading state (src/components/LoadingSpinner.tsx)
<div className="animate-spin rounded-full border-2 border-gray-200 border-t-black h-8 w-8"></div>

// Empty state (src/components/EmptyState.tsx)
<div className="text-center py-12 text-neutral-600">
  <div className="rounded-2xl border-2 border-neutral-200 p-6">
    <div className="text-neutral-900 text-lg font-semibold mb-2">{title}</div>
  </div>
</div>
```

## 9) Accessibility & Inclusivity

**WCAG AA Baseline**: 4.5:1 contrast ratio, keyboard navigation, screen reader support
**Focus Patterns**: `focus-visible:ring-2 ring-brand` for all interactive elements
**ARIA Labels**: Use `aria-label` for icon buttons, `aria-describedby` for form helpers
**Copy Tone**: Plain language, inclusive, no jargon or technical terms

**Examples from codebase**:
```tsx
// Focus ring (src/app/(personal)/menu/page.tsx)
<button className="focus:outline-none focus-visible:ring-2 ring-brand">

// ARIA label (src/app/(personal)/menu/page.tsx)
<button aria-label="Back to profile">
```

## 10) Motion & Interaction

**Transitions**: `transition-colors` for hover states, `transition-shadow` for elevation changes
**Duration**: Fast interactions (<200ms), never block user input
**Principles**: Subtle, purposeful, enhance usability without distraction

**Examples from codebase**:
```tsx
// Hover transition (src/app/(personal)/menu/page.tsx)
<button className="hover:bg-gray-50 transition-colors">

// Shadow transition (src/app/(personal)/menu/page.tsx)
<div className="hover:shadow-md transition-shadow duration-200">
```

## 11) Do & Don't Examples

**✅ Good Spacing**:
```tsx
// Consistent 8px rhythm
<div className="space-y-4">
  <div className="p-4 bg-white rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold mb-2">Title</h3>
    <p className="text-sm text-neutral-600">Description</p>
  </div>
</div>
```

**❌ Bad Spacing**:
```tsx
// Inconsistent spacing, no rhythm
<div className="space-y-3">
  <div className="p-5 bg-white rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold mb-1">Title</h3>
    <p className="text-sm text-neutral-600">Description</p>
  </div>
</div>
```

**✅ Good Button Usage**:
```tsx
// Clear hierarchy with variants
<Button variant="primary">Save Changes</Button>
<Button variant="ghost">Cancel</Button>
```

**❌ Bad Button Usage**:
```tsx
// Inconsistent styling, unclear hierarchy
<button className="bg-orange-500 text-white px-4 py-2 rounded">Save</button>
<button className="bg-gray-200 text-black px-3 py-1 rounded">Cancel</button>
```

## 12) Future Gaps

**Gaps to Address**:
1. **Design Tokens File**: Extract CSS custom properties to `src/styles/tokens.json` for better maintainability
2. **Image Optimization**: Implement `next/image` with proper sizing and lazy loading
3. **Motion System**: Define standard animation durations and easing curves
4. **Icon System**: Standardize icon usage and sizing across components
5. **Dark Mode**: Prepare design tokens for future dark mode support

---

## How to Use This Document

**For Designers**: Reference this when creating new components or pages. Ensure all design decisions align with these principles.

**For Developers**: Use this as a checklist when implementing UI. Check spacing, typography, and component usage against these standards.

**For AI Agents**: Pin this alongside AI_GUIDELINES.md and tokens.json. Follow these principles when making design decisions or creating new components.
