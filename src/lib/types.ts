export type UUID = string;

export type PersonalProfile = {
  id: string;
  name: string;
  bio: string;
  avatarUrl?: string | null;
  email: string;
  phone: string;
  dateOfBirth: string;
  connectId: string;
  createdAt: string;
  updatedAt: string;
};

export type Business = {
  id: UUID;
  name: string;
  bio: string;
  logoUrl?: string | null;
  createdAt: string; // ISO timestamp
};

export type AppContext =
  | { type: "personal" }
  | { type: "business"; businessId: UUID };

export type AppState = {
  personalProfile: PersonalProfile | null;
  businesses: Business[];
  context: AppContext;
  isHydrated: boolean;
  isAccountSwitching: boolean;
};

export type AppActions = {
  setPersonalProfile: (profile: PersonalProfile) => void;
  addBusiness: (input: Omit<Business, "id" | "createdAt"> & Partial<Pick<Business, "logoUrl">>) => Business;
  switchToPersonal: () => void;
  switchToBusiness: (businessId: UUID) => void;
  clearAll: () => void;
  setAccountSwitching: (loading: boolean) => void;
  resetMenuState: () => void;
};

export type AppStore = AppState & AppActions;

// Typing indicator types
export type ChatTypingState = {
  chatId: string;
  typingUsers: string[]; // Array of user IDs who are typing
  lastUpdated: string; // ISO timestamp
};

export type TypingActions = {
  updateChatTyping: (chatId: string, typingUsers: string[]) => void;
  clearChatTyping: (chatId: string) => void;
  getChatTyping: (chatId: string) => ChatTypingState | null;
};

// TODO: replace with Supabase profiles and orgs tables.
// Keep ids as string/UUID-compatible for future DB integration.

// Chat types
export type Message = {
  id: UUID;
  conversationId: UUID;
  sender: "me" | "them";
  text: string;
  createdAt: string; // ISO
  read?: boolean;
};

export type Conversation = {
  id: UUID;
  title: string;
  avatarUrl?: string | null;
  isGroup?: boolean;
  unreadCount: number;
  messages: Message[];
};

