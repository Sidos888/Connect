# Connect Page Design System
## The Standard for All Content Pages in Connect

Created: November 2025  
Status: **Design Framework - Apply to all content pages**

---

## 📋 Overview

The Saved page represents the **signature design language** for Connect. This document defines the exact patterns, measurements, and **reusable components** to replicate across all content pages (Notifications, Gallery, Achievements, Highlights, Memories, etc.).

**NEW:** As of November 2025, this design system is now available as **reusable React components** (`PageHeader` and `PageContent`), making implementation 90% faster and ensuring perfect consistency.

---

## 🚀 Quick Start: Using the Component System

### **Mobile Full-Screen Page (5 minutes):**

```tsx
import { MobilePage, PageHeader, PageContent } from '@/components/layout/PageSystem';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function YourMobilePage() {
  const router = useRouter();
  
  return (
    <MobilePage>
      <PageHeader
        title="Your Page"
        backButton
        onBack={() => router.back()}
        actions={[
          {
            icon: <Plus size={20} />,
            onClick: () => {},
            label: "Add"
          }
        ]}
      />
      <PageContent>
        <div className="px-8 pb-8" style={{ paddingTop: '140px' }}>
          {/* Your content here */}
        </div>
      </PageContent>
    </MobilePage>
  );
}
```

### **Web Modal (5 minutes):**

```tsx
import { PageHeader, PageContent } from '@/components/layout/PageSystem';

<div 
  className="bg-white rounded-3xl w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl relative"
>
  <PageHeader
    title="Your Modal"
    backButton
    onBack={onClose}
  />
  <PageContent>
    <div className="px-8 pb-8" style={{ paddingTop: '104px' }}>
      {/* Your content here */}
    </div>
  </PageContent>
</div>
```

**Key Rules:**
- ✅ Mobile: MUST wrap in `<MobilePage>`, content padding: 140px
- ✅ Web: Use modal container, content padding: 104px
- ✅ Content: ALWAYS add `px-8 pb-8` wrapper with proper paddingTop

---

## 🎨 Core Design Principles

### 1. **Ultra-Thin Borders** (Apple-like Refinement)
```tsx
borderWidth: '0.4px'  // NOT 1px - much more subtle
borderColor: '#E5E7EB'  // Gray-200
```
**Why:** Creates elegance without visual weight. Defines space without dominating.

### 2. **Dual-Layer Shadow System** (Depth Without Heaviness)
```tsx
// Default state:
boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'

// Hover state:
boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
```
**Components:**
- **Outer shadow:** Creates depth and elevation
- **Inset shadow:** Adds dimension and materiality
- **Subtle values:** Never harsh or heavy

### 3. **Micro-Interactions** (Delightful Hover Effects)
```tsx
// Card hover
className="hover:-translate-y-[1px] transition-all duration-200"
style={{ willChange: 'transform, box-shadow' }}

// Dynamic shadow on hover
onMouseEnter={(e) => {
  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
}}
```
**Details:**
- **1px lift** on hover (subtle, not exaggerated)
- **200ms transitions** (fast enough to feel instant, slow enough to see)
- **Performance hints:** `willChange` for smooth animations

### 4. **Gradient Icon Containers** (Visual Hierarchy)
```tsx
// Structure
className="w-12 h-12 bg-gradient-to-br from-[COLOR]-400 to-[COLOR]-600 rounded-xl flex items-center justify-center flex-shrink-0"

// Examples:
from-orange-400 to-orange-600  // Events
from-blue-400 to-blue-600      // Venues
from-purple-400 to-purple-600  // People (alternative)
```
**Specifications:**
- **Size:** 48px × 48px (3rem)
- **Gradient:** Bottom-right diagonal (`bg-gradient-to-br`)
- **Corners:** `rounded-xl` (12px)
- **Icon:** White, 24px × 24px (`w-6 h-6`)
- **Purpose:** Category differentiation, visual interest

### 5. **Card Structure** (Consistent Pattern)
```tsx
className="bg-white rounded-2xl p-4 border border-gray-200 transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
style={{
  borderWidth: '0.4px',
  borderColor: '#E5E7EB',
  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
  willChange: 'transform, box-shadow'
}}
```
**Measurements:**
- **Corners:** `rounded-2xl` (16px)
- **Padding:** `p-4` (16px all sides)
- **Spacing:** `space-y-3` (12px between cards)
- **Background:** Pure white (`#FFFFFF`)

### 6. **Section Headers** (Clear Categorization)
```tsx
className="text-sm font-semibold text-gray-900 mb-3 px-1"
```
**Details:**
- **Size:** Small (14px)
- **Weight:** Semibold (600)
- **Color:** Gray-900 (almost black)
- **Padding:** 1px horizontal (4px) - subtle alignment
- **Margin:** 12px bottom spacing

### 7. **Safe Area Handling** (Mobile-First)
```tsx
// Header padding
paddingTop: 'max(env(safe-area-inset-top), 70px)'

// Content padding  
paddingTop: '104px'  // Matches header blur zone
```
**Purpose:**
- Respects iOS notch/Dynamic Island
- Minimum 70px fallback for non-notch devices
- Content starts below header blur zone

### 8. **Flex Layout Patterns** (Text Overflow Handling)
```tsx
// Container
className="flex items-center gap-3"

// Text area
className="flex-1 min-w-0"  // Allows truncation

// Buttons/icons
className="flex-shrink-0"  // Prevents squishing

// Long text
className="truncate"  // Adds ellipsis
```

### 9. **Typography Hierarchy**
```tsx
// Primary title
className="font-semibold text-gray-900 mb-1"

// Secondary text / metadata
className="text-sm text-gray-500"

// Action buttons
className="text-sm font-medium"
```

### 10. **Color Palette**
```tsx
// Brand
Orange-600: #FF6600  // Primary actions

// Text
Gray-900: #111827   // Headings
Gray-700: #374151   // Body text
Gray-500: #6B7280   // Metadata

// Borders
Gray-200: #E5E7EB   // Subtle borders

// Accents
Yellow-500: #EAB308  // Stars/ratings
Blue-400/600: #60A5FA/#2563EB  // Category gradients
```

### 11. **Action Buttons**
```tsx
// Primary (filled)
className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"

// Secondary (icon only)
className="p-2 hover:bg-gray-50 rounded-lg transition-colors"

// Tertiary (icon in card)
className="flex-shrink-0 p-2 hover:bg-gray-50 rounded-lg transition-colors"
```

### 12. **Scrollbar Hiding** (Clean Aesthetics)
```tsx
className="scrollbar-hide"
style={{ 
  scrollbarWidth: 'none',      // Firefox
  msOverflowStyle: 'none'      // IE/Edge
}}
```
**CSS (in globals.css):**
```css
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

---

## 🖥️ Web Modal Exclusive Features

### **A. Modal Positioning**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Dimming overlay */}
  {/* Modal content */}
</div>
```

### **B. Compact Multi-Layer Blur Header** 🌟 *(Now Automated via Components)*

#### **System Specifications:**

**Web (100px compact blur):**
- 5 blur layers @ 20px each
- Ends BEFORE content starts (104px)
- Opacity: 85% → 5%
- Blur progression: 2px → 1.5px → 1px → 0.5px → 0.2px

**Mobile (135px compact blur):**
- 5 blur layers @ 27px each
- Ends BEFORE content starts (140px)
- Opacity: 85% → 30% (enhanced transition zone)
- Blur progression: 2px → 1.5px → 1px → 1px → 0.6px

#### **Web Blur Layers (Automated in PageHeader):**
```tsx
// Layer 5 (0-20px): 2px blur - Button zone
// Layer 4 (20-40px): 1.5px blur
// Layer 3 (40-60px): 1px blur
// Layer 2 (60-80px): 0.5px blur
// Layer 1 (80-100px): 0.2px blur - Fade to zero
```

**Opacity Gradient (Web - 100px):**
```tsx
rgba(255,255,255,0.85) 0%
rgba(255,255,255,0.78) 20%
rgba(255,255,255,0.68) 40%
rgba(255,255,255,0.5) 60%
rgba(255,255,255,0.25) 80%
rgba(255,255,255,0.05) 100%
```

#### **Mobile Blur Layers (Automated in PageHeader):**
```tsx
// Layer 5 (0-27px): 2px blur - Button/title zone
// Layer 4 (27-54px): 1.5px blur - Title area
// Layer 3 (54-81px): 1px blur - Below title
// Layer 2 (81-108px): 1px blur - Transition (enhanced)
// Layer 1 (108-135px): 0.6px blur - Pre-content (enhanced)
```

**Opacity Gradient (Mobile - 135px):**
```tsx
rgba(255,255,255,0.85) 0%
rgba(255,255,255,0.78) 20%
rgba(255,255,255,0.68) 40%
rgba(255,255,255,0.62) 60%
rgba(255,255,255,0.58) 80%
rgba(255,255,255,0.3) 100%
```

**Key Insight:** Blur ends BEFORE content begins, ensuring "Saved Events" and other section titles are fully visible and sharp!

**Visual Effect:** Content smoothly fades and blurs as it scrolls under the header - iOS frosted glass effect, but compact and performance-optimized.

### **C. Header Buttons** (Circular Frosted Style)

#### **X Button (Close):**
```tsx
<button
  onClick={() => setShowCenteredSaved(false)}
  className="absolute top-8 left-8 z-10 flex items-center justify-center w-10 h-10 transition-all duration-200 hover:-translate-y-[1px]"
  style={{
    borderRadius: '100px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderWidth: '0.4px',
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
    willChange: 'transform, box-shadow',
    pointerEvents: 'auto'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
  }}
  aria-label="Close"
>
  <X size={20} className="text-gray-900" />
</button>
```

#### **Title (Center):**
```tsx
<h2 className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-xl font-semibold text-gray-900 flex items-center h-10" 
    style={{ pointerEvents: 'auto' }}>
  Saved
</h2>
```

#### **Action Buttons (Right):**
Same style as X button, positioned `top-8 right-8`, gap-3 between them.

### **D. Bottom Blur System** *(Automated in PageContent)*

**Specifications (Same for Web & Mobile):**
- 4 blur layers @ 20px each = 80px total
- Lighter opacity than top
- Blur progression: 0.5px → 0.3px → 0.15px → 0.05px

**Opacity Gradient (80px):**
```tsx
rgba(255,255,255,0.5) 0%    // 50% at bottom
rgba(255,255,255,0.35) 25%
rgba(255,255,255,0.2) 50%
rgba(255,255,255,0.1) 75%
rgba(255,255,255,0) 100%    // Fades to zero
```

**Blur Layers:**
```tsx
// Layer 4 (0-20px from bottom): 0.5px blur
// Layer 3 (20-40px): 0.3px blur
// Layer 2 (40-60px): 0.15px blur
// Layer 1 (60-80px): 0.05px blur - imperceptible
```

**Purpose:** Prevents abrupt content cutoff at bottom, softer than top header. Always included via `<PageContent>`.

---

## 📱 Mobile vs Web Differences (Auto-Handled by Components)

### **Platform Detection**
The `PageHeader` component automatically detects platform and adjusts:

| Feature | Web | Mobile |
|---------|-----|--------|
| **Blur Height** | 100px | 135px |
| **Blur Layers** | 5 × 20px | 5 × 27px |
| **Title Size** | 20px | 22px |
| **Content Padding** | 104px | 140px |
| **Top Padding** | 32px | max(safe-area, 70px) |
| **Opacity Start** | 85% | 85% |
| **Opacity End** | 5% | 30% |

### **Mobile** (`/saved` route - Using Components)
```tsx
export default function SavedPage() {
  const router = useRouter();
  
  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <PageHeader
        title="Saved"
        backButton
        onBack={() => router.back()}
        actions={[...]}
      />
      <PageContent>
        <Saved />
      </PageContent>
    </div>
  );
}
```

**Key Features:**
- Full-screen
- 135px blur zone
- 22px title
- Safe area padding (iOS notch)
- Enhanced transition area blur

### **Web** (Modal in ProfileMenu - Using Components)
```tsx
<div 
  className="bg-white rounded-3xl w-[680px] h-[620px]"
  style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
>
  <PageHeader
    title="Saved"
    backButton={false}
    actions={[...]}
  />
  <PageContent>
    <Saved />
  </PageContent>
</div>
```

**Key Features:**
- Centered modal (680px × 620px)
- 100px blur zone
- 20px title
- Compact design
- Still in dimming overlay (handled by parent modal)

---

## 🧩 Reusable Code Patterns

### **Pattern 1: Standard Card**
```tsx
<div
  className="bg-white rounded-2xl p-4 border border-gray-200 transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
  style={{
    borderWidth: '0.4px',
    borderColor: '#E5E7EB',
    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
    willChange: 'transform, box-shadow'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
  }}
>
  {/* Card content */}
</div>
```

### **Pattern 2: Icon Container**
```tsx
<div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
  <Calendar className="w-6 h-6 text-white" />
</div>
```

### **Pattern 3: Section Layout**
```tsx
<div className="mb-6">
  <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Section Title</h3>
  <div className="space-y-3">
    {items.map((item) => (
      {/* Card */}
    ))}
  </div>
</div>
```

### **Pattern 4: Card Content Structure**
```tsx
<div className="flex items-center gap-3">
  {/* Icon container */}
  <div className="w-12 h-12 bg-gradient-to-br from-[COLOR]-400 to-[COLOR]-600 rounded-xl">
    <Icon />
  </div>
  
  {/* Content (grows to fill space) */}
  <div className="flex-1 min-w-0">
    <h4 className="font-semibold text-gray-900">{title}</h4>
    <p className="text-sm text-gray-500 truncate">{subtitle}</p>
  </div>
  
  {/* Action button (fixed width) */}
  <button className="flex-shrink-0">
    {/* Action */}
  </button>
</div>
```

### **Pattern 5: Circular Action Button (Web Modal)**
```tsx
<button
  className="flex items-center justify-center w-10 h-10 transition-all duration-200 hover:-translate-y-[1px]"
  style={{
    borderRadius: '100px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderWidth: '0.4px',
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
    willChange: 'transform, box-shadow',
    pointerEvents: 'auto'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
  }}
>
  <Icon size={20} className="text-gray-900" />
</button>
```

---

## 📐 Exact Measurements Reference

### Spacing
- **Card padding:** 16px (`p-4`)
- **Card gap:** 12px (`space-y-3`)
- **Section gap:** 24px (`mb-6`)
- **Icon gap:** 12px (`gap-3`)
- **Button gap:** 12px (`gap-3`)
- **Horizontal padding:** 32px (`px-8`)

### Sizes
- **Icon container:** 48px × 48px
- **Icon:** 24px × 24px
- **Small icon:** 16px × 16px
- **Action buttons:** 40px × 40px (circular)
- **Modal width:** 680px
- **Modal height:** 620px

### Radii
- **Cards:** 16px (`rounded-2xl`)
- **Modal:** 24px (`rounded-3xl`)
- **Icon containers:** 12px (`rounded-xl`)
- **Buttons:** 8px (`rounded-lg`)
- **Circular buttons:** 100px (`borderRadius: '100px'`)

### Colors (Hex Values)
```
Orange-600: #FF6600
Orange-400: #FB923C
Orange-700: #C2410C

Gray-900: #111827
Gray-700: #374151
Gray-500: #6B7280
Gray-200: #E5E7EB

Blue-600: #2563EB
Blue-400: #60A5FA

Yellow-500: #EAB308
```

---

## ✅ Implementation Checklist (Updated for Component System)

When creating a new content page:

### **Step 1: Create the Page (5 minutes)**
- [ ] Import `PageHeader` and `PageContent` from `@/components/layout/PageSystem`
- [ ] Add `PageHeader` with title, back button, and optional actions
- [ ] Wrap content in `PageContent`
- [ ] Set CSS variable for platform-specific padding (104px web, 140px mobile)

### **Step 2: Style Your Content (Following Design System)**
- [ ] Use **0.4px borders** on all cards
- [ ] Apply **dual-layer shadows** (outer + inset)
- [ ] Add **hover effects** (-1px translateY + enhanced shadow)
- [ ] Use **gradient icon containers** with appropriate colors
- [ ] Maintain **typography hierarchy**
- [ ] Add **performance hints** (willChange)

### **Step 3: Done!**
- [ ] Blur system: ✅ Automatic
- [ ] Platform detection: ✅ Automatic
- [ ] Safe area padding: ✅ Automatic
- [ ] Bottom blur: ✅ Automatic
- [ ] Scrollbar hiding: ✅ Automatic

---

## 🚀 Pages to Apply This Design To:

1. **Saved** - ✅ **COMPLETE** (using components)
2. **Notifications** - ⏳ Ready to implement (5 mins with components)
3. **Gallery** - ⏳ Ready to implement (5 mins with components)
4. **Achievements** - ⏳ Ready to implement (5 mins with components)
5. **Highlights** - ⏳ Ready to implement (5 mins with components)
6. **Memories** - ⏳ Ready to implement (5 mins with components)
7. **About Me** (if needed)
8. **Timeline** (if redesigning)

**Component Files:**
- `src/components/layout/PageHeader.tsx` - Header with blur system
- `src/components/layout/PageContent.tsx` - Content wrapper with bottom blur
- `src/components/layout/PageSystem.ts` - Export barrel

---

## 💡 Design Philosophy

**Why this works:**
- **Subtle refinement** over bold statements
- **Micro-interactions** create delight
- **Consistent patterns** = learnable interface
- **Performance-first** = smooth experience
- **Mobile-optimized** = safe areas respected
- **Accessible** = good contrast, clear hierarchy

**The goal:** Make Connect feel **premium, modern, and delightful** - like a carefully crafted native iOS app, even on the web.

---

## 📝 Notes

- Design finalized November 2025
- **Component system created November 4, 2025** ✨
- Tested on iOS (iPhone 12-16), works perfectly
- Optimized blur system (5 top + 4 bottom = 9 layers total)
- Better performance than initial 15-layer system
- Uses React 19 + Next.js 15 + Capacitor 7
- All measurements are in pixels for consistency
- Shadow values are empirically tuned for best visual effect

---

## 🎯 Component API Reference

### `<PageHeader>` Props

```tsx
interface PageHeaderProps {
  title: string;              // Page title (required)
  backButton?: boolean;       // Show back button (default: false)
  onBack?: () => void;        // Back button handler
  actions?: ActionButton[];   // Right action buttons (max 2)
  className?: string;         // Additional classes
}

interface ActionButton {
  icon: ReactNode;           // Icon component
  onClick: () => void;       // Click handler
  label: string;             // Accessibility label
  disabled?: boolean;        // Disabled state
}
```

### `<PageContent>` Props

```tsx
interface PageContentProps {
  children: ReactNode;       // Page content (required)
  bottomBlur?: boolean;      // Show bottom blur (default: true)
  className?: string;        // Additional classes
}
```

---

**File Location:** `SAVED_PAGE_DESIGN_SYSTEM.md`  
**Component Location:** `src/components/layout/`  
**Last Updated:** November 4, 2025  
**Status:** ✅ Active Design Standard with Reusable Components

