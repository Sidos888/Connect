"use client";

import { create } from "zustand";
import { AppStore, Business, PersonalProfile, UUID, Conversation } from "./types";

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
  seedConversations: () => void;
  getConversations: () => Conversation[];
  sendMessage: (conversationId: UUID, text: string) => void;
  markAllRead: (conversationId: UUID) => void;
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

  seedConversations: () => {
    console.log('seedConversations called, current length:', get().conversations.length);
    if (get().conversations.length) {
      console.log('Conversations already exist, skipping seed');
      return;
    }
    const seed: Conversation[] = [
      {
        id: generateId(),
        title: "Alice",
        avatarUrl: null,
        unreadCount: 1,
        isGroup: false,
        messages: [
          { id: generateId(), conversationId: "", sender: "them" as const, text: "Hey there!", createdAt: new Date().toISOString(), read: false },
        ],
      },
      {
        id: generateId(),
        title: "Team Huddle",
        avatarUrl: null,
        unreadCount: 0,
        isGroup: true,
        messages: [
          { id: generateId(), conversationId: "", sender: "me" as const, text: "Meeting at 3?", createdAt: new Date().toISOString(), read: true },
          { id: generateId(), conversationId: "", sender: "them" as const, text: "Yep, see you!", createdAt: new Date().toISOString(), read: true },
        ],
      },
    ].map((c) => ({ ...c, messages: c.messages.map((m) => ({ ...m, conversationId: c.id })) }));
    console.log('Setting conversations to:', seed);
    set({ conversations: seed });
    console.log('Conversations after set:', get().conversations);
    const { personalProfile, businesses, context } = get();
    saveToLocalStorage({ personalProfile, businesses, context, conversations: seed });
  },

  getConversations: () => get().conversations,

  sendMessage: (conversationId, text) => {
    const conversations = get().conversations.map((c) =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, { id: generateId(), conversationId, sender: "me" as const, text, createdAt: new Date().toISOString(), read: true }] }
        : c
    );
    set({ conversations });
    const { personalProfile, businesses, context } = get();
    saveToLocalStorage({ personalProfile, businesses, context, conversations });
  },

  markAllRead: (conversationId) => {
    const conversations = get().conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0, messages: c.messages.map((m) => ({ ...m, read: true })) } : c
    );
    set({ conversations });
    const { personalProfile, businesses, context } = get();
    saveToLocalStorage({ personalProfile, businesses, context, conversations });
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
      conversations: persisted.conversations ?? [],
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

