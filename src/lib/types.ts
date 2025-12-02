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
  isEventChat?: boolean;
  unreadCount: number;
  messages: Message[];
};

// Chat service types
export type MessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type SimpleMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_profile_pic?: string;
  text: string;
  created_at: string;
  reply_to_message_id?: string | null;
  reply_to_message?: {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_profile_pic?: string;
    text: string;
    created_at: string;
    message_type?: 'text' | 'image' | 'file' | 'system' | 'listing';
    attachments?: MediaAttachment[];
    listing_id?: string;
    listing_photo_urls?: string[];
  } | null;
  attachments?: MediaAttachment[];
  deleted_at?: string | null;
  message_type?: 'text' | 'image' | 'file' | 'system' | 'listing';
  listing_id?: string | null;
  reactions?: MessageReaction[];
};

export type MediaAttachment = {
  id: string;
  file_url: string;
  file_type: 'image' | 'video';
  thumbnail_url?: string;
};

export type SimpleChat = {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  photo?: string;
  last_message_at?: string | null;
  is_event_chat?: boolean;
  participants: Array<{
    id: string;
    name: string;
    profile_pic?: string | null;
  }>;
  last_message?: SimpleMessage | null;
  unread_count?: number;
};

