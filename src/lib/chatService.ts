import { getSupabaseClient } from './supabaseClient';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { SimpleMessage, SimpleChat, MediaAttachment } from './types';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message_text: string | null;
  message_type: 'text' | 'image' | 'poll' | 'listing';
  image_url: string | null;
  images: string[] | null;
  created_at: string;
  read_by: string[];
  poll_id: string | null;
  reply_to_message_id: string | null;
  is_pinned: boolean;
  sender_name?: string;
  sender_profile_pic?: string;
  attachment_count?: number; // Number of attachments for this message
  listing_id?: string | null;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role?: 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  user_name?: string;
  user_profile_pic?: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  photo?: string | null; // Group chat photo
  listing_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_event_chat?: boolean;
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
  private supabase: SupabaseClient;
  private activeSubscriptions: Map<string, RealtimeChannel> = new Map();

  constructor(supabase?: SupabaseClient) {
    const client = supabase || getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }
    this.supabase = client;
  }

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
      
      // Test session status
      const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser();
      console.log('ChatService: Auth check:', { 
        authUser: authUser?.id, 
        requestedUserId: userId, 
        authError: authError?.message 
      });
      
      if (authError || !authUser) {
        console.error('ChatService: Authentication failed:', authError);
        return { chats: [], error: new Error('Authentication failed') };
      }
      
      // Get all chats where the user is a participant
      const { data: userChats, error: userChatsError } = await this.supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId);

      if (userChatsError) {
        console.error('Error getting user chat participants:', {
          error: userChatsError,
          message: userChatsError.message,
          details: userChatsError.details,
          hint: userChatsError.hint,
          code: userChatsError.code,
          userId: userId,
          authUser: user?.id
        });
        return { chats: [], error: userChatsError };
      }

      if (!userChats || userChats.length === 0) {
        // No chats for this user
        return { chats: [], error: null };
      }

      // Get the actual chat details
      const chatIds = userChats.map(chat => chat.chat_id);
      console.log('🔍 ChatService.getUserChats: Fetching chat details for', chatIds.length, 'chats');
      const { data: chats, error } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, photo, listing_id, created_by, created_at, updated_at, last_message_at, is_event_chat, is_archived
        `)
        .in('id', chatIds)
        // Show chats that are not explicitly archived. Old rows may have is_archived = null.
        .or('is_archived.is.null,is_archived.eq.false')
        .order('last_message_at', { ascending: false, nullsFirst: false });
      
      // Log any missing chats (participant exists but chat not returned)
      if (chats && chatIds.length > chats.length) {
        const returnedChatIds = new Set(chats.map(c => c.id));
        const missingChatIds = chatIds.filter(id => !returnedChatIds.has(id));
        console.warn('⚠️ ChatService.getUserChats: Some chats were filtered out:', {
          totalParticipantChats: chatIds.length,
          returnedChats: chats.length,
          missingChatIds
        });
      }

      console.log('🔍 ChatService.getUserChats: Fetched', chats?.length || 0, 'chats after filtering');
      if (chats) {
        chats.forEach(chat => {
          console.log('🔍 ChatService.getUserChats: Chat', chat.id, {
            name: chat.name,
            is_event_chat: chat.is_event_chat,
            is_archived: chat.is_archived,
            last_message_at: chat.last_message_at
          });
        });
      }

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
          const setupError = new Error('Chat system not set up. Please contact administrator.');
          (setupError as any).code = 'CHAT_NOT_SETUP';
          (setupError as any).details = 'The chat database tables have not been created yet.';
          (setupError as any).hint = 'Run the setup-chat-system.sql script in Supabase';
          return { chats: [], error: setupError };
        }
        
        // Only log error if it's not a common "no data" error or authentication error
        if (error.code !== 'PGRST116' && 
            error.message !== 'JSON object requested, multiple (or no) rows returned' &&
            error.message !== 'User not authenticated' &&
            error.message !== 'User ID is required' &&
            error.message !== 'User ID mismatch') {
          console.error('Error getting user chats:', serializableError);
        }
        
        const err = new Error(serializableError.message);
        (err as any).code = serializableError.code;
        (err as any).details = serializableError.details;
        (err as any).hint = serializableError.hint;
        return { chats: [], error: err };
      }

      // Get participants for all chats in parallel
      const { data: allParticipants } = await this.supabase
        .from('chat_participants')
        .select(`
          chat_id, user_id, role, joined_at, last_read_at,
          accounts!inner(id, name, profile_pic)
        `)
        .in('chat_id', chatIds);

      // Group participants by chat_id
      const participantsByChat = new Map<string, ChatParticipant[]>();
      if (allParticipants) {
        allParticipants.forEach((p: any) => {
          if (!participantsByChat.has(p.chat_id)) {
            participantsByChat.set(p.chat_id, []);
          }
          participantsByChat.get(p.chat_id)!.push({
            id: p.id || p.user_id,
            chat_id: p.chat_id,
            user_id: p.user_id,
            role: p.role || 'member',
            joined_at: p.joined_at,
            last_read_at: p.last_read_at,
            user_name: (p.accounts as any)?.name,
            user_profile_pic: (p.accounts as any)?.profile_pic
          });
        });
      }

      // Transform the data to our Chat interface
      const transformedChats: Chat[] = (chats || []).map(chat => ({
        id: chat.id,
        type: chat.type,
        name: chat.name,
        photo: (chat as any).photo || null, // Add photo field for group chats
        listing_id: chat.listing_id,
        created_by: chat.created_by,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        last_message_at: chat.last_message_at,
        is_event_chat: (chat as any).is_event_chat || false,
        participants: participantsByChat.get(chat.id) || []
      }));

      // Get the last message for each chat in parallel
      const lastMessagePromises = transformedChats.map(async (chat) => {
        const { data: lastMessage, error: messageError } = await this.supabase
          .from('chat_messages')
          .select(`
            id, chat_id, sender_id, message_text, 
            created_at, reply_to_message_id,
            accounts!inner(name, profile_pic)
          `)
          .eq('chat_id', chat.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!messageError && lastMessage) {
          // Get attachment count for the last message
          const { count: attachmentCount, error: attachmentError } = await this.supabase
            .from('attachments')
            .select('*', { count: 'exact', head: true })
            .eq('message_id', lastMessage.id);

          if (attachmentError) {
            console.error('Error getting attachment count for message:', lastMessage.id, attachmentError);
          }

          const finalAttachmentCount = attachmentCount || 0;
          
          console.log('ChatService.getUserChats: Last message for chat', chat.id, {
            messageId: lastMessage.id,
            hasText: !!lastMessage.message_text,
            textLength: lastMessage.message_text?.length || 0,
            attachmentCount: finalAttachmentCount,
            senderId: lastMessage.sender_id,
            senderName: (lastMessage.accounts as any)?.name
          });
          
          chat.last_message = {
            id: lastMessage.id,
            chat_id: lastMessage.chat_id,
            sender_id: lastMessage.sender_id,
            message_text: lastMessage.message_text,
            message_type: 'text', // Default since column doesn't exist
            image_url: null,
            images: null,
            created_at: lastMessage.created_at,
            read_by: [],
            poll_id: null,
            reply_to_message_id: lastMessage.reply_to_message_id || null,
            is_pinned: false,
            sender_name: (lastMessage.accounts as any)?.name,
            sender_profile_pic: (lastMessage.accounts as any)?.profile_pic,
            attachment_count: finalAttachmentCount // Add attachment count
          };
        }

        // Calculate unread count for this user
        const userParticipant = chat.participants?.find(p => p.user_id === userId);
        if (userParticipant) {
          const { count } = await this.supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .gt('created_at', userParticipant.last_read_at)
            .neq('sender_id', userId)
            .is('deleted_at', null);

          chat.unread_count = count || 0;
        } else {
          chat.unread_count = 0;
          }
      });

      await Promise.all(lastMessagePromises);

      console.log('Successfully got user chats:', transformedChats.length);
      return { chats: transformedChats, error: null };
    } catch (error) {
      console.error('Error in getUserChats:', error);
      return { chats: [], error: error as Error };
    }
  }

  // Helper: Convert ChatMessage to SimpleMessage
  private convertToSimpleMessage(msg: ChatMessage, attachments: MediaAttachment[] = []): SimpleMessage {
    return {
      id: msg.id,
      chat_id: msg.chat_id,
      sender_id: msg.sender_id,
      sender_name: msg.sender_name || 'Unknown User',
      sender_profile_pic: msg.sender_profile_pic || undefined,
      text: msg.message_text || '',
      created_at: msg.created_at,
      reply_to_message_id: msg.reply_to_message_id || null,
      attachments: attachments.length > 0 ? attachments : undefined,
      deleted_at: null
    };
  }

  // Get messages for a specific chat
  async getChatMessages(
    chatId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ messages: SimpleMessage[]; hasMore: boolean; error: Error | null }> {
    try {
      console.log('ChatService: Getting messages for chat:', chatId, 'limit:', limit, 'offset:', offset);
      
      // Get current user ID for marking as read
      const { data: { user } } = await this.supabase.auth.getUser();
      const userId = user?.id;
      
      // Fetch messages with limit and offset
      // Select only columns that exist in the database
      const { data: messages, error } = await this.supabase
        .from('chat_messages')
        .select(`
          id, chat_id, sender_id, message_text, 
          created_at, reply_to_message_id, deleted_at,
          message_type, listing_id,
          accounts!inner(name, profile_pic)
        `)
        .eq('chat_id', chatId)
        .is('deleted_at', null) // Only get non-deleted messages
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting chat messages:', error);
        return { messages: [], hasMore: false, error };
      }

      // Check if there are more messages
      const { count } = await this.supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)
        .is('deleted_at', null)
        .lt('created_at', messages && messages.length > 0 ? messages[messages.length - 1].created_at : new Date().toISOString());
      
      const hasMore = (count || 0) > 0;

      // Get attachments for all messages
      const messageIds = (messages || []).map(m => m.id);
      let attachmentsMap: Map<string, MediaAttachment[]> = new Map();
      
      if (messageIds.length > 0) {
        const { data: attachments } = await this.supabase
          .from('attachments')
          .select('id, message_id, file_url, file_type, thumbnail_url')
          .in('message_id', messageIds);
        
        if (attachments) {
          attachments.forEach(att => {
            if (!attachmentsMap.has(att.message_id)) {
              attachmentsMap.set(att.message_id, []);
            }
            attachmentsMap.get(att.message_id)!.push({
              id: att.id,
              file_url: att.file_url,
              file_type: att.file_type as 'image' | 'video',
              thumbnail_url: att.thumbnail_url || undefined
            });
          });
        }
      }

      // Transform messages to SimpleMessage format (reverse order for display)
      const transformedMessages: SimpleMessage[] = (messages || [])
        .reverse() // Reverse to show oldest first
        .map(msg => {
          const chatMsg: ChatMessage = {
        id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
        message_text: msg.message_text,
            message_type: msg.message_type || 'text',
            image_url: null,
            images: null,
        created_at: msg.created_at,
            read_by: [],
            poll_id: null,
          reply_to_message_id: msg.reply_to_message_id,
            is_pinned: false,
        sender_name: (msg.accounts as any)?.name,
        sender_profile_pic: (msg.accounts as any)?.profile_pic
          };
          const simpleMsg = this.convertToSimpleMessage(chatMsg, attachmentsMap.get(msg.id) || []);
          // Add listing_id if present
          if (msg.listing_id) {
            simpleMsg.listing_id = msg.listing_id;
          }
          // Add message_type if present
          if (msg.message_type) {
            simpleMsg.message_type = msg.message_type as 'text' | 'image' | 'file' | 'system' | 'listing';
          }
          return simpleMsg;
        });

      // Mark messages as read for this user
      if (userId) {
      await this.markMessagesAsRead(chatId, userId);
      }

      console.log('Successfully got chat messages:', transformedMessages.length, 'hasMore:', hasMore);
      return { messages: transformedMessages, hasMore, error: null };
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      return { messages: [], hasMore: false, error: error as Error };
    }
  }

  // Send a listing message to a chat
  async sendListingMessage(
    chatId: string,
    listingId: string
  ): Promise<{ message: SimpleMessage | null; error: Error | null }> {
    try {
      console.log('ChatService: Sending listing message to chat:', chatId, 'listingId:', listingId);
      
      // Get current user ID
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { message: null, error: new Error('User not authenticated') };
      }
      const senderId = user.id;
      
      // Get current timestamp
      const currentTimestamp = new Date().toISOString();
      
      // Insert listing message
      const { data: message, error } = await this.supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          message_text: '', // Empty text for listing messages
          message_type: 'listing',
          listing_id: listingId
        })
        .select(`
          id, chat_id, sender_id, message_text, 
          created_at, reply_to_message_id, message_type, listing_id,
          accounts!inner(name, profile_pic)
        `)
        .single();

      if (error) {
        console.error('Error sending listing message:', error);
        return { message: null, error };
      }

      // Update chat's last_message_at
      await this.supabase
        .from('chats')
        .update({ 
          last_message_at: message.created_at || currentTimestamp,
          updated_at: message.created_at || currentTimestamp
        })
        .eq('id', chatId);

      const chatMessage: ChatMessage = {
        id: message.id,
        chat_id: message.chat_id,
        sender_id: message.sender_id,
        message_text: message.message_text,
        message_type: 'listing',
        image_url: null,
        images: null,
        created_at: message.created_at,
        read_by: [],
        poll_id: null,
        reply_to_message_id: message.reply_to_message_id || null,
        is_pinned: false,
        sender_name: (message.accounts as any)?.name,
        sender_profile_pic: (message.accounts as any)?.profile_pic,
        listing_id: listingId
      };

      const simpleMessage = this.convertToSimpleMessage(chatMessage, []);
      simpleMessage.message_type = 'listing';
      simpleMessage.listing_id = listingId;

      console.log('Successfully sent listing message:', simpleMessage.id);
      return { message: simpleMessage, error: null };
    } catch (error) {
      console.error('Error in sendListingMessage:', error);
      return { message: null, error: error as Error };
    }
  }

  // Send a message to a chat
  async sendMessage(
    chatId: string, 
    content: string, 
    attachments?: MediaAttachment[]
  ): Promise<{ message: SimpleMessage | null; error: Error | null }> {
    try {
      console.log('ChatService: Sending message to chat:', chatId, 'content:', content.substring(0, 50));
      
      // Get current user ID
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { message: null, error: new Error('User not authenticated') };
      }
      const senderId = user.id;
      
      // Get current timestamp to ensure consistency
      const currentTimestamp = new Date().toISOString();
      
      // Insert message
      const { data: message, error } = await this.supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          message_text: content,
          // Only use columns that exist in database
        })
          .select(`
            id, chat_id, sender_id, message_text, 
            created_at, reply_to_message_id,
            accounts!inner(name, profile_pic)
          `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { message: null, error };
      }

      // Save attachments if provided
      console.log('📎 ChatService.sendMessage: Processing attachments', {
        hasAttachments: !!(attachments && attachments.length > 0),
        attachmentCount: attachments?.length || 0,
        messageId: message.id,
        attachments: attachments?.map((att, i) => ({
          index: i + 1,
          id: att.id,
          file_url: att.file_url?.substring(0, 60) + '...',
          file_type: att.file_type,
          has_thumbnail: !!att.thumbnail_url
        }))
      });

      if (attachments && attachments.length > 0 && message.id) {
        const attachmentInserts = attachments.map(att => ({
          message_id: message.id,
          file_url: att.file_url,
          file_type: att.file_type,
          thumbnail_url: att.thumbnail_url || null
        }));
        
        console.log('💾 ChatService.sendMessage: Inserting attachments into database', {
          count: attachmentInserts.length,
          inserts: attachmentInserts.map((ins, i) => ({
            index: i + 1,
            message_id: ins.message_id,
            file_url: ins.file_url?.substring(0, 60) + '...',
            file_type: ins.file_type,
            has_thumbnail: !!ins.thumbnail_url
          }))
        });
        
        const { error: attachError } = await this.supabase
          .from('attachments')
          .insert(attachmentInserts);
        
        if (attachError) {
          console.error('❌ ChatService.sendMessage: Error saving attachments:', attachError);
          console.error('Error details:', {
            message: attachError.message,
            code: attachError.code,
            details: attachError.details,
            hint: attachError.hint
          });
          // Don't fail the message send, just log the error
        } else {
          console.log('✅ ChatService.sendMessage: Attachments saved successfully', {
            count: attachmentInserts.length
          });
        }
      } else {
        console.log('ℹ️ ChatService.sendMessage: No attachments to save', {
          hasAttachments: !!(attachments && attachments.length > 0),
          hasMessageId: !!message.id
        });
      }

      // Update chat's last_message_at with current timestamp (use message.created_at or currentTimestamp)
      // Use message.created_at if available, otherwise use currentTimestamp
      const timestampToUse = message.created_at || currentTimestamp;
      console.log('🕐 Updating chat timestamp:', { chatId, timestampToUse, messageCreatedAt: message.created_at });
      
      const { data: updateData, error: updateError } = await this.supabase
        .from('chats')
        .update({ 
          last_message_at: timestampToUse,
          updated_at: timestampToUse
        })
        .eq('id', chatId)
        .select('id, last_message_at, updated_at'); // Select to verify update
      
      if (updateError) {
        console.error('❌ Error updating chat timestamp:', {
          error: updateError,
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
          chatId,
          timestampToUse
        });
        // Don't fail the message send, but log the error
      } else {
        console.log('✅ Chat timestamp updated successfully:', {
          chatId,
          updatedTimestamp: updateData?.[0]?.last_message_at,
          requestedTimestamp: timestampToUse,
          match: updateData?.[0]?.last_message_at === timestampToUse
        });
        
        // Verify the update actually worked
        if (updateData && updateData[0] && updateData[0].last_message_at !== timestampToUse) {
          console.warn('⚠️ Timestamp mismatch! Database returned different timestamp:', {
            requested: timestampToUse,
            actual: updateData[0].last_message_at
          });
        }
        
        // Double-check by querying the database directly
        const { data: verifyData, error: verifyError } = await this.supabase
          .from('chats')
          .select('id, last_message_at, updated_at')
          .eq('id', chatId)
          .single();
        
        if (verifyError) {
          console.error('❌ Error verifying timestamp update:', verifyError);
        } else {
          console.log('🔍 Verification query result:', {
            chatId,
            last_message_at: verifyData?.last_message_at,
            updated_at: verifyData?.updated_at,
            matches: verifyData?.last_message_at === timestampToUse
          });
        }
      }

      const chatMessage: ChatMessage = {
        id: message.id,
        chat_id: message.chat_id,
        sender_id: message.sender_id,
        message_text: message.message_text,
          message_type: 'text', // Default since column doesn't exist
          image_url: null,
          images: null,
          created_at: message.created_at,
          read_by: [],
          poll_id: null,
          reply_to_message_id: message.reply_to_message_id || null,
          is_pinned: false,
        sender_name: (message.accounts as any)?.name,
        sender_profile_pic: (message.accounts as any)?.profile_pic
      };

      const simpleMessage = this.convertToSimpleMessage(chatMessage, attachments || []);

      console.log('Successfully sent message:', simpleMessage.id);
      return { message: simpleMessage, error: null };
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

      // Only treat as error if it's not a "no rows" type error
      if (checkError && checkError.code !== 'PGRST116') {
        // Create a serializable error object
        const serializableError = {
          message: checkError.message || 'Unknown error',
          code: checkError.code || 'UNKNOWN',
          details: checkError.details || null,
          hint: checkError.hint || null
        };
        
        console.error('Error checking existing chats:', serializableError);
        const err = new Error(serializableError.message);
        (err as any).code = serializableError.code;
        (err as any).details = serializableError.details;
        (err as any).hint = serializableError.hint;
        return { chat: null, error: err };
      }
      
      // If checkError exists but it's just "no rows", continue (no existing chat found)
      // existingChats will be null or empty, which is fine

      // Check if any of these chats also has user2Id as a participant
      for (const chat of existingChats || []) {
        const { data: participants, error: participantError } = await this.supabase
              .from('chat_participants')
              .select('user_id')
          .eq('chat_id', chat.id);

        if (!participantError && participants) {
          const participantIds = participants.map(p => p.user_id);
          if (participantIds.includes(user2Id) && participantIds.length === 2) {
            // Direct chat already exists - return it instead of error
            console.log('Direct chat already exists, returning existing chat:', chat.id);
            
            // Get the full chat data with participants
            const { data: fullChat, error: fullChatError } = await this.supabase
              .from('chats')
              .select(`
                id, type, name, listing_id, created_by, created_at, updated_at, last_message_at,
                chat_participants(
                  id, user_id, role, joined_at, last_read_at,
                  accounts(id, name, profile_pic)
                )
              `)
              .eq('id', chat.id)
              .single();

            if (fullChatError) {
              console.error('Error getting existing chat data:', fullChatError);
              // Continue to create new chat if we can't fetch existing one
            } else if (fullChat) {
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
                  role: cp.role || 'member',
                  joined_at: cp.joined_at,
                  last_read_at: cp.last_read_at,
                  user_name: cp.accounts?.name,
                  user_profile_pic: cp.accounts?.profile_pic
                })),
                unread_count: 0
              };
              return { chat: transformedChat, error: null };
            }
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
        const err = new Error(serializableError.message);
        (err as any).code = serializableError.code;
        (err as any).details = serializableError.details;
        (err as any).hint = serializableError.hint;
        return { chat: null, error: err };
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
        const err = new Error(serializableError.message);
        (err as any).code = serializableError.code;
        (err as any).details = serializableError.details;
        (err as any).hint = serializableError.hint;
        return { chat: null, error: err };
      }

      // Get the full chat data with participants
      const { data: fullChat, error: fullChatError } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, listing_id, created_by, created_at, updated_at, last_message_at,
          chat_participants(
            id, user_id, role, joined_at, last_read_at,
            accounts(id, name, profile_pic)
          )
        `)
        .eq('id', newChat.id)
        .single();

      if (fullChatError) {
        // If fetching full details fails, still return the chat with minimal info
        // since the chat was successfully created
        console.warn('Error getting full chat data, returning minimal chat:', fullChatError);
        const minimalChat: Chat = {
          id: newChat.id,
          type: newChat.type || 'direct',
          name: newChat.name,
          listing_id: newChat.listing_id,
          created_by: newChat.created_by,
          created_at: newChat.created_at,
          updated_at: newChat.updated_at,
          last_message_at: newChat.last_message_at,
          participants: [],
          unread_count: 0
        };
        console.log('Successfully created direct chat (minimal):', minimalChat.id);
        return { chat: minimalChat, error: null };
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
          role: cp.role || 'member',
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
          type: 'group',
          name: groupName,
          photo: groupPhoto || null,
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
        role: userId === user.id ? 'admin' : 'member', // Creator is admin, others are members
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
          id, type, name, photo, listing_id, created_by, created_at, updated_at, last_message_at,
          chat_participants(
            id, user_id, role, joined_at, last_read_at,
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
        type: fullChat.type as 'direct' | 'group',
        name: fullChat.name,
        photo: fullChat.photo || null,
        listing_id: fullChat.listing_id,
        created_by: fullChat.created_by,
        created_at: fullChat.created_at,
        updated_at: fullChat.updated_at,
        last_message_at: fullChat.last_message_at,
        participants: fullChat.chat_participants.map((cp: any) => ({
          id: cp.id,
          chat_id: cp.chat_id,
          user_id: cp.user_id,
          role: cp.role || 'member',
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

  // Add members to an existing group chat
  async addMembersToGroup(chatId: string, memberIds: string[]): Promise<{ error: Error | null }> {
    try {
      console.log('Adding members to group:', { chatId, memberIds });

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { error: new Error('User not authenticated') };
      }

      // Verify the chat exists and is a group
      const { data: chat, error: chatError } = await this.supabase
        .from('chats')
        .select('id, type')
        .eq('id', chatId)
        .single();

      if (chatError || !chat) {
        return { error: chatError as Error || new Error('Chat not found') };
      }

      if (chat.type !== 'group') {
        return { error: new Error('Can only add members to group chats') };
      }

      // Check which members are already in the group
      const { data: existingParticipants } = await this.supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)
        .in('user_id', memberIds);

      const existingMemberIds = new Set((existingParticipants || []).map(p => p.user_id));
      const newMemberIds = memberIds.filter(id => !existingMemberIds.has(id));

      if (newMemberIds.length === 0) {
        return { error: new Error('All selected members are already in the group') };
      }

      // Add new participants (all as 'member' role, not admin)
      const participants = newMemberIds.map(userId => ({
        chat_id: chatId,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString(),
        last_read_at: new Date().toISOString()
      }));

      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        return { error: participantsError as Error };
      }

      console.log('Successfully added members to group');
      return { error: null };
    } catch (error) {
      console.error('Error in addMembersToGroup:', error);
      return { error: error as Error };
    }
  }

  // Update group chat details
  async updateGroupChat(
    chatId: string,
    updates: { name?: string; photo?: string | null }
  ): Promise<{ error: Error | null }> {
    try {
      console.log('Updating group chat:', { chatId, updates });

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { error: new Error('User not authenticated') };
      }

      // Verify the chat exists and is a group
      const { data: chat, error: chatError } = await this.supabase
        .from('chats')
        .select('id, type, created_by')
        .eq('id', chatId)
        .single();

      if (chatError || !chat) {
        return { error: chatError as Error || new Error('Chat not found') };
      }

      if (chat.type !== 'group') {
        return { error: new Error('Can only update group chats') };
      }

      // Check if user is a participant in the group (admin or member)
      const { data: participant, error: participantError } = await this.supabase
        .from('chat_participants')
        .select('user_id, role')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .single();

      if (participantError || !participant) {
        return { error: new Error('You must be a member of the group to update group details') };
      }

      // Allow any participant (admin or member) to update group details

      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }

      if (updates.photo !== undefined) {
        updateData.photo = updates.photo;
      }

      // Update the chat
      const { error: updateError } = await this.supabase
        .from('chats')
        .update(updateData)
        .eq('id', chatId);

      if (updateError) {
        console.error('Error updating group chat:', updateError);
        return { error: updateError as Error };
      }

      console.log('Successfully updated group chat');
      return { error: null };
    } catch (error) {
      console.error('Error in updateGroupChat:', error);
      return { error: error as Error };
    }
  }

  // Leave a group chat (remove user from participants)
  async leaveGroup(chatId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      console.log('Leaving group:', { chatId, userId });

      // Verify the chat exists and is a group
      const { data: chat, error: chatError } = await this.supabase
        .from('chats')
        .select('id, type')
        .eq('id', chatId)
        .single();

      if (chatError || !chat) {
        return { error: chatError as Error || new Error('Chat not found') };
      }

      if (chat.type !== 'group') {
        return { error: new Error('Can only leave group chats') };
      }

      // Remove the user from chat_participants
      const { error: removeError } = await this.supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (removeError) {
        console.error('Error removing participant:', removeError);
        return { error: removeError as Error };
      }

      console.log('Successfully left group');
      return { error: null };
    } catch (error) {
      console.error('Error in leaveGroup:', error);
      return { error: error as Error };
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

      // Query connections table to get user's friends/connections
      // Connections are bidirectional (user1_id and user2_id), so we check both
      const { data: connectionRows, error: connError } = await this.supabase
        .from('connections')
        .select(`
          user1_id,
          user2_id,
          user1_account: accounts!connections_user1_id_fkey(id, name, profile_pic, bio),
          user2_account: accounts!connections_user2_id_fkey(id, name, profile_pic, bio)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (connError) {
        console.error('ChatService: Error querying connections:', connError);
        return { contacts: [], error: connError };
      }

      // Process connections to get the connected user's profile
      // If current user is user1, return user2's profile; if user2, return user1's profile
      const contacts = (connectionRows || [])
        .map((row: any) => {
          // If current user is user1, return user2's profile
          if (row.user1_id === userId) {
            return row.user2_account;
          }
          // If current user is user2, return user1's profile
          else if (row.user2_id === userId) {
            return row.user1_account;
          }
          return null;
        })
        .filter(Boolean)
        .map((account: any) => ({
          id: account.id,
          name: account.name,
          profile_pic: account.profile_pic,
          bio: account.bio
        }));

      console.log('ChatService: Returning contacts from connections:', contacts.length, 'contacts');
      return { contacts, error: null };
    } catch (error) {
      console.error('Error in getContacts:', error);
      return { contacts: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }


  // Get a chat by ID
  async getChatById(chatId: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      console.log('ChatService: Getting chat by ID:', chatId);
      
      // Get current user ID
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { chat: null, error: new Error('User not authenticated') };
      }
      const userId = user.id;
      
      // Fetch chat with participants
      const { data: chat, error } = await this.supabase
        .from('chats')
        .select(`
          id, type, name, photo, listing_id, created_by, created_at, updated_at, last_message_at, is_event_chat,
          chat_participants!inner(
            id, user_id, role, joined_at, last_read_at,
            accounts!inner(id, name, profile_pic)
          )
        `)
        .eq('id', chatId)
        .single();

      if (error) {
        console.error('Error getting chat:', error);
        return { chat: null, error };
      }

      // Get last message
      const { data: lastMessage } = await this.supabase
        .from('chat_messages')
        .select(`
          id, chat_id, message_text, created_at, sender_id, reply_to_message_id,
          accounts!inner(name, profile_pic)
        `)
        .eq('chat_id', chatId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate unread count
      const userParticipant = chat.chat_participants.find((p: any) => p.user_id === userId);
      let unreadCount = 0;
      
      if (userParticipant) {
        const { count } = await this.supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chatId)
          .gt('created_at', userParticipant.last_read_at)
          .neq('sender_id', userId)
          .is('deleted_at', null);
        
        unreadCount = count || 0;
      }

      // Transform to SimpleChat
      const simpleChat: SimpleChat = {
        id: chat.id,
        type: chat.type === 'direct' ? 'direct' : 'group',
        name: chat.name || '',
        photo: (chat as any).photo || undefined, // Group chat photo from chats table
        is_event_chat: (chat as any).is_event_chat || false,
        participants: chat.chat_participants.map((p: any) => ({
          id: p.user_id,
          name: (p.accounts as any)?.name || 'Unknown User',
          profile_pic: (p.accounts as any)?.profile_pic || undefined,
          role: p.role || 'member'
        })),
        last_message: lastMessage
          ? {
          id: lastMessage.id,
              chat_id: lastMessage.chat_id,
              sender_id: lastMessage.sender_id,
              sender_name: (lastMessage.accounts as any)?.name || 'Unknown User',
              sender_profile_pic: (lastMessage.accounts as any)?.profile_pic || undefined,
              text: lastMessage.message_text || '',
          created_at: lastMessage.created_at,
              reply_to_message_id: lastMessage.reply_to_message_id || null,
              attachments: [],
              deleted_at: null
            }
          : undefined,
        last_message_at: chat.last_message_at,
        unread_count: unreadCount
      };

      console.log('Successfully got chat:', simpleChat.id);
      return { chat: simpleChat, error: null };
    } catch (error) {
      console.error('Error in getChatById:', error);
      return { chat: null, error: error as Error };
    }
  }

  // Subscribe to realtime updates for a chat
  subscribeToChat(
    chatId: string,
    onNewMessage: (message: SimpleMessage) => void,
    onMessageUpdate?: (message: SimpleMessage) => void,
    onMessageDelete?: (messageId: string) => void
  ): () => void {
    const channelKey = `chat:${chatId}`;
    
    // Unsubscribe from existing channel if any
    if (this.activeSubscriptions.has(channelKey)) {
      this.unsubscribeFromChat(chatId);
    }

    const channel = this.supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          console.log('📨 New message received:', payload.new);
          
          // Fetch full message with sender info
          const { data: message } = await this.supabase
            .from('chat_messages')
          .select(`
            id, chat_id, sender_id, message_text, 
            created_at, reply_to_message_id,
            accounts!inner(name, profile_pic)
          `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            // Get attachments
            const { data: attachments } = await this.supabase
              .from('attachments')
              .select('id, message_id, file_url, file_type, thumbnail_url')
              .eq('message_id', message.id);

            const chatMsg: ChatMessage = {
              id: message.id,
              chat_id: message.chat_id,
              sender_id: message.sender_id,
              message_text: message.message_text,
          message_type: 'text', // Default since column doesn't exist
          image_url: null,
          images: null,
          created_at: message.created_at,
          read_by: [],
          poll_id: null,
          reply_to_message_id: message.reply_to_message_id || null,
          is_pinned: false,
              sender_name: (message.accounts as any)?.name,
              sender_profile_pic: (message.accounts as any)?.profile_pic
            };

            const simpleMessage = this.convertToSimpleMessage(
              chatMsg,
              (attachments || []).map(att => ({
                id: att.id,
                file_url: att.file_url,
                file_type: att.file_type as 'image' | 'video',
                thumbnail_url: att.thumbnail_url || undefined
              }))
            );

            onNewMessage(simpleMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          if (onMessageUpdate) {
            // Similar to INSERT but for updates
            const { data: message } = await this.supabase
              .from('chat_messages')
          .select(`
            id, chat_id, sender_id, message_text, 
            created_at, reply_to_message_id,
            accounts!inner(name, profile_pic)
          `)
              .eq('id', payload.new.id)
        .single();

            if (message) {
              const chatMsg: ChatMessage = {
                id: message.id,
                chat_id: message.chat_id,
                sender_id: message.sender_id,
                message_text: message.message_text,
          message_type: 'text', // Default since column doesn't exist
          image_url: null,
          images: null,
          created_at: message.created_at,
          read_by: [],
          poll_id: null,
          reply_to_message_id: message.reply_to_message_id || null,
          is_pinned: false,
                sender_name: (message.accounts as any)?.name,
                sender_profile_pic: (message.accounts as any)?.profile_pic
              };

              const simpleMessage = this.convertToSimpleMessage(chatMsg);
              onMessageUpdate(simpleMessage);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          if (onMessageDelete) {
            onMessageDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    this.activeSubscriptions.set(channelKey, channel);
    console.log('📡 Subscribed to chat:', chatId);

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromChat(chatId);
    };
  }

  // Unsubscribe from a chat
  unsubscribeFromChat(chatId: string): void {
    const channelKey = `chat:${chatId}`;
    const channel = this.activeSubscriptions.get(channelKey);
    
    if (channel) {
      this.supabase.removeChannel(channel);
      this.activeSubscriptions.delete(channelKey);
      console.log('📡 Unsubscribed from chat:', chatId);
    }
  }

  // Send typing indicator
  async sendTypingIndicator(chatId: string, isTyping: boolean): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      const channel = this.supabase.channel(`typing:${chatId}`);
      
      if (isTyping) {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: user.id, is_typing: true }
        });
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  // Get chat media (attachments)
  async getChatMedia(chatId: string): Promise<{ media: MediaAttachment[]; error: Error | null }> {
    try {
      const { data: messages } = await this.supabase
        .from('chat_messages')
        .select('id')
        .eq('chat_id', chatId)
        .is('deleted_at', null);

      if (!messages || messages.length === 0) {
        return { media: [], error: null };
      }

      const messageIds = messages.map(m => m.id);
      const { data: attachments, error } = await this.supabase
        .from('attachments')
        .select('id, message_id, file_url, file_type, thumbnail_url')
        .in('message_id', messageIds)
        .order('created_at', { ascending: false });

      if (error) {
        return { media: [], error };
      }

      const media: MediaAttachment[] = (attachments || []).map(att => ({
        id: att.id,
        file_url: att.file_url,
        file_type: att.file_type as 'image' | 'video',
        thumbnail_url: att.thumbnail_url || undefined
      }));

      return { media, error: null };
    } catch (error) {
      return { media: [], error: error as Error };
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    console.log('🧹 Cleaning up all chat subscriptions');
    const chatIds = Array.from(this.activeSubscriptions.keys());
    chatIds.forEach(key => {
      const chatId = key.replace('chat:', '');
      this.unsubscribeFromChat(chatId);
    });
  }

  // Delete a chat (only if it has no messages)
  async deleteChat(chatId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Check if chat has any messages
      const { data: messages, error: messagesError } = await this.supabase
        .from('chat_messages')
        .select('id')
        .eq('chat_id', chatId)
        .is('deleted_at', null)
        .limit(1);

      if (messagesError) {
        console.error('Error checking messages:', messagesError);
        return { success: false, error: messagesError as Error };
      }

      // Only delete if there are no messages
      if (messages && messages.length > 0) {
        console.log('Chat has messages, cannot delete');
        return { success: false, error: new Error('Cannot delete chat with messages') };
      }

      // Delete chat participants first (cascade should handle this, but being explicit)
      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId);

      if (participantsError) {
        console.error('Error deleting participants:', participantsError);
        // Continue anyway, cascade might handle it
      }

      // Delete the chat
      const { error: chatError } = await this.supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (chatError) {
        console.error('Error deleting chat:', chatError);
        return { success: false, error: chatError as Error };
      }

      console.log('Successfully deleted empty chat:', chatId);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteChat:', error);
      return { success: false, error: error as Error };
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
      isGroup: chat.type === 'group',
      messages
    };
  }
}
