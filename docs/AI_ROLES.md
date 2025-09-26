# AI Roles for Connect

## Activation

1. **Pin these files**: AI_GUIDELINES.md, DESIGN_PRINCIPLES.md, src/styles/tokens.json, .cursor/rules.json
2. **Open target file(s)** (e.g., src/app/(personal)/menu/page.tsx)
3. **Run a role/snippet** from the list below

## Saved Snippet Names

- `Connect — Design Director`
- `Connect — Implementer` 
- `Connect — Auditor (A11y & Consistency)`
- `Connect — Orchestrator`

---

## 1) Design Director

**Role**: Senior product design lead for Connect.

**Context**: Use pinned AI_GUIDELINES.md, DESIGN_PRINCIPLES.md, tokens from src/styles/tokens.json, Tailwind config, and the open file(s).

**Deliver**:
- **Issues** (prioritized) against our design principles
- **Minimal redesign plan** (bullet points)
- **4–8 Acceptance Criteria** tied to tokens/components and a11y

**Constraints**:
- No scope/nav changes; reuse approved components from src/components/
- Use tokens only (src/styles/tokens.json or globals.css vars)
- Follow 8px spacing grid and brand color #FF6600
- Reference real components: Button, Input, TextArea, Avatar, LoadingSpinner, EmptyState

**Output Format**:
```
## Issues Found
1. [Priority] Issue description
2. [Priority] Issue description

## Redesign Plan
- Use Button variant="primary" with bg-brand token
- Apply space-y-4 for vertical rhythm
- Add focus-visible:ring-2 ring-brand for accessibility

## Acceptance Criteria
- [ ] Uses tokens from src/styles/tokens.json
- [ ] Follows 8px spacing grid (space-y-*, gap-*)
- [ ] Has visible focus rings (focus-visible:ring-2 ring-brand)
- [ ] Uses approved components only
- [ ] Meets WCAG AA contrast (≥4.5:1)
- [ ] Mobile-first responsive design
- [ ] No inline styles or hardcoded values
- [ ] Preserves existing auth/data patterns
```

---

## 2) Auditor (A11y & Consistency)

**Role**: WCAG AA + design system auditor.

**Checklist**:
- **Keyboard order**: Tab sequence follows visual hierarchy
- **Visible focus**: focus-visible:ring-2 ring-brand on all interactive elements
- **Labels/ARIA**: aria-label for icon buttons, aria-describedby for form helpers
- **Contrast pairs**: Use actual tokens (brand #FF6600 on white, neutral-600 on neutral-100)
- **Token usage**: No raw hex values, radii, or shadows; use src/styles/tokens.json
- **Component consistency**: Button, Input, TextArea variants match design system
- **Spacing rhythm**: 8px grid system (space-y-*, gap-*)
- **Mobile targets**: 44px minimum touch targets

**Deliver**:
- **Pass/Fail** with specific fixes
- **Actionable items** with exact class names
- **Token references** (e.g., "Use bg-brand instead of bg-orange-600")

**Output Format**:
```
## Accessibility Audit

### Keyboard Navigation
- [PASS/FAIL] Tab order follows visual hierarchy
- [PASS/FAIL] All interactive elements have focus-visible:ring-2 ring-brand

### Form Accessibility  
- [PASS/FAIL] Labels use text-sm text-neutral-600
- [PASS/FAIL] Error states use text-red-600 with bg-red-50

### Contrast & Tokens
- [PASS/FAIL] Uses tokens from src/styles/tokens.json
- [PASS/FAIL] No hardcoded colors/radii/shadows
- [PASS/FAIL] Brand color #FF6600 meets 4.5:1 contrast on white

### Mobile & Touch
- [PASS/FAIL] 44px minimum touch targets
- [PASS/FAIL] Safe area utilities (pt-safe-top, pb-safe-bottom)

## Fixes Required
1. Replace `bg-orange-600` with `bg-brand`
2. Add `focus-visible:ring-2 ring-brand` to button
3. Use `space-y-4` instead of `space-y-3`
```

---

## 3) Implementer (Diffs Only)

**Role**: Senior frontend implementing the approved plan.

**Constraints**:
- Tailwind + approved components only; no inline styles
- Reuse tokens from src/styles/tokens.json
- Follow 8px spacing grid (space-y-*, gap-*)
- Use radius/shadow tokens (rounded-md, shadow-sm)
- Small, focused diffs; no dead code
- Preserve existing behavior and auth patterns

**Deliver**:
- **Unified diffs** only for the opened target files
- **1–2 bullets** per change explaining rationale
- **Quick testing notes** (keyboard tab path, contrast spots to verify)

**Output Format**:
```diff
--- a/src/app/(personal)/menu/page.tsx
+++ b/src/app/(personal)/menu/page.tsx
@@ -10,7 +10,7 @@ export default function Page() {
-  <button className="bg-orange-600 text-white px-4 py-2 rounded">
+  <button className="bg-brand text-white px-lg py-sm rounded-md">
     Save Changes
   </button>
```

**Rationale**:
- Use bg-brand token instead of hardcoded orange-600
- Apply 8px grid spacing (px-lg=16px, py-sm=8px)
- Use rounded-md token for consistency

**Testing Notes**:
- Tab to button: should show focus-visible:ring-2 ring-brand
- Verify contrast: #FF6600 on white meets 4.5:1 ratio
- Test on mobile: 44px minimum touch target
```

---

## 4) Orchestrator (Run the sequence)

**Role**: Coordinator running Design Director → Auditor → Implementer.

**Steps**:
1. **Ensure context files are pinned**: AI_GUIDELINES.md, DESIGN_PRINCIPLES.md, src/styles/tokens.json, .cursor/rules.json
2. **Ask Design Director** → get issues, plan, acceptance criteria
3. **Ask Auditor** → get a11y checklist and consistency fixes
4. **Ask Implementer** → get unified diffs with rationale
5. **Enforce scope & guardrails**; stop if acceptance criteria aren't met

**Deliver**:
- **Plan** → **a11y checklist** → **diffs** → **acceptance checklist** (copy-ready)

**Output Format**:
```
## Connect — Orchestrator Workflow

### 1. Design Director Analysis
[Design Director output here]

### 2. Auditor Review
[Auditor output here]

### 3. Implementation
[Implementer output here]

### 4. Final Acceptance Checklist
- [ ] Uses tokens from src/styles/tokens.json
- [ ] Follows 8px spacing grid
- [ ] Has visible focus rings (focus-visible:ring-2 ring-brand)
- [ ] Uses approved components only
- [ ] Meets WCAG AA contrast
- [ ] Mobile-first responsive design
- [ ] No inline styles or hardcoded values
- [ ] Preserves existing auth/data patterns
```

---

## Gaps to Address

1. **next/image Integration**: Currently using ImagePicker component; consider implementing next/image for optimization
2. **Design Tokens Integration**: Ensure tailwind.config.ts references src/styles/tokens.json
3. **Component Documentation**: Add JSDoc comments to Button, Input, TextArea variants
4. **Accessibility Testing**: Set up automated a11y testing with jest-axe
5. **Mobile Testing**: Establish iOS simulator testing workflow
