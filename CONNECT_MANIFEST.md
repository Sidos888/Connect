# 🌐 CONNECT — Product & Engineering Manifest

**Version:** 1.0 | **Last Updated:** October 12, 2025

## 1. 🌍 Mission Statement

**Connect is the operating system for business and life.**

It brings every part of the real world — events, experiences, communication, and creation — into one seamless system.  
Connect blends clarity, warmth, and speed through a mobile-first experience that empowers people and businesses to live and operate better together.

**Core Objective:**  
To unify how humans connect, create, and collaborate in real life — all through one platform.

### Vision Pillars
1. **Simplicity** — One place to manage life and work. One login, one system.
2. **Connection** — Designed to bring people together, not keep them scrolling.
3. **Empowerment** — Tools that help users take action: book, plan, build, host, grow.
4. **Trust** — Secure by default. Transparent. Human-centered.
5. **Expansion** — Scalable from one person to an entire ecosystem of businesses.

---

## 2. 🎨 Design Principles

### Core Tenets
1. **Mobile-First Always** — Touch-friendly, safe-area aware
2. **8px Grid System** — All spacing multiples of 8px
3. **Purposeful Color** — Orange `#FF6600` for action, neutrals for calm
4. **Typography Hierarchy** — Geist Sans, clear size/weight scale
5. **Accessible by Default** — 4.5:1 contrast, visible focus rings
> **Design Intent:** Every visual, motion, and interaction must express Connect’s philosophy — that this is the OS for life and business. The interface should feel calm, confident, and action-ready, never cluttered or artificial.

### Color System
```css
--color-brand: #FF6600;
--color-neutral-50: #fafafa; --color-neutral-100: #f5f5f5; --color-neutral-200: #e5e5e5;
--color-neutral-500: #737373; --color-neutral-600: #525252; --color-neutral-700: #404040; --color-neutral-900: #171717;
```

### Spacing (8px Grid)
```tsx
xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px, 3xl: 40px, 4xl: 48px
// Use: space-y-*, gap-*, p-4, px-6, py-8
```

### Typography Scale
```tsx
text-xs: 12px, text-sm: 14px, text-base: 16px, text-lg: 18px, text-xl: 20px, text-2xl: 24px
font-normal: 400, font-medium: 500, font-semibold: 600, font-bold: 700
```

### Component Library
```tsx
<Button variant="primary|secondary|ghost|destructive" />
<Input label="Name" className="w-full rounded-md border border-neutral-200" />
<TextArea label="Bio" rows={4} />
<Avatar src={pic} name={name} size="sm|md|lg" />
<LoadingSpinner size="sm|md|lg" />
<EmptyState icon={<Icon />} title="Title" subtitle="Subtitle" action={<Button />} />
```

### States & Feedback
```tsx
// Loading: {loading && <LoadingSpinner size="md" />}
// Error: <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>
// Success: <div className="p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-600">Success</p></div>
// Empty: <EmptyState icon={<Icon />} title="No items" subtitle="Get started" />
```

### Accessibility (WCAG AA)
- Contrast: 4.5:1 minimum
- Focus: `focus-visible:ring-2 ring-brand`
- Touch: 44px minimum targets
- ARIA: `aria-label` for icons, `aria-describedby` for helpers

---

## 3. ⚙️ Backend Principles

### Database (PostgreSQL + Supabase)
- **RLS:** Every table has access control policies
- **Migrations:** SQL files in `/sql/` directory
- **Functions:** Server-side logic via RPCs
- **Real-time:** Postgres LISTEN/NOTIFY

### Core Tables
```sql
auth.users (Supabase managed)
accounts (id, name, bio, profile_pic, connect_id, dob)
account_identities (account_id, auth_user_id, method, identifier)
business_accounts (id, owner_account_id, name, bio, logo_url, is_public)
chats (id, type, name, created_by)
chat_participants (chat_id, user_id, joined_at, last_read_at)
chat_messages (id, chat_id, sender_id, message_text, seq, client_generated_id, status)
connections (requester_id, accepter_id, status)
rate_limits (identifier, ip_address, count, window_start)
auth_audit_log (user_id, action, timestamp)
```

### RLS Patterns
```sql
-- Standard: Users access own data
CREATE POLICY "Users access own data" ON table_name FOR ALL USING (user_id = auth.uid());

-- Chat: Users see messages in chats they participate in
CREATE POLICY "Chat access" ON chat_messages FOR SELECT USING (
  chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid())
);

-- Public: Anyone can read if is_public = true
CREATE POLICY "Public read" ON business_accounts FOR SELECT USING (is_public = true OR owner_id = auth.uid());
```

### Key Functions
```sql
app_normalize_identifier(method, identifier) -- Normalize email/phone
app_can_send_otp(identifier) -- Rate limiting check
app_create_or_link_account(auth_user_id, method, identifier, name) -- Account creation/linking
assign_message_seq() -- Auto-assign sequential numbers
mark_messages_as_read(chat_id, user_id) -- Mark as read
get_latest_seq(chat_id) -- Get latest sequence number
```

---

## 4. 🧩 Architecture & Folder Rules

### Project Structure
```
src/
├── app/ (Next.js App Router)
│   ├── (personal)/ (personal account routes)
│   ├── (business)/ (business account routes)
│   ├── api/ (API routes)
│   ├── globals.css (Tailwind + custom CSS)
│   └── layout.tsx (root layout)
├── components/ (reusable UI)
├── lib/ (business logic)
│   ├── authContext.tsx (auth state)
│   ├── store.ts (Zustand global store)
│   ├── supabaseClient.ts (Supabase config)
│   ├── simpleChatService.ts (chat service)
│   └── types.ts (TypeScript types)
└── state/ (additional state)
```

### Routing Conventions
- Route groups: `(personal)`, `(business)` — shared layouts
- Dynamic routes: `[id]`, `[chatId]` — folder-based params
- Protected routes: Wrap in `<ProtectedRoute>`

### Component Organization
```tsx
// File naming: PascalCase.tsx for components, camelCase.ts for utilities
// Structure:
export default function ComponentName({ prop1, prop2 }: Props) {
  return <div className="...">...</div>;
}
```

### Import Order
```tsx
// 1. External libraries
import React, { useState } from 'react';
// 2. Internal components  
import Button from '@/components/Button';
// 3. Internal utilities
import { useAuth } from '@/lib/authContext';
// 4. Types
import type { Account } from '@/lib/types';
```

### State Management
```tsx
// Global: Zustand store (src/lib/store.ts)
export const useAppStore = create<AppStore>((set) => ({
  personalProfile: null,
  businesses: [],
  setPersonalProfile: (profile) => set({ personalProfile: profile }),
}));

// Auth: Context (src/lib/authContext.tsx)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}

// Local: useState for component state only
```

---

## 5. 🧠 Coding Conventions

### TypeScript
```tsx
// Prefer type over interface for simple shapes
type User = { id: string; name: string; email?: string; };

// Avoid any, use unknown with type guards
function processData(data: unknown) {
  if (typeof data === 'string') { /* type guard */ }
}

// Nullish handling
const name = user?.profile?.name;
const displayName = user?.name ?? 'Anonymous';
const count = items?.length ?? 0; // Not || (0 is falsy)
```

### React Patterns
```tsx
// Functional components only
// Hooks: top-level only, same order
// Event handlers: inline for simple, named for complex
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Complex logic
};
```

### Error Handling
```tsx
// Service layer: Return { data, error } tuple
async function fetchProfile(userId: string): Promise<{ data: Profile | null; error: Error | null; }> {
  try {
    const { data, error } = await supabase.from('accounts').select('*').eq('id', userId).single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// Usage
const { data: profile, error } = await fetchProfile(userId);
if (error) { /* handle error */ }
```

### Async/Await
```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await someAsyncOperation();
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 6. 🧱 Data Model Overview

### Core Entities
```sql
-- User profiles
accounts (id, name, bio, dob, profile_pic, connect_id, created_at, updated_at)

-- Auth linking  
account_identities (id, account_id, auth_user_id, method, identifier, created_at)
-- Links: auth.users ↔ accounts (one account, multiple identities)

-- Business accounts (max 3 per user)
business_accounts (id, owner_account_id, name, bio, logo_url, is_public, created_at, updated_at)

-- Chats & messaging
chats (id, type, name, created_by, created_at, updated_at, last_message_at)
chat_participants (id, chat_id, user_id, joined_at, last_read_at)
chat_messages (id, chat_id, sender_id, message_text, message_type, seq, client_generated_id, status, reply_to_message_id, deleted_at, created_at, updated_at)

-- Social connections
connections (id, requester_id, accepter_id, status, created_at, updated_at)

-- System tables
rate_limits (id, identifier, ip_address, count, window_start, created_at)
auth_audit_log (id, user_id, action, details, timestamp)
```

### Key Concepts
- **Accounts:** User profiles (public read, owner write)
- **Identities:** Link auth methods to accounts (email + phone possible)
- **Business:** Up to 3 per user, public/private visibility
- **Chats:** Direct or group, participants see messages
- **Messages:** Sequential ordering (seq), idempotency (client_generated_id), status tracking
- **Connections:** Unidirectional friendship requests

---

## 7. 🔐 Security Standards

### Authentication Flow
1. User enters email/phone → normalize identifier
2. Check rate limits (5 OTP/15min per identifier, 30/15min per IP)
3. Send OTP via Supabase Auth
4. Verify code → check existing identity
5. If exists: load account; if new: create account + identity

### RLS Examples
```sql
-- Public profiles
CREATE POLICY "Accounts publicly readable" ON accounts FOR SELECT USING (true);
CREATE POLICY "Users update own account" ON accounts FOR UPDATE USING (id = auth.uid());

-- Private messages
CREATE POLICY "Users view their chat messages" ON chat_messages FOR SELECT USING (
  chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid())
);

-- Business accounts
CREATE POLICY "Public business readable" ON business_accounts FOR SELECT USING (is_public = true OR owner_account_id = auth.uid());
```

### Storage Security
```sql
-- Avatars: Public read, authenticated write to own path
CREATE POLICY "Public avatar read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Chat media: Private, participants only
CREATE POLICY "Chat participants access media" ON storage.objects FOR SELECT USING (
  bucket_id = 'chat-media' AND (storage.foldername(name))[1] IN (
    SELECT chat_id::text FROM chat_participants WHERE user_id = auth.uid()
  )
);
```

### Environment Variables
```env
# Public
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Server-side (never commit)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

## 8. ⚡ Performance Guidelines

### Database Optimization
```sql
-- Always index foreign keys and timestamps
CREATE INDEX idx_table_fk_column ON table(fk_column);
CREATE INDEX idx_table_timestamp ON table(timestamp);

-- Chat performance indexes
CREATE INDEX idx_chat_messages_chat_id_seq_desc ON chat_messages(chat_id, seq DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_chat_messages_client_generated ON chat_messages(sender_id, client_generated_id) WHERE client_generated_id IS NOT NULL;
```

### Query Patterns
```tsx
// ✅ Select only needed columns
const { data } = await supabase.from('accounts').select('id, name, profile_pic').eq('id', userId);

// ✅ Keyset pagination for large datasets
const { data } = await supabase.from('chat_messages').select('*').eq('chat_id', chatId).lt('seq', beforeSeq).order('seq', { ascending: false }).limit(50);
```

### Frontend Optimization
```tsx
// Code splitting
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), { loading: () => <LoadingSpinner /> });

// Memoization
const sortedMessages = useMemo(() => messages.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0)), [messages]);
const handleClick = useCallback(() => doSomething(id), [id]);

// Real-time filtering
const channel = supabase.channel('chat-updates').on('postgres_changes', {
  event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}`
}, (payload) => { /* handle */ }).subscribe();
```

### Caching Strategy
```tsx
// Service layer caching (simpleChatService.ts)
private chatMessages: Map<string, SimpleMessage[]> = new Map();
private readonly CACHE_DURATION = 30000; // 30 seconds

// LocalStorage persistence (store.ts)
const STORAGE_KEY = "connect.app.v1";
function saveToLocalStorage(data: PersistedShape) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
```

---

## 9. 💬 Tone & Brand Voice

### Writing Principles
- **Clear:** Plain language, no jargon
- **Warm:** Friendly but professional  
- **Concise:** Respect user's time
- **Inclusive:** Accessible to all backgrounds

### UI Copy Examples
```tsx
// ✅ GOOD
<Button>Save Changes</Button>
<p>Let's set up your profile</p>
<p>Something went wrong. Please try again.</p>
<EmptyState title="No messages yet" subtitle="Start a conversation!" />

// ❌ BAD
<Button>Submission</Button>
<p>Initialize your user account profile configuration</p>
<p>Fatal error: NullPointerException</p>
<EmptyState title="Empty dataset" subtitle="No records found" />
```

### Accessibility Copy
```tsx
// Descriptive ARIA labels
<button aria-label="Close settings modal">×</button>
<button aria-label="Send message"><SendIcon /></button>

// Helper text with IDs
<Input label="Phone" aria-describedby="phone-helper" />
<span id="phone-helper" className="text-xs text-gray-500">We'll send you a verification code</span>
```

---

## 10. 📏 Example Ruleset

### ✅ Correct Style
```tsx
// Button usage
<Button variant="primary" className="w-full">Save Changes</Button>
<Button variant="secondary" className="w-full">Cancel</Button>

// Form structure
<div className="space-y-4">
  <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
  <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full" />
  {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>}
  <Button variant="primary" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
</div>

// Card composition
<div className="p-4 bg-white rounded-lg shadow-sm border border-neutral-200">
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Card Title</h3>
  <p className="text-sm text-neutral-600">Card description</p>
</div>

// Spacing rhythm (8px grid)
<div className="space-y-8"> {/* 32px between sections */}
  <section className="space-y-4"> {/* 16px between items */}
    <h2 className="text-xl font-semibold mb-2">Section Title</h2>
    <div className="space-y-2"> {/* 8px between tight items */}
      <p>Item 1</p><p>Item 2</p>
    </div>
  </section>
</div>
```

### ❌ Incorrect Style
```tsx
// ❌ Avoid inline styles
<button style={{ backgroundColor: '#FF6600', padding: '8px 16px' }}>Save</button>
// ✅ Use components
<Button variant="primary">Save</Button>

// ❌ Avoid hardcoded colors
<div className="bg-[#FF6600] text-white">...</div>
// ✅ Use design tokens
<div className="bg-brand text-white">...</div>

// ❌ Avoid inconsistent spacing
<div className="space-y-3"><div className="mb-5">...</div><div className="mt-7">...</div></div>
// ✅ Use consistent 8px rhythm
<div className="space-y-4"><div>...</div><div>...</div></div>

// ❌ Avoid raw data in UI
<p>{user.created_at}</p> // "2025-10-12T14:30:00Z"
// ✅ Format for display
<p>{formatDate(user.created_at)}</p> // "Oct 12, 2025"
```

---

## 11. 🕹️ Maintenance Guidelines

### Code Review Checklist
- [ ] Uses design tokens (no hardcoded colors/spacing)
- [ ] Follows 8px spacing grid
- [ ] Has visible focus rings (`focus-visible:ring-2 ring-brand`)
- [ ] Uses approved components (`Button`, `Input`, etc.)
- [ ] Meets WCAG AA contrast (≥4.5:1)
- [ ] Mobile-first responsive design
- [ ] No inline styles
- [ ] Proper error handling
- [ ] TypeScript types defined
- [ ] ESLint passes
- [ ] Real-time subscriptions cleaned up

### Refactoring Priorities
**High:** Image optimization (`next/image`), design tokens file, component docs, a11y testing, performance monitoring
**Medium:** Dark mode support, icon system, animation system, SEO optimization, error boundaries  
**Low:** Storybook, E2E tests, bundle analyzer, PWA support

### Testing Strategy
```bash
npm run test            # Run tests
npm run test:ui         # Interactive UI  
npm run test:coverage   # Coverage report
```

```tsx
// Unit tests (Vitest)
import { describe, it, expect } from 'vitest';
import { formatNameForDisplay } from '../utils';

describe('formatNameForDisplay', () => {
  it('formats first name only', () => {
    expect(formatNameForDisplay('John')).toBe('John');
  });
});
```

### Deployment Workflow
```bash
npm run lint && npm run test:run && npm run build && npm run start
npx cap sync ios && npx cap sync android
```

### Documentation Standards
```tsx
/**
 * Button component with variant support
 * @param variant - Button style: 'primary' | 'secondary' | 'ghost' | 'destructive'
 * @param children - Button content
 * @example <Button variant="primary">Save Changes</Button>
 */
export default function Button({ variant = "primary", className, ...rest }: Props) {
  // ...
}
```

---

## 🎯 Summary

**Connect is built on these foundations:**

1. **Mobile-first design** — Touch-friendly, safe-area aware, Capacitor 7
2. **Clean design system** — 8px grid, brand orange, Geist Sans, WCAG AA
3. **Supabase backend** — PostgreSQL + RLS, real-time, storage, auth
4. **Type-safe TypeScript** — Strict mode, no `any`, proper error handling
5. **Component consistency** — Reusable `Button`, `Input`, `Avatar`, etc.
6. **Passwordless auth** — OTP flows with intelligent identity linking
7. **Real-time messaging** — Idempotent sends, offline queue, delivery tracking
8. **Security-first** — RLS policies, rate limiting, path discipline
9. **Performance-optimized** — Caching, pagination, code splitting
10. **Human-centered tone** — Clear, warm, inclusive copy

**When in doubt, ask:**
- Does this follow the 8px grid?
- Does this use design tokens?
- Is this accessible (WCAG AA)?
- Is this mobile-friendly (44px touch targets)?
- Is this secure (RLS policies)?
- Is this consistent with existing patterns?

**This manifest is the source of truth for building Connect. Follow it religiously.**

---

## 🐛 **12. Debugging Protocol**

Before writing any fix, follow this protocol:

### **The Five-Step Debug Process**

1. **Reproduce** — Can you make the bug happen 100% of the time?
2. **Isolate** — Remove code until the bug disappears (binary search approach)
3. **Understand** — Write down the root cause in plain English
4. **Fix** — Only now write code that addresses the root cause
5. **Verify** — Test that ONLY this bug is fixed (no side effects)

### **Red Flags (Stop and Rethink)**

- ❌ "I'm not sure why this fixes it, but it does"
- ❌ "This is a workaround until we figure out the real issue"
- ❌ "It works on my machine"
- ❌ Adding more code to fix a bug caused by too much code

### **Green Flags (Good to Proceed)**

- ✅ "The bug happens because X, and this fix addresses X directly"
- ✅ "I removed 50 lines and the bug disappeared"
- ✅ "I can explain this fix to a non-technical person"
- ✅ The fix makes the code simpler, not more complex

### **The Three Strikes Rule**

If you fix the same bug three times, the fourth attempt should be a refactor, not another fix.

**Example:**
- Strike 1: "Double messages" → Try callback fix
- Strike 2: "Still double messages" → Try memoization fix
- Strike 3: "STILL double messages" → Try force cleanup fix
- **Strike 4: STOP. Refactor the entire subscription system.**

---

## 📏 **13. Complexity Budget**

Prevent code from becoming unmaintainable by enforcing hard limits.

### **File Size Limits**

- **Service files** (e.g., `simpleChatService.ts`): **300 lines max**
- **Component files**: **200 lines max**
- **Utility files**: **100 lines max**
- **Hook files**: **50 lines max**

### **Function Complexity Limits**

- **Max 3 levels of nesting** (if/for/while)
- **Max 5 parameters** per function
- **Max 30 lines** per function
- **Max 3 responsibilities** per function

### **If You Exceed These Limits**

1. **Split into multiple files** — Group related functions
2. **Extract helper functions** — Break down complex logic
3. **Simplify logic** — Remove unnecessary abstraction

### **Example: Bad vs. Good**

```typescript
// ❌ BAD: 80-line function with 5 nested ifs and 7 parameters
function handleMessage(msg, user, chat, opts, flags, meta, ctx) {
  if (user) {
    if (chat) {
      if (opts.validate) {
        if (flags.enabled) {
          if (meta.timestamp) {
            // ... 70 more lines ...
          }
        }
      }
    }
  }
}

// ✅ GOOD: 3 small, focused functions
function validateMessage(msg: Message): boolean {
  return msg.text.length > 0 && msg.text.length < 1000;
}

function enrichMessage(msg: Message, user: User): EnrichedMessage {
  return { ...msg, sender: user, timestamp: Date.now() };
}

function saveMessage(msg: EnrichedMessage, chatId: string): Promise<void> {
  return supabase.from('chat_messages').insert(msg);
}
```

### **Monthly Complexity Audit**

Run this checklist on the 1st of every month:

- [ ] Any file over 300 lines? → Split it
- [ ] Any function over 30 lines? → Break it down
- [ ] Any component doing 3+ things? → Separate concerns
- [ ] Any "TODO" or "FIXME" older than 2 weeks? → Do it now or delete it
- [ ] Any code you can't explain in one sentence? → Simplify it

---

## ✂️ **14. Simplification Checklist**

### **The Delete-First Principle**

When fixing a bug, ask: **"What can I remove?"** before asking "What can I add?"

**Example:**
- ❌ Bad approach: "Add subscription tracking to prevent duplicates"
- ✅ Good approach: "Remove the second place that's subscribing"

### **Weekly Code Review (5 Minutes)**

Every Friday, ask yourself:

1. **What's the longest file?** (Should be under 500 lines)
2. **What's the most complex function?** (Should be explainable in 2 sentences)
3. **What would I refactor if I had 2 hours?** (There should always be an answer)

### **Monthly Simplification Sprint (4 Hours)**

Once a month, dedicate 4 hours to:

- [ ] **Delete unused code** — Remove commented-out code, unused imports, dead functions
- [ ] **Combine duplicate logic** — DRY (Don't Repeat Yourself) violations
- [ ] **Split big files** — Any file over 300 lines gets broken down
- [ ] **Remove "temporary" workarounds** — If it's been there 2+ weeks, make it permanent or delete it
- [ ] **Update documentation** — README, comments, manifest

### **The "Explain It Back" Rule**

When implementing a feature or fix:

1. **Explain what you did in plain English** (no jargon)
2. **Show the before/after line count** (should go down, not up)
3. **Demonstrate it working** (with screenshots or video)

If you can't do all three clearly, it's probably too complex.

### **Architecture Review Questions**

Ask these quarterly:

- [ ] Any singleton patterns? → Can we inject dependencies instead?
- [ ] Any global state? → Can we use local state?
- [ ] Any complex caching? → Can we simplify or remove it?
- [ ] Any "clever" code? → Can we make it obvious instead?
- [ ] Any files with multiple responsibilities? → Can we split them?

---

**This manifest is the source of truth for building Connect. Follow it religiously.**

---

**End of CONNECT_MANIFEST**
