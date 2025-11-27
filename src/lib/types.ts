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

// New chat system types
export interface SimpleChat {
  id: string;
  type: 'direct' | 'group';
  name: string;
  photo?: string;
  participants: Array<{
    id: string;
    name: string;
    profile_pic?: string;
    role?: 'admin' | 'member';
  }>;
  last_message?: {
    id: string;
    content: string;
    created_at: string;
    sender: {
      id: string;
      name: string;
      profile_pic?: string;
    };
  };
  last_message_at?: string;
  unreadCount: number;
}

export interface SimpleMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_profile_pic?: string;
  text: string;
  created_at: string;
  seq?: number;
  client_generated_id?: string;
  status?: 'sent' | 'delivered' | 'read';
  reply_to_message_id?: string | null;
  reply_to_message?: SimpleMessage | null;
  attachments?: MediaAttachment[];
  reactions?: MessageReaction[];
  deleted_at?: string | null;
}

export interface MediaAttachment {
  id: string;
  file_url: string;
  file_type: 'image' | 'video';
  thumbnail_url?: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

/**
 * Account interface
 * 
 * IMPORTANT: account.id is ALWAYS equal to auth.uid()
 * This is enforced by foreign key constraint: accounts.id -> auth.users.id
 * 
 * Use auth.uid() for all database operations (RLS policies expect this)
 * Use account object only for display data (name, profile_pic, etc)
 */
export interface Account {
  id: string;  // Always equals auth.uid()
  name: string;
  created_at: string;
  updated_at: string;
}

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
  senderId?: string;
  senderName?: string;
  text: string;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_type: 'image' | 'video';
    file_size?: number;
    thumbnail_url?: string;
    width?: number;
    height?: number;
  }>;
  createdAt: string; // ISO
  read?: boolean;
  deleted_at?: string | null;
};

export type Conversation = {
  id: UUID;
  title: string;
  avatarUrl?: string | null;
  isGroup?: boolean;
  unreadCount: number;
  last_message?: string;
  last_message_at?: string;
  messages: Message[]; // Keep for backward compatibility during transition
};


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
  senderId?: string;
  senderName?: string;
  text: string;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_type: 'image' | 'video';
    file_size?: number;
    thumbnail_url?: string;
    width?: number;
    height?: number;
  }>;
  createdAt: string; // ISO
  read?: boolean;
  deleted_at?: string | null;
};

export type Conversation = {
  id: UUID;
  title: string;
  avatarUrl?: string | null;
  isGroup?: boolean;
  unreadCount: number;
  last_message?: string;
  last_message_at?: string;
  messages: Message[]; // Keep for backward compatibility during transition
};


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
  senderId?: string;
  senderName?: string;
  text: string;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_type: 'image' | 'video';
    file_size?: number;
    thumbnail_url?: string;
    width?: number;
    height?: number;
  }>;
  createdAt: string; // ISO
  read?: boolean;
  deleted_at?: string | null;
};

export type Conversation = {
  id: UUID;
  title: string;
  avatarUrl?: string | null;
  isGroup?: boolean;
  unreadCount: number;
  last_message?: string;
  last_message_at?: string;
  messages: Message[]; // Keep for backward compatibility during transition
};


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
  senderId?: string;
  senderName?: string;
  text: string;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_type: 'image' | 'video';
    file_size?: number;
    thumbnail_url?: string;
    width?: number;
    height?: number;
  }>;
  createdAt: string; // ISO
  read?: boolean;
  deleted_at?: string | null;
};

export type Conversation = {
  id: UUID;
  title: string;
  avatarUrl?: string | null;
  isGroup?: boolean;
  unreadCount: number;
  last_message?: string;
  last_message_at?: string;
  messages: Message[]; // Keep for backward compatibility during transition
};

