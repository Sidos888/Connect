# Loading Animations Inventory

## 📋 Complete List of Loading Animations in the App

### 1. **LoadingSpinner** (`src/components/LoadingSpinner.tsx`)
- **Type**: Spinning circle animation
- **Animation**: `animate-spin` (Tailwind CSS)
- **Style**: Black border spinner with rounded circle
- **Sizes**: sm (16px), md (32px), lg (64px)
- **Used in**:
  - `AccountSwitchingOverlay.tsx` - Account switching overlay
  - `ProtectedRoute.tsx` - Protected route loading states
  - `SigningOutPage.tsx` - Sign out page
  - `AppShell.tsx` - App shell loading
  - `ProfileMenu.tsx` - Profile menu loading
  - `VerificationModal.tsx` - Verification modal
  - `SettingsContent.tsx` - Settings content
  - `EventGalleryView.tsx` - Event gallery
  - `Memories.tsx` - Memories page
  - `Connections.tsx` - Connections page
  - `AddPage.tsx` - Add person page
  - `ConnectionsModal.tsx` - Connections modal
  - `UserProfileModal.tsx` - User profile modal
  - `GroupSetupModal.tsx` - Group setup modal
  - `GroupInfoModal.tsx` - Group info modal
  - `SettingsModal.tsx` - Settings modal
  - `NewMessageModal.tsx` - New message modal
  - `ChatLayout.tsx` - Chat layout
  - `PersonalChatPanel.tsx` - Personal chat panel
  - `IndividualChatPage.tsx` - Individual chat page
  - `ChatPage.tsx` - Chat page
  - `NewChatPage.tsx` - New chat page
  - `MyLifePage.tsx` - My life page
  - `ConnectIdProfileClient.tsx` - Connect ID profile
  - `ProfileClientWrapper.tsx` - Profile client wrapper
  - `AttendeesPage.tsx` - Attendees page
  - `CenteredAddPerson.tsx` - Centered add person
  - `AccountCheckModal.tsx` - Account check modal
  - `BusinessTemplate.tsx` - Business template

### 2. **Loading8** (`src/components/Loading8.tsx`)
- **Type**: Three-dot wave animation
- **Animation**: Custom CSS keyframe `loading8-wave`
- **Style**: Three black dots that bounce up in sequence
- **Timing**: 1.4s infinite, delays: 0s, 0.2s, 0.4s
- **Used in**:
  - `Notifications.tsx` - Notifications page loading
  - `Memories.tsx` - Memories page loading
  - `MyLifePage.tsx` - My Life page loading (when checking completed listings)
  - `ChatPage.tsx` - Chat page loading (2 instances)
  - `ChatLayout.tsx` - Chat layout loading
  - `IndividualChatPage.tsx` - Individual chat page loading
  - `NewChatPage.tsx` - New chat page loading (2 instances)

### 3. **LoadingScreen** (`src/components/LoadingScreen.tsx`)
- **Type**: Full-screen logo with pulse animation
- **Animation**: `animate-pulse` (Tailwind CSS)
- **Style**: Connect logo that pulses
- **Used in**:
  - App initialization/startup screens

### 4. **ThreeDotLoading** (`src/components/ThreeDotLoading.tsx`)
- **Type**: Three-dot vertical bounce animation
- **Animation**: Custom React state-based animation
- **Style**: Three grey dots that move up/down in sequence
- **Timing**: 500ms per phase, cycles through 3 phases
- **Used in**:
  - Chat typing indicators (likely)

### 5. **ThreeDotLoadingBounce** (`src/components/ThreeDotLoadingBounce.tsx`)
- **Type**: Three-dot bounce animation
- **Animation**: `animate-bounce` (Tailwind CSS)
- **Style**: Three grey dots that bounce with staggered delays
- **Delays**: 0ms, 150ms, 300ms
- **Used in**:
  - Chat typing indicators

### 6. **LoadingMessageCard** (`src/components/chat/LoadingMessageCard.tsx`)
- **Type**: Three-dot wave animation on message card
- **Animation**: Custom CSS keyframe `loading8-wave` (smaller version)
- **Style**: Three black dots (4.8px) that bounce up in sequence
- **Timing**: 1.4s infinite, delays: 0s, 0.2s, 0.4s
- **Used in**:
  - Chat message uploads/loading states

### 7. **Inline Loading Animations** (Tailwind CSS classes)
- **`animate-pulse`**: Used in:
  - `LoadingScreen.tsx` - Logo pulse
  - `Guard.tsx` - Guard loading bar
  - `AppShell.tsx` - App shell loading
  - `ModalContext.tsx` - Modal context loading
  - `ProfileMenu.tsx` - Profile menu loading
  - `VerificationModal.tsx` - Verification modal
  - `SettingsContent.tsx` - Settings content
  - `InlineProfileView.tsx` - Inline profile view
  - `NewChatPage.tsx` - New chat page
  - `ScanPage.tsx` - Scan page
  - `ConnectIdProfileClient.tsx` - Connect ID profile
  - `ConnectIdPage.tsx` - Connect ID page
  - `AttendeesPage.tsx` - Attendees page
  - `CenteredAddPerson.tsx` - Centered add person
  - `PersonalChatPanel.tsx` - Personal chat panel
  - `ProfileClientWrapper.tsx` - Profile client wrapper
  - `ChatDisabledPage.tsx` - Chat disabled page
  - `MenuBlankPage.tsx` - Menu blank page
  - `GroupProfileModal.tsx` - Group profile modal
  - `InlineContactSelector.tsx` - Inline contact selector
  - `AccountCheckModal.tsx` - Account check modal
  - `ConnectionsModal.tsx` - Connections modal
  - `UserProfileModal.tsx` - User profile modal
  - `GroupSetupModal.tsx` - Group setup modal
  - `GroupInfoModal.tsx` - Group info modal
  - `SettingsModal.tsx` - Settings modal
  - `NewMessageModal.tsx` - New message modal
  - `BusinessTemplate.tsx` - Business template

- **`animate-spin`**: Used in:
  - `LoadingSpinner.tsx` - Main spinner component
  - Various inline loading states

- **`animate-bounce`**: Used in:
  - `ThreeDotLoadingBounce.tsx` - Three dot bounce component

## 📊 Summary

**Total Loading Animation Components**: 6
1. LoadingSpinner (spinning circle)
2. Loading8 (three-dot wave)
3. LoadingScreen (pulsing logo)
4. ThreeDotLoading (three-dot vertical bounce)
5. ThreeDotLoadingBounce (three-dot bounce)
6. LoadingMessageCard (message card with dots)

**Total Files Using Loading Animations**: ~48 files

**Animation Types**:
- Spinning circles (`animate-spin`)
- Pulsing elements (`animate-pulse`)
- Bouncing dots (`animate-bounce`)
- Custom wave animations (CSS keyframes)
- Custom state-based animations (React)

## 🎯 Most Common Usage

1. **LoadingSpinner** - Most widely used (23+ files)
2. **animate-pulse** - Second most common (34 files)
3. **Loading8** - Used in 7+ files (notifications, memories, my-life, chat pages)
4. **ThreeDotLoading/ThreeDotLoadingBounce** - Used in chat typing indicators
5. **LoadingMessageCard** - Used in chat message uploads

