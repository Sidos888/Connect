# Connect Page Design System
## The Standard for All Content Pages in Connect

Created: November 2025  
Status: **Design Framework - Apply to all content pages**

---

## 📋 Overview

The Saved page represents the **signature design language** for Connect. This document defines the exact patterns, measurements, and code to replicate across all content pages (Notifications, Gallery, Achievements, Highlights, Memories, etc.).

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

### **B. Revolutionary Multi-Layer Blur Header** 🌟

#### **Structure:**
```tsx
<div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
  {/* Opacity gradient layer */}
  {/* 5 blur layers with decreasing intensity */}
  {/* Header buttons and title */}
</div>
```

#### **Opacity Gradient Layer (104px height):**
```tsx
height: '104px'
background: 'linear-gradient(to bottom, 
  rgba(255,255,255,0.98) 0%,
  rgba(255,255,255,0.92) 10%,
  rgba(255,255,255,0.85) 20%,
  rgba(255,255,255,0.75) 30%,
  rgba(255,255,255,0.6) 40%,
  rgba(255,255,255,0.45) 50%,
  rgba(255,255,255,0.3) 60%,
  rgba(255,255,255,0.2) 75%,
  rgba(255,255,255,0.12) 90%,
  rgba(255,255,255,0.05) 100%
)'
```

#### **5-Layer Progressive Blur:**
```tsx
// Layer 5 (0-20px): 2px blur - Button zone
<div className="absolute top-0 left-0 right-0" style={{
  height: '20px',
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)'
}} />

// Layer 4 (20-35px): 1.5px blur
<div className="absolute left-0 right-0" style={{
  top: '20px',
  height: '15px',
  backdropFilter: 'blur(1.5px)',
  WebkitBackdropFilter: 'blur(1.5px)'
}} />

// Layer 3 (35-55px): 1px blur
<div className="absolute left-0 right-0" style={{
  top: '35px',
  height: '20px',
  backdropFilter: 'blur(1px)',
  WebkitBackdropFilter: 'blur(1px)'
}} />

// Layer 2 (55-80px): 0.5px blur
<div className="absolute left-0 right-0" style={{
  top: '55px',
  height: '25px',
  backdropFilter: 'blur(0.5px)',
  WebkitBackdropFilter: 'blur(0.5px)'
}} />

// Layer 1 (80-104px): 0.2px blur - Fade out
<div className="absolute left-0 right-0" style={{
  top: '80px',
  height: '24px',
  backdropFilter: 'blur(0.2px)',
  WebkitBackdropFilter: 'blur(0.2px)'
}} />
```

**Visual Effect:** Content smoothly fades and blurs as it scrolls under the header - iOS frosted glass effect.

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

### **D. Bottom Blur System** (Lighter than top)

```tsx
<div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
  {/* Opacity gradient - LIGHTER than top */}
  <div className="absolute bottom-0 left-0 right-0" style={{
    height: '80px',  // Shorter than top (104px)
    background: 'linear-gradient(to top, 
      rgba(255,255,255,0.5) 0%,      // 50% instead of 98%
      rgba(255,255,255,0.42) 12%,
      rgba(255,255,255,0.35) 25%,
      rgba(255,255,255,0.28) 40%,
      rgba(255,255,255,0.2) 60%,
      rgba(255,255,255,0.12) 80%,
      rgba(255,255,255,0.05) 100%
    )'
  }} />
  
  {/* 3-layer blur (lighter than top) */}
  {/* Bottom 0-20px: 1px blur */}
  {/* 20-40px: 0.5px blur */}
  {/* 40-60px: 0.2px blur */}
</div>
```

**Purpose:** Prevents abrupt content cutoff at bottom, softer than top header.

---

## 📱 Mobile vs Web Differences

### **Mobile** (`/saved` route)
```tsx
<div className="fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col">
  {/* Header */}
  <div className="bg-white px-4" style={{ 
    paddingTop: 'max(env(safe-area-inset-top), 70px)', 
    paddingBottom: '16px' 
  }}>
    <div className="relative w-full h-14 flex items-center justify-center">
      {/* Back button (left) */}
      <button className="absolute left-0 action-btn-circle">
        <ChevronLeftIcon />
      </button>
      {/* Title (center) */}
      <h1 className="font-semibold text-[18px] leading-6 text-gray-900 text-center">
        Saved
      </h1>
    </div>
  </div>
  
  {/* Content */}
  <Saved />
</div>
```

**Key Features:**
- Full-screen (`fixed inset-0`)
- Simple header (back button + title)
- Safe area padding
- No overlay, no blur effects

### **Web** (Modal in ProfileMenu)
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Dark overlay */}
  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />
  
  {/* Modal card */}
  <div className="bg-white rounded-3xl w-full max-w-[680px] h-[620px]">
    {/* Top blur header */}
    {/* Content */}
    {/* Bottom blur */}
  </div>
</div>
```

**Key Features:**
- Centered modal (680px × 620px)
- Dark dimming overlay (50% black)
- Multi-layer blur header
- Circular action buttons
- Bottom blur fade

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

## ✅ Implementation Checklist

When creating a new content page, ensure:

- [ ] **Mobile route** created in `src/app/(personal)/[name]/page.tsx`
- [ ] **Component** created in `src/components/[name]/[Name].tsx`
- [ ] **Web modal** added to `ProfileMenu.tsx`
- [ ] **0.4px borders** on all cards
- [ ] **Dual-layer shadows** (outer + inset)
- [ ] **Hover effects** (-1px translateY + enhanced shadow)
- [ ] **Gradient icon containers** with appropriate colors
- [ ] **Multi-layer blur header** on web modal
- [ ] **Bottom blur fade** on web modal
- [ ] **Safe area padding** on mobile
- [ ] **Scrollbar hidden**
- [ ] **Typography hierarchy** maintained
- [ ] **Performance optimization** (willChange)

---

## 🚀 Pages to Apply This Design To:

1. **Notifications** - ✅ Ready to implement
2. **Gallery** - ✅ Ready to implement
3. **Achievements** - ✅ Ready to implement
4. **Highlights** - ✅ Ready to implement
5. **Memories** - ✅ Ready to implement
6. **About Me** (if needed)
7. **Timeline** (if redesigning)

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

- This design was finalized November 2025
- Tested on iOS, works perfectly
- Uses React 19 + Next.js 15 + Capacitor 7
- All measurements are in pixels for consistency
- Shadow values are empirically tuned for best visual effect

---

**File Location:** `SAVED_PAGE_DESIGN_SYSTEM.md`  
**Last Updated:** November 4, 2025  
**Status:** Active Design Standard

