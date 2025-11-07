# 🔧 Autofill Input Shadow Fix

## Problem
When users select an email/value from browser autocomplete, hover shadows don't work properly on the input field. The lift animation works but shadows remain static.

## Root Cause

### Issue 1: CSS Shadow Layer Ordering
Chrome's `:-webkit-autofill` pseudo-class uses `!important` which overrides JavaScript inline styles.

**CSS Shadow Rendering:**
- Shadows render in the order listed
- **First shadow = Top layer** (most visible)
- **Last shadow = Bottom layer** (can be hidden underneath)

### Issue 2: React State Not Updating
Browser autofill fills the DOM directly without triggering React's `onChange` event.

---

## The Complete Solution

### 1. Fix CSS Shadow Layer Order (`globals.css`)

**❌ Wrong Order:**
```css
input:-webkit-autofill:hover {
  -webkit-box-shadow: 
    inset 0 0 0 30px white,              /* TOP - Massive white fill */
    0 2px 8px rgba(0,0,0,0.06),          /* Outer shadow */
    0 0 1px rgba(100,100,100,0.3),       /* Border glow */
    inset 0 0 2px rgba(27,27,27,0.25)    /* BOTTOM - Hidden! */
  !important;
}
```
**Problem:** The 30px white inset renders OVER the 2px dark inset, hiding it.

**✅ Correct Order:**
```css
input:-webkit-autofill:hover {
  -webkit-box-shadow: 
    inset 0 0 2px rgba(27,27,27,0.25),  /* 1st (TOP) - Dark inner shadow ✓ */
    inset 0 0 0 30px white,              /* 2nd - White fill (hides blue bg) */
    0 2px 8px rgba(0,0,0,0.06),         /* 3rd - Outer depth shadow */
    0 0 1px rgba(100,100,100,0.3)       /* 4th - Border enhancement */
  !important;
}
```

**Apply to all autofill states:**
- `input:-webkit-autofill` (default)
- `input:-webkit-autofill:hover` (hover)
- `input:-webkit-autofill:focus` (focused)
- `input:-webkit-autofill:active` (active)

### 2. Catch Autofill Events in React

**Add `onInput` handler:**
```typescript
<input
  value={email}
  onChange={(e) => setEmail(e.target.value)}   // Normal typing
  onInput={(e) => setEmail((e.target as HTMLInputElement).value)}  // Catches autofill!
/>
```

**Add autofill detection with useEffect:**
```typescript
useEffect(() => {
  const checkAutofill = () => {
    if (emailInputRef.current && emailInputRef.current.value && !email) {
      setEmail(emailInputRef.current.value);
    }
  };
  
  const timer = setTimeout(checkAutofill, 100);  // Delayed check
  
  // Chrome fires animationstart on autofill
  const input = emailInputRef.current;
  if (input) {
    input.addEventListener('animationstart', checkAutofill);
    return () => {
      clearTimeout(timer);
      input.removeEventListener('animationstart', checkAutofill);
    };
  }
  
  return () => clearTimeout(timer);
}, [step, email]);
```

### 3. Use State-Based Hover Tracking

**❌ Don't use direct style manipulation:**
```typescript
onMouseEnter={(e) => {
  e.currentTarget.style.boxShadow = '...';  // Gets overridden by !important
}}
```

**✅ Use state-based approach:**
```typescript
const [emailHovered, setEmailHovered] = useState(false);

<input
  onMouseEnter={() => {
    if (!emailFocused) setEmailHovered(true);
  }}
  onMouseLeave={() => {
    setEmailHovered(false);
  }}
  style={{
    boxShadow: (emailFocused || emailHovered)
      ? '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(100,100,100,0.3), inset 0 0 2px rgba(27,27,27,0.25)'
      : '0 0 1px rgba(100,100,100,0.25), inset 0 0 2px rgba(27,27,27,0.25)'
  }}
/>
```

---

## Complete Implementation Checklist

When adding Connect-style inputs with autofill support:

- [ ] Add `onInput` handler alongside `onChange`
- [ ] Add autofill detection `useEffect` with ref check
- [ ] Use state variable for hover (`const [emailHovered, setEmailHovered] = useState(false)`)
- [ ] Condition style on `(focused || hovered)`
- [ ] Update `globals.css` autofill rules with correct shadow order
- [ ] Ensure `inset 0 0 2px rgba(27,27,27,0.25)` is FIRST in shadow list

---

## Why This Happens

**Browser Autofill Behavior:**
1. Chrome adds `:-webkit-autofill` pseudo-class to autofilled inputs
2. This triggers CSS rules with `!important` (to override site styles)
3. The `!important` beats inline styles from JavaScript
4. You need to fight `!important` with `!important` in your own CSS
5. Shadow layer order matters - browser renders from top to bottom of the list

**The 30px white inset:**
- Purpose: Hides Chrome's default blue autofill background
- Problem: Also hides your subtle inner shadows if ordered wrong
- Solution: Stack your shadows ABOVE the white fill layer

---

## Files Modified

- `src/app/globals.css` (lines 556-580)
- `src/components/auth/LoginModal.tsx` 
- `src/components/auth/SignUpModal.tsx`

---

## Testing

1. Open login/signup modal
2. Click email field
3. Select email from browser autocomplete
4. Blur the field (click outside)
5. Hover over the autofilled input
6. **Expected:** Should see outer shadow (depth) + inner shadow (dark edge)
7. **Should match:** Non-autofilled input hover state exactly

---

## Related Issues

- Browser autofill doesn't trigger React `onChange` immediately
- CSS `!important` in pseudo-classes overrides inline styles
- Multiple inset shadows can hide each other based on order
- Direct DOM manipulation (`e.currentTarget.style.X = Y`) doesn't work with `!important` CSS

---

*Last updated: November 2025*
*Pattern: Connect Design System - Input Autofill*

