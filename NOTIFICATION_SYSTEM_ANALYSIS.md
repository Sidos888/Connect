# Notification System Implementation Analysis

## Unified Two-Level Tracking System

This system uses a **consistent two-level tracking pattern** for both **Chats** and **Notifications**:

### **Level 1: Page-Level Tracking (Badge Removal)**
- **Purpose**: Remove badges from navigation icons when page is viewed
- **Chats**: `last_inbox_view_at` on `accounts` table
- **Notifications**: `last_notifications_page_view_at` on `accounts` table
- **Behavior**: When page is viewed → Update timestamp → Badges disappear

### **Level 2: Card-Level Tracking (Individual Indicators)**
- **Purpose**: Show unread indicators on individual cards even after page is viewed
- **Chats**: `last_read_at` on `chat_participants` table (already exists)
- **Notifications**: `opened_at` on each notification type table (`listing_invites`, `friend_requests`, etc.)
- **Behavior**: When individual card is opened → Update timestamp → Card indicator disappears

### **Key Benefits:**
- ✅ **Consistent pattern** across both pages
- ✅ **Badges disappear** when page is viewed (user has seen there are new items)
- ✅ **Cards can remain unread** even after page is viewed (user hasn't opened specific items)
- ✅ **Scalable** - Easy to add new notification types or chat features

---

## System Requirements Summary

### 1. **Chats Icon (Bottom Navigation)**
- **Red dot with number**: Shows count of chats with unread messages
- **Display**: Always show number (or "9+" if count > 9)
- **Behavior**: 
  - When chats page is opened → Remove red dot immediately (even if chat card isn't opened)
  - Only reappear when there are new unread chats
  - Number = total count of chats with unread messages

### 2. **Menu Icon (Bottom Navigation)**
- **Red dot (no number)**: Shows when there are unread notifications
- **Display**: Just red dot, no number
- **Behavior**:
  - When menu page is opened → **Red dot STAYS on menu icon** (does NOT disappear)
  - Red dot on bell icon (top right) also shows with number
  - When bell icon is clicked (opens notifications page) → Remove red dot from menu icon AND bell icon
  - Don't show on menu icon again until new notification arrives

### 3. **Bell Icon (Top Right on Menu Page)**
- **Red dot with number**: Shows count of unread notifications
- **Display**: Always show number (or "9+" if count > 9)
- **Behavior**:
  - When notifications page is opened (via bell icon click) → Mark all as read, remove dots from both menu and bell icons
  - Don't show again until new notification arrives

---

## Current System Analysis

### **Chat Unread Tracking**

**Database Structure:**
- `chat_participants` table has `last_read_at` timestamp
- `chat_messages` table has `status` field ('sent', 'delivered', 'read')
- Function `get_unread_count(chat_id, user_id)` exists to count unread messages per chat

**How it works:**
1. When user opens a chat, `mark_messages_as_read()` is called
2. This updates `chat_participants.last_read_at` to NOW()
3. Unread count = messages where `created_at > last_read_at` AND `sender_id != user_id`

**For Chats Icon Badge:**
- Need to count **how many chats** have unread messages (not total unread count)
- Query: Count distinct `chat_id` where `get_unread_count(chat_id, user_id) > 0`
- When chats icon clicked → Mark all chats as "viewed" (new concept needed)

**Challenge:** Currently there's no "viewed inbox" tracking. We need to track:
- When user clicks chats icon (views inbox) → mark all chats as "viewed"
- Only show badge for chats with messages **after** the last "inbox view"

**Solution Options:**
1. **Add `last_inbox_view_at` to user profile/account** - Track when user last viewed inbox
2. **Add `last_inbox_view_at` to each chat_participant** - Track per-chat when viewed in inbox
3. **Use existing `last_read_at`** - But this tracks when chat was opened, not when inbox was viewed

**Recommended:** Add `last_inbox_view_at` timestamp to track when user last viewed the chats inbox page.

**Note:** This follows the same pattern as notifications - page-level tracking for badge removal, while `last_read_at` on `chat_participants` tracks individual chat reads (card-level).

---

### **Notification Unread Tracking (Generalized for All Notification Types)**

**Current Notification Types:**
- `listing_invites` - Listing invitations (status: 'pending' | 'accepted' | 'declined')
- `friend_requests` - Friend requests (status: 'pending' | 'accepted' | 'rejected')
- **Future**: Other notification types will be added

**Database Structure:**
- Each notification type has its own table with `status` and `created_at`
- **No unified tracking** currently exists for page-level viewing

**How notifications work:**
- Each notification type is queried separately
- Displayed together on the notifications page
- User can accept/decline individual notifications

**For Notification Badges (Page-Level):**
- **Menu Icon**: Show red dot when there are unread notifications (any type)
- **Bell Icon**: Show count of unread notifications (any type)
- **When notifications page opened**: Mark all notifications as "viewed" at page level (removes badges)

**For Individual Cards (Card-Level):**
- Individual notification cards can show red circle if card hasn't been opened/clicked
- This is separate from page-level viewing
- Cards can remain "unopened" even after page is viewed

**Two-Level Tracking System:**

1. **Page-Level Tracking** (for badges):
   - Add `last_notifications_page_view_at` to `accounts` table
   - When notifications page is viewed → Update this timestamp
   - Badge calculation: Count notifications where `created_at > last_notifications_page_view_at`
   - **This removes badges from menu/bell icons when page is viewed**

2. **Card-Level Tracking** (for individual card indicators):
   - Each notification type can track its own "opened" state:
     - `listing_invites.opened_at` - When listing invite card was opened
     - `friend_requests.opened_at` - When friend request card was opened
   - Cards show red circle if `opened_at IS NULL`
   - **This allows cards to show unread indicators even after page is viewed**

**Solution:**
- **Page-level**: Add `last_notifications_page_view_at TIMESTAMPTZ` to `accounts` table
- **Card-level**: Add `opened_at TIMESTAMPTZ` to each notification type table (listing_invites, friend_requests, etc.)

---

## Implementation Plan

### **Phase 1: Database Schema Changes**

#### 1.1 Add Inbox View Tracking
```sql
-- Option A: Add to accounts table (simpler, one timestamp per user)
ALTER TABLE accounts ADD COLUMN last_inbox_view_at TIMESTAMPTZ;

-- Option B: Add to chat_participants (more granular, per-chat tracking)
ALTER TABLE chat_participants ADD COLUMN last_inbox_view_at TIMESTAMPTZ;
```

**Recommendation:** Option A (accounts table) - simpler and sufficient. When user views inbox, update this timestamp. Count chats with messages after this timestamp.

#### 1.2 Add Notification Page View Tracking
```sql
-- Add last_notifications_page_view_at to accounts table (page-level)
ALTER TABLE accounts ADD COLUMN last_notifications_page_view_at TIMESTAMPTZ;
```

**When to set `last_notifications_page_view_at`:**
- When user opens notifications page → Update `accounts.last_notifications_page_view_at = NOW()`
- This marks all notifications as "viewed" for badge purposes (removes menu/bell badges)

#### 1.3 Add Card-Level Opened Tracking (Optional - for individual card indicators)
```sql
-- Add opened_at to listing_invites table (card-level)
ALTER TABLE listing_invites ADD COLUMN opened_at TIMESTAMPTZ;

-- Add opened_at to friend_requests table (card-level)
ALTER TABLE friend_requests ADD COLUMN opened_at TIMESTAMPTZ;
```

**When to set `opened_at`:**
- When user clicks/opens individual notification card → Set `opened_at = NOW()` for that specific notification
- This allows cards to show red circle if `opened_at IS NULL` (even after page is viewed)

---

### **Phase 2: Backend Functions**

#### 2.1 Get Unread Chats Count
```sql
CREATE OR REPLACE FUNCTION get_unread_chats_count(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_last_inbox_view TIMESTAMPTZ;
  v_unread_chats_count BIGINT;
BEGIN
  -- Get user's last inbox view timestamp
  SELECT last_inbox_view_at INTO v_last_inbox_view
  FROM accounts
  WHERE id = p_user_id;
  
  -- Count chats with messages after last_inbox_view (or all if never viewed)
  IF v_last_inbox_view IS NULL THEN
    -- Never viewed inbox - count all chats with unread messages
    SELECT COUNT(DISTINCT cm.chat_id) INTO v_unread_chats_count
    FROM chat_messages cm
    INNER JOIN chat_participants cp ON cm.chat_id = cp.chat_id
    WHERE cp.user_id = p_user_id
      AND cm.sender_id <> p_user_id
      AND cm.deleted_at IS NULL
      AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at);
  ELSE
    -- Count chats with new messages since last inbox view
    SELECT COUNT(DISTINCT cm.chat_id) INTO v_unread_chats_count
    FROM chat_messages cm
    INNER JOIN chat_participants cp ON cm.chat_id = cp.chat_id
    WHERE cp.user_id = p_user_id
      AND cm.sender_id <> p_user_id
      AND cm.deleted_at IS NULL
      AND cm.created_at > v_last_inbox_view
      AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at);
  END IF;
  
  RETURN COALESCE(v_unread_chats_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2.2 Mark Inbox as Viewed
```sql
CREATE OR REPLACE FUNCTION mark_inbox_as_viewed(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE accounts
  SET last_inbox_view_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2.3 Get Unread Notifications Count (Generalized - All Types)
```sql
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_last_page_view TIMESTAMPTZ;
  v_listing_invites_count BIGINT;
  v_friend_requests_count BIGINT;
  v_total_count BIGINT;
BEGIN
  -- Get user's last notifications page view timestamp
  SELECT last_notifications_page_view_at INTO v_last_page_view
  FROM accounts
  WHERE id = p_user_id;
  
  -- Count unread listing invites (created after last page view, or all if never viewed)
  IF v_last_page_view IS NULL THEN
    -- Never viewed notifications page - count all pending invites
    SELECT COUNT(*) INTO v_listing_invites_count
    FROM listing_invites
    WHERE invitee_id = p_user_id
      AND status = 'pending';
  ELSE
    -- Count invites created after last page view
    SELECT COUNT(*) INTO v_listing_invites_count
    FROM listing_invites
    WHERE invitee_id = p_user_id
      AND status = 'pending'
      AND created_at > v_last_page_view;
  END IF;
  
  -- Count unread friend requests (created after last page view, or all if never viewed)
  IF v_last_page_view IS NULL THEN
    -- Never viewed notifications page - count all pending requests
    SELECT COUNT(*) INTO v_friend_requests_count
    FROM friend_requests
    WHERE receiver_id = p_user_id
      AND status = 'pending';
  ELSE
    -- Count requests created after last page view
    SELECT COUNT(*) INTO v_friend_requests_count
    FROM friend_requests
    WHERE receiver_id = p_user_id
      AND status = 'pending'
      AND created_at > v_last_page_view;
  END IF;
  
  -- Total unread notifications (all types)
  v_total_count := COALESCE(v_listing_invites_count, 0) + COALESCE(v_friend_requests_count, 0);
  
  RETURN v_total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2.4 Mark Notifications Page as Viewed
```sql
CREATE OR REPLACE FUNCTION mark_notifications_page_as_viewed(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update user's last notifications page view timestamp
  -- This marks all notifications as "viewed" for badge purposes
  UPDATE accounts
  SET last_notifications_page_view_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2.5 Mark Individual Notification Card as Opened (Optional - for card-level indicators)
```sql
CREATE OR REPLACE FUNCTION mark_listing_invite_card_opened(p_invite_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE listing_invites
  SET opened_at = NOW()
  WHERE id = p_invite_id
    AND invitee_id = p_user_id
    AND opened_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_friend_request_card_opened(p_request_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE friend_requests
  SET opened_at = NOW()
  WHERE id = p_request_id
    AND receiver_id = p_user_id
    AND opened_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **Phase 3: Frontend Implementation**

#### 3.1 TabBar Component Updates
- Add badge prop to TabItem type with support for:
  - `badgeCount?: number` - Number to display (or "9+" if > 9)
  - `badgeType?: 'number' | 'dot'` - Display number or just dot
- **Chats Icon**: 
  - Display red dot with number (always show number, or "9+" if > 9)
  - When clicked → Call `markInboxAsViewed()` to remove badge
- **Menu Icon**: 
  - Display red dot only (no number)
  - When clicked → **Do NOT** remove badge (badge stays until notifications page is opened)

#### 3.2 Chat Service Updates
- Add method: `getUnreadChatsCount()` - calls `get_unread_chats_count()`
- Add method: `markInboxAsViewed()` - calls `mark_inbox_as_viewed()`
- Add real-time subscription to update badge when new messages arrive

#### 3.3 Notifications Service Updates (New Unified Service)
- Create new `NotificationsService` or add to existing service
- Add method: `getUnreadNotificationsCount()` - calls `get_unread_notifications_count()` (counts all types)
- Add method: `markNotificationsPageAsViewed()` - calls `mark_notifications_page_as_viewed()`
- Add method: `markListingInviteCardOpened()` - calls `mark_listing_invite_card_opened()` (optional)
- Add method: `markFriendRequestCardOpened()` - calls `mark_friend_request_card_opened()` (optional)

#### 3.4 Menu Page Updates
- When menu page loads → **Do NOT** call `markNotificationsPageAsViewed()` (badges stay visible)
- Display badge on bell icon with unread count (number or "9+")
- Menu icon badge (red dot, no number) remains visible until notifications page is opened

#### 3.5 Notifications Page Updates
- When notifications page loads → Call `markNotificationsPageAsViewed()` (removes badges from BOTH menu and bell icons)
- Display unread count on bell icon (number or "9+", will be 0 after page is viewed)
- Individual cards can still show red circles if `opened_at IS NULL` (card-level tracking)
- **Important**: This is the ONLY place that removes the menu icon badge

#### 3.6 Chats Page Updates
- When chats page loads → Call `markInboxAsViewed()` (removes badge from chats icon)
- Display badge on chats icon with unread chats count

---

## Read/Unread Calculation Logic

### **Chats Badge Calculation:**

**Unread Chat = Chat where:**
1. User is a participant (`chat_participants.user_id = current_user_id`)
2. Has messages from others (`chat_messages.sender_id != current_user_id`)
3. Messages created after `last_inbox_view_at` (or all if never viewed)
4. Messages created after `chat_participants.last_read_at` (or all if never read)

**Formula:**
```
unread_chats = COUNT(DISTINCT chat_id) WHERE:
  - chat_id IN user's chats
  - EXISTS message WHERE:
    - sender_id != user_id
    - created_at > MAX(last_inbox_view_at, last_read_at)
    - deleted_at IS NULL
```

### **Notifications Badge Calculation (Generalized):**

**Unread Notification (Page-Level) = Any notification where:**
1. User is the recipient (varies by type: `invitee_id`, `receiver_id`, etc.)
2. `status = 'pending'` (or equivalent unread status)
3. `created_at > last_notifications_page_view_at` (or all if never viewed)

**Formula:**
```
unread_notifications = 
  COUNT(listing_invites) WHERE:
    - invitee_id = user_id
    - status = 'pending'
    - created_at > last_notifications_page_view_at (or all if NULL)
  +
  COUNT(friend_requests) WHERE:
    - receiver_id = user_id
    - status = 'pending'
    - created_at > last_notifications_page_view_at (or all if NULL)
  +
  ... (future notification types)
```

**Card-Level Indicator:**
- Individual cards show red circle if `opened_at IS NULL` (regardless of page view)
- This allows cards to remain "unopened" even after page is viewed

---

## Implementation Complexity Assessment

### **Difficulty: Medium**

**Easy Parts:**
- ✅ Database functions are straightforward
- ✅ Badge UI components already exist (can reuse patterns)
- ✅ Real-time subscriptions already in place for chats

**Medium Parts:**
- ⚠️ Need to add database columns (migration required)
- ⚠️ Need to update multiple components (TabBar, Menu, Notifications, Chats)
- ⚠️ Need to handle state management (React Query cache updates)

**Potential Challenges:**
- ⚠️ Real-time updates for notification badges (need subscription to `listing_invites`)
- ⚠️ Edge cases: What if user views notifications but doesn't accept/decline? (Should stay as "read" but still "pending")
- ⚠️ Performance: Counting unread chats might be expensive if user has many chats (need efficient query)

---

## Database Migration Required

### **Migration 1: Add Inbox View Tracking**
```sql
-- Add column to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS last_inbox_view_at TIMESTAMPTZ;

-- Create index for performance (if needed)
CREATE INDEX IF NOT EXISTS idx_accounts_last_inbox_view_at 
ON accounts(last_inbox_view_at) 
WHERE last_inbox_view_at IS NOT NULL;
```

### **Migration 2: Add Notification Page View Tracking**
```sql
-- Add column to accounts table (page-level tracking)
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS last_notifications_page_view_at TIMESTAMPTZ;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_accounts_last_notifications_page_view_at 
ON accounts(last_notifications_page_view_at) 
WHERE last_notifications_page_view_at IS NOT NULL;
```

### **Migration 3: Add Card-Level Opened Tracking (Optional)**
```sql
-- Add opened_at to listing_invites table (for individual card indicators)
ALTER TABLE listing_invites 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

-- Add opened_at to friend_requests table (for individual card indicators)
ALTER TABLE friend_requests 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_invites_opened_at 
ON listing_invites(invitee_id, opened_at) 
WHERE status = 'pending' AND opened_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_friend_requests_opened_at 
ON friend_requests(receiver_id, opened_at) 
WHERE status = 'pending' AND opened_at IS NULL;
```

---

## State Management Strategy

### **React Query Keys:**
- `['unread-chats-count', userId]` - For chats badge
- `['unread-notifications-count', userId]` - For notifications badge
- `['listing-invites', userId]` - Already exists, will include `read_at`

### **Real-time Subscriptions:**
- **Chats**: Already subscribed to `chat_messages` changes → Update unread count badge
- **Notifications**: Need subscriptions to:
  - `listing_invites` changes → Update unread count badge
  - `friend_requests` changes → Update unread count badge
  - Future notification types → Add subscriptions as needed

### **Cache Invalidation:**
- **Chats Page:**
  - When inbox viewed → Invalidate `['unread-chats-count']`
  - When individual chat opened → Invalidate `['chat', chatId]` and `['unread-chats-count']`
  
- **Notifications Page:**
  - When notifications page viewed → Invalidate `['unread-notifications-count']`, `['listing-invites']`, `['friend-requests']`
  - When individual notification card opened → Invalidate specific notification query (optional)

---

## Summary

**Is it easy to implement?** 
- **Medium difficulty** - Requires database changes, new functions, and UI updates, but the logic is straightforward.

**Unified Two-Level Tracking Pattern:**

### **Chats Page:**
1. **Page-Level (Badge)**: Use `last_inbox_view_at` timestamp - count chats with messages after this timestamp
   - **Badge Type**: Number badge (always shows number or "9+")
   - **Removal**: When chats page is opened → Badge disappears immediately
2. **Card-Level (Individual Chat)**: Use `last_read_at` on `chat_participants` - track when individual chat was opened

### **Notifications Page:**
1. **Page-Level (Badge)**: Use `last_notifications_page_view_at` timestamp - count all notification types where `created_at > last_notifications_page_view_at`
   - **Menu Icon Badge**: Red dot only (no number) - stays visible until notifications page is opened
   - **Bell Icon Badge**: Number badge (always shows number or "9+") - removed when notifications page is opened
   - **Removal**: Only when notifications page is opened (via bell icon click) → Both badges disappear
2. **Card-Level (Individual Notification)**: Use `opened_at` timestamp on each notification type - show red circle if `opened_at IS NULL`

**Key Differences:**
- ✅ **Chats**: Badge clears immediately when page is viewed
- ✅ **Notifications**: Menu icon badge persists until notifications page is explicitly opened (better reminder)
- ✅ **Number badges**: Always show count for clarity (chats icon, bell icon)
- ✅ **Dot badge**: Simple indicator without clutter (menu icon)

**Key Decisions Needed:**
1. Where to store `last_inbox_view_at`? ✅ **Decided**: `accounts` table
2. Should we use existing `last_read_at` or add new `last_inbox_view_at`? ✅ **Decided**: Add new field for inbox view, keep `last_read_at` for individual chat reads
3. How to generalize notifications for multiple types? ✅ **Decided**: Use `last_notifications_page_view_at` on `accounts` table (page-level), and optional `opened_at` on each notification type table (card-level)
4. Should we add card-level tracking (`opened_at`)? ✅ **Decided**: Optional - allows individual cards to show unread indicators even after page is viewed

**Estimated Implementation Time:**
- Database migrations: 45 minutes (3 migrations: inbox view, notifications page view, card-level tracking)
- Backend functions: 1.5 hours (generalized notification counting, multiple notification types)
- Frontend components: 3-4 hours (TabBar badges, Menu page, Notifications page, unified service)
- Testing & refinement: 1.5 hours
- **Total: ~6-7 hours**

---

## Badge Display Rules

### **Chats Icon (Bottom Navigation)**
- **Type**: Number badge (always shows number)
- **Display**: 
  - Show actual count (e.g., "1", "5", "9")
  - If count > 9, show "9+"
- **Behavior**: Removed when chats page is opened

### **Menu Icon (Bottom Navigation)**
- **Type**: Dot badge (no number)
- **Display**: Just red dot, no number
- **Behavior**: 
  - Stays visible when menu page is opened
  - Only removed when notifications page is opened (via bell icon click)

### **Bell Icon (Top Right on Menu Page)**
- **Type**: Number badge (always shows number)
- **Display**: 
  - Show actual count (e.g., "1", "5", "9")
  - If count > 9, show "9+"
- **Behavior**: Removed when notifications page is opened

---

## Architecture Benefits

### **Generalized Design:**
- ✅ Works with any notification type (listing invites, friend requests, future types)
- ✅ Single page-level timestamp tracks all notification types
- ✅ Easy to add new notification types (just add to count function)

### **Two-Level Tracking:**
- ✅ **Page-level**: Badges disappear when notifications page is viewed
- ✅ **Card-level**: Individual cards can still show unread indicators if not opened
- ✅ Flexible - cards can remain "unopened" even after page is viewed

### **Scalability:**
- ✅ Adding new notification types only requires:
  1. Adding count logic to `get_unread_notifications_count()` function
  2. Adding `opened_at` column to new notification table (optional)
  3. Adding card opened function (optional)

### **User Experience:**
- ✅ **Chats**: Badge clears immediately when page is viewed (user knows there are new chats)
- ✅ **Notifications**: Badge stays on menu icon until user explicitly opens notifications page (persistent reminder)
- ✅ **Number badges**: Always show count for clarity (chats icon, bell icon)
- ✅ **Dot badge**: Simple indicator without clutter (menu icon)
