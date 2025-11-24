# Chat Page Comparison Analysis

## Key Differences Between Inbox Page and Individual Chat Page

### Inbox Page (`src/app/(personal)/chat/page.tsx`)
✅ **Uses proper design system:**
- Wraps content in `MobilePage` component
- Uses `PageHeader` component with built-in overlay system
- Content uses CSS variable `--saved-content-padding-top` for spacing
- Proper gradient overlay and blur effects

### Individual Chat Page (`src/app/(personal)/chat/individual/page.tsx`)
❌ **Uses custom implementation:**
- No `MobilePage` wrapper
- Custom absolute positioned buttons (back button, profile card)
- Fixed position container
- No proper overlay system
- Manual z-index management

## The Solution: Use Same System

The individual chat page should use:
1. `MobilePage` wrapper
2. `PageHeader` component with:
   - `backButton={true}` with `onBack` handler
   - `leftSection` for profile card
   - Proper overlay system built-in
3. Content wrapped in scrollable container with proper padding

## Benefits
- Consistent design across chat pages
- Proper overlay system (no white background issues)
- Built-in blur and gradient effects
- Proper z-index management
- Cleaner code


