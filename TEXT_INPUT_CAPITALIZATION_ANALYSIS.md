# Text Input Capitalization Analysis

## Issue Report
- **Mac Simulator**: Text input shows all caps
- **Phone (iOS)**: Text input shows no caps (all lowercase)
- **Desired**: Normal capitalization (initial cap at start of sentence, lowercase rest, unless caps lock is on)

## Current System Analysis

### 1. GlobalInputFix Component
**Location:** `src/components/GlobalInputFix.tsx`

**Key Behavior:**
- **Only runs on iOS devices** (line 12): Checks for `iPad|iPhone|iPod` in user agent
- **Mac Simulator**: This component does NOT run (not detected as iOS)
- **Phone (iOS)**: This component DOES run

**What it does:**
1. **For textareas** (lines 60-63, 261-268):
   - **Removes `autocapitalize` attribute entirely**
   - Lets iOS use its "default" behavior
   - This is causing all lowercase on phone

2. **For inputs** (lines 65-66, 272-273):
   - **Sets `autocapitalize="off"`**
   - Prevents any capitalization
   - This might be causing all caps on simulator

3. **Complex caps lock inversion logic** (lines 99-184):
   - Attempts to fix iOS caps lock inversion bug
   - Intercepts keyboard events and corrects case
   - May be interfering with normal behavior

### 2. Individual Input Settings

**Fields with `autoCapitalize="words"`** (correct for names):
- `src/components/settings/EditPersonalDetails.tsx` (line 231)
- `src/app/(personal)/settings/edit/details/page.tsx` (line 189)
- `src/components/settings/EditProfileLanding.tsx` (line 439)
- `src/app/(personal)/highlights/create/page.tsx` (line 703)
- `src/components/listings/EditListingDetailsView.tsx` (line 1093)
- `src/app/(personal)/my-life/create/page.tsx` (line 865)

**Fields that remove `autocapitalize`**:
- Chat textareas (removed in `onFocus` handlers)
- Various inputs in `EditListingDetailsView.tsx` (line 1389)

### 3. CSS Settings
**Location:** `src/app/globals.css` (lines 573-574)
```css
text-transform: none !important;
-webkit-text-transform: none !important;
```
- Prevents CSS-based capitalization (correct)

## Root Cause

### Problem 1: Platform-Specific Behavior
- **Mac Simulator**: `GlobalInputFix` doesn't run → inputs might default to all caps
- **Phone (iOS)**: `GlobalInputFix` removes `autocapitalize` → defaults to all lowercase

### Problem 2: Wrong Default Settings
- **Textareas**: Should use `autocapitalize="sentences"` for normal sentence capitalization
- **Regular text inputs**: Should use `autocapitalize="sentences"` for normal behavior
- **Name inputs**: Already correct with `autocapitalize="words"`

### Problem 3: Over-Complex Logic
- The caps lock inversion fix might be interfering with normal behavior
- Removing `autocapitalize` entirely prevents iOS from using its built-in sentence capitalization

## Solution

### Recommended Fix:
1. **Set `autocapitalize="sentences"` for textareas** (normal sentence capitalization)
2. **Set `autocapitalize="sentences"` for regular text inputs** (unless they're names)
3. **Keep `autocapitalize="words"` for name fields** (already correct)
4. **Simplify or remove the caps lock inversion logic** if it's causing issues
5. **Make behavior consistent across platforms** (simulator and device)

### Implementation:
- Update `GlobalInputFix` to set `autocapitalize="sentences"` instead of removing it
- Or remove `GlobalInputFix` entirely and set proper `autocapitalize` attributes directly on inputs
- Ensure consistent behavior on both simulator and device

## Current State Summary

| Platform | GlobalInputFix Running? | Textarea Behavior | Input Behavior | Result |
|----------|------------------------|-------------------|----------------|--------|
| Mac Simulator | ❌ No | Default (might be all caps) | Default (might be all caps) | **All caps** |
| Phone (iOS) | ✅ Yes | `autocapitalize` removed → lowercase | `autocapitalize="off"` → no caps | **No caps** |

## Desired State

| Platform | Textarea Behavior | Input Behavior | Result |
|----------|-------------------|----------------|--------|
| All | `autocapitalize="sentences"` | `autocapitalize="sentences"` | **Normal capitalization** (initial cap at sentence start, lowercase rest) |
| Name fields | `autocapitalize="words"` | `autocapitalize="words"` | **Capitalize each word** (for names) |
