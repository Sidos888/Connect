# Connect Project - Architecture Recommendations

**Date:** October 12, 2025  
**Focus:** Structural improvements, separation of concerns, and scalability

---

## Executive Summary

The Connect project architecture has evolved organically, resulting in mixed patterns, unclear boundaries, and scaling challenges. This document provides concrete recommendations for refactoring toward a maintainable, testable, and scalable architecture.

### Current Architecture Grade: **C (65/100)**

**Strengths:**
- ✅ Modern tech stack (Next.js 15, React 19, Supabase)
- ✅ Client-side state management (Zustand)
- ✅ Real-time capabilities working
- ✅ Mobile-ready (Capacitor)

**Critical Gaps:**
- 🔴 Mixed concerns (UI + logic + data in single files)
- 🔴 No clear service layer
- 🔴 State management scattered across contexts
- 🔴 Flat folder structure becoming unwieldy
- 🔴 No consistent patterns

---

## 1. Recommended Folder Structure

### Current Structure (Problematic)

```
src/
├── app/              # 100+ files, deeply nested, mixed concerns
├── components/       # 63 files, some organization, primitives mixed with features
├── lib/              # 28 files, mixed utilities, services, types
└── state/            # 1 file (underutilized)
```

**Problems:**
- Hard to find files
- Unclear where new code belongs
- Features spread across multiple directories
- No separation between shared and feature-specific code
- Primitives mixed with complex components

### Recommended Structure (Feature-Based)

```
src/
├── app/                          # Next.js pages ONLY (minimal logic)
│   ├── (personal)/
│   │   ├── layout.tsx            # Layout configuration
│   │   ├── page.tsx              # Route entry point
│   │   └── chat/
│   │       └── page.tsx          # Delegates to ChatFeature
│   ├── (business)/
│   └── api/                      # API routes
│       └── delete-account/
│           └── route.ts
│
├── features/                     # Feature modules (self-contained)
│   │
│   ├── auth/                     # Authentication feature
│   │   ├── index.ts              # Public API (exports)
│   │   ├── components/           # Auth-specific UI
│   │   │   ├── LoginModal.tsx
│   │   │   ├── SignUpModal.tsx
│   │   │   ├── VerificationModal.tsx
│   │   │   └── AccountCheckFlow.tsx
│   │   ├── hooks/                # Auth business logic
│   │   │   ├── useAuth.ts
│   │   │   ├── useVerification.ts
│   │   │   └── useAccountCreation.ts
│   │   ├── services/             # Auth data layer
│   │   │   ├── authService.ts
│   │   │   └── verificationService.ts
│   │   ├── store/                # Auth state
│   │   │   └── authStore.ts
│   │   ├── types.ts              # Auth TypeScript types
│   │   └── utils.ts              # Auth-specific utilities
│   │
│   ├── chat/                     # Chat/messaging feature
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── messages/         # Message-related components
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   └── MessageActions.tsx
│   │   │   ├── media/            # Media-related components
│   │   │   │   ├── MediaViewer.tsx
│   │   │   │   ├── MediaUploadButton.tsx
│   │   │   │   ├── AttachmentMenu.tsx
│   │   │   │   └── GalleryModal.tsx
│   │   │   ├── modals/           # Chat modals
│   │   │   │   ├── GroupInfoModal.tsx
│   │   │   │   ├── SettingsModal.tsx
│   │   │   │   └── ConnectionsModal.tsx
│   │   │   ├── ChatPanel.tsx     # Main chat UI
│   │   │   └── ChatList.tsx      # Conversation list
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   ├── useMessages.ts
│   │   │   ├── useSendMessage.ts
│   │   │   ├── useTypingIndicator.ts
│   │   │   └── useChatSubscription.ts
│   │   ├── services/
│   │   │   ├── chatService.ts
│   │   │   ├── messageService.ts
│   │   │   ├── realtimeService.ts
│   │   │   ├── mediaService.ts
│   │   │   └── offlineQueueService.ts
│   │   ├── store/
│   │   │   └── chatStore.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── profile/                  # User profile feature
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── ProfileView.tsx
│   │   │   ├── ProfileEditor.tsx
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   └── ProfileMenu/      # Complex component gets its own folder
│   │   │       ├── ProfileMenu.tsx
│   │   │       ├── MenuList.tsx
│   │   │       ├── ProfileSection.tsx
│   │   │       └── SettingsSection.tsx
│   │   ├── hooks/
│   │   │   ├── useProfile.ts
│   │   │   ├── useProfileUpdate.ts
│   │   │   └── useAvatarUpload.ts
│   │   ├── services/
│   │   │   ├── profileService.ts
│   │   │   └── avatarService.ts
│   │   ├── store/
│   │   │   └── profileStore.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── connections/              # Social connections feature
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── ConnectionsList.tsx
│   │   │   ├── ConnectionItem.tsx
│   │   │   ├── FriendRequestsList.tsx
│   │   │   ├── FriendRequestItem.tsx
│   │   │   └── UserSearch.tsx
│   │   ├── hooks/
│   │   │   ├── useConnections.ts
│   │   │   ├── useFriendRequests.ts
│   │   │   └── useUserSearch.ts
│   │   ├── services/
│   │   │   └── connectionsService.ts
│   │   ├── store/
│   │   │   └── connectionsStore.ts
│   │   └── types.ts
│   │
│   ├── my-life/                  # Events/activities feature
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventList.tsx
│   │   │   ├── Carousel.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── ProfileStrip.tsx
│   │   ├── hooks/
│   │   │   └── useEvents.ts
│   │   ├── services/
│   │   │   └── eventsService.ts
│   │   └── types.ts
│   │
│   └── business/                 # Business profiles feature
│       ├── index.ts
│       ├── components/
│       │   ├── BusinessProfile.tsx
│       │   ├── HubCard.tsx
│       │   └── BusinessSwitcher.tsx
│       ├── hooks/
│       │   └── useBusiness.ts
│       └── types.ts
│
├── shared/                       # Shared across all features
│   │
│   ├── components/               # Reusable components
│   │   │
│   │   ├── primitives/           # Basic UI building blocks
│   │   │   ├── Avatar/
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── AvatarGroup.tsx
│   │   │   │   └── Avatar.test.tsx
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── IconButton.tsx
│   │   │   │   └── Button.test.tsx
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── TextArea.tsx
│   │   │   │   └── SearchInput.tsx
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ModalHeader.tsx
│   │   │   │   ├── ModalBody.tsx
│   │   │   │   └── ModalFooter.tsx
│   │   │   ├── Card/
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── CardHeader.tsx
│   │   │   │   └── CardContent.tsx
│   │   │   ├── Badge/
│   │   │   ├── Spinner/
│   │   │   ├── Tooltip/
│   │   │   ├── Toast/
│   │   │   └── index.ts          # Re-export all primitives
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── AppShell.tsx
│   │   │   ├── TopNavigation.tsx
│   │   │   ├── MobileBottomNavigation.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   └── patterns/             # Common UI patterns
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingState.tsx
│   │       └── InfiniteScroll.tsx
│   │
│   ├── hooks/                    # Shared React hooks
│   │   ├── useAuth.ts            # Auth state access
│   │   ├── useAsyncData.ts       # Generic async loading
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useIntersection.ts
│   │   ├── usePrevious.ts
│   │   ├── useClickOutside.ts
│   │   └── index.ts
│   │
│   ├── services/                 # Shared services (infrastructure)
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client setup
│   │   │   ├── storage.ts        # Storage helpers
│   │   │   └── realtime.ts       # Realtime helpers
│   │   ├── api/
│   │   │   └── apiClient.ts      # HTTP client wrapper
│   │   └── analytics/
│   │       └── analytics.ts      # Analytics service
│   │
│   ├── stores/                   # Global Zustand stores
│   │   ├── uiStore.ts            # UI state (modals, tabs)
│   │   ├── sessionStore.ts       # Session data
│   │   └── index.ts
│   │
│   ├── types/                    # Shared TypeScript types
│   │   ├── database.ts           # Re-export from supabase-types
│   │   ├── models.ts             # Domain models
│   │   ├── api.ts                # API request/response types
│   │   ├── components.ts         # Common component props
│   │   └── utils.ts              # Utility types
│   │
│   ├── utils/                    # Pure utility functions
│   │   ├── formatting/
│   │   │   ├── dates.ts
│   │   │   ├── numbers.ts
│   │   │   └── text.ts
│   │   ├── validation/
│   │   │   ├── email.ts
│   │   │   ├── phone.ts
│   │   │   └── schemas.ts        # Zod schemas
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   ├── config/                   # App configuration
│   │   ├── env.ts                # Environment variables
│   │   ├── routes.ts             # Route constants
│   │   └── features.ts           # Feature flags
│   │
│   └── lib/                      # Third-party library configs
│       ├── logger.ts
│       ├── sentry.ts
│       └── analytics.ts
│
├── styles/                       # Global styles
│   ├── globals.css
│   ├── tokens.json               # Design tokens
│   └── theme.ts                  # Tailwind theme config
│
└── tests/                        # Test utilities
    ├── helpers/
    │   ├── test-utils.tsx
    │   └── setup.ts
    └── mocks/
        ├── supabase.ts
        └── handlers.ts
```

### Benefits of This Structure

1. **Feature Isolation**
   - All chat code in `features/chat/`
   - Can work on chat without touching auth
   - Easy to find related code

2. **Clear Boundaries**
   - `features/` = Feature-specific code
   - `shared/` = Reusable across features
   - `app/` = Routing only

3. **Scalability**
   - Add new feature = Add new feature folder
   - No need to touch other features
   - Team can own specific features

4. **Testability**
   - Each feature can be tested in isolation
   - Mocks only what's needed
   - Clear dependencies

5. **Import Clarity**
   ```typescript
   // Feature-specific imports
   import { ChatPanel } from '@/features/chat';
   import { useProfile } from '@/features/profile';
   
   // Shared imports
   import { Button, Modal } from '@/shared/components/primitives';
   import { useAuth } from '@/shared/hooks';
   ```

---

## 2. Separation of Concerns

### Problem: Mixed Responsibilities

**Current (PersonalChatPanel.tsx - 1026 lines):**
```typescript
export default function PersonalChatPanel({ conversation }) {
  // STATE MANAGEMENT (100+ lines)
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  // ... 30 more state variables
  
  // DATA FETCHING (200+ lines)
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', conversation.id);
      setMessages(data);
    };
    loadMessages();
  }, [conversation.id]);
  
  // BUSINESS LOGIC (300+ lines)
  const sendMessage = async (text) => {
    // Complex message sending logic
    // File validation
    // Offline queue management
    // Error handling
  };
  
  // REALTIME SUBSCRIPTIONS (150+ lines)
  useEffect(() => {
    const subscription = supabase
      .channel('messages')
      .on('INSERT', handleNewMessage)
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);
  
  // UI RENDERING (276+ lines)
  return (
    <div>
      {/* Complex JSX with inline logic */}
    </div>
  );
}
```

**Responsibilities mixed:**
- UI rendering
- State management
- Data fetching
- Real-time subscriptions
- Business logic
- Error handling
- Media handling

### Recommended: Layered Architecture

**Layer 1: Service Layer (Data Access)**
```typescript
// features/chat/services/messageService.ts
export class MessageService {
  constructor(private supabase: SupabaseClient) {}
  
  async getMessages(chatId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) throw new AppError('Failed to load messages', error);
    return data;
  }
  
  async sendMessage(chatId: string, userId: string, text: string): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: userId,
        text,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw new AppError('Failed to send message', error);
    return data;
  }
}

export const messageService = new MessageService(supabase);
```

**Layer 2: Business Logic Layer (Hooks)**
```typescript
// features/chat/hooks/useMessages.ts
export function useMessages(chatId: string) {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => messageService.getMessages(chatId),
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (text: string) => 
      messageService.sendMessage(chatId, user.id, text),
    
    onSuccess: (newMessage) => {
      // Update cache optimistically
      queryClient.setQueryData(
        ['messages', chatId],
        (old: Message[] = []) => [...old, newMessage]
      );
    },
    
    onError: (error) => {
      toast.error('Failed to send message');
      logger.error('Send message failed', error);
    },
  });
}

// features/chat/hooks/useChatSubscription.ts
export function useChatSubscription(chatId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          // Update cache with new message
          queryClient.setQueryData(
            ['messages', chatId],
            (old: Message[] = []) => [...old, payload.new]
          );
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [chatId, queryClient]);
}
```

**Layer 3: Presentation Layer (Components)**
```typescript
// features/chat/components/ChatPanel.tsx (now ~150 lines)
export function ChatPanel({ conversation }: ChatPanelProps) {
  const { data: messages, isLoading, error } = useMessages(conversation.id);
  const { mutate: sendMessage, isPending } = useSendMessage(conversation.id);
  
  // Subscribe to real-time updates
  useChatSubscription(conversation.id);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={conversation} />
      <MessageList messages={messages} />
      <MessageInput 
        onSend={sendMessage} 
        disabled={isPending}
      />
    </div>
  );
}
```

### Benefits

1. **Testability**
   ```typescript
   // Test service layer (pure functions)
   test('messageService.sendMessage', async () => {
     const message = await messageService.sendMessage('chat1', 'user1', 'Hello');
     expect(message.text).toBe('Hello');
   });
   
   // Test business logic (hooks)
   test('useSendMessage updates cache', async () => {
     const { result } = renderHook(() => useSendMessage('chat1'));
     await act(() => result.current.mutate('Hello'));
     // Assert cache updated
   });
   
   // Test UI (component)
   test('ChatPanel renders messages', () => {
     render(<ChatPanel conversation={mockConversation} />);
     expect(screen.getByText('Hello')).toBeInTheDocument();
   });
   ```

2. **Reusability**
   - Service layer can be used in multiple features
   - Hooks can be used in multiple components
   - Components are dumb, easy to reuse

3. **Maintainability**
   - Change data fetching = Edit service layer
   - Change business logic = Edit hooks
   - Change UI = Edit components
   - Clear separation of concerns

---

## 3. State Management Strategy

### Current: Mixed Patterns (Confusing)

**4 different state management approaches:**

1. **Zustand (store.ts)** - For conversations, profile
2. **React Context (authContext.tsx)** - For authentication
3. **Local state** - In every component
4. **Supabase cache (simpleChatService)** - Custom caching

**Problems:**
- Unclear where state lives
- Data duplicated across layers
- Synchronization bugs
- Hard to debug

### Recommended: Clear State Strategy

**Server State vs Client State**

```typescript
// SERVER STATE (data from API/database)
// Managed by React Query

// Read data
const { data: profile } = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => profileService.getProfile(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutate data
const { mutate: updateProfile } = useMutation({
  mutationFn: (updates) => profileService.updateProfile(userId, updates),
  onSuccess: () => {
    queryClient.invalidateQueries(['profile', userId]);
  },
});

// CLIENT STATE (UI state, local-only)
// Managed by Zustand

// stores/uiStore.ts
export const useUIStore = create((set) => ({
  activeTab: 'home',
  activeModal: null,
  sidebarOpen: false,
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

// Usage
const { activeTab, setActiveTab } = useUIStore();
```

### Recommended Store Structure

```typescript
// stores/authStore.ts - Authentication state
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearAuth: () => set({ user: null, session: null, isAuthenticated: false }),
}));

// stores/uiStore.ts - UI state
export const useUIStore = create<UIStore>((set) => ({
  activeModal: null,
  activeTab: 'home',
  sidebarOpen: true,
  theme: 'light',
  
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));

// stores/sessionStore.ts - Session/temporary data
export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      recentSearches: [],
      draftMessages: {},
      
      addRecentSearch: (query) => set((state) => ({
        recentSearches: [query, ...state.recentSearches].slice(0, 10)
      })),
      
      saveDraftMessage: (chatId, text) => set((state) => ({
        draftMessages: { ...state.draftMessages, [chatId]: text }
      })),
    }),
    {
      name: 'session-storage',
    }
  )
);
```

### When to Use Each

| State Type | Tool | Example |
|------------|------|---------|
| Server data (CRUD) | React Query | Profiles, messages, chats |
| Authentication | Zustand + localStorage | User session, tokens |
| UI state (global) | Zustand | Active tab, open modals |
| UI state (local) | useState | Input value, loading state |
| Form state | React Hook Form | Complex forms with validation |
| URL state | Next.js params/searchParams | Filters, pagination, selected item |

---

## 4. API/Service Layer Design

### Current: Direct Supabase Calls Everywhere

**Found in 33 files:**
```typescript
// Component makes direct database call
const { data } = await supabase.from('messages').select('*');
```

**Problems:**
- Business logic in components
- Duplicated query logic
- Hard to test
- Hard to switch database/API
- No centralized error handling

### Recommended: Service Layer Pattern

**Create abstraction over Supabase:**

```typescript
// shared/services/supabase/baseService.ts
export abstract class BaseService<T> {
  constructor(
    protected supabase: SupabaseClient,
    protected tableName: string
  ) {}
  
  async findAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*');
    
    if (error) throw new AppError(`Failed to load ${this.tableName}`, error);
    return data as T[];
  }
  
  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new AppError(`Failed to load ${this.tableName}`, error);
    }
    
    return data as T;
  }
  
  async create(data: Partial<T>): Promise<T> {
    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();
    
    if (error) throw new AppError(`Failed to create ${this.tableName}`, error);
    return created as T;
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: updated, error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new AppError(`Failed to update ${this.tableName}`, error);
    return updated as T;
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw new AppError(`Failed to delete ${this.tableName}`, error);
  }
}
```

**Feature-specific services extend base:**

```typescript
// features/chat/services/messageService.ts
export class MessageService extends BaseService<Message> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'messages');
  }
  
  // Feature-specific methods
  async getMessagesByChatId(
    chatId: string,
    options?: {
      limit?: number;
      before?: string;
    }
  ): Promise<Message[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        sender:accounts(id, name, profile_pic),
        attachments(*)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false });
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.before) {
      query = query.lt('created_at', options.before);
    }
    
    const { data, error } = await query;
    
    if (error) throw new AppError('Failed to load messages', error);
    return data as Message[];
  }
  
  async sendMessage(
    chatId: string,
    senderId: string,
    text: string,
    options?: {
      replyToId?: string;
      attachments?: string[];
    }
  ): Promise<Message> {
    // Validation
    if (!text.trim()) {
      throw new AppError('Message cannot be empty', { code: 'EMPTY_MESSAGE' });
    }
    
    // Create message
    const message = await this.create({
      chat_id: chatId,
      sender_id: senderId,
      text: text.trim(),
      reply_to_message_id: options?.replyToId,
      created_at: new Date().toISOString(),
    });
    
    // Attach media if provided
    if (options?.attachments?.length) {
      await this.attachMedia(message.id, options.attachments);
    }
    
    return message;
  }
  
  async markAsRead(chatId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('mark_messages_read', {
      p_chat_id: chatId,
      p_user_id: userId,
    });
    
    if (error) throw new AppError('Failed to mark messages as read', error);
  }
  
  private async attachMedia(messageId: string, urls: string[]): Promise<void> {
    // Attachment logic
  }
}

// Export singleton instance
export const messageService = new MessageService(supabase);
```

### Benefits

1. **Centralized logic**
   - All database calls in one place
   - Easy to find and modify

2. **Testability**
   ```typescript
   // Mock the service
   jest.mock('@/features/chat/services/messageService');
   
   test('sendMessage validates empty text', async () => {
     await expect(messageService.sendMessage('chat1', 'user1', ''))
       .rejects.toThrow('Message cannot be empty');
   });
   ```

3. **Type safety**
   - Service knows exact return types
   - TypeScript autocomplete works

4. **Switchable backend**
   - Can replace Supabase with REST API
   - Components don't need to change

---

## 5. Error Handling Architecture

### Current: Inconsistent Patterns

**Pattern 1: Silent failure**
```typescript
const { error } = await supabase.from('table').select();
if (error) console.error(error);
```

**Pattern 2: Local error state**
```typescript
const [error, setError] = useState<string | null>(null);
if (error) return <div>{error}</div>;
```

**Pattern 3: Try-catch**
```typescript
try {
  await doSomething();
} catch (error) {
  console.error(error);
}
```

### Recommended: Centralized Error Handling

**Error Types:**
```typescript
// shared/types/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'info' | 'warning' | 'error' | 'critical',
    public cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 'warning');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 'error');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 'info');
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 'error');
  }
}
```

**Error Handler:**
```typescript
// shared/lib/errorHandler.ts
import * as Sentry from '@sentry/nextjs';

export function handleError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }
  
  // Supabase error
  if (error?.code) {
    return mapSupabaseError(error);
  }
  
  // Network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError();
  }
  
  // Unknown error
  console.error('Unhandled error:', error);
  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    'error',
    error
  );
}

function mapSupabaseError(error: any): AppError {
  const errorMap: Record<string, AppError> = {
    'PGRST116': new NotFoundError('Resource'),
    '23505': new ValidationError('This record already exists'),
    '23503': new ValidationError('Related record not found'),
    '42501': new AuthenticationError('Permission denied'),
  };
  
  return errorMap[error.code] || new AppError(
    error.message || 'Database error',
    error.code,
    'error'
  );
}

// Global error handler hook
export function useErrorHandler() {
  const showToast = useToast();
  
  return useCallback((error: unknown) => {
    const appError = handleError(error);
    
    // Log to monitoring service
    if (appError.severity === 'critical' || appError.severity === 'error') {
      Sentry.captureException(error, {
        extra: {
          code: appError.code,
          severity: appError.severity,
        },
      });
    }
    
    // Show user feedback
    showToast({
      title: appError.message,
      variant: appError.severity === 'critical' || appError.severity === 'error'
        ? 'error'
        : appError.severity,
    });
    
    return appError;
  }, [showToast]);
}
```

**Usage:**
```typescript
// In services
async getMessages(chatId: string): Promise<Message[]> {
  try {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId);
    
    if (error) throw handleError(error);
    return data;
  } catch (error) {
    throw handleError(error);
  }
}

// In hooks
const { mutate: sendMessage } = useMutation({
  mutationFn: (text) => messageService.sendMessage(chatId, userId, text),
  onError: (error) => {
    const appError = handleError(error);
    
    // Specific handling
    if (appError instanceof ValidationError) {
      // Show inline validation error
    } else {
      // Show toast
      toast.error(appError.message);
    }
  },
});

// In components
const handleSubmit = async () => {
  try {
    await sendMessage(text);
  } catch (error) {
    const appError = handleError(error);
    setError(appError.message);
  }
};
```

---

## 6. TypeScript Architecture

### Current: Mixed Type Safety

**Issues:**
- Many `any` types
- Inconsistent type definitions
- Types spread across files
- Not using generated Supabase types

### Recommended: Strict Type System

**1. Use Generated Database Types:**
```typescript
// shared/types/database.ts
import { Database as DatabaseGenerated } from '@/lib/supabase-types';

// Re-export for convenience
export type Database = DatabaseGenerated;
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];

// Common types
export type Account = Tables<'accounts'>;
export type Message = Tables<'messages'>;
export type Chat = Tables<'chats'>;
export type Connection = Tables<'connections'>;
```

**2. Create View Models:**
```typescript
// features/chat/types.ts
import { Message } from '@/shared/types/database';

// Database type
export type MessageDB = Message;

// View model for UI
export interface MessageViewModel {
  id: string;
  chatId: string;
  text: string;
  createdAt: Date; // Parsed from string
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  attachments: AttachmentViewModel[];
  isOwn: boolean; // Computed property
  reactions: ReactionViewModel[];
}

// Mapper function
export function toMessageViewModel(
  message: MessageDB,
  currentUserId: string
): MessageViewModel {
  return {
    id: message.id,
    chatId: message.chat_id,
    text: message.text,
    createdAt: new Date(message.created_at),
    sender: {
      id: message.sender_id,
      name: message.sender_name || 'Unknown',
      avatarUrl: message.sender_profile_pic || null,
    },
    attachments: message.attachments?.map(toAttachmentViewModel) || [],
    isOwn: message.sender_id === currentUserId,
    reactions: message.reactions?.map(toReactionViewModel) || [],
  };
}
```

**3. Strict TypeScript Config:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 7. Testing Strategy

### Recommended Test Structure

```
tests/
├── unit/                         # Pure function tests
│   ├── services/
│   │   ├── messageService.test.ts
│   │   ├── profileService.test.ts
│   │   └── authService.test.ts
│   └── utils/
│       ├── formatting.test.ts
│       └── validation.test.ts
│
├── integration/                  # Feature tests
│   ├── features/
│   │   ├── auth.test.ts
│   │   ├── chat.test.ts
│   │   └── profile.test.ts
│   └── api/
│       └── routes.test.ts
│
├── e2e/                          # End-to-end tests
│   ├── flows/
│   │   ├── signup.spec.ts
│   │   ├── chat.spec.ts
│   │   └── profile-edit.spec.ts
│   └── fixtures/
│
└── helpers/                      # Test utilities
    ├── test-utils.tsx
    ├── setup.ts
    └── mocks/
        ├── supabase.ts
        └── handlers.ts
```

**Testing Guidelines:**
- Unit tests: 70% coverage
- Integration tests: 20% coverage
- E2E tests: 10% coverage

---

## 8. Migration Strategy

### Phase 1: Foundation (Week 1-2)

1. **Create new folder structure** (don't move files yet)
2. **Set up service layer** for 1-2 features
3. **Create hooks layer** for same features
4. **Write tests** for new code

### Phase 2: Incremental Migration (Week 3-6)

1. **Pick one feature** (e.g., chat)
2. **Extract service layer**
3. **Extract hooks**
4. **Refactor components** to use new architecture
5. **Add tests**
6. **Repeat** for next feature

### Phase 3: Consolidation (Week 7-8)

1. **Move remaining files** to new structure
2. **Remove old patterns**
3. **Update imports**
4. **Final testing**

**Key Principle: Incremental, not big bang**

---

## Summary

The recommended architecture provides:

✅ **Clear structure** - Feature-based organization  
✅ **Separation of concerns** - Services/hooks/components  
✅ **Type safety** - Strict TypeScript with view models  
✅ **Testability** - Each layer tested independently  
✅ **Scalability** - Easy to add new features  
✅ **Maintainability** - Clear patterns and conventions  

**Next Steps:**
1. Review and approve this architecture plan
2. Create proof-of-concept with one feature (chat recommended)
3. Migrate incrementally over 6-8 weeks
4. Document patterns for team

---

**Report Generated:** October 12, 2025

