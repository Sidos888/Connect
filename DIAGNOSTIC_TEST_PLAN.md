# 🔬 Comprehensive Diagnostic Test Plan

## What I've Added

I've instrumented the codebase with comprehensive diagnostic logging to trace the exact point where connections and messages fail to load. The logging is marked with `🔬` emojis so you can easily filter console output.

### Files Modified

1. **`src/lib/authContext.tsx`**
   - Added logging to chatService creation
   - Added logging to test the getAccount closure
   - Shows when account state changes

2. **`src/lib/simpleChatService.ts`**
   - Added detailed logging to `getUserChats()`
   - Added detailed logging to `getContacts()`
   - Shows account state, session state, and query results

3. **`src/app/(personal)/chat/ChatLayout.tsx`**
   - Added logging to track when useEffect triggers
   - Tests chatService.getAccount() closure before calling loadConversations
   - Shows state of account and chatService

## How to Test

### Step 1: Sign In
1. Open your browser developer tools (F12)
2. Go to the Console tab
3. Filter for `🔬` to see only diagnostic logs
4. Navigate to the app and sign in with email or phone

### Step 2: Watch the Console Output

You should see a series of logs that look like this:

```
🔬 AuthContext: ========== CREATING CHAT SERVICE ==========
🔬 AuthContext: Account state: { hasAccount: true, accountId: '...', accountName: '...' }
🔬 AuthContext: Creating getAccount closure
🔬 AuthContext: Closure will capture account: ...
✅ AuthContext: SimpleChatService instance created

🔬 ChatLayout: useEffect triggered
🔬 ChatLayout: State: { isHydrated: true, hasAccount: true, accountId: '...', hasChatService: true }
🔬 ChatLayout: Calling loadConversations with: { accountId: '...', chatServiceExists: true }
🔬 ChatLayout: Testing chatService.getAccount(): { testAccountId: '...', ... }

🔬 getUserChats: START
🔬 getUserChats: this.getAccount function exists? function
🔬 getUserChats: account from getAccount(): { hasAccount: true, accountId: '...', accountName: '...' }
```

### Step 3: Identify the Failure Point

Look for these **critical indicators**:

#### ❌ **Issue 1: No Account in ChatService**
```
🔴 SimpleChatService: No account available, returning empty chats
🔴 This is why chats are not loading!
```
**Meaning**: The getAccount closure is returning null. This is a timing/closure issue.

#### ❌ **Issue 2: No Session**
```
🔴 SimpleChatService: No active session, waiting for auth...
🔴 This is why chats are not loading!
```
**Meaning**: User is authenticated but session is not available in Supabase client.

#### ❌ **Issue 3: ID Mismatch**
```
🔬 getUserChats: ID COMPARISON: {
  accountId: 'abc...',
  sessionUserId: 'def...',
  idsMatch: false,
  CRITICAL: '🔴 IDS MISMATCH - THIS IS THE PROBLEM!'
}
```
**Meaning**: The account ID doesn't match the session user ID. This violates unified identity.

#### ❌ **Issue 4: RLS Blocking**
```
🔴 getUserChats: Error fetching chat participants: {
  message: 'permission denied for table chat_participants',
  CRITICAL: '🔴 RLS POLICY MAY BE BLOCKING ACCESS'
}
```
**Meaning**: RLS policies are blocking the query.

#### ❌ **Issue 5: No Data**
```
🔬 getUserChats: Chat participants query result: {
  participantCount: 0,
  CRITICAL: '🔴 NO PARTICIPANTS FOUND - RLS BLOCKING OR NO DATA?'
}
```
**Meaning**: Either RLS is silently blocking or user genuinely has no chats.

#### ❌ **Issue 6: Stale Closure**
```
🔬 ChatLayout: Testing chatService.getAccount(): {
  testAccountId: 'abc...',
  matchesCurrentAccount: false,
  CRITICAL: '🔴 IDS MISMATCH - STALE CLOSURE!'
}
```
**Meaning**: The chatService has a stale reference to an old account.

### Step 4: For Connections

Look for similar diagnostic output when you try to access connections (e.g., creating a new chat):

```
🔬 getContacts: START
🔬 getContacts: Called with userId: ...
🔬 getContacts: Session check: { ... }
🔬 getContacts: Querying connections table...
🔬 getContacts: Raw connections data: { connectionCount: X, ... }
```

## Expected Results

### ✅ Healthy Sign-In Flow

```
🔬 AuthContext: ========== CREATING CHAT SERVICE ==========
🔬 AuthContext: Account state: { hasAccount: true, accountId: '4f04235f-...', accountName: 'Sid Farquharson' }
✅ AuthContext: SimpleChatService instance created

🔬 ChatLayout: useEffect triggered
🔬 ChatLayout: State: { isHydrated: true, hasAccount: true, accountId: '4f04235f-...', hasChatService: true }
🔬 ChatLayout: Testing chatService.getAccount(): { testAccountId: '4f04235f-...', matchesCurrentAccount: true, CRITICAL: '✅ IDs MATCH' }

🔬 getUserChats: START
🔬 getUserChats: account from getAccount(): { hasAccount: true, accountId: '4f04235f-...', accountName: 'Sid Farquharson' }
🔬 getUserChats: Auth user check: { hasUser: true, userId: '4f04235f-...', userEmail: 'sid@...', userPhone: null, authError: undefined }
🔬 getUserChats: Session check: { hasSession: true, sessionUserId: '4f04235f-...', ... }
🔬 getUserChats: ID COMPARISON: { accountId: '4f04235f-...', sessionUserId: '4f04235f-...', idsMatch: true, CRITICAL: '✅ IDs MATCH' }
✅ getUserChats: Active session confirmed: 4f04235f-...
🔬 getUserChats: Step 1 - Fetching chat participants...
🔬 getUserChats: Querying chat_participants for user_id: 4f04235f-...
🔬 getUserChats: Chat participants query result: { participantCount: 7, CRITICAL: '✅ Found 7 participants' }
```

## What to Send Me

After you sign in and navigate to the chat page, please copy ALL console output that includes `🔬` or `🔴` or `✅` and send it to me. 

You can filter in Chrome DevTools by typing `🔬` in the filter box.

## Quick Filters for Console

- **All diagnostics**: `🔬`
- **Critical errors**: `🔴`
- **Success checkpoints**: `✅`
- **All combined**: `🔬|🔴|✅` (use regex filter)

## What This Will Tell Us

1. **Timing Issue**: If account is null when getUserChats is called
2. **Session Issue**: If Supabase session is missing or expired
3. **ID Mismatch**: If unified identity is broken
4. **RLS Issue**: If policies are blocking queries
5. **Data Issue**: If user genuinely has no data
6. **Closure Issue**: If chatService has stale account reference

Once you provide the console output, I'll know exactly where to fix the issue.

