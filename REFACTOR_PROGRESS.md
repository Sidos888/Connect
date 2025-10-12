# Messaging Scalability Refactor - Progress Report

**Date**: Current Session
**Status**: Phase 1 & 2 Complete, Phase 3-5 In Progress

## ✅ Completed

### Phase 1: Database Migrations (COMPLETE)

- ✅ Created `sql/migration_01_add_seq_and_status.sql`
  - Adds seq, client_generated_id, status columns
  - Creates unique indexes for data integrity
  - Creates performance indexes
  - Includes backfill logic for existing messages
  - Full rollback instructions included

- ✅ Created `sql/migration_02_triggers_and_functions.sql`
  - `assign_message_seq()` function and trigger
  - `mark_messages_as_read()` RPC function
  - `mark_messages_as_delivered()` RPC function
  - `get_unread_count()` helper function
  - `get_latest_seq()` helper function
  - All functions granted to authenticated users

- ✅ Created `sql/migration_03_realtime_publication.sql`
  - Sets REPLICA IDENTITY FULL on all chat tables
  - Adds tables to supabase_realtime publication
  - Includes verification queries

- ✅ Created `docs/STAGING_SETUP.md`
  - Comprehensive guide for staging environment setup
  - Migration application process
  - Testing checklist
  - Performance testing guidelines
  - Rollback procedures

**Note**: Migrations NOT YET APPLIED to database. User needs to review and execute.

### Phase 2: Service Layer Refactor (70% COMPLETE)

#### ✅ Utility Files Created

- ✅ `src/lib/utils/network.ts`
  - `withRetry()` with exponential backoff
  - `NetworkError` class
  - `isOnline()` helper
  - `waitForOnline()` helper
  - `debounce()` and `throttle()` utilities
  - `batchWithDelay()` for rate-limited APIs

- ✅ `src/lib/utils/dedupeStore.ts`
  - `DedupeStore` class with TTL and LRU eviction
  - `createCompositeKey()` helper
  - `globalMessageDedupeStore` instance
  - Automatic cleanup with periodic intervals
  - Statistics tracking

#### ✅ simpleChatService.ts Updates

**Types Updated:**
- ✅ `SimpleMessage` interface extended with:
  - `seq?`: number
  - `client_generated_id?`: string
  - `status?`: 'sent' | 'delivered' | 'read'
- ✅ New `PendingMessage` interface for offline queue

**New Features Implemented:**
- ✅ Imported network and dedupe utilities
- ✅ Added `DedupeStore` instance
- ✅ Added offline queue (`pendingQueue: PendingMessage[]`)
- ✅ Added per-chat seq tracking (`chatLatestSeq: Map`)
- ✅ Replaced old withRetry with new network utility
- ✅ Updated constructor to listen for 'online' event
- ✅ Updated `cleanupOldTracking()` to use `DedupeStore`

**New Methods Added:**
- ✅ `flushPendingQueue()` - Process offline messages with retry
- ✅ `addToPendingQueue()` - Add failed message to queue
- ✅ `getPendingMessages()` - Get queue for UI display
- ✅ `markMessagesAsDelivered()` - RPC call for delivery status
- ✅ `markMessagesAsRead()` - RPC call for read status  
- ✅ `getLatestSeq()` - Get latest seq for a chat

**Methods Refactored:**
- ✅ `getChatMessages()`:
  - Now supports keyset pagination with `beforeSeq` parameter
  - Orders by seq (deterministic ordering)
  - Returns `{ messages, error, hasMore }`
  - Tracks latest seq per chat
  - Includes new seq, client_generated_id, status fields

- ✅ `sendMessage()`:
  - Generates `client_generated_id` for idempotency
  - Checks `isOnline()` and queues if offline
  - Handles idempotency conflicts (23505 error)
  - Updates seq tracking
  - Uses `DedupeStore` to prevent duplicates
  - Adds to pending queue on network errors
  - Sets initial `status: 'sent'`

#### ⏳ TODO in simpleChatService.ts

- ⏳ Update `subscribeToMessages()`:
  - Add seq-based filtering (`if (newMessage.seq <= lastSeq) return`)
  - Replace processedMessages/recentMessageSignatures with DedupeStore
  - Update to include seq, client_generated_id, status in message conversion

- ⏳ Update `getUserChats()`:
  - Order by seq instead of created_at
  - Include seq in returned messages

- ⏳ Update `cleanup()` method:
  - Remove references to old processedMessages
  - Remove references to recentMessageSignatures
  - Call `dedupeStore.destroy()`

- ⏳ Add debounced `markMessagesAsDelivered()` calls in realtime subscriptions

## ⏳ In Progress / TODO

### Phase 3: Frontend Wiring (NOT STARTED)

#### UI Components to Update:

**3.1 Message Ordering**
- ⏳ Update `PersonalChatPanel.tsx`:
  - Sort messages by seq (with created_at fallback)
  - Handle pagination with scroll-up detection
  - Call `getChatMessages(chatId, beforeSeq)` on scroll

- ⏳ Update `ChatLayout.tsx`:
  - Sort conversation previews by last_message seq
  - Update realtime handlers to use seq

- ⏳ Update `src/lib/store.ts`:
  - Add `pendingMessages: PendingMessage[]` to state
  - Add actions: `addPendingMessage`, `removePendingMessage`, `flushPendingMessages`
  - Update `loadConversations` to use seq ordering
  - Wire to `simpleChatService` offline queue

**3.2 Optional Delivery Status Ticks**
- ⏳ Update `MessageBubble.tsx`:
  - Add optional status rendering:
    ```tsx
    {message.status === 'sent' && '✓'}
    {message.status === 'delivered' && '✓✓'}
    {message.status === 'read' && <span className="text-blue-500">✓✓</span>}
    ```
  - Only render if status present (backwards compatible)

**3.3 Call Delivery Lifecycle**
- ⏳ In `PersonalChatPanel.tsx`:
  - Call `markMessagesAsRead()` on chat focus/mount
  - Debounce to avoid excessive calls

### Phase 4: Testing Infrastructure (NOT STARTED)

**4.1 Setup Vitest**
- ⏳ Create `vitest.config.ts`
- ⏳ Install dependencies: `vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom`
- ⏳ Create `tests/setup.ts` with mocks
- ⏳ Add test scripts to `package.json`

**4.2 Unit Tests**
- ⏳ `tests/unit/simpleChatService.test.ts`:
  - Test idempotent send (same client_generated_id = one row)
  - Test seq ordering
  - Test keyset pagination
  - Test deduplication
  - Test offline queue

- ⏳ `tests/unit/dedupeStore.test.ts`:
  - Test add/has/cleanup
  - Test TTL expiration
  - Test LRU behavior

- ⏳ `tests/unit/network.test.ts`:
  - Test retry logic
  - Test exponential backoff
  - Test auth error skip

**4.3 Integration Tests**
- ⏳ `tests/integration/messaging.test.ts`:
  - Setup test Supabase instance
  - Test message send → realtime receive flow
  - Test no duplicates after optimistic replace
  - Test mark_messages_as_read RPC
  - Test mark_messages_as_delivered RPC
  - Test concurrent sends maintain seq order

### Phase 5: Documentation (NOT STARTED)

**5.1 Update MESSAGING_SYSTEM_ANALYSIS.md**
- ⏳ Add section on seq-based ordering
- ⏳ Document idempotency pattern
- ⏳ Document delivery lifecycle
- ⏳ Document offline queue
- ⏳ Update schema diagrams

**5.2 Create docs/messaging.md**
- ⏳ New columns reference
- ⏳ New functions reference
- ⏳ Service contracts
- ⏳ Migration guide

**5.3 Create docs/TESTING.md**
- ⏳ How to run tests
- ⏳ How to setup test Supabase project
- ⏳ Test coverage goals

## 🔴 Critical Next Steps (Priority Order)

1. **Apply Migrations to Staging** (MUST DO FIRST)
   - Review migration files
   - Create staging Supabase project
   - Apply migrations in order
   - Verify with test queries
   - Test with sample data

2. **Complete realtime subscription updates** in simpleChatService.ts
   - This is required for the refactor to work properly
   - Add seq filtering
   - Use DedupeStore instead of old tracking
   - Call markMessagesAsDelivered on receive

3. **Update UI to sort by seq**
   - PersonalChatPanel.tsx
   - ChatLayout.tsx  
   - store.ts loadConversations

4. **Add Zustand store offline queue support**
   - Wire to simpleChatService
   - Display pending messages in UI
   - Show retry state

5. **Test end-to-end**
   - Send messages
   - Verify order is deterministic
   - Test offline/online behavior
   - Verify no duplicates

6. **Add delivery status ticks** (optional but nice)
   - Update MessageBubble
   - Call lifecycle methods

7. **Setup testing infrastructure**
   - Even basic smoke tests are valuable

8. **Update documentation**
   - Helps future developers understand changes

## 📊 Completion Estimate

- **Phase 1**: 100% ✅
- **Phase 2**: 70% ✅ (Critical parts done, realtime subscriptions pending)
- **Phase 3**: 0% ⏳
- **Phase 4**: 0% ⏳
- **Phase 5**: 0% ⏳
- **Overall**: ~35% complete

**Estimated Time to Complete**:
- Phase 2 completion: 2-3 hours
- Phase 3 (UI): 3-4 hours
- Phase 4 (Tests): 4-6 hours (can be done incrementally)
- Phase 5 (Docs): 2-3 hours

**Total remaining**: 11-16 hours of development work

## ⚠️ Known Issues / Warnings

1. **Migrations not applied** - The SQL files are ready but need to be executed on staging/production

2. **realtime subscriptions not updated** - Current subscriptions don't use seq filtering or new DedupeStore yet. This may cause issues.

3. **UI still uses created_at** - Frontend components not yet updated to use seq ordering

4. **No tests yet** - Changes not covered by automated tests

5. **Type signature changes** - `getChatMessages` now returns `hasMore` in addition to messages/error. Calling code needs updates.

## 🎯 Acceptance Criteria Status

- ⏳ All migrations run successfully (not applied yet)
- ⏳ RLS policies remain enforced (will verify after migration)
- ⏳ Messages display in deterministic order (UI not updated yet)
- ⏳ Duplicate messages cannot occur (deduplication implemented but not tested)
- ✅ Idempotency works (implemented in sendMessage)
- ⏳ Keyset pagination loads older history (implemented but UI not wired)
- ⏳ Delivery lifecycle works (RPC functions ready, not called yet)
- ⏳ Offline queue retries failed sends (implemented but not tested)
- ⏳ Unit tests pass (not written yet)
- ⏳ Integration tests pass (not written yet)
- ⏳ No visual regressions (not tested yet)
- ⏳ Staging soak test (migrations not applied yet)

## 📝 Notes for Next Session

1. **Start with realtime subscriptions** - This is the most critical remaining piece for Phase 2

2. **Test incrementally** - After each change, manually test to ensure no regressions

3. **Consider feature flags** - Might want to gate new features behind flags for gradual rollout

4. **Backup before migration** - Essential! Use Supabase dashboard or `pg_dump`

5. **Monitor after deployment** - Watch for errors, performance issues, duplicate messages

6. **Consider batched backfill** - If chat_messages table is very large (>100K rows), modify migration_01 to use smaller batches

## 🔗 References

- Plan: `/refactor-messaging-scalability.plan.md`
- Migrations: `sql/migration_*.sql`
- Utilities: `src/lib/utils/*.ts`
- Service: `src/lib/simpleChatService.ts`
- Staging Guide: `docs/STAGING_SETUP.md`

