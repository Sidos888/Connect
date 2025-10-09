import { getSupabaseClient } from './supabaseClient';
import { formatNameForDisplay } from './utils';

export interface SimpleChat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  photo?: string;
  participants: Array<{
    id: string;
    name: string;
    profile_pic?: string;
  }>;
  messages: SimpleMessage[];
  last_message?: string;
  last_message_at?: string;
  unreadCount: number;
}

export interface SimpleMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
}

class SimpleChatService {
  private supabase = getSupabaseClient();
  private chats: Map<string, SimpleChat> = new Map();
  private userChats: Map<string, SimpleChat[]> = new Map();
  private userChatsTimestamp: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  
  // Real-time subscriptions
  private messageSubscriptions: Map<string, any> = new Map();
  private typingSubscriptions: Map<string, any> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();
  private typingCallbacks: Map<string, (typingUsers: string[]) => void> = new Map();

  // Retry mechanism for failed requests
  private async withRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 2,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on auth errors or 500 errors
        if (lastError.message.includes('Invalid Refresh Token') || 
            lastError.message.includes('Refresh Token Not Found') ||
            lastError.message.includes('500')) {
          throw lastError;
        }
        
        if (attempt < maxRetries) {
          console.warn(`SimpleChatService: Retry ${attempt + 1}/${maxRetries} after error:`, lastError.message);
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }
    
    throw lastError;
  }

  // Expose Supabase client for advanced queries from UI components when needed
  getSupabaseClient() {
    return this.supabase;
  }

  // Clear chat cache (useful when chat data is updated)
  clearChatCache(chatId?: string) {
    if (chatId) {
      this.chats.delete(chatId);
      console.log('SimpleChatService: Cleared cache for chat:', chatId);
    } else {
      this.chats.clear();
      console.log('SimpleChatService: Cleared all chat cache');
    }
  }

  // Clear all caches (chats and user chats)
  clearAllCaches() {
    this.chats.clear();
    this.userChats.clear();
    console.log('SimpleChatService: Cleared all caches');
  }

  // Real-time messaging methods
  subscribeToMessages(chatId: string, onNewMessage: (message: SimpleMessage) => void): () => void {
    console.log('SimpleChatService: Subscribing to messages for chat:', chatId);
    
    // Unsubscribe from existing subscription if any
    if (this.messageSubscriptions.has(chatId)) {
      this.messageSubscriptions.get(chatId)?.unsubscribe();
    }

    const subscription = this.supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        }, 
        async (payload) => {
          console.log('SimpleChatService: New message received:', payload);
          
          // Get sender name from participants
          const chat = this.chats.get(chatId);
          const sender = chat?.participants.find(p => p.id === payload.new.sender_id);
          
          const message: SimpleMessage = {
            id: payload.new.id,
            chat_id: payload.new.chat_id,
            sender_id: payload.new.sender_id,
            sender_name: sender?.name || 'Unknown',
            text: payload.new.message_text,
            created_at: payload.new.created_at
          };

          // Add to local cache
          if (chat) {
            chat.messages.push(message);
            chat.last_message = message.text;
            chat.last_message_at = message.created_at;
          }

          // Notify callback
          onNewMessage(message);
        }
      )
      .subscribe();

    this.messageSubscriptions.set(chatId, subscription);
    
    return () => {
      console.log('SimpleChatService: Unsubscribing from messages for chat:', chatId);
      subscription.unsubscribe();
      this.messageSubscriptions.delete(chatId);
    };
  }

  subscribeToTyping(chatId: string, userId: string, onTypingUpdate: (typingUsers: string[]) => void): () => void {
    console.log('SimpleChatService: Subscribing to typing for chat:', chatId);
    
    // Initialize typing users set for this chat
    if (!this.typingUsers.has(chatId)) {
      this.typingUsers.set(chatId, new Set());
    }
    
    // Store callback
    this.typingCallbacks.set(chatId, onTypingUpdate);

    const subscription = this.supabase
      .channel(`typing:${chatId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = subscription.presenceState();
        // Count users who are in the chat input (have typing: true in their presence data)
        const typingUserIds = Object.keys(state).filter(id => {
          if (id === userId) return false; // Exclude current user
          const presence = state[id];
          return presence && presence[0] && presence[0].typing === true;
        });
        
        // Update typing users
        const typingSet = this.typingUsers.get(chatId)!;
        typingSet.clear();
        typingUserIds.forEach(id => typingSet.add(id));
        
        // Notify callback
        onTypingUpdate(Array.from(typingSet));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== userId && newPresences && newPresences[0] && newPresences[0].typing === true) {
          const typingSet = this.typingUsers.get(chatId)!;
          typingSet.add(key);
          onTypingUpdate(Array.from(typingSet));
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const typingSet = this.typingUsers.get(chatId)!;
        typingSet.delete(key);
        onTypingUpdate(Array.from(typingSet));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await subscription.track({
            user_id: userId,
            online_at: new Date().toISOString()
          });
        }
      });

    this.typingSubscriptions.set(chatId, subscription);
    
    return () => {
      console.log('SimpleChatService: Unsubscribing from typing for chat:', chatId);
      subscription.unsubscribe();
      this.typingSubscriptions.delete(chatId);
      this.typingUsers.delete(chatId);
      this.typingCallbacks.delete(chatId);
    };
  }

  // Send typing indicator
  async sendTypingIndicator(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    const subscription = this.typingSubscriptions.get(chatId);
    if (!subscription) return;

    if (isTyping) {
      await subscription.track({
        user_id: userId,
        typing: true,
        online_at: new Date().toISOString()
      });
    } else {
      await subscription.track({
        user_id: userId,
        typing: false,
        online_at: new Date().toISOString()
      });
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    console.log('SimpleChatService: Cleaning up all subscriptions');
    
    // Unsubscribe from all message subscriptions
    this.messageSubscriptions.forEach((subscription, chatId) => {
      console.log('SimpleChatService: Unsubscribing from messages for chat:', chatId);
      subscription.unsubscribe();
    });
    this.messageSubscriptions.clear();
    
    // Unsubscribe from all typing subscriptions
    this.typingSubscriptions.forEach((subscription, chatId) => {
      console.log('SimpleChatService: Unsubscribing from typing for chat:', chatId);
      subscription.unsubscribe();
    });
    this.typingSubscriptions.clear();
    
    this.typingUsers.clear();
    this.typingCallbacks.clear();
  }

  // Get user's contacts from the database (only actual connections)
  async getContacts(userId: string): Promise<{ contacts: any[]; error: Error | null }> {
    try {
      console.log('SimpleChatService: Getting connections for user:', userId);
      
      // Get connections where the user is either user1 or user2
      const { data: connections, error: connectionsError } = await this.supabase
        .from('connections')
        .select(`
          id,
          user1_id,
          user2_id,
          status,
          created_at
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        // If it's an RLS policy error, return empty contacts instead of failing
        if (connectionsError.message?.includes('policy') || connectionsError.message?.includes('permission')) {
          console.warn('SimpleChatService: RLS policy blocked connections query, returning empty list');
          return { contacts: [], error: null };
        }
        return { contacts: [], error: connectionsError };
      }

      console.log('SimpleChatService: Found connections:', connections?.length || 0);

      // Extract the connected user IDs (not the current user)
      const connectedUserIds = new Set<string>();
      
      (connections || []).forEach(connection => {
        if (connection.user1_id === userId) {
          connectedUserIds.add(connection.user2_id);
        } else if (connection.user2_id === userId) {
          connectedUserIds.add(connection.user1_id);
        }
      });

      // Get account details for connected users
      const connectedUsers = new Map();
      if (connectedUserIds.size > 0) {
        const { data: accountsData, error: accountsError } = await this.supabase
          .from('accounts')
          .select('id, name, profile_pic, connect_id, bio, dob')
          .in('id', Array.from(connectedUserIds));

        if (!accountsError && accountsData) {
          accountsData.forEach(account => {
            connectedUsers.set(account.id, {
              id: account.id,
              name: account.name,
              profile_pic: account.profile_pic,
              connect_id: account.connect_id,
              bio: account.bio,
              dob: account.dob,
              is_blocked: false
            });
          });
        } else {
          console.warn('SimpleChatService: Failed to fetch account details for connections:', accountsError);
        }
      }

      // Convert map to array and sort by name
      const contacts = Array.from(connectedUsers.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      console.log('SimpleChatService: Returning connected users:', contacts.length);
      return { contacts, error: null };
    } catch (error) {
      console.error('Error in getContacts:', error);
      return { contacts: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get user's chats (now loads from Supabase with caching)
  async getUserChats(userId: string): Promise<{ chats: SimpleChat[]; error: Error | null }> {
    try {
      // Check cache first
      const cachedChats = this.userChats.get(userId);
      const cacheTimestamp = this.userChatsTimestamp.get(userId);
      const now = Date.now();
      
      if (cachedChats && cacheTimestamp && (now - cacheTimestamp) < this.CACHE_DURATION) {
        console.log('SimpleChatService: Returning cached chats for user:', userId);
        return { chats: cachedChats, error: null };
      }

      return await this.withRetry(async () => {
        return await this._getUserChatsInternal(userId);
      });
    } catch (error) {
      console.error('Error in getUserChats after retries:', error);
      return { chats: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  private async _getUserChatsInternal(userId: string): Promise<{ chats: SimpleChat[]; error: Error | null }> {
    try {
      // Get user's chats from Supabase with last_read_at
      const { data: userChats, error: userChatsError } = await this.supabase
        .from('chat_participants')
        .select('chat_id, last_read_at')
        .eq('user_id', userId);

      if (userChatsError) {
        console.error('Error getting user chat participants:', userChatsError);
        return { chats: [], error: userChatsError };
      }

      if (!userChats || userChats.length === 0) {
        console.log('SimpleChatService: No chats found for user:', userId);
        return { chats: [], error: null };
      }

      // Get the actual chat details
      const chatIds = userChats.map(chat => chat.chat_id);
      const { data: chatsData, error: chatsError } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, photo, created_by, created_at, updated_at, last_message_at
        `)
        .in('id', chatIds)
        .order('last_message_at', { ascending: false });

      if (chatsError) {
        console.error('Error loading chats from Supabase:', chatsError);
        return { chats: [], error: chatsError };
      }

      // Bulk load all participants for all chats at once
      const allChatIds = chatsData?.map(chat => chat.id) || [];
      let allParticipants: Map<string, Array<{ id: string; name: string; profile_pic?: string }>> = new Map();
      let allUnreadCounts: Map<string, number> = new Map();

      if (allChatIds.length > 0) {
        // Get all participants for all chats in one query
        const { data: allParticipantData, error: allParticipantsError } = await this.supabase
          .from('chat_participants')
          .select('chat_id, user_id, last_read_at')
          .in('chat_id', allChatIds);

        if (!allParticipantsError && allParticipantData) {
          // Group participants by chat_id
          const participantsByChat = new Map<string, string[]>();
          const lastReadByChat = new Map<string, string>();
          
          allParticipantData.forEach(participant => {
            if (!participantsByChat.has(participant.chat_id)) {
              participantsByChat.set(participant.chat_id, []);
            }
            participantsByChat.get(participant.chat_id)!.push(participant.user_id);
            
            // Store last_read_at for the current user
            if (participant.user_id === userId) {
              lastReadByChat.set(participant.chat_id, participant.last_read_at);
            }
          });

          // Get all unique user IDs
          const allUserIds = [...new Set(allParticipantData.map(p => p.user_id))];
          
          // Fetch account details for all users in one query
          const { data: allAccountsData, error: allAccountsError } = await this.supabase
            .from('accounts')
            .select('id, name, profile_pic')
            .in('id', allUserIds);

          if (!allAccountsError && allAccountsData) {
            const accountsMap = new Map(allAccountsData.map(account => [account.id, account]));
            
            // Build participants map for each chat
            participantsByChat.forEach((userIds, chatId) => {
              const participants = userIds.map(userId => {
                const account = accountsMap.get(userId);
                return account ? {
                  id: account.id,
                  name: formatNameForDisplay(account.name),
                  profile_pic: account.profile_pic || undefined
                } : {
                  id: userId,
                  name: 'Unknown User',
                  profile_pic: undefined
                };
              });
              allParticipants.set(chatId, participants);
            });
          }

          // Bulk calculate unread counts and get last messages for all chats
          const unreadCountPromises = allChatIds.map(async (chatId) => {
            const lastReadAt = lastReadByChat.get(chatId);
            let unreadCount = 0;
            let lastMessage = null;

            // Get unread count
            if (lastReadAt) {
              const { count, error: unreadError } = await this.supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('chat_id', chatId)
                .gt('created_at', lastReadAt)
                .neq('sender_id', userId);
              
              unreadCount = (!unreadError && count !== null) ? count : 0;
            }

            // Get last message
            const { data: lastMessageData, error: lastMessageError } = await this.supabase
              .from('chat_messages')
              .select('id, message_text, sender_id, created_at')
              .eq('chat_id', chatId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (!lastMessageError && lastMessageData) {
              lastMessage = {
                id: lastMessageData.id,
                chat_id: chatId,
                sender_id: lastMessageData.sender_id,
                sender_name: lastMessageData.sender_id === userId ? 'You' : 'Other',
                text: lastMessageData.message_text,
                created_at: lastMessageData.created_at
              };
            }
            
            return { chatId, count: unreadCount, lastMessage };
          });

          const unreadResults = await Promise.all(unreadCountPromises);
          unreadResults.forEach(({ chatId, count, lastMessage }) => {
            allUnreadCounts.set(chatId, count);
            // Store last message in the chat object
            const chat = chatsData?.find(c => c.id === chatId);
            if (chat && lastMessage) {
              (chat as any).lastMessage = lastMessage;
            }
          });
        }
      }

      // Build the final chats array
      const chats: SimpleChat[] = [];
      for (const chat of chatsData || []) {
        const participants = allParticipants.get(chat.id) || [];
        const unreadCount = allUnreadCounts.get(chat.id) || 0;

        console.log('SimpleChatService: Creating chat object for', chat.id, 'with photo:', chat.photo);
        // Get the last message if it was loaded
        const lastMessage = (chat as any).lastMessage;
        
        chats.push({
          id: chat.id,
          type: chat.type,
          name: chat.name,
          photo: chat.photo,
          participants,
          messages: lastMessage ? [lastMessage] : [], // Include last message if available
          last_message: lastMessage?.text,
          last_message_at: chat.last_message_at,
          unreadCount
        });
      }

      // Update in-memory chats and cache
      chats.forEach(chat => {
        this.chats.set(chat.id, chat);
      });
      
      // Cache the user's chats with timestamp
      this.userChats.set(userId, chats);
      this.userChatsTimestamp.set(userId, Date.now());
      
      console.log('SimpleChatService: getUserChats for user:', userId, 'loaded from Supabase:', chats.length, 'chats');
      return { chats, error: null };
    } catch (error) {
      console.error('Error in getUserChats:', error);
      return { chats: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Mark messages as read for a user in a chat
  async markMessagesAsRead(chatId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking messages as read:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Find existing direct chat between two users
  async findExistingDirectChat(userId1: string, userId2: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      console.log('SimpleChatService: Looking for existing direct chat between:', userId1, 'and', userId2);

      // Query for direct chats where both users are participants
      const { data: chats, error } = await this.supabase
        .from('chats')
        .select(`
          id,
          type,
          name,
          created_at,
          chat_participants!inner(user_id)
        `)
        .eq('type', 'direct')
        .in('chat_participants.user_id', [userId1, userId2]);

      if (error) {
        console.error('Error finding existing chats:', error);
        return { chat: null, error };
      }

      // Find a chat that has both users as participants
      for (const chat of chats || []) {
        const { data: participants, error: participantsError } = await this.supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chat.id);

        if (participantsError) continue;

        const participantIds = participants?.map(p => p.user_id) || [];
        if (participantIds.includes(userId1) && participantIds.includes(userId2)) {
          // Found existing chat, convert to SimpleChat format
          const { chat: fullChat, error: chatError } = await this.getChatById(chat.id);
          if (!chatError && fullChat) {
            console.log('SimpleChatService: Found existing chat:', chat.id);
            return { chat: fullChat, error: null };
          }
        }
      }

      console.log('SimpleChatService: No existing chat found');
      return { chat: null, error: null };
    } catch (error) {
      console.error('Error in findExistingDirectChat:', error);
      return { chat: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Create a direct chat (now saves to Supabase)
  async createDirectChat(otherUserId: string, currentUserId: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      console.log('SimpleChatService: Creating direct chat between:', currentUserId, 'and', otherUserId);

      // Create chat in Supabase
      const { data: chatData, error: chatError } = await this.supabase
        .from('chats')
        .insert({
          type: 'direct',
          name: null,
          created_by: currentUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat in Supabase:', chatError);
        return { chat: null, error: chatError };
      }

      // Add participants to Supabase
      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert([
          { chat_id: chatData.id, user_id: currentUserId },
          { chat_id: chatData.id, user_id: otherUserId }
        ]);

      if (participantsError) {
        console.error('Error adding participants to Supabase:', participantsError);
        return { chat: null, error: participantsError };
      }
      
      const chat: SimpleChat = {
        id: chatData.id,
        type: 'direct',
        participants: [
          {
            id: currentUserId,
            name: 'You', // We'll get this from accounts table later
            profile_pic: undefined
          },
          {
            id: otherUserId,
            name: otherUserId === '569b346c-3e6e-48cd-a432-190dbfe78120' ? 'Chandan Saddi' : 'Frizzy Valiyff',
            profile_pic: otherUserId === '569b346c-3e6e-48cd-a432-190dbfe78120' 
              ? 'https://rxlqtyfhsocxnsnnnlwl.supabase.co/storage/v1/object/public/avatars/avatars/569b346c-3e6e-48cd-a432-190dbfe78120.jpeg'
              : 'https://rxlqtyfhsocxnsnnnlwl.supabase.co/storage/v1/object/public/avatars/avatars/d5943fed-3a45-45a9-a871-937bad29cedb.jpeg'
          }
        ],
        messages: []
      };

      // Store the chat in memory
      this.chats.set(chatData.id, chat);
      
      console.log('SimpleChatService: Created and saved chat to Supabase:', chat);
      console.log('SimpleChatService: Total chats in memory:', this.chats.size);
      return { chat, error: null };
    } catch (error) {
      console.error('SimpleChatService: Error creating chat:', error);
      return { chat: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Create a group chat
  async createGroupChat(name: string, participantIds: string[], photo?: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      console.log('SimpleChatService: Creating group chat:', name, 'with participants:', participantIds);
      
      // Create chat in Supabase
      const { data: chatData, error: chatError } = await this.supabase
        .from('chats')
        .insert({
          type: 'group',
          name: name,
          photo: photo ?? null,
          created_by: participantIds[0]
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating group chat in Supabase:', chatError);
        return { chat: null, error: chatError };
      }

      // Add participants to chat_participants table
      const participantInserts = participantIds.map(userId => ({
        chat_id: chatData.id,
        user_id: userId
      }));

      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantsError) {
        console.error('Error adding participants to group chat:', participantsError);
        return { chat: null, error: participantsError };
      }

      // Get participant details
      const { data: participantsData, error: participantsError2 } = await this.supabase
        .from('chat_participants')
        .select(`
          user_id,
          accounts!inner(id, name, profile_pic)
        `)
        .eq('chat_id', chatData.id);

      if (participantsError2) {
        console.error('Error loading group chat participants:', participantsError2);
        return { chat: null, error: participantsError2 };
      }

      type ParticipantRow2 = { accounts: { id: string; name: string; profile_pic?: string | null } };
      const participants = (participantsData || []).map((p: ParticipantRow2) => ({
        id: p.accounts.id,
        name: formatNameForDisplay(p.accounts.name),
        profile_pic: p.accounts.profile_pic || undefined
      }));

      const chat: SimpleChat = {
        id: chatData.id,
        type: 'group',
        name: name,
        participants,
        messages: []
      };

      // Store in memory
      this.chats.set(chat.id, chat);
      console.log('SimpleChatService: Created and saved group chat to Supabase:', chat);
      console.log('SimpleChatService: Total chats in memory:', this.chats.size);

      return { chat, error: null };
    } catch (error) {
      console.error('SimpleChatService: Error creating group chat:', error);
      return { chat: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get a specific chat by ID
  async getChatById(chatId: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      // First check local cache
      const cachedChat = this.chats.get(chatId);
      if (cachedChat) {
        console.log('SimpleChatService: getChatById from cache for:', chatId);
        return { chat: cachedChat, error: null };
      }

      // If not in cache, query the database
      console.log('SimpleChatService: getChatById from database for:', chatId);
      
      // Get chat details
      const { data: chatData, error: chatError } = await this.supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError || !chatData) {
        console.error('Error fetching chat:', chatError);
        return { chat: null, error: new Error('Chat not found') };
      }

      // Get participants
      const { data: participantsData, error: participantsError } = await this.supabase
        .from('chat_participants')
        .select(`
          user_id,
          accounts!inner(id, name, profile_pic)
        `)
        .eq('chat_id', chatId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return { chat: null, error: participantsError };
      }

      type ParticipantRow3 = { accounts: { id: string; name: string; profile_pic?: string | null } };
      const participants = (participantsData || []).map((p: ParticipantRow3) => ({
        id: p.accounts.id,
        name: formatNameForDisplay(p.accounts.name),
        profile_pic: p.accounts.profile_pic || undefined
      }));

      // Convert to SimpleChat format
      const simpleChat: SimpleChat = {
        id: chatData.id,
        type: chatData.type,
        name: chatData.name || undefined,
        photo: chatData.photo || undefined,
        participants: participants,
        messages: [],
        unreadCount: 0,
        last_message: chatData.last_message || undefined,
        last_message_at: chatData.last_message_at || undefined
      };

      console.log('SimpleChatService: getChatById - chatData.photo:', chatData.photo);
      console.log('SimpleChatService: getChatById - simpleChat.photo:', simpleChat.photo);

      // Cache the result
      this.chats.set(chatId, simpleChat);

      console.log('SimpleChatService: getChatById found chat:', simpleChat.id);
      return { chat: simpleChat, error: null };
    } catch (error) {
      console.error('Error in getChatById:', error);
      return { chat: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get chat messages (now loads from Supabase)
  async getChatMessages(chatId: string, userId: string): Promise<{ messages: SimpleMessage[]; error: Error | null }> {
    try {
      const chat = this.chats.get(chatId);
      if (!chat) {
        return { messages: [], error: new Error('Chat not found') };
      }

      // Load messages from Supabase
      const { data: messagesData, error: fetchError } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error loading messages from Supabase:', fetchError);
        return { messages: [], error: fetchError };
      }

      // Convert Supabase messages to SimpleMessage format
      const messages: SimpleMessage[] = (messagesData || []).map(msg => ({
        id: msg.id,
        chat_id: msg.chat_id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_id === userId ? 'You' : 'Other',
        text: msg.message_text || '',
        created_at: msg.created_at
      }));

      // Update in-memory chat with messages from Supabase
      chat.messages = messages;
      
      console.log('SimpleChatService: getChatMessages for chat:', chatId, 'loaded from Supabase:', messages.length, 'messages');
      return { messages, error: null };
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      return { messages: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Delete a chat
  async deleteChat(chatId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Delete from Supabase
      const { error: deleteError } = await this.supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (deleteError) {
        console.error('Error deleting chat from Supabase:', deleteError);
        return { success: false, error: deleteError };
      }

      // Remove from in-memory cache
      this.chats.delete(chatId);
      
      console.log('SimpleChatService: Chat deleted:', chatId);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteChat:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Send a message (now saves to Supabase)
  async sendMessage(chatId: string, senderId: string, messageText: string): Promise<{ message: SimpleMessage | null; error: Error | null }> {
    try {
      const chat = this.chats.get(chatId);
      if (!chat) {
        return { message: null, error: new Error('Chat not found') };
      }

      // Save message to Supabase
      const { data: messageData, error: insertError } = await this.supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          message_text: messageText,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving message to Supabase:', insertError);
        return { message: null, error: insertError };
      }

      // Convert Supabase message to SimpleMessage format
      const message: SimpleMessage = {
        id: messageData.id,
        chat_id: chatId,
        sender_id: senderId,
        sender_name: 'You',
        text: messageText,
        created_at: messageData.created_at
      };
      
      // Add message to the in-memory chat
      chat.messages.push(message);
      chat.last_message_at = message.created_at;
      chat.updated_at = message.created_at;
      
      console.log('SimpleChatService: Message sent and saved to Supabase:', message.id);
      return { message, error: null };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return { message: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // ===== CONNECTION MANAGEMENT FUNCTIONS =====

  // Check if two users are connected
  async areUsersConnected(userId1: string, userId2: string): Promise<{ connected: boolean; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .rpc('are_users_connected', {
          user1_id: userId1,
          user2_id: userId2
        });

      if (error) {
        console.error('Error checking connection status:', error);
        return { connected: false, error };
      }

      return { connected: data || false, error: null };
    } catch (error) {
      console.error('Error in areUsersConnected:', error);
      return { connected: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get connection status between two users
  async getConnectionStatus(userId1: string, userId2: string): Promise<{ status: string; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_connection_status', {
          user1_id: userId1,
          user2_id: userId2
        });

      if (error) {
        console.error('Error getting connection status:', error);
        return { status: 'none', error };
      }

      return { status: data || 'none', error: null };
    } catch (error) {
      console.error('Error in getConnectionStatus:', error);
      return { status: 'none', error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Add a connection (send friend request)
  async addConnection(userId: string, connectedUserId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('connections')
        .insert({
          user1_id: userId,
          user2_id: connectedUserId,
          status: 'pending'
        });

      if (error) {
        console.error('Error adding connection:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in addConnection:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Accept a connection (accept friend request)
  async acceptConnection(userId: string, connectedUserId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('user1_id', connectedUserId)
        .eq('user2_id', userId);

      if (error) {
        console.error('Error accepting connection:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in acceptConnection:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Remove a connection (unfriend)
  async removeConnection(userId: string, connectedUserId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Remove both directions of the connection
      const { error: error1 } = await this.supabase
        .from('connections')
        .delete()
        .eq('user1_id', userId)
        .eq('user2_id', connectedUserId);

      const { error: error2 } = await this.supabase
        .from('connections')
        .delete()
        .eq('user1_id', connectedUserId)
        .eq('user2_id', userId);

      if (error1 || error2) {
        console.error('Error removing connection:', error1 || error2);
        return { success: false, error: error1 || error2 };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in removeConnection:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get user's connections (friends) - bidirectional
  async getUserConnections(userId: string): Promise<{ connections: any[]; error: Error | null }> {
    try {
      console.log('SimpleChatService: Getting user connections for:', userId);
      
      const { data, error } = await this.supabase
        .rpc('get_user_bidirectional_connections', {
          user_id: userId,
          status_filter: 'accepted'
        });

      console.log('SimpleChatService: getUserConnections result:', { data, error });

      if (error) {
        console.error('Error getting user connections:', error);
        return { connections: [], error };
      }

      return { connections: data || [], error: null };
    } catch (error) {
      console.error('Error in getUserConnections:', error);
      return { connections: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get mutual connections count
  async getMutualConnectionsCount(userId1: string, userId2: string): Promise<{ count: number; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_mutual_connections_count', {
          user1_id: userId1,
          user2_id: userId2
        });

      if (error) {
        console.error('Error getting mutual connections count:', error);
        return { count: 0, error };
      }

      return { count: data || 0, error: null };
    } catch (error) {
      console.error('Error in getMutualConnectionsCount:', error);
      return { count: 0, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get mutual connections (up to limit)
  async getMutualConnections(userId1: string, userId2: string, limit: number = 3): Promise<{ connections: any[]; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_mutual_connections', {
          user1_id: userId1,
          user2_id: userId2,
          limit_count: limit
        });

      if (error) {
        console.error('Error getting mutual connections:', error);
        return { connections: [], error };
      }

      return { connections: data || [], error: null };
    } catch (error) {
      console.error('Error in getMutualConnections:', error);
      return { connections: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Hide a chat (for when users are no longer connected)
  async hideChat(chatId: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Add a hidden flag to chat_participants for this user
      const { error } = await this.supabase
        .from('chat_participants')
        .update({ hidden: true })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error hiding chat:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in hideChat:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Show a chat (for when users reconnect)
  async showChat(chatId: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Remove the hidden flag from chat_participants for this user
      const { error } = await this.supabase
        .from('chat_participants')
        .update({ hidden: false })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error showing chat:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in showChat:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Update group profile (name, bio, photo)
  async updateGroupProfile(chatId: string, updates: {
    name?: string;
    bio?: string;
    photo?: string | null;
  }): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('chats')
        .update({
          name: updates.name,
          bio: updates.bio,
          photo: updates.photo
        })
        .eq('id', chatId)
        .eq('type', 'group');

      if (error) {
        console.error('Error updating group profile:', error);
        return { success: false, error };
      }

      // Clear cache for this chat to force refresh
      this.clearChatCache(chatId);

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateGroupProfile:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}

export const simpleChatService = new SimpleChatService();
