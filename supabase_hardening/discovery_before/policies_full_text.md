# RLS Policies - Full Text (Connect-Staging)
**Discovery Date:** October 12, 2025  
**Project:** Connect-Staging (mohctrsopquwoyfweadl)

---

## Summary

- **Total public schema policies:** 31
- **Storage policies:** 0
- **Tables with RLS enabled:** 13/13 (100%)

---

## Policies by Table

### account_identities (2 policies)

#### 1. Users can insert their own identities
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `(auth_user_id = auth.uid())`
- **Status:** ✅ Properly scoped

#### 2. Users can view their own identities
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `(auth_user_id = auth.uid())`
- **Status:** ✅ Properly scoped

---

### accounts (3 policies)

#### 1. Users can insert their own account
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `(id = auth.uid())`
- **Status:** ✅ Properly scoped

#### 2. Users can update their own account
- **Command:** UPDATE
- **Roles:** {public}
- **USING:** `(id = auth.uid())`
- **Status:** ✅ Properly scoped

#### 3. Users can view all accounts
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `true`
- **Status:** ⚠️ OVERLY PERMISSIVE - allows viewing all accounts

---

### attachments (1 policy)

#### 1. Users can view attachments in their chats
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `(EXISTS ( SELECT 1 FROM (chat_messages m JOIN chat_participants cp ON ((m.chat_id = cp.chat_id))) WHERE ((m.id = attachments.message_id) AND (cp.user_id = auth.uid()))))`
- **Status:** ✅ Participant-scoped

---

### auth_audit_log (1 policy)

#### 1. Users can view their own audit log
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `(user_id = auth.uid())`
- **Status:** ✅ Properly scoped

---

### business_accounts (3 policies)

#### 1. Users can insert their own business accounts
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `(owner_account_id IN ( SELECT ai.account_id FROM account_identities ai WHERE (ai.auth_user_id = auth.uid())))`
- **Status:** ✅ Owner-scoped

#### 2. Users can update their own business accounts
- **Command:** UPDATE
- **Roles:** {public}
- **USING:** `(owner_account_id IN ( SELECT ai.account_id FROM account_identities ai WHERE (ai.auth_user_id = auth.uid())))`
- **Status:** ✅ Owner-scoped

#### 3. Users can view business accounts
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `true`
- **Status:** ⚠️ OVERLY PERMISSIVE - allows viewing all business accounts

---

### chat_messages (4 policies)

#### 1. Users can delete their own messages
- **Command:** DELETE
- **Roles:** {public}
- **USING:** `(sender_id = auth.uid())`
- **Status:** ✅ Owner-scoped

#### 2. Users can send messages
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `((sender_id = auth.uid()) AND (chat_id IN ( SELECT chat_participants.chat_id FROM chat_participants WHERE (chat_participants.user_id = auth.uid()))))`
- **Status:** ✅ Participant + owner-scoped

#### 3. Users can update their own messages
- **Command:** UPDATE
- **Roles:** {public}
- **USING:** `(sender_id = auth.uid())`
- **Status:** ✅ Owner-scoped

#### 4. Users can view messages in their chats
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `(chat_id IN ( SELECT chat_participants.chat_id FROM chat_participants WHERE (chat_participants.user_id = auth.uid())))`
- **Status:** ✅ Participant-scoped

---

### chat_participants (2 policies)

#### 1. Users can add participants to chats they created
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `(chat_id IN ( SELECT chats.id FROM chats WHERE (chats.created_by = auth.uid())))`
- **Status:** ✅ Creator-scoped

#### 2. Users can view participants of their chats
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `(chat_id IN ( SELECT chat_participants_1.chat_id FROM chat_participants chat_participants_1 WHERE (chat_participants_1.user_id = auth.uid())))`
- **Status:** ✅ Participant-scoped

---

### chats (2 policies)

#### 1. Users can create chats
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `(created_by = auth.uid())`
- **Status:** ✅ Creator-scoped

#### 2. Users can view chats they participate in
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `(id IN ( SELECT chat_participants.chat_id FROM chat_participants WHERE (chat_participants.user_id = auth.uid())))`
- **Status:** ✅ Participant-scoped

---

### connections (2 policies)

#### 1. Users can insert their own connections
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `(user1_id = auth.uid())`
- **Status:** ✅ Owner-scoped

#### 2. Users can view their own connections
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `((user1_id = auth.uid()) OR (user2_id = auth.uid()))`
- **Status:** ✅ Bi-directional ownership

---

### current_session_accounts (4 policies)

#### 1. Users can delete their own sessions
- **Command:** DELETE
- **Roles:** {public}
- **USING:** `(auth_user_id = auth.uid())`
- **Status:** ✅ Owner-scoped

#### 2. Users can insert their own sessions
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `(auth_user_id = auth.uid())`
- **Status:** ✅ Owner-scoped

#### 3. Users can update their own sessions
- **Command:** UPDATE
- **Roles:** {public}
- **USING:** `(auth_user_id = auth.uid())`
- **Status:** ✅ Owner-scoped

#### 4. Users can view their own sessions
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `(auth_user_id = auth.uid())`
- **Status:** ✅ Owner-scoped

---

### friend_requests (4 policies)

#### 1. Users can delete their sent friend requests
- **Command:** DELETE
- **Roles:** {public}
- **USING:** `(sender_id = auth.uid())`
- **Status:** ✅ Sender-scoped

#### 2. Users can send friend requests
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `(sender_id = auth.uid())`
- **Status:** ✅ Sender-scoped

#### 3. Users can update received friend requests
- **Command:** UPDATE
- **Roles:** {public}
- **USING:** `(receiver_id = auth.uid())`
- **Status:** ✅ Receiver-scoped

#### 4. Users can view their friend requests
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `((sender_id = auth.uid()) OR (receiver_id = auth.uid()))`
- **Status:** ✅ Bi-directional

---

### message_reactions (3 policies)

#### 1. Users can add reactions
- **Command:** INSERT
- **Roles:** {public}
- **WITH CHECK:** `(user_id = auth.uid())`
- **Status:** ✅ Owner-scoped

#### 2. Users can delete own reactions
- **Command:** DELETE
- **Roles:** {public}
- **USING:** `(user_id = auth.uid())`
- **Status:** ✅ Owner-scoped

#### 3. Users can view reactions in their chats
- **Command:** SELECT
- **Roles:** {public}
- **USING:** `(EXISTS ( SELECT 1 FROM (chat_messages cm JOIN chat_participants cp ON ((cm.chat_id = cp.chat_id))) WHERE ((cm.id = message_reactions.message_id) AND (cp.user_id = auth.uid()))))`
- **Status:** ✅ Participant-scoped

---

### rate_limits (0 policies)

**No policies defined** - Table has RLS enabled but no policies exist yet.  
**Status:** ⚠️ RLS enabled with no policies = all access denied

---

## Issues Found

### 🔴 Critical Issues

1. **rate_limits table:** RLS enabled but NO policies exist
   - **Impact:** All access to rate_limits table will fail
   - **Fix:** Either disable RLS or add appropriate policies

### 🟡 Moderate Issues

2. **accounts - "Users can view all accounts":** Uses `USING true`
   - **Impact:** Any authenticated user can view ALL accounts
   - **Recommendation:** Restrict to connections only or specific use cases

3. **business_accounts - "Users can view business accounts":** Uses `USING true`
   - **Impact:** Any authenticated user can view ALL business accounts
   - **Recommendation:** Restrict to owner or public business profiles only

---

## Storage

- **No storage buckets exist yet**
- **No storage.objects policies exist yet**
- **Action required:** Create buckets and policies for avatars and chat-media

---

## Positive Findings ✅

1. **100% RLS coverage** - All tables have RLS enabled
2. **Most policies properly scoped** - 28/31 policies use proper ownership/participation checks
3. **Participant-scoped chat policies** - Chat system has good security
4. **SECURITY DEFINER functions** - Limited to 3 in public schema (appropriate)

---

**End of Policy Discovery Report**

