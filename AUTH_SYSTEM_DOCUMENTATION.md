# Connect - Authentication System Documentation

**Last Updated:** October 12, 2025  
**Version:** Current Production System

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [Core Components](#core-components)
6. [Account Management](#account-management)
7. [Security & RLS Policies](#security--rls-policies)
8. [Storage & File Upload](#storage--file-upload)
9. [Mobile Support](#mobile-support)
10. [Known Issues & Workarounds](#known-issues--workarounds)
11. [Environment Configuration](#environment-configuration)

---

## System Overview

### Technology Stack
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Mobile:** Capacitor 7 (iOS + Android)
- **State Management:** Zustand (via store.ts)
- **Authentication:** Supabase Auth with OTP (Email & Phone)

### Authentication Methods
1. **Email OTP** - One-time password sent to email
2. **Phone OTP** - SMS verification code (SMS not configured yet, uses test mode)

### Key Design Decisions
- **Dual Identity System:** Separates auth identities (`auth.users`) from user profiles (`accounts` table)
- **Identity Linking:** `account_identities` table maps multiple auth methods to single user profiles
- **No Passwords:** Passwordless authentication only (OTP-based)
- **Mobile-First:** Built with Capacitor for native iOS/Android support
- **Session Persistence:** Uses localStorage with mobile-compatible storage adapter

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                      │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ LoginModal │  │ SignUpModal │  │ VerificationModal    │ │
│  └────────────┘  └─────────────┘  └──────────────────────┘ │
│         │                │                    │              │
│         └────────────────┴────────────────────┘              │
│                          │                                   │
│                  ┌───────▼────────┐                          │
│                  │  AuthContext   │ (authContext.tsx)        │
│                  │  AuthProvider  │                          │
│                  └───────┬────────┘                          │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         │                │                │                 │
│  ┌──────▼─────┐   ┌─────▼──────┐  ┌─────▼──────┐          │
│  │   User     │   │  Account   │  │  Loading   │          │
│  │   State    │   │   State    │  │   State    │          │
│  └────────────┘   └────────────┘  └────────────┘          │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │   Supabase Client         │ (supabaseClient.ts)
         │   - Auth                  │
         │   - Database              │
         │   - Storage               │
         │   - Realtime              │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
         │      Supabase Backend     │
         │                           │
         │  ┌─────────────────────┐  │
         │  │   auth.users        │  │ (Supabase Auth table)
         │  │   - id (UUID)       │  │
         │  │   - email           │  │
         │  │   - phone           │  │
         │  └─────────────────────┘  │
         │           │                │
         │  ┌────────▼──────────────┐ │
         │  │ account_identities   │ │ (Linking table)
         │  │  - account_id        │ │
         │  │  - auth_user_id      │ │
         │  │  - method            │ │
         │  │  - identifier        │ │
         │  └────────┬─────────────┘ │
         │           │                │
         │  ┌────────▼──────────────┐ │
         │  │     accounts         │ │ (User profiles)
         │  │  - id (UUID)         │ │
         │  │  - name              │ │
         │  │  - bio               │ │
         │  │  - profile_pic       │ │
         │  │  - connect_id        │ │
         │  │  - dob               │ │
         │  └──────────────────────┘ │
         └───────────────────────────┘
```

### Data Flow

**Sign Up / Login Flow:**
```
1. User enters email/phone → LoginModal/SignUpModal
2. Frontend calls sendEmailVerification() or sendPhoneVerification()
3. AuthContext calls supabase.auth.signInWithOtp()
4. Supabase sends OTP to email/phone
5. User enters OTP code
6. Frontend calls verifyEmailCode() or verifyPhoneCode()
7. AuthContext verifies OTP with Supabase
8. Check if account exists via account_identities table
9a. IF EXISTS: Load account and redirect to app
9b. IF NEW: Show account creation form (name, bio, avatar)
10. Create account record in accounts table
11. Create identity link in account_identities table
12. Redirect to home page
```

**Session Management:**
```
1. On app load, AuthProvider initializes
2. Calls supabase.auth.getSession()
3. If session exists, calls loadAccountForUser(user.id)
4. Queries account_identities to find account
5. Loads full account data from accounts table
6. Sets user + account state
7. Syncs account to Zustand store (personalProfile)
8. Real-time listener updates profile changes
```

---

## Database Schema

### 1. `auth.users` (Supabase Managed)
**Purpose:** Supabase's internal authentication table (managed automatically)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auth user ID |
| `email` | TEXT | User's email address |
| `phone` | TEXT | User's phone number |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `confirmed_at` | TIMESTAMPTZ | Email/phone verification timestamp |

**Notes:**
- Automatically managed by Supabase Auth
- One row per authentication identity
- Users never directly query this table

### 2. `accounts` (Custom User Profiles)
**Purpose:** Stores actual user profile data

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    dob DATE,
    profile_pic TEXT,
    connect_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique account ID |
| `name` | TEXT | NOT NULL | User's display name |
| `bio` | TEXT | | User bio (max 150 chars in UI) |
| `dob` | DATE | | Date of birth (optional) |
| `profile_pic` | TEXT | | URL to avatar image in storage |
| `connect_id` | TEXT | UNIQUE | Unique username/handle |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Account creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update time |

**Indexes:**
```sql
CREATE INDEX idx_accounts_connect_id ON accounts(connect_id);
```

**Triggers:**
```sql
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. `account_identities` (Identity Linking)
**Purpose:** Maps authentication methods to user accounts (many-to-one)

```sql
CREATE TABLE account_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method TEXT NOT NULL, -- 'email', 'phone', 'google', 'apple'
    identifier TEXT NOT NULL, -- email address, phone number, etc.
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(auth_user_id),
    UNIQUE(method, identifier)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identity record ID |
| `account_id` | UUID | FK → accounts(id) | Links to user's account |
| `auth_user_id` | UUID | FK → auth.users(id), UNIQUE | Links to Supabase auth user |
| `method` | TEXT | NOT NULL | Auth method (email/phone/google/apple) |
| `identifier` | TEXT | NOT NULL | Email address, phone number, etc. |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | When identity was linked |

**Unique Constraints:**
- `UNIQUE(auth_user_id)` - One auth user can only link to one account
- `UNIQUE(method, identifier)` - One email/phone can only exist once per method

**Indexes:**
```sql
CREATE INDEX idx_account_identities_auth_user_id ON account_identities(auth_user_id);
CREATE INDEX idx_account_identities_account_id ON account_identities(account_id);
CREATE INDEX idx_account_identities_method_identifier ON account_identities(method, identifier);
```

**Why This Design?**
- Allows users to link multiple auth methods (email + phone) to one account
- Prevents duplicate accounts when user signs in with different methods
- Enables "forgot password" flows by linking new auth to existing account
- Supports future OAuth providers (Google, Apple, etc.)

### 4. `connections` (Friend Relationships)
**Purpose:** Instagram-style bidirectional friend connections

```sql
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, connected_user_id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_connections_user_id ON connections(user_id);
CREATE INDEX idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX idx_connections_status ON connections(status);
```

### 5. Storage Buckets

#### `avatars` Bucket
**Purpose:** Store user profile pictures

- **Access:** Public read, authenticated write
- **Path Structure:** `avatars/{account_id}.{ext}`
- **Max Size:** Default Supabase limits
- **Allowed Types:** Images (jpg, png, webp, etc.)

**Storage Policies:**
```sql
-- Upload policy
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- View policy
CREATE POLICY "Authenticated users can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Update policy
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Delete policy
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

---

## Authentication Flow

### Email Authentication Flow

#### Step 1: User Enters Email
```typescript
// LoginModal.tsx or SignUpModal.tsx
const [email, setEmail] = useState('');

// User types email: "user@example.com"
```

#### Step 2: Send OTP
```typescript
// User clicks "Continue" button
const handleSendCode = async () => {
  setLoading(true);
  
  // Call authContext method
  const { error } = await sendEmailVerification(email);
  
  if (error) {
    setError(error.message);
    return;
  }
  
  // Show verification step
  setStep('verify');
  setVerificationMethod('email');
};
```

**Backend Implementation (authContext.tsx):**
```typescript
const sendEmailVerification = async (email: string) => {
  // Rate limiting check (30 seconds between requests)
  const lastEmailTime = localStorage.getItem('lastEmailVerification');
  const now = Date.now();
  const RATE_LIMIT_MS = 30000; // 30 seconds

  if (lastEmailTime && (now - parseInt(lastEmailTime)) < RATE_LIMIT_MS) {
    const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - parseInt(lastEmailTime))) / 1000);
    return { error: new Error(`Please wait ${remainingSeconds} seconds before sending another verification email`) };
  }

  try {
    // Call Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: { 
        emailRedirectTo: undefined,
        shouldCreateUser: true // Allow new user creation
      }
    });

    if (error) throw error;
    
    // Store timestamp of successful email send
    localStorage.setItem('lastEmailVerification', now.toString());
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

#### Step 3: User Enters OTP Code
```typescript
// VerificationModal.tsx
const [code, setCode] = useState(['', '', '', '', '', '']);

// User types 6-digit code: "123456"
```

#### Step 4: Verify OTP
```typescript
const handleVerify = async () => {
  const codeString = code.join('');
  setLoading(true);
  
  // Call verifyEmailCode
  const { error, isExistingAccount, tempUser } = await verifyEmailCode(email, codeString);
  
  if (error) {
    setError(error.message);
    return;
  }
  
  if (isExistingAccount) {
    // Existing user - redirect to home
    onClose();
    router.push('/');
  } else {
    // New user - show account creation
    // (handled in LoginModal/SignUpModal)
  }
};
```

**Backend Implementation (authContext.tsx):**
```typescript
const verifyEmailCode = async (email: string, code: string) => {
  try {
    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    });

    if (error) {
      // Handle expired/invalid tokens
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        return { error: new Error('Verification code has expired. Please request a new code.') };
      }
      throw error;
    }
    
    if (!data.user) throw new Error('No user returned from verification');

    // Check if this email is already linked to an account
    const { exists, account } = await checkExistingAccount(email);
    
    if (exists && account) {
      // EXISTING USER FLOW
      console.log('👤 Found existing account for email');
      
      // Set the account immediately
      setAccount(account);
      
      // Ensure identity mapping exists
      await supabase
        .from('account_identities')
        .upsert({
          account_id: account.id,
          auth_user_id: data.user.id,
          method: 'email',
          identifier: email.toLowerCase()
        }, { 
          onConflict: 'account_id,auth_user_id,method,identifier',
          ignoreDuplicates: false 
        });
      
      // Load account data
      await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
      await loadAccountForUser(data.user.id);
      
      return { error: null, isExistingAccount: true };
    } else {
      // NEW USER FLOW
      console.log('🆕 New user, will need to create account');
      return { 
        error: null, 
        isExistingAccount: false,
        tempUser: { email, authUserId: data.user.id }
      };
    }
  } catch (error) {
    return { error: error as Error };
  }
};
```

#### Step 5: Check for Existing Account
```typescript
const checkExistingAccount = async (email?: string, phone?: string) => {
  try {
    // Query account_identities table
    let query = supabase
      .from('account_identities')
      .select(`
        account_id,
        accounts (
          id,
          name,
          bio,
          dob,
          profile_pic,
          connect_id,
          created_at,
          updated_at
        )
      `);

    if (email) {
      query = query.eq('method', 'email').eq('identifier', email);
      
      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data?.accounts) {
        return { exists: true, account: data.accounts as Account, error: null };
      }
    }

    return { exists: false, account: null, error: null };
  } catch (error) {
    return { exists: false, error: error as Error };
  }
};
```

#### Step 6a: Existing User - Load Account
```typescript
const loadAccountForUser = async (authUserId: string) => {
  // Strategy 1: Try email identity linking
  if (email) {
    const { data: emailLink } = await supabase
      .from('account_identities')
      .select(`account_id, accounts!account_id(*)`)
      .eq('method', 'email')
      .eq('identifier', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (emailLink?.accounts) {
      setAccount(emailLink.accounts);
      return;
    }
  }

  // Strategy 2: Try phone identity linking
  // Strategy 3: Try auth_user_id mapping
  // Strategy 4: Try direct account lookup by ID
  // Strategy 5: Create new account if none found
};
```

#### Step 6b: New User - Create Account
```typescript
// Show account creation form in LoginModal
const handleCreateAccount = async () => {
  const { error } = await createAccount({
    name: userName,
    email: email,
    bio: userBio
  });
  
  if (error) {
    setError(error.message);
    return;
  }
  
  // Redirect to home
  router.push('/');
};
```

**Backend Implementation (authContext.tsx):**
```typescript
const createAccount = async (userData: { 
  name: string; 
  email?: string; 
  phone?: string; 
  bio?: string; 
  dob?: string 
}) => {
  // Create local account object first (optimistic UI)
  const newAccount = {
    id: user?.id || 'temp-id',
    name: userData.name,
    bio: userData.bio || '',
    dob: userData.dob || null,
    profile_pic: '',
    connect_id: generateConnectId(userData.name),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Set account state immediately
  setAccount(newAccount);
  
  // Save to database in background
  if (supabase && user) {
    (async () => {
      try {
        const result = await supabase
          .from('accounts')
          .insert([{
            name: userData.name,
            bio: userData.bio || '',
            dob: userData.dob || null,
            connect_id: newAccount.connect_id
          }])
          .select('*')
          .single();

        if (result.data) {
          // Create identity link
          const primaryMethod = userData.email ? 'email' : 'phone';
          const primaryIdentifier = userData.email || userData.phone;
          
          if (primaryIdentifier) {
            await supabase
              .from('account_identities')
              .insert({
                account_id: result.data.id,
                auth_user_id: user.id,
                method: primaryMethod,
                identifier: primaryIdentifier
              });
          }
        }
      } catch (error) {
        console.error('Background save failed:', error);
      }
    })();
  }
  
  return { error: null };
};
```

### Phone Authentication Flow

**Similar to email flow, with these differences:**

#### Phone Number Formatting
```typescript
// User input: "0466 310 826" or "466 310 826"
// Normalized: "+61466310826"

const normalizePhoneForBackend = (phone: string) => {
  const digits = phone.replace(/[^\d]/g, '');
  
  // If starts with 0, remove it and add +61
  if (digits.startsWith('0')) {
    return `+61${digits.slice(1)}`;
  }
  // If doesn't start with 0, just add +61
  return `+61${digits}`;
};
```

#### Phone OTP Send
```typescript
const sendPhoneVerification = async (phone: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: { 
        shouldCreateUser: true
      }
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

#### Phone OTP Verify
```typescript
const verifyPhoneCode = async (phone: string, code: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms'
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned from verification');

    // Check for existing account (with phone format variations)
    const { exists, account } = await checkExistingAccount(undefined, phone);
    
    if (exists && account) {
      // Existing user flow
      setAccount(account);
      await loadAccountForUser(data.user.id);
      return { error: null, isExistingAccount: true };
    } else {
      // New user flow
      return { 
        error: null, 
        isExistingAccount: false,
        tempUser: { phone, authUserId: data.user.id }
      };
    }
  } catch (error) {
    return { error: error as Error };
  }
};
```

---

## Core Components

### 1. `authContext.tsx` - Auth State Management

**Location:** `src/lib/authContext.tsx`  
**Lines:** 1451 total

**Purpose:** Central authentication state and business logic

**Key State:**
```typescript
const [user, setUser] = useState<User | null>(null);       // Supabase auth user
const [account, setAccount] = useState<Account | null>(null); // User profile
const [loading, setLoading] = useState(true);              // Loading state
```

**Initialization Flow:**
```typescript
useEffect(() => {
  // 1. Get initial session
  const getInitialSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      await loadAccountForUser(session.user.id);
      setupRealtimeSync();
    }
    
    setLoading(false);
  };
  
  getInitialSession();
  
  // 2. Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadAccountForUser(session.user.id);
        setupRealtimeSync();
      } else {
        setUser(null);
        setAccount(null);
      }
      
      setLoading(false);
    }
  );
  
  return () => subscription.unsubscribe();
}, [supabase]);
```

**Real-time Profile Sync:**
```typescript
const setupRealtimeSync = () => {
  if (!user?.id) return;

  const channel = supabase
    .channel('profile-sync')
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'accounts',
        filter: `id=eq.${user.id}`
      },
      (payload) => {
        // Update local state with new profile data
        setAccount(payload.new);
        
        // Update app store
        import('./store').then(({ useAppStore }) => {
          const store = useAppStore.getState();
          if (store.setPersonalProfile) {
            store.setPersonalProfile({
              id: payload.new.id,
              name: payload.new.name,
              bio: payload.new.bio,
              avatarUrl: payload.new.profile_pic,
              // ... etc
            });
          }
        });
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};
```

**Account Loading Strategies:**

The `loadAccountForUser()` function tries 5 strategies in order:

1. **Email Identity Linking** - Look up by email in `account_identities`
2. **Phone Identity Linking** - Look up by phone in `account_identities` (tries multiple formats)
3. **Auth User ID Mapping** - Look up by `auth_user_id` in `account_identities`
4. **Direct Account Lookup** - Query `accounts` table by ID directly
5. **Create Fallback Account** - Create temporary account to prevent null state

**Phone Number Format Handling:**

The system tries multiple phone number formats to handle legacy data:
```typescript
const phoneVariations = [
  phone,                                    // "+61466310826"
  phone.replace(/^\+/, ''),                // "61466310826"  
  phone.replace(/^\+61/, '0'),             // "0466310826"
  phone.replace(/^\+61/, ''),              // "466310826"
  `+61${phone.replace(/^\+61/, '')}`,      // Ensure +61 prefix
  `61${phone.replace(/^\+61/, '')}`,       // Ensure 61 prefix
];

// Try each variation
for (const phoneVariation of phoneVariations) {
  const { data } = await supabase
    .from('account_identities')
    .select('...')
    .eq('method', 'phone')
    .eq('identifier', phoneVariation)
    .maybeSingle();
  
  if (data?.accounts) return { exists: true, account: data.accounts };
}
```

**Sign Out Flow:**
```typescript
const signOut = async () => {
  // 1. Clear local state first
  setUser(null);
  setAccount(null);
  setLoading(false);
  
  // 2. Clean up real-time subscriptions
  if (realtimeCleanupRef.current) {
    realtimeCleanupRef.current();
  }
  
  // 3. Clear chat service caches
  const { simpleChatService } = await import('./simpleChatService');
  simpleChatService.cleanup();
  simpleChatService.clearAllCaches();
  
  // 4. Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // 5. Call Supabase signOut (don't wait)
  supabase.auth.signOut().catch(err => console.log('Signout error:', err));
};
```

**Exported Methods:**
```typescript
interface AuthContextType {
  // State
  user: User | null;
  account: Account | null;
  loading: boolean;
  supabase: any;
  
  // OTP Methods
  sendEmailVerification: (email: string) => Promise<{ error: Error | null }>;
  sendPhoneVerification: (phone: string) => Promise<{ error: Error | null }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ error: Error | null; isExistingAccount?: boolean; tempUser?: any }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ error: Error | null; isExistingAccount?: boolean; tempUser?: any }>;
  
  // Account Management
  createAccount: (userData: { name: string; email?: string; phone?: string; bio?: string; dob?: string }) => Promise<{ error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  updateProfile: (profile: any) => Promise<{ error: Error | null }>;
  
  // Legacy Compatibility
  checkUserExists: (phone?: string, email?: string) => Promise<{ exists: boolean; userData?: any; error: Error | null }>;
  loadUserProfile: () => Promise<{ profile: any | null; error: Error | null }>;
  refreshAuthState: () => Promise<void>;
  linkPhoneToAccount: (phone: string) => Promise<{ error: Error | null }>;
  linkEmailToAccount: (email: string) => Promise<{ error: Error | null }>;
  
  // Auth
  signOut: () => Promise<void>;
}
```

### 2. `supabaseClient.ts` - Supabase Connection

**Location:** `src/lib/supabaseClient.ts`  
**Lines:** 139 total

**Purpose:** Create and configure Supabase client with mobile support

**Client Initialization:**
```typescript
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  
  // Get environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Fallback to Connect-Staging project if env vars missing
  const fallbackUrl = url || 'https://rxlqtyfhsocxnsnnnlwl.supabase.co';
  const fallbackAnon = anon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  
  const storage = createMobileCompatibleStorage();
  
  client = createClient(fallbackUrl, fallbackAnon, {
    auth: {
      persistSession: true,
      storage: storage,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable for mobile
      flowType: 'pkce', // PKCE flow for mobile security
      debug: false
    }
  });

  // Session recovery watchdog
  const checkAndRecoverSession = async () => {
    try {
      const { data, error } = await client!.auth.getSession();
      if (error && (error.message?.includes('Invalid Refresh Token') || 
                   error.message?.includes('Refresh Token Not Found'))) {
        console.warn('🧹 Clearing invalid refresh token state');
        await clearInvalidSession();
        const { data: newData } = await client!.auth.getSession();
        return newData?.session || null;
      }
      return data?.session || null;
    } catch (err) {
      await clearInvalidSession();
      return null;
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', checkAndRecoverSession);
    checkAndRecoverSession();
  }

  return client;
}
```

**Mobile-Compatible Storage:**
```typescript
const createMobileCompatibleStorage = () => {
  if (typeof window === 'undefined') return undefined;
  
  return {
    getItem: (key: string) => {
      try {
        const item = window.localStorage.getItem(key);
        return Promise.resolve(item);
      } catch (error) {
        console.error('🔧 Storage GET error:', error);
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      } catch (error) {
        console.error('🔧 Storage SET error:', error);
        return Promise.resolve();
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      } catch (error) {
        console.error('🔧 Storage REMOVE error:', error);
        return Promise.resolve();
      }
    }
  };
};
```

**Session Cleanup:**
```typescript
export async function clearInvalidSession() {
  if (typeof window !== 'undefined') {
    try {
      // Clear all auth-related localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cleared invalid auth session data');
    } catch (error) {
      console.error('🧹 Error clearing session:', error);
    }
  }
}
```

### 3. `LoginModal.tsx` - Login UI Component

**Location:** `src/components/auth/LoginModal.tsx`  
**Lines:** 639 total

**Purpose:** User interface for login flow

**UI Steps:**
1. **Phone/Email Selection** - User chooses authentication method
2. **Phone/Email Entry** - User enters phone number or email
3. **OTP Verification** - User enters 6-digit code
4. **Account Creation** (if new user) - User enters name, bio, avatar

**Key Features:**
- Scroll-to-dismiss gesture on mobile
- Auto-focus phone input on open
- Smart phone formatting (handles both 04xx and 4xx formats)
- Email validation
- Rate limiting (prevents spam)
- Error handling with user-friendly messages
- Automatic redirect after successful login

**Phone Number Handling:**
```typescript
// Auto-format phone number as user types
const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  
  // Ensure +61 prefix is always present
  if (!value.startsWith('+61')) {
    if (phoneInputRef.current) {
      phoneInputRef.current.value = '+61 ';
      phoneInputRef.current.setSelectionRange(4, 4);
    }
    return;
  }
  
  // Remove +61 prefix and spaces to get just the digits
  const cleanValue = value.replace(/^\+61\s*/, '').replace(/\s/g, '');
  const digits = cleanValue.replace(/[^\d]/g, '');
  
  // Smart digit limiting: 10 digits if starts with 0, 9 digits otherwise
  const maxDigits = digits.startsWith('0') ? 10 : 9;
  const limitedDigits = digits.slice(0, maxDigits);
  
  setPhoneNumber(limitedDigits);
};
```

### 4. `SignUpModal.tsx` - Sign Up UI Component

**Location:** `src/components/auth/SignUpModal.tsx`  
**Lines:** 498 total

**Purpose:** User interface for sign up flow

**Identical to LoginModal** with these differences:
- Different header text ("Sign up" vs "Log in")
- Different button text
- Different default state

### 5. `VerificationModal.tsx` - OTP Entry Component

**Location:** `src/components/auth/VerificationModal.tsx`

**Purpose:** 6-digit OTP code entry interface

**Features:**
- Auto-focus first input on open
- Auto-advance to next input on digit entry
- Auto-submit when all 6 digits entered
- Paste support (handles pasted 6-digit codes)
- Backspace navigation
- Visual feedback on error
- Resend code timer (60 seconds)

**Code Input Implementation:**
```typescript
const [code, setCode] = useState(['', '', '', '', '', '']);
const inputRefs = [
  useRef<HTMLInputElement>(null),
  useRef<HTMLInputElement>(null),
  useRef<HTMLInputElement>(null),
  useRef<HTMLInputElement>(null),
  useRef<HTMLInputElement>(null),
  useRef<HTMLInputElement>(null)
];

const handleInputChange = (index: number, value: string) => {
  // Only accept single digits
  if (!/^\d?$/.test(value)) return;
  
  const newCode = [...code];
  newCode[index] = value;
  setCode(newCode);
  
  // Auto-advance to next input
  if (value && index < 5) {
    inputRefs[index + 1].current?.focus();
  }
  
  // Auto-submit when all filled
  if (newCode.every(digit => digit !== '')) {
    handleVerify(newCode.join(''));
  }
};

const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
  if (e.key === 'Backspace' && !code[index] && index > 0) {
    inputRefs[index - 1].current?.focus();
  }
};

const handlePaste = (e: React.ClipboardEvent) => {
  e.preventDefault();
  const pastedData = e.clipboardData.getData('text');
  const digits = pastedData.replace(/\D/g, '').slice(0, 6);
  
  if (digits.length === 6) {
    setCode(digits.split(''));
    // Auto-submit
    handleVerify(digits);
  }
};
```

### 6. `ProtectedRoute.tsx` - Auth Guard Component

**Location:** `src/components/auth/ProtectedRoute.tsx`  
**Lines:** 424 total

**Purpose:** Protect routes that require authentication

**Usage:**
```typescript
<ProtectedRoute>
  <PrivateContent />
</ProtectedRoute>
```

**Features:**
- Shows loading spinner while checking auth
- Shows custom login prompt if not authenticated
- Handles profile loading
- Timeout protection (8 seconds max wait)
- Syncs with app store
- Custom messages based on route

**Login Prompt UI:**
```typescript
// If not authenticated, show friendly prompt
return (
  <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
    <div className="mb-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
        <LockClosedIcon className="w-8 h-8 text-brand" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">{displayTitle}</h2>
      <p className="text-neutral-600">{displayDescription}</p>
    </div>
    <AuthButton onClick={showLogin}>
      {displayButtonText}
    </AuthButton>
  </div>
);
```

### 7. `AppShell.tsx` - Layout & Route Protection

**Location:** `src/components/layout/AppShell.tsx`  
**Lines:** 120 total

**Purpose:** App-wide layout with conditional protection

**Features:**
- Wraps entire app
- Conditionally shows navigation bars
- Applies ProtectedRoute to private pages
- Handles public routes (/, /explore, etc.)
- Mobile-optimized layouts

**Public Routes:**
```typescript
const publicRoutes = ['/', '/explore', '/debug-tables', '/migration-test'];
const normalizedPath = pathname.replace(/\/$/, '') || '/';
const isPublicRoute = publicRoutes.includes(normalizedPath);

if (isPublicRoute) {
  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />
      <main className="w-full pb-20 lg:pb-0 lg:pt-20">
        {children}
      </main>
      <MobileBottomNavigation />
    </div>
  );
}

// Private routes
return (
  <div className="min-h-screen bg-white">
    <TopNavigation />
    <main className="flex-1 w-full lg:pt-20">
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </main>
    <MobileBottomNavigation />
  </div>
);
```

---

## Account Management

### Update Profile

```typescript
const updateProfile = async (profileUpdates: any) => {
  if (!supabase || !account) {
    return { error: new Error('No account to update') };
  }

  try {
    const updateData = {
      name: profileUpdates.name,
      bio: profileUpdates.bio,
      profile_pic: profileUpdates.avatarUrl || profileUpdates.profile_pic
    };
    
    const { data, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', account.id)
      .select()
      .single();

    if (error) throw error;
    
    setAccount(data);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

### Upload Avatar

```typescript
const uploadAvatar = async (file: File) => {
  if (!supabase || !account) {
    return { url: null, error: new Error('Not authenticated') };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${account.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
};
```

### Delete Account

```typescript
const deleteAccount = async () => {
  if (!supabase) {
    return { error: new Error('No supabase client available') };
  }

  const accountIdToDelete = account?.id || user?.id;
  
  if (!accountIdToDelete) {
    return { error: new Error('No account to delete') };
  }

  try {
    // 1. Clear local state first
    setAccount(null);
    
    // 2. Delete account_identities (foreign key dependency)
    await supabase
      .from('account_identities')
      .delete()
      .eq('account_id', accountIdToDelete);
    
    // 3. Delete account
    await supabase
      .from('accounts')
      .delete()
      .eq('id', accountIdToDelete);
    
    // 4. Sign out
    await signOut();
    
    return { error: null };
  } catch (error) {
    // Even on error, try to sign out
    await signOut();
    return { error: error as Error };
  }
};
```

### Link Additional Auth Method

**Link Phone to Existing Account:**
```typescript
const linkPhoneToAccount = async (phone: string) => {
  if (!supabase || !user || !account) {
    return { error: new Error('Not authenticated') };
  }

  try {
    const { error } = await supabase
      .from('account_identities')
      .insert({
        account_id: account.id,
        auth_user_id: user.id,
        method: 'phone',
        identifier: phone
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

**Link Email to Existing Account:**
```typescript
const linkEmailToAccount = async (email: string) => {
  if (!supabase || !user || !account) {
    return { error: new Error('Not authenticated') };
  }

  try {
    const { error } = await supabase
      .from('account_identities')
      .insert({
        account_id: account.id,
        auth_user_id: user.id,
        method: 'email',
        identifier: email
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

---

## Security & RLS Policies

### Row Level Security (RLS)

**All tables have RLS enabled:**
```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
```

### Accounts Table Policies

#### 1. View Own Account
```sql
CREATE POLICY "Users can view their own account" ON accounts
    FOR SELECT USING (
        id IN (
            SELECT ai.account_id 
            FROM account_identities ai 
            WHERE ai.auth_user_id = auth.uid()
        )
    );
```

**What it does:** Users can only SELECT their own account row by looking up their `auth.uid()` in the `account_identities` table.

#### 2. Update Own Account
```sql
CREATE POLICY "Users can update their own account" ON accounts
    FOR UPDATE USING (
        id IN (
            SELECT ai.account_id 
            FROM account_identities ai 
            WHERE ai.auth_user_id = auth.uid()
        )
    );
```

**What it does:** Users can only UPDATE their own account row.

#### 3. Insert Own Account
```sql
CREATE POLICY "Users can insert their own account" ON accounts
    FOR INSERT WITH CHECK (true);
```

**What it does:** Any authenticated user can create an account. The actual account linking is controlled by `account_identities`.

### Account Identities Table Policies

#### 1. View Own Identities
```sql
CREATE POLICY "Users can view their own identities" ON account_identities
    FOR SELECT USING (auth_user_id = auth.uid());
```

**What it does:** Users can only see identity records where `auth_user_id` matches their authenticated user ID.

#### 2. Insert Own Identities
```sql
CREATE POLICY "Users can insert their own identities" ON account_identities
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());
```

**What it does:** Users can only create identity records for themselves.

### Connections Table Policies

#### 1. View Connections
```sql
CREATE POLICY "Users can view their own connections" ON connections
    FOR SELECT USING (user_id = auth.uid() OR connected_user_id = auth.uid());
```

**What it does:** Users can see connections where they are either the requester or the recipient.

#### 2. Insert Connections
```sql
CREATE POLICY "Users can insert their own connections" ON connections
    FOR INSERT WITH CHECK (user_id = auth.uid());
```

**What it does:** Users can only create connection requests as the requester.

#### 3. Update Connections
```sql
CREATE POLICY "Users can update their own connections" ON connections
    FOR UPDATE USING (user_id = auth.uid());
```

**What it does:** Users can update connections they created.

#### 4. Delete Connections
```sql
CREATE POLICY "Users can delete their own connections" ON connections
    FOR DELETE USING (user_id = auth.uid());
```

**What it does:** Users can delete connections they created.

### Storage Policies (Avatars Bucket)

See [Storage & File Upload](#storage--file-upload) section above.

---

## Storage & File Upload

### Avatars Bucket

**Bucket Configuration:**
- **Name:** `avatars`
- **Public:** `true` (publicly readable)
- **Path Structure:** `avatars/{account_id}.{ext}`

**File Upload Flow:**

1. **User selects image in UI**
```typescript
// ImagePicker component
<input 
  type="file" 
  accept="image/*" 
  onChange={(e) => handleImageSelect(e.target.files[0])}
/>
```

2. **Upload to Supabase Storage**
```typescript
const { url, error } = await uploadAvatar(file);

// In authContext:
const uploadAvatar = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${account.id}.${fileExt}`;
  const filePath = `avatars/${fileName}`;
  
  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
  
  if (uploadError) throw uploadError;
  
  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);
  
  return { url: data.publicUrl, error: null };
};
```

3. **Update profile with avatar URL**
```typescript
await updateProfile({
  ...profile,
  avatarUrl: url
});
```

**Storage URL Format:**
```
https://rxlqtyfhsocxnsnnnlwl.supabase.co/storage/v1/object/public/avatars/{account_id}.jpg
```

**File Constraints:**
- Supported formats: jpg, png, webp, gif
- Max size: Default Supabase limits (6MB for free tier)
- Naming: Filename is account ID to prevent conflicts
- Upsert: `{ upsert: true }` overwrites existing files

---

## Mobile Support

### Capacitor Configuration

**File:** `capacitor.config.ts`

```typescript
const config: CapacitorConfig = {
  appId: 'com.connect.app',
  appName: 'connect',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: false,
      accessoryBarVisible: false
    }
  },
  server: {
    androidScheme: 'https'
  }
};
```

### Mobile-Specific Features

#### 1. Touch-Optimized UI
- Large touch targets (44x44pt minimum)
- Bottom sheet modals with drag-to-dismiss
- Haptic feedback on button presses
- No hover states (uses active states)

#### 2. Keyboard Handling
```typescript
// Prevent keyboard from resizing viewport
Keyboard.setResizeMode({ mode: 'none' });

// Hide keyboard when clicking outside input
document.addEventListener('touchstart', (e) => {
  if (!e.target.closest('input, textarea')) {
    Keyboard.hide();
  }
});
```

#### 3. Safe Area Insets
```css
/* globals.css */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

#### 4. Native Navigation
- iOS swipe-back gesture support
- Android hardware back button handling
- Status bar styling

#### 5. Offline Support
- Service Worker for offline caching
- Local storage for session persistence
- Queue pending requests when offline

### iOS Specific

**Build Commands:**
```bash
npm run build
npx cap sync ios
npx cap open ios
```

**Xcode Configuration:**
- Info.plist permissions (camera, photo library)
- App icons and launch screens
- Signing & capabilities
- Deployment target: iOS 13.0+

### Android Specific

**Build Commands:**
```bash
npm run build
npx cap sync android
npx cap open android
```

**Android Studio Configuration:**
- AndroidManifest.xml permissions
- App icons and splash screens
- Signing configuration
- Min SDK: API 22 (Android 5.1)
- Target SDK: API 34 (Android 14)

---

## Known Issues & Workarounds

### 1. Phone Number Format Inconsistency

**Problem:** Phone numbers stored in different formats:
- `+61466310826`
- `61466310826`
- `0466310826`
- `466310826`

**Workaround:** Try all format variations when looking up existing accounts:
```typescript
const phoneVariations = [
  phone,                            // Original
  phone.replace(/^\+/, ''),        // Remove +
  phone.replace(/^\+61/, '0'),     // Replace +61 with 0
  phone.replace(/^\+61/, ''),      // Remove +61
  `+61${phone.replace(/^\+61/, '')}`, // Ensure +61
  `61${phone.replace(/^\+61/, '')}`,  // Ensure 61
];

for (const variation of phoneVariations) {
  // Try lookup with this format
}
```

**Proper Solution:** Normalize all phone numbers to `+{country_code}{number}` format before storing:
```typescript
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `+61${digits.slice(1)}`;
  }
  if (!digits.startsWith('61')) {
    return `+61${digits}`;
  }
  return `+${digits}`;
}
```

### 2. Refresh Token Errors on App Resume

**Problem:** When app returns from background, Supabase sometimes reports "Invalid Refresh Token" errors.

**Workaround:** Watchdog function that detects and clears invalid sessions:
```typescript
const checkAndRecoverSession = async () => {
  const { data, error } = await client.auth.getSession();
  
  if (error && (error.message?.includes('Invalid Refresh Token') || 
               error.message?.includes('Refresh Token Not Found'))) {
    await clearInvalidSession();
    const { data: newData } = await client.auth.getSession();
    return newData?.session || null;
  }
  
  return data?.session || null;
};

// Run on app focus
window.addEventListener('focus', checkAndRecoverSession);
```

**Proper Solution:** Configure Supabase Auth with longer refresh token expiry and implement proper token refresh handling.

### 3. Account Not Loading After Auth

**Problem:** User successfully authenticates but `account` state remains `null`.

**Root Causes:**
- Missing identity mapping in `account_identities` table
- Race condition between auth state change and account loading
- Database RLS policies blocking queries

**Debug Steps:**
1. Check if `auth.users` record exists
2. Check if `accounts` record exists
3. Check if `account_identities` mapping exists
4. Check RLS policies allow the query
5. Check Supabase logs for errors

**Temporary Workaround:** Create fallback account to prevent null state:
```typescript
if (!account) {
  const fallbackAccount = {
    id: user.id,
    name: user.email?.split('@')[0] || 'User',
    bio: '',
    profile_pic: null,
    connect_id: generateConnectId(user.email?.split('@')[0] || 'User'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  setAccount(fallbackAccount);
}
```

### 4. Duplicate Account Creation

**Problem:** Sometimes a new account is created even though user already has one.

**Root Cause:** Race condition in `checkExistingAccount` → `createAccount` flow.

**Workaround:** Use `UNIQUE` constraints on `account_identities` table to prevent duplicates:
```sql
UNIQUE(method, identifier)  -- Prevents duplicate email/phone
UNIQUE(auth_user_id)        -- Prevents multiple accounts per auth user
```

**Proper Solution:** Use database transaction to atomically check and create:
```sql
BEGIN;
  -- Lock the identity row
  SELECT * FROM account_identities 
  WHERE method = 'email' AND identifier = 'user@example.com'
  FOR UPDATE;
  
  -- If not found, insert
  INSERT INTO account_identities (...) VALUES (...);
  INSERT INTO accounts (...) VALUES (...);
COMMIT;
```

### 5. SMS OTP Not Sending

**Problem:** Phone verification codes not being sent to real phone numbers.

**Root Cause:** Supabase SMS provider not configured in project settings.

**Current Status:** Using test/development mode (OTP codes shown in logs).

**Solution:** Configure Twilio or another SMS provider in Supabase dashboard:
1. Go to Authentication > Providers > Phone
2. Enable phone provider
3. Configure SMS provider (Twilio, MessageBird, Vonage, etc.)
4. Add credentials and phone number

### 6. Loading State Stuck on ProtectedRoute

**Problem:** ProtectedRoute shows loading spinner indefinitely.

**Root Cause:** Auth initialization never completes or account never loads.

**Workaround:** Timeout after 8 seconds:
```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    if (!isHydrated || loading) {
      setLoadingTimeout(true);
    }
  }, 8000);
  return () => clearTimeout(timeout);
}, []);
```

**Proper Solution:** Fix underlying auth/account loading issues.

### 7. Multiple Account Tables

**Problem:** Codebase has references to both `accounts` and `profiles` tables.

**Current State:** Using `accounts` table. Old `profiles` table references may still exist in code.

**Migration Path:**
1. Audit all database queries for `profiles` references
2. Update to use `accounts` table
3. Run migration to copy data from `profiles` to `accounts`
4. Drop old `profiles` table

### 8. Bio Not Updating in UI

**Problem:** User updates bio in settings, but UI doesn't reflect changes.

**Root Cause:** Real-time subscription not updating or store not syncing.

**Debugging:**
1. Check if database UPDATE succeeds
2. Check if real-time subscription fires
3. Check if `setAccount()` is called
4. Check if store `setPersonalProfile()` is called
5. Check if UI component reads from correct source

**Workaround:** Manual refresh after profile update:
```typescript
await updateProfile({ bio: newBio });
await refreshAuthState(); // Force reload
```

---

## Environment Configuration

### Required Environment Variables

**File:** `.env.local` (not in version control)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Fallback Configuration

If environment variables are missing, the app uses hardcoded fallback to **Connect-Staging** project:

```typescript
// supabaseClient.ts
const fallbackUrl = 'https://rxlqtyfhsocxnsnnnlwl.supabase.co';
const fallbackAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**⚠️ Security Note:** Remove fallback credentials before production deployment.

### Supabase Project Configuration

**Authentication Settings:**
- Enable Email provider
- Enable Phone provider (with SMS provider)
- Confirm email: Disabled (using OTP instead)
- Confirm phone: Enabled
- Email OTP expiry: 1 hour
- Phone OTP expiry: 10 minutes

**Email Templates:**
Location: `supabase/templates/`

- `confirm-email.html` - Email OTP template
- `invite.html` - User invitation template
- `magic-link.html` - Magic link template
- `recovery.html` - Password recovery template

**Database Extensions:**
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptography functions

**Storage Settings:**
- Buckets: `avatars`
- File size limit: 6MB (free tier)
- Allowed MIME types: `image/*`

---

## Summary & Recommendations

### Current System Strengths
✅ Passwordless authentication (more secure, better UX)  
✅ Multi-method identity linking (email + phone)  
✅ Mobile-first design with Capacitor  
✅ Real-time profile sync  
✅ Comprehensive RLS security  
✅ Optimistic UI updates  
✅ Extensive error handling and logging  

### Current System Weaknesses
⚠️ Phone number format inconsistency  
⚠️ Complex account loading logic (5 strategies)  
⚠️ Fallback to hardcoded credentials  
⚠️ SMS OTP not configured  
⚠️ Some loading state race conditions  
⚠️ Old `profiles` table references may still exist  
⚠️ No unit tests for auth flows  

### Recommended Improvements

#### 1. Normalize Phone Numbers
Implement strict phone number normalization:
```typescript
// Always store as: +{country_code}{number}
function normalizePhone(phone: string, countryCode: string = '61'): string {
  const digits = phone.replace(/\D/g, '');
  
  // Remove leading 0
  const withoutLeadingZero = digits.startsWith('0') ? digits.slice(1) : digits;
  
  // Ensure country code
  if (withoutLeadingZero.startsWith(countryCode)) {
    return `+${withoutLeadingZero}`;
  }
  
  return `+${countryCode}${withoutLeadingZero}`;
}

// Use everywhere before storing
const normalizedPhone = normalizePhone(userInputPhone);
```

#### 2. Simplify Account Loading
Reduce from 5 strategies to 2:
1. **Identity Lookup** - Query `account_identities` by `auth_user_id`
2. **Create New** - If not found, create account

Remove email/phone identifier lookups (use auth_user_id as primary key).

#### 3. Remove Hardcoded Credentials
```typescript
// Fail fast if env vars missing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
}
```

#### 4. Configure SMS Provider
Set up Twilio in Supabase dashboard:
1. Create Twilio account
2. Get API credentials
3. Configure in Supabase > Authentication > Providers > Phone
4. Test with real phone numbers

#### 5. Add Unit Tests
```typescript
// Example: tests/auth.test.ts
describe('Authentication', () => {
  it('normalizes phone numbers correctly', () => {
    expect(normalizePhone('0466310826')).toBe('+61466310826');
    expect(normalizePhone('466310826')).toBe('+61466310826');
    expect(normalizePhone('+61466310826')).toBe('+61466310826');
  });
  
  it('creates account after OTP verification', async () => {
    // Mock Supabase client
    // Test OTP verification
    // Assert account created
  });
  
  it('links identity to existing account', async () => {
    // Test identity linking
  });
});
```

#### 6. Implement Session Recovery
```typescript
// Detect app resume from background
import { App } from '@capacitor/app';

App.addListener('appStateChange', async ({ isActive }) => {
  if (isActive) {
    // Check session validity
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      // Clear invalid session
      await clearInvalidSession();
    } else if (session) {
      // Refresh session
      await supabase.auth.refreshSession();
    }
  }
});
```

#### 7. Add Proper Error Tracking
Integrate error tracking service (Sentry, LogRocket, etc.):
```typescript
import * as Sentry from '@sentry/react';

// Track auth errors
try {
  await sendEmailVerification(email);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'auth', method: 'email_otp' },
    contexts: { email: email }
  });
  throw error;
}
```

#### 8. Implement Rate Limiting
Move rate limiting from client to server:
```sql
-- Create rate limiting table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, action)
);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_count INTEGER,
  p_window_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  SELECT count, window_start INTO v_count, v_window_start
  FROM rate_limits
  WHERE identifier = p_identifier AND action = p_action;
  
  -- Check if window expired
  IF v_window_start IS NULL OR v_window_start < (now() - (p_window_minutes || ' minutes')::INTERVAL) THEN
    -- Reset window
    INSERT INTO rate_limits (identifier, action, count, window_start)
    VALUES (p_identifier, p_action, 1, now())
    ON CONFLICT (identifier, action) DO UPDATE
    SET count = 1, window_start = now();
    RETURN TRUE;
  END IF;
  
  -- Check if limit exceeded
  IF v_count >= p_max_count THEN
    RETURN FALSE;
  END IF;
  
  -- Increment count
  UPDATE rate_limits
  SET count = count + 1
  WHERE identifier = p_identifier AND action = p_action;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 9. Add Account Verification Status
Track account completion:
```sql
ALTER TABLE accounts ADD COLUMN verified BOOLEAN DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN verification_completed_at TIMESTAMPTZ;

-- Update trigger
CREATE OR REPLACE FUNCTION check_account_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NOT NULL AND NEW.name != '' THEN
    NEW.verified = TRUE;
    IF OLD.verified = FALSE THEN
      NEW.verification_completed_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER account_verification_trigger
  BEFORE INSERT OR UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION check_account_verification();
```

#### 10. Implement Audit Logging
Track auth events for security:
```sql
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  auth_user_id UUID,
  event_type TEXT NOT NULL, -- login, logout, register, etc.
  method TEXT, -- email, phone, google, etc.
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_auth_audit_log_account_id ON auth_audit_log(account_id);
CREATE INDEX idx_auth_audit_log_created_at ON auth_audit_log(created_at);
```

---

## Conclusion

This authentication system provides a solid foundation with passwordless auth, multi-method identity linking, and mobile support. The main areas for improvement are:

1. **Data consistency** - Normalize phone numbers and simplify account loading
2. **Production readiness** - Remove hardcoded credentials, configure SMS
3. **Observability** - Add error tracking and audit logging
4. **Security** - Implement server-side rate limiting and session recovery
5. **Testing** - Add unit and integration tests for critical flows

The dual-identity architecture (`auth.users` + `accounts` + `account_identities`) is well-designed and flexible for future OAuth providers and multi-account scenarios.

---

**Document Version:** 1.0  
**Last Updated:** October 12, 2025  
**Maintained By:** Connect Development Team

