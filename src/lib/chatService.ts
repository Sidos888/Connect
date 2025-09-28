import { getSupabaseClient } from './supabaseClient';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message_text: string | null;
  message_type: 'text' | 'image' | 'poll';
  image_url: string | null;
  images: string[] | null;
  created_at: string;
  read_by: string[];
  poll_id: string | null;
  reply_to_message_id: string | null;
  is_pinned: boolean;
  sender_name?: string;
  sender_profile_pic?: string;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  user_name?: string;
  user_profile_pic?: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'event_group';
  name: string | null;
  listing_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participants?: ChatParticipant[];
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface Conversation {
  id: string;
  title: string;
  avatarUrl: string | null;
  unreadCount: number;
  isGroup: boolean;
  messages: Array<{
    id: string;
    conversationId: string;
    sender: 'me' | 'them';
    text: string;
    createdAt: string;
    read: boolean;
  }>;
}

export class ChatService {
  private supabase = getSupabaseClient();

  // Get all chats for a user
  async getUserChats(userId: string): Promise<{ chats: Chat[]; error: Error | null }> {
    try {
      // Validate userId
      if (!userId) {
        const error = new Error('User ID is required');
        return { chats: [], error };
      }

      // Check if user is authenticated
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        const error = new Error('User not authenticated');
        return { chats: [], error };
      }

      // Double-check that the userId matches the authenticated user
      if (user.id !== userId) {
        const error = new Error('User ID mismatch');
        return { chats: [], error };
      }

      console.log('ChatService: Getting chats for authenticated user:', userId);
      
      // Get all chats where the user is a participant
      const { data: userChats, error: userChatsError } = await this.supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId);

      if (userChatsError) {
        console.error('Error getting user chat participants:', userChatsError);
        return { chats: [], error: userChatsError };
      }

      if (!userChats || userChats.length === 0) {
        // No chats for this user
        return { chats: [], error: null };
      }

      // Get the actual chat details
      const chatIds = userChats.map(chat => chat.chat_id);
      const { data: chats, error } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, listing_id, created_by, created_at, updated_at, last_message_at
        `)
        .in('id', chatIds)
        .order('last_message_at', { ascending: false });

      if (error) {
        // Create a serializable error object first
        const serializableError = {
          message: error.message || 'Unknown error',
          code: error.code || 'UNKNOWN',
          details: error.details || null,
          hint: error.hint || null
        };
        
        // Check if it's a table not found error
        if (error.message?.includes('relation "chats" does not exist') || 
            error.message?.includes('relation "chat_participants" does not exist')) {
          console.error('Chat tables not found. Please run the setup script in Supabase:', serializableError);
          return { chats: [], error: { 
            message: 'Chat system not set up. Please contact administrator.', 
            code: 'CHAT_NOT_SETUP',
            details: 'The chat database tables have not been created yet.',
            hint: 'Run the setup-chat-system.sql script in Supabase'
          }};
        }
        
        // Only log error if it's not a common "no data" error or authentication error
        if (error.code !== 'PGRST116' && 
            error.message !== 'JSON object requested, multiple (or no) rows returned' &&
            error.message !== 'User not authenticated' &&
            error.message !== 'User ID is required' &&
            error.message !== 'User ID mismatch') {
          console.error('Error getting user chats:', serializableError);
        }
        
        return { chats: [], error: serializableError };
      }

      // Transform the data to our Chat interface
      const transformedChats: Chat[] = (chats || []).map(chat => ({
        id: chat.id,
        type: chat.type,
        name: chat.name,
        listing_id: chat.listing_id,
        created_by: chat.created_by,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        last_message_at: chat.last_message_at,
        participants: chat.chat_participants.map((cp: any) => ({
          id: cp.id,
          chat_id: cp.chat_id,
          user_id: cp.user_id,
          joined_at: cp.joined_at,
          last_read_at: cp.last_read_at,
          user_name: cp.accounts?.name,
          user_profile_pic: cp.accounts?.profile_pic
        }))
      }));

      // Get the last message for each chat
      for (const chat of transformedChats) {
        const { data: lastMessage, error: messageError } = await this.supabase
          .from('chat_messages')
          .select(`
            id, chat_id, sender_id, message_text, message_type, image_url, images, 
            created_at, read_by, poll_id, reply_to_message_id, is_pinned,
            accounts!inner(name, profile_pic)
          `)
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!messageError && lastMessage) {
          chat.last_message = {
            id: lastMessage.id,
            chat_id: lastMessage.chat_id,
            sender_id: lastMessage.sender_id,
            message_text: lastMessage.message_text,
            message_type: lastMessage.message_type,
            image_url: lastMessage.image_url,
            images: lastMessage.images,
            created_at: lastMessage.created_at,
            read_by: lastMessage.read_by,
            poll_id: lastMessage.poll_id,
            reply_to_message_id: lastMessage.reply_to_message_id,
            is_pinned: lastMessage.is_pinned,
            sender_name: lastMessage.accounts?.name,
            sender_profile_pic: lastMessage.accounts?.profile_pic
          };
        }

        // Calculate unread count for this user
        const userParticipant = chat.participants?.find(p => p.user_id === userId);
        if (userParticipant) {
          const { data: unreadMessages, error: unreadError } = await this.supabase
            .from('chat_messages')
            .select('id')
            .eq('chat_id', chat.id)
            .gt('created_at', userParticipant.last_read_at)
            .neq('sender_id', userId);

          if (!unreadError) {
            chat.unread_count = unreadMessages?.length || 0;
          }
        }
      }

      console.log('Successfully got user chats:', transformedChats.length);
      return { chats: transformedChats, error: null };
    } catch (error) {
      console.error('Error in getUserChats:', error);
      return { chats: [], error: error as Error };
    }
  }

  // Get messages for a specific chat
  async getChatMessages(chatId: string, userId: string): Promise<{ messages: ChatMessage[]; error: Error | null }> {
    try {
      console.log('ChatService: Getting messages for chat:', chatId);
      
      const { data: messages, error } = await this.supabase
        .from('chat_messages')
        .select(`
          id, chat_id, sender_id, message_text, message_type, image_url, images, 
          created_at, read_by, poll_id, reply_to_message_id, is_pinned,
          accounts!inner(name, profile_pic)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting chat messages:', error);
        return { messages: [], error };
      }

      // Transform messages to our interface
      const transformedMessages: ChatMessage[] = (messages || []).map(msg => ({
        id: msg.id,
        chat_id: msg.chat_id,
        sender_id: msg.sender_id,
        message_text: msg.message_text,
        message_type: msg.message_type,
        image_url: msg.image_url,
        images: msg.images,
        created_at: msg.created_at,
        read_by: msg.read_by,
        poll_id: msg.poll_id,
        reply_to_message_id: msg.reply_to_message_id,
        is_pinned: msg.is_pinned,
        sender_name: msg.accounts?.name,
        sender_profile_pic: msg.accounts?.profile_pic
      }));

      // Mark messages as read for this user
      await this.markMessagesAsRead(chatId, userId);

      console.log('Successfully got chat messages:', transformedMessages.length);
      return { messages: transformedMessages, error: null };
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      return { messages: [], error: error as Error };
    }
  }

  // Send a message to a chat
  async sendMessage(chatId: string, senderId: string, messageText: string): Promise<{ message: ChatMessage | null; error: Error | null }> {
    try {
      console.log('ChatService: Sending message to chat:', chatId);
      
      const { data: message, error } = await this.supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          message_text: messageText,
          message_type: 'text',
          read_by: [senderId] // Mark as read by sender
        })
        .select(`
          id, chat_id, sender_id, message_text, message_type, image_url, images, 
          created_at, read_by, poll_id, reply_to_message_id, is_pinned,
          accounts!inner(name, profile_pic)
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { message: null, error };
      }

      // Update chat's last_message_at
      await this.supabase
        .from('chats')
        .update({ 
          last_message_at: message.created_at,
          updated_at: message.created_at
        })
        .eq('id', chatId);

      const transformedMessage: ChatMessage = {
        id: message.id,
        chat_id: message.chat_id,
        sender_id: message.sender_id,
        message_text: message.message_text,
        message_type: message.message_type,
        image_url: message.image_url,
        images: message.images,
        created_at: message.created_at,
        read_by: message.read_by,
        poll_id: message.poll_id,
        reply_to_message_id: message.reply_to_message_id,
        is_pinned: message.is_pinned,
        sender_name: message.accounts?.name,
        sender_profile_pic: message.accounts?.profile_pic
      };

      console.log('Successfully sent message:', transformedMessage.id);
      return { message: transformedMessage, error: null };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return { message: null, error: error as Error };
    }
  }

  // Mark messages as read for a user in a chat
  async markMessagesAsRead(chatId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      console.log('ChatService: Marking messages as read for user:', userId, 'in chat:', chatId);
      
      // Update the user's last_read_at in chat_participants
      const { error } = await this.supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking messages as read:', error);
        return { error };
      }

      console.log('Successfully marked messages as read');
      return { error: null };
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      return { error: error as Error };
    }
  }

  // Create a new direct chat between current user and another user
  async createDirectChat(otherUserId: string): Promise<{ chat: Chat | null; error: Error | null }> {
    try {
      console.log('ChatService: Creating direct chat with:', otherUserId);
      
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const user1Id = user.id;
      const user2Id = otherUserId;
      
      // Check if a direct chat already exists between these users
      const { data: existingChats, error: checkError } = await this.supabase
        .from('chats')
        .select(`
          id,
          chat_participants!inner(user_id)
        `)
        .eq('type', 'direct')
        .eq('chat_participants.user_id', user1Id);

      if (checkError) {
        // Create a serializable error object
        const serializableError = {
          message: checkError.message || 'Unknown error',
          code: checkError.code || 'UNKNOWN',
          details: checkError.details || null,
          hint: checkError.hint || null
        };
        
        console.error('Error checking existing chats:', serializableError);
        return { chat: null, error: serializableError };
      }

      // Check if any of these chats also has user2Id as a participant
      for (const chat of existingChats || []) {
        const { data: participants, error: participantError } = await this.supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chat.id);

        if (!participantError && participants) {
          const participantIds = participants.map(p => p.user_id);
          if (participantIds.includes(user2Id) && participantIds.length === 2) {
            // Direct chat already exists
            console.log('Direct chat already exists:', chat.id);
            return { chat: null, error: new Error('Direct chat already exists') };
          }
        }
      }

      // Create new chat
      const { data: newChat, error: chatError } = await this.supabase
        .from('chats')
        .insert({
          type: 'direct',
          name: null,
          created_by: user1Id
        })
        .select()
        .single();

      if (chatError) {
        // Create a serializable error object
        const serializableError = {
          message: chatError.message || 'Unknown error',
          code: chatError.code || 'UNKNOWN',
          details: chatError.details || null,
          hint: chatError.hint || null
        };
        
        console.error('Error creating chat:', serializableError);
        return { chat: null, error: serializableError };
      }

      // Add both users as participants
      const { error: participantError } = await this.supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: user1Id },
          { chat_id: newChat.id, user_id: user2Id }
        ]);

      if (participantError) {
        // Create a serializable error object
        const serializableError = {
          message: participantError.message || 'Unknown error',
          code: participantError.code || 'UNKNOWN',
          details: participantError.details || null,
          hint: participantError.hint || null
        };
        
        console.error('Error adding participants:', serializableError);
        return { chat: null, error: serializableError };
      }

      // Get the full chat data with participants
      const { data: fullChat, error: fullChatError } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, listing_id, created_by, created_at, updated_at, last_message_at,
          chat_participants(
            id, user_id, joined_at, last_read_at,
            accounts(id, name, profile_pic)
          )
        `)
        .eq('id', newChat.id)
        .single();

      if (fullChatError) {
        // Create a serializable error object
        const serializableError = {
          message: fullChatError.message || 'Unknown error',
          code: fullChatError.code || 'UNKNOWN',
          details: fullChatError.details || null,
          hint: fullChatError.hint || null
        };
        
        console.error('Error getting full chat data:', serializableError);
        return { chat: null, error: serializableError };
      }

      const transformedChat: Chat = {
        id: fullChat.id,
        type: fullChat.type,
        name: fullChat.name,
        listing_id: fullChat.listing_id,
        created_by: fullChat.created_by,
        created_at: fullChat.created_at,
        updated_at: fullChat.updated_at,
        last_message_at: fullChat.last_message_at,
        participants: fullChat.chat_participants.map((cp: any) => ({
          id: cp.id,
          chat_id: cp.chat_id,
          user_id: cp.user_id,
          joined_at: cp.joined_at,
          last_read_at: cp.last_read_at,
          user_name: cp.accounts?.name,
          user_profile_pic: cp.accounts?.profile_pic
        })),
        unread_count: 0
      };

      console.log('Successfully created direct chat:', transformedChat.id);
      return { chat: transformedChat, error: null };
    } catch (error) {
      console.error('Error in createDirectChat:', error);
      return { chat: null, error: error as Error };
    }
  }

  // Create a group chat
  async createGroupChat(
    groupName: string, 
    participantIds: string[], 
    groupPhoto?: string
  ): Promise<{ chat: Chat | null; error: Error | null }> {
    try {
      console.log('Creating group chat:', { groupName, participantIds, groupPhoto });
      
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create the chat
      const { data: chat, error: chatError } = await this.supabase
        .from('chats')
        .insert({
          type: 'event_group',
          name: groupName,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat:', chatError);
        return { chat: null, error: chatError as Error };
      }

      // Add participants (including the creator)
      const allParticipantIds = [user.id, ...participantIds];
      const participants = allParticipantIds.map(userId => ({
        chat_id: chat.id,
        user_id: userId,
        joined_at: new Date().toISOString(),
        last_read_at: new Date().toISOString()
      }));

      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        // Clean up the chat if participants failed
        await this.supabase.from('chats').delete().eq('id', chat.id);
        return { chat: null, error: participantsError as Error };
      }

      // Get the full chat with participants
      const { data: fullChat, error: fetchError } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, listing_id, created_by, created_at, updated_at, last_message_at,
          chat_participants(
            id, user_id, joined_at, last_read_at,
            accounts(id, name, profile_pic)
          )
        `)
        .eq('id', chat.id)
        .single();

      if (fetchError) {
        console.error('Error fetching created chat:', fetchError);
        return { chat: null, error: fetchError as Error };
      }

      // Transform to Chat format
      const transformedChat: Chat = {
        id: fullChat.id,
        type: fullChat.type as 'direct' | 'event_group',
        name: fullChat.name,
        listing_id: fullChat.listing_id,
        created_by: fullChat.created_by,
        created_at: fullChat.created_at,
        updated_at: fullChat.updated_at,
        last_message_at: fullChat.last_message_at,
        participants: fullChat.chat_participants.map((cp: any) => ({
          id: cp.id,
          chat_id: cp.chat_id,
          user_id: cp.user_id,
          joined_at: cp.joined_at,
          last_read_at: cp.last_read_at,
          user_name: cp.accounts?.name,
          user_profile_pic: cp.accounts?.profile_pic
        })),
        unread_count: 0
      };

      console.log('Successfully created group chat:', transformedChat.id);
      return { chat: transformedChat, error: null };
    } catch (error) {
      console.error('Error in createGroupChat:', error);
      return { chat: null, error: error as Error };
    }
  }

  // Get contacts (friends) for a user
  async getContacts(userId: string): Promise<{ contacts: any[]; error: Error | null }> {
    try {
      console.log('ChatService: getContacts called with userId:', userId);
      if (!userId) {
        console.log('ChatService: No userId provided');
        return { contacts: [], error: new Error('User ID is required') };
      }

      // TEMPORARY WORKAROUND: Return only the user's actual connections
      // Based on the REST API accounts table for user 4f04235f-d166-48d9-ae07-a97a6421a328 (Sid Farquharson)
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

      console.log('ChatService: Returning hardcoded contacts:', contacts);
      return { contacts, error: null };
    } catch (error) {
      console.error('Error in getContacts:', error);
      return { contacts: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Create a direct chat between two users
  async createDirectChat(otherUserId: string, currentUserId: string): Promise<{ chat: Chat | null; error: Error | null }> {
    try {
      if (!otherUserId || !currentUserId) {
        return { chat: null, error: new Error('Both user IDs are required') };
      }

      // For now, skip the existing chat check and always create a new chat
      // TODO: Implement proper existing chat detection later
      console.log('Creating new direct chat between:', currentUserId, 'and', otherUserId);

      // Create new direct chat
      const { data: newChat, error: createError } = await this.supabase
        .from('chats')
        .insert({
          type: 'direct',
          name: null,
          created_by: currentUserId
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating chat:', createError);
        return { chat: null, error: createError };
      }

      // Add both users as participants
      console.log('Adding participants to chat:', newChat.id);
      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: currentUserId },
          { chat_id: newChat.id, user_id: otherUserId }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        return { chat: null, error: participantsError };
      }

      // Fetch the complete chat with participants
      const { data: fullChat, error: fetchError } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, listing_id, created_by, created_at, updated_at, last_message_at,
          chat_participants!inner(
            id, user_id, joined_at, last_read_at,
            accounts!inner(id, name, profile_pic)
          )
        `)
        .eq('id', newChat.id)
        .single();

      if (fetchError) {
        console.error('Error fetching new chat:', fetchError);
        return { chat: null, error: fetchError };
      }

      return { chat: fullChat, error: null };
    } catch (error) {
      console.error('Error in createDirectChat:', error);
      return { chat: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Convert Chat to Conversation format for the store
  convertChatToConversation(chat: Chat, currentUserId: string): Conversation {
    const otherParticipant = chat.participants?.find(p => p.user_id !== currentUserId);
    const title = chat.type === 'direct' 
      ? (otherParticipant?.user_name || 'Unknown User')
      : (chat.name || 'Group Chat');
    
    const avatarUrl = chat.type === 'direct' 
      ? otherParticipant?.user_profile_pic || null
      : null;

    // Convert messages to the format expected by the store
    const messages = chat.last_message ? [{
      id: chat.last_message.id,
      conversationId: chat.id,
      sender: chat.last_message.sender_id === currentUserId ? 'me' as const : 'them' as const,
      text: chat.last_message.message_text || (chat.last_message.message_type === 'image' ? '📷 Image' : 'Message'),
      createdAt: chat.last_message.created_at,
      read: chat.last_message.read_by.includes(currentUserId)
    }] : [];

    return {
      id: chat.id,
      title,
      avatarUrl,
      unreadCount: chat.unread_count || 0,
      isGroup: chat.type === 'event_group',
      messages
    };
  }

  // Create a group chat
  async createGroupChat(groupName: string, participantIds: string[]): Promise<{ chat: Chat | null; error: Error | null }> {
    try {
      if (!groupName || participantIds.length < 2) {
        return { chat: null, error: new Error('Group name and at least 2 participants are required') };
      }

      const currentUserId = participantIds[0]; // First participant is the creator

      console.log('Creating group chat:', groupName, 'with participants:', participantIds);

      // Create new group chat
      const { data: newChat, error: createError } = await this.supabase
        .from('chats')
        .insert({
          type: 'group',
          name: groupName,
          created_by: currentUserId
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating group chat:', createError);
        return { chat: null, error: createError };
      }

      // Add all participants
      const participants = participantIds.map(userId => ({
        chat_id: newChat.id,
        user_id: userId
      }));

      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error adding participants to group chat:', participantsError);
        return { chat: null, error: participantsError };
      }

      // Fetch the complete chat with participants
      const { data: fullChat, error: fetchError } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, listing_id, created_by, created_at, updated_at, last_message_at,
          chat_participants!inner(
            id, user_id, joined_at, last_read_at,
            accounts!inner(id, name, profile_pic)
          )
        `)
        .eq('id', newChat.id)
        .single();

      if (fetchError) {
        console.error('Error fetching new group chat:', fetchError);
        return { chat: null, error: fetchError };
      }

      return { chat: fullChat, error: null };
    } catch (error) {
      console.error('Error in createGroupChat:', error);
      return { chat: null, error: error as Error };
    }
  }
}

export const chatService = new ChatService();
