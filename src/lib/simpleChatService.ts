import { getSupabaseClient } from './supabaseClient';

export interface SimpleChat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: Array<{
    id: string;
    name: string;
    profile_pic?: string;
  }>;
  messages: SimpleMessage[];
  last_message?: string;
  last_message_at?: string;
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

  // Get user's contacts (hardcoded for now)
  async getContacts(userId: string): Promise<{ contacts: any[]; error: Error | null }> {
    try {
      // Return hardcoded contacts that exist in the accounts table
      const contacts = [
        {
          id: '569b346c-3e6e-48cd-a432-190dbfe78120',
          name: 'Chandan Saddi',
          profile_pic: 'https://rxlqtyfhsocxnsnnnlwl.supabase.co/storage/v1/object/public/avatars/avatars/569b346c-3e6e-48cd-a432-190dbfe78120.jpeg',
          is_blocked: false
        },
        {
          id: 'd5943fed-3a45-45a9-a871-937bad29cedb',
          name: 'Frizzy Valiyff',
          profile_pic: 'https://rxlqtyfhsocxnsnnnlwl.supabase.co/storage/v1/object/public/avatars/avatars/d5943fed-3a45-45a9-a871-937bad29cedb.jpeg',
          is_blocked: false
        }
      ];

      return { contacts, error: null };
    } catch (error) {
      return { contacts: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get user's chats (now loads from Supabase)
  async getUserChats(userId: string): Promise<{ chats: SimpleChat[]; error: Error | null }> {
    try {
      // Get user's chats from Supabase
      const { data: userChats, error: userChatsError } = await this.supabase
        .from('chat_participants')
        .select('chat_id')
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
          id, type, name, created_by, created_at, updated_at, last_message_at
        `)
        .in('id', chatIds)
        .order('last_message_at', { ascending: false });

      if (chatsError) {
        console.error('Error loading chats from Supabase:', chatsError);
        return { chats: [], error: chatsError };
      }

      // Get participants for each chat
      const chats: SimpleChat[] = [];
      for (const chat of chatsData || []) {
        const { data: participantsData, error: participantsError } = await this.supabase
          .from('chat_participants')
          .select(`
            user_id,
            accounts!inner(id, name, profile_pic)
          `)
          .eq('chat_id', chat.id);

        console.log('SimpleChatService: Raw participants data for chat', chat.id, ':', participantsData);
        console.log('SimpleChatService: Participants error for chat', chat.id, ':', participantsError);

        if (participantsError) {
          console.error('Error loading participants for chat:', chat.id, participantsError);
          continue;
        }

        const participants = (participantsData || []).map((p: any) => ({
          id: p.accounts.id,
          name: p.accounts.name,
          profile_pic: p.accounts.profile_pic
        }));

        console.log('SimpleChatService: Chat participants for', chat.id, ':', participants);

        chats.push({
          id: chat.id,
          type: chat.type,
          name: chat.name,
          participants,
          messages: [] // Will be loaded separately
        });
      }

      // Update in-memory chats
      chats.forEach(chat => {
        this.chats.set(chat.id, chat);
      });
      
      console.log('SimpleChatService: getUserChats for user:', userId, 'loaded from Supabase:', chats.length, 'chats');
      return { chats, error: null };
    } catch (error) {
      console.error('Error in getUserChats:', error);
      return { chats: [], error: error instanceof Error ? error : new Error('Unknown error') };
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
          created_by: participantIds[0] // Use first participant as creator
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

      const participants = (participantsData || []).map((p: any) => ({
        id: p.accounts.id,
        name: p.accounts.name,
        profile_pic: p.accounts.profile_pic
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
      const chat = this.chats.get(chatId);
      console.log('SimpleChatService: getChatById for:', chatId, 'found:', !!chat);
      return { chat: chat || null, error: null };
    } catch (error) {
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
}

export const simpleChatService = new SimpleChatService();
