"use client";

import { create } from "zustand";
import { AppStore, Business, PersonalProfile, UUID, Conversation, ChatTypingState, TypingActions } from "./types";
import type { SimpleChatService, SimpleChat, SimpleMessage } from "./simpleChatService";
import { getSupabaseClient } from "./supabaseClient";

type PersistedShape = {
  personalProfile: PersonalProfile | null;
  businesses: Business[];
  context: AppStore["context"];
  conversations: Conversation[];
};

const STORAGE_KEY = "connect.app.v1";

function loadFromLocalStorage(): PersistedShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedShape;
  } catch {
    return null;
  }
}

function saveToLocalStorage(data: PersistedShape) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function generateId(): UUID {
  // Simple UUID-like generator for local use
  return crypto.randomUUID ? crypto.randomUUID() : `loc_${Math.random().toString(36).slice(2)}`;
}

type ChatActions = {
  loadConversations: (userId: string, chatService: SimpleChatService) => Promise<void>;
  getConversations: () => Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  sendMessage: (conversationId: UUID, text: string, userId: string, chatService: SimpleChatService, replyToMessageId?: string, mediaUrls?: string[]) => Promise<void>;
  markAllRead: (conversationId: UUID, userId: string, chatService: SimpleChatService) => Promise<void>;
  markMessagesAsRead: (conversationId: UUID, userId: string, chatService: SimpleChatService) => Promise<void>;
  createDirectChat: (otherUserId: string, userId: string, chatService: SimpleChatService) => Promise<Conversation | null>;
  clearConversations: () => void;
};

type FullStore = AppStore & ChatActions & { conversations: Conversation[] } & {
  // Typing indicator state
  chatTypingStates: Map<string, ChatTypingState>;
} & TypingActions;

export const useAppStore = create<FullStore>((set, get) => ({
  personalProfile: null,
  businesses: [],
  context: { type: "personal" },
  isHydrated: false, // Always start as false to prevent hydration mismatch
  conversations: [],
  isAccountSwitching: false,
  chatTypingStates: new Map(),
  pendingMessages: [], // NEW: Offline message queue

  setAccountSwitching: (loading: boolean) => {
    set({ isAccountSwitching: loading });
  },

  setPersonalProfile: (profile) => {
    set({ personalProfile: profile });
    const { businesses, context, conversations } = get();
    saveToLocalStorage({ personalProfile: profile, businesses, context, conversations });
  },

  addBusiness: (input) => {
    const business: Business = {
      id: generateId(),
      name: input.name,
      bio: input.bio,
      logoUrl: input.logoUrl ?? null,
      createdAt: new Date().toISOString(),
    };
    const businesses = [...get().businesses, business];
    const context = { type: "business" as const, businessId: business.id };
    set({ businesses, context });
    const { personalProfile, conversations } = get();
    saveToLocalStorage({ personalProfile, businesses, context, conversations });
    return business;
  },

  switchToPersonal: () => {
    const context = { type: "personal" as const };
    set({ context });
    const { personalProfile, businesses, conversations } = get();
    saveToLocalStorage({ personalProfile, businesses, context, conversations });
  },

  switchToBusiness: (businessId) => {
    const exists = get().businesses.some((b) => b.id === businessId);
    const context = exists ? { type: "business" as const, businessId } : { type: "personal" as const };
    set({ context });
    const { personalProfile, businesses, conversations } = get();
    saveToLocalStorage({ personalProfile, businesses, context, conversations });
  },

  clearAll: () => {
    set({ personalProfile: null, businesses: [], context: { type: "personal" }, conversations: [] });
    localStorage.removeItem('connect-store');
    sessionStorage.clear();
  },

  resetMenuState: () => {
    // This will be used to reset menu state when navigating to menu
    // The actual state reset will be handled in the menu component
    // We'll use a custom event to notify the menu component
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('resetMenuState'));
    }
  },

  loadConversations: async (userId: string, chatService: SimpleChatService) => {
    console.log('loadConversations called for user:', userId);
    
    // Don't try to load conversations if user is not authenticated
    if (!userId) {
      console.log('No userId provided, skipping conversation loading');
      return;
    }
    
    try {
      console.log('🔧 Store: Loading conversations for user:', userId);
      const { chats, error } = await chatService.getUserChats();
      console.log('🔧 Store: getUserChats result:', { chats: chats?.length, error });
      
      if (error) {
        console.error('🔧 Store: Error loading conversations:', error);
        console.error('🔧 Store: Error details:', {
          message: error.message || 'Unknown error',
          code: (error as any).code || 'UNKNOWN',
          details: (error as any).details || null,
          hint: (error as any).hint || null
        });
        return;
      }
      
      // Convert SimpleChat to Conversation format - use last_message data that's now included
      const conversations: Conversation[] = chats.map((chat) => {
        console.log('Converting chat:', chat.id, 'type:', chat.type, 'photo:', chat.photo);
        const otherParticipant = chat.participants.find(p => p.id !== userId);
        
        // Use the last_message data that's now loaded with the chat
        const lastMessage = chat.last_message && chat.messages && chat.messages.length > 0 ? {
          id: chat.messages[0].id,
          conversationId: chat.id,
          sender: chat.messages[0].sender_id === userId ? 'me' as const : 'them' as const,
          senderId: chat.messages[0].sender_id,
          senderName: chat.messages[0].sender_name || 'Unknown',
          text: chat.messages[0].text,
          attachments: chat.messages[0].attachments || [],
          createdAt: chat.messages[0].created_at,
          read: false
        } : null;

        return {
          id: chat.id,
          title: chat.type === 'direct' 
            ? otherParticipant?.name || 'Unknown User'
            : chat.name || 'Group Chat',
          avatarUrl: chat.type === 'direct' 
            ? otherParticipant?.profile_pic || null
            : chat.photo || null,
          isGroup: chat.type === 'group',
          unreadCount: chat.unreadCount || 0,
          messages: lastMessage ? [lastMessage] : []
        };
      });
      
      console.log('Loaded conversations:', conversations.length);
      set({ conversations });
      const { personalProfile, businesses, context } = get();
      saveToLocalStorage({ personalProfile, businesses, context, conversations });
      
      // Real-time subscriptions are now handled by individual components
      // This keeps the store simple and focused on conversation list management
      
    } catch (error) {
      console.error('Error in loadConversations:', error);
    }
  },

  getConversations: () => get().conversations,

  setConversations: (conversations) => {
    set({ conversations });
    const { personalProfile, businesses, context } = get();
    saveToLocalStorage({ personalProfile, businesses, context, conversations });
  },

  sendMessage: async (conversationId, text, userId, chatService, replyToMessageId?) => {
    try {
      const { message, error } = await chatService.sendMessage(conversationId, text, replyToMessageId);
      if (error) {
        console.error('Error sending message:', error);
        return;
      }
      
      // Don't update local state here - let real-time subscription handle it
      // This prevents duplication
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  },

  markAllRead: async (conversationId, userId, chatService) => {
    try {
      // Mark messages as read in the database
      const { error } = await chatService.markAsRead(conversationId);
      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Update local state
      const conversations = get().conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0, messages: c.messages.map((m) => ({ ...m, read: true })) } : c
      );
      set({ conversations });
      const { personalProfile, businesses, context } = get();
      saveToLocalStorage({ personalProfile, businesses, context, conversations });
    } catch (error) {
      console.error('Error in markAllRead:', error);
    }
  },

  markMessagesAsRead: async (conversationId, userId, chatService) => {
    try {
      // Mark messages as read in the database
      const { error } = await chatService.markAsRead(conversationId);
      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Update local state
      const conversations = get().conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      set({ conversations });
      const { personalProfile, businesses, context } = get();
      saveToLocalStorage({ personalProfile, businesses, context, conversations });
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  },

  createDirectChat: async (otherUserId, userId, chatService) => {
    try {
      const { chat, error } = await chatService.createDirectChat(otherUserId);
      if (error) {
        console.error('Error creating direct chat:', error);
        return null;
      }
      
      if (chat) {
        // Convert SimpleChat to Conversation format
        const otherParticipant = chat.participants.find(p => p.id !== userId);
        const conversation: Conversation = {
          id: chat.id,
          title: chat.type === 'direct' 
            ? otherParticipant?.name || 'Unknown User'
            : chat.name || 'Group Chat',
          avatarUrl: chat.type === 'direct' 
            ? otherParticipant?.profile_pic || null
            : null,
          isGroup: chat.type === 'group',
          unreadCount: 0,
          messages: []
        };
        
        // Add to local state
        const conversations = [...get().conversations, conversation];
        set({ conversations });
        const { personalProfile, businesses, context } = get();
        saveToLocalStorage({ personalProfile, businesses, context, conversations });
        
        return conversation;
      }
      
      return null;
    } catch (error) {
      console.error('Error in createDirectChat:', error);
      return null;
    }
  },

  clearConversations: () => {
    console.log('Store: Clearing all conversations');
    set({ conversations: [] });
    const { personalProfile, businesses, context } = get();
    saveToLocalStorage({ personalProfile, businesses, context, conversations: [] });
  },


  // Typing indicator actions
  updateChatTyping: (chatId: string, typingUsers: string[]) => {
    console.log('Store: Updating typing state for chat:', chatId, 'users:', typingUsers);
    const { chatTypingStates } = get();
    const newTypingStates = new Map(chatTypingStates);
    
    if (typingUsers.length > 0) {
      newTypingStates.set(chatId, {
        chatId,
        typingUsers,
        lastUpdated: new Date().toISOString()
      });
    } else {
      newTypingStates.delete(chatId);
    }
    
    set({ chatTypingStates: newTypingStates });
  },

  clearChatTyping: (chatId: string) => {
    console.log('Store: Clearing typing state for chat:', chatId);
    const { chatTypingStates } = get();
    const newTypingStates = new Map(chatTypingStates);
    newTypingStates.delete(chatId);
    set({ chatTypingStates: newTypingStates });
  },

  getChatTyping: (chatId: string) => {
    const { chatTypingStates } = get();
    return chatTypingStates.get(chatId) || null;
  },
}));

// Hydrate from localStorage after store is initialized
if (typeof window !== "undefined") {
  // Use setTimeout to ensure store is fully initialized
  setTimeout(() => {
    try {
      const persisted = loadFromLocalStorage();
      if (persisted) {
        useAppStore.setState({
          personalProfile: persisted.personalProfile,
          businesses: persisted.businesses,
          context: persisted.context,
          conversations: [], // Always start with empty conversations to load real data
          isHydrated: true, // Mark as hydrated after loading from localStorage
        });
        console.log('✅ Store hydrated from localStorage');
      } else {
        useAppStore.setState({
          isHydrated: true, // Mark as hydrated even with empty state
        });
        console.log('✅ Store hydrated with empty state');
      }
    } catch (error) {
      console.error('Error hydrating store:', error);
      // Still mark as hydrated even if there's an error
      useAppStore.setState({
        isHydrated: true,
      });
      console.log('✅ Store hydrated with error fallback');
    }
  }, 0);
}

export function useCurrentBusiness() {
  const { context, businesses } = useAppStore();
  if (context.type !== "business") return null;
  return businesses.find((b) => b.id === context.businessId) ?? null;
}

// TODO: replace localStorage with Supabase tables: profiles (personal) and orgs (businesses).

