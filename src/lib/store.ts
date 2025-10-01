"use client";

import { create } from "zustand";
import { AppStore, Business, PersonalProfile, UUID, Conversation } from "./types";
import { simpleChatService, SimpleChat, SimpleMessage } from "./simpleChatService";
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
  loadConversations: (userId: string) => Promise<void>;
  getConversations: () => Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  sendMessage: (conversationId: UUID, text: string, userId: string) => Promise<void>;
  markAllRead: (conversationId: UUID, userId: string) => Promise<void>;
  markMessagesAsRead: (conversationId: UUID, userId: string) => Promise<void>;
  createDirectChat: (otherUserId: string) => Promise<Conversation | null>;
  clearConversations: () => void;
};

type FullStore = AppStore & ChatActions & { conversations: Conversation[] };

export const useAppStore = create<FullStore>((set, get) => ({
  personalProfile: null,
  businesses: [],
  context: { type: "personal" },
  isHydrated: false,
  conversations: [],
  isAccountSwitching: false,

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

  loadConversations: async (userId: string) => {
    console.log('loadConversations called for user:', userId);
    
    // Don't try to load conversations if user is not authenticated
    if (!userId) {
      console.log('No userId provided, skipping conversation loading');
      return;
    }
    
    try {
      const { chats, error } = await simpleChatService.getUserChats(userId);
      if (error) {
        // Only log error if it's not an authentication error
        if (error.message !== 'User not authenticated' && 
            error.message !== 'User ID is required' &&
            error.message !== 'User ID mismatch') {
          console.error('Error loading conversations:', {
            message: error.message || 'Unknown error',
            code: error.code || 'UNKNOWN',
            details: error.details || null,
            hint: error.hint || null
          });
        }
        return;
      }
      
      // Convert SimpleChat to Conversation format and load last message
      const conversations: Conversation[] = await Promise.all(chats.map(async (chat) => {
        console.log('Converting chat:', chat.id, 'participants:', chat.participants, 'userId:', userId);
        console.log('All participant IDs:', chat.participants.map(p => p.id));
        console.log('Looking for participant that is not:', userId);
        const otherParticipant = chat.participants.find(p => p.id !== userId);
        console.log('Other participant found:', otherParticipant);
        
        // Load the last message for this chat
        const { messages, error } = await simpleChatService.getChatMessages(chat.id, userId);
        const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
        
        return {
          id: chat.id,
          title: chat.type === 'direct' 
            ? otherParticipant?.name || 'Unknown User'
            : chat.name || 'Group Chat',
          avatarUrl: chat.type === 'direct' 
            ? otherParticipant?.profile_pic || null
            : null,
          isGroup: chat.type === 'group',
          unreadCount: chat.unreadCount || 0,
          messages: lastMessage ? [{
            id: lastMessage.id,
            text: lastMessage.text,
            sender_id: lastMessage.sender_id,
            created_at: lastMessage.created_at,
            createdAt: lastMessage.created_at
          }] : []
        };
      }));
      
      console.log('Loaded conversations:', conversations.length);
      set({ conversations });
      const { personalProfile, businesses, context } = get();
      saveToLocalStorage({ personalProfile, businesses, context, conversations });
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

  sendMessage: async (conversationId, text, userId) => {
    try {
      const { message, error } = await simpleChatService.sendMessage(conversationId, userId, text);
      if (error) {
        console.error('Error sending message:', error);
        return;
      }
      
      // Update local state with the new message
      const conversations = get().conversations.map((c) => {
        if (c.id === conversationId) {
          const newMessage = {
            id: message!.id,
            conversationId,
            sender: "me" as const,
            text: message!.text || '',
            createdAt: message!.created_at,
            read: true
          };
          return { ...c, messages: [...c.messages, newMessage] };
        }
        return c;
      });
      
      set({ conversations });
      const { personalProfile, businesses, context } = get();
      saveToLocalStorage({ personalProfile, businesses, context, conversations });
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  },

  markAllRead: async (conversationId, userId) => {
    try {
      // For now, just update local state since simpleChatService doesn't have markMessagesAsRead
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

  markMessagesAsRead: async (conversationId, userId) => {
    try {
      // Mark messages as read in the database
      const { error } = await simpleChatService.markMessagesAsRead(conversationId, userId);
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

  createDirectChat: async (otherUserId) => {
    try {
      // Get current user ID for conversion
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return null;
      }
      
      const { chat, error } = await simpleChatService.createDirectChat(otherUserId, user.id);
      if (error) {
        console.error('Error creating direct chat:', error);
        return null;
      }
      
      if (chat) {
        // Convert SimpleChat to Conversation format
        const otherParticipant = chat.participants.find(p => p.id !== user.id);
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
}));

// Hydrate from localStorage on first import in client
if (typeof window !== "undefined") {
  const persisted = loadFromLocalStorage();
  if (persisted) {
    useAppStore.setState({
      personalProfile: persisted.personalProfile,
      businesses: persisted.businesses,
      context: persisted.context,
      isHydrated: true,
      conversations: [], // Always start with empty conversations to load real data
    });
  } else {
    useAppStore.setState({ isHydrated: true, conversations: [] });
  }
} else {
  // Server-side: set hydrated to false initially
  useAppStore.setState({ isHydrated: false });
}

export function useCurrentBusiness() {
  const { context, businesses } = useAppStore();
  if (context.type !== "business") return null;
  return businesses.find((b) => b.id === context.businessId) ?? null;
}

// TODO: replace localStorage with Supabase tables: profiles (personal) and orgs (businesses).

