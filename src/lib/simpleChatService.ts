import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface Account {
  id: string;
  name: string;
  profile_pic?: string;
  created_at: string;
  updated_at: string;
}

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
  sender_profile_pic?: string;
  text: string;
  created_at: string;
  seq?: number;
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

// ============================================================================
// SIMPLIFIED CHAT SERVICE
// ============================================================================

export class SimpleChatService {
  private supabase: SupabaseClient;
  private currentAccount: Account;
  private activeSubscriptions: Map<string, RealtimeChannel> = new Map();

  constructor(supabase: SupabaseClient, account: Account) {
    this.supabase = supabase;
    this.currentAccount = account;
  }

  // ==========================================================================
  // CHAT OPERATIONS
  // ==========================================================================

  /**
   * Get all chats for the current user
   */
  async getUserChats(): Promise<{ chats: SimpleChat[]; error: Error | null }> {
    try {
      console.log('🔧 SimpleChatService: Getting chats for account:', this.currentAccount.id);
      
      // Debug: Check if auth_account_id() function exists and works
      const { data: authTest, error: authError } = await this.supabase
        .rpc('auth_account_id');
      console.log('🔧 SimpleChatService: auth_account_id() test:', { authTest, authError });
      
      const { data: chats, error } = await this.supabase
        .from('chats')
        .select(`
          id,
          type,
          name,
          last_message_at,
          created_at,
          chat_participants!inner(
            user_id,
            accounts!inner(id, name, profile_pic)
          )
        `)
        .eq('chat_participants.user_id', this.currentAccount.id)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      console.log('🔧 SimpleChatService: Query result:', { chats: chats?.length, error });

      if (error) throw error;

      const simpleChats: SimpleChat[] = (chats || []).map((chat: any) => ({
        id: chat.id,
        type: chat.type,
        name: chat.name,
        photo: undefined, // No photo column in chats table
        participants: chat.chat_participants.map((p: any) => ({
          id: p.accounts.id,
          name: p.accounts.name,
          profile_pic: p.accounts.profile_pic
        })),
        messages: [],
        last_message_at: chat.last_message_at,
        unreadCount: 0
      }));

      console.log('🔧 SimpleChatService: Returning chats:', simpleChats.length);
      return { chats: simpleChats, error: null };
    } catch (err) {
      console.error('🔧 SimpleChatService: Error in getUserChats:', err);
      return { chats: [], error: err as Error };
    }
  }

  /**
   * Get messages for a specific chat
   */
  async getChatMessages(
    chatId: string,
    limit: number = 50
  ): Promise<{ messages: SimpleMessage[]; error: Error | null }> {
    try {
      const { data: messages, error } = await this.supabase
        .from('chat_messages')
        .select(`
          id,
          chat_id,
          sender_id,
          message_text,
          created_at,
          seq,
          status,
          reply_to_message_id,
          deleted_at,
          accounts!chat_messages_sender_id_fkey(name, profile_pic)
        `)
        .eq('chat_id', chatId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Load reactions and attachments in parallel
      const messageIds = (messages || []).map((m: any) => m.id);
      
      const [reactionsData, attachmentsData] = await Promise.all([
        this.supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', messageIds),
        this.supabase
          .from('attachments')
          .select('*')
          .in('message_id', messageIds)
      ]);

      const reactionsMap = new Map<string, MessageReaction[]>();
      (reactionsData.data || []).forEach((r: any) => {
        if (!reactionsMap.has(r.message_id)) {
          reactionsMap.set(r.message_id, []);
        }
        reactionsMap.get(r.message_id)!.push(r);
      });

      const attachmentsMap = new Map<string, MediaAttachment[]>();
      (attachmentsData.data || []).forEach((a: any) => {
        if (!attachmentsMap.has(a.message_id)) {
          attachmentsMap.set(a.message_id, []);
        }
        attachmentsMap.get(a.message_id)!.push({
          id: a.id,
          file_url: a.file_url,
          file_type: a.file_type,
          thumbnail_url: a.thumbnail_url
        });
      });

      const simpleMessages: SimpleMessage[] = (messages || []).map((m: any) => ({
        id: m.id,
        chat_id: m.chat_id,
        sender_id: m.sender_id,
        sender_name: m.accounts?.name || 'Unknown',
        sender_profile_pic: m.accounts?.profile_pic,
        text: m.message_text || '',
        created_at: m.created_at,
        seq: m.seq,
        status: m.status,
        reply_to_message_id: m.reply_to_message_id,
        reactions: reactionsMap.get(m.id) || [],
        attachments: attachmentsMap.get(m.id) || [],
        deleted_at: m.deleted_at
      })).reverse(); // Oldest first

      return { messages: simpleMessages, error: null };
    } catch (err) {
      return { messages: [], error: err as Error };
    }
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(
    chatId: string,
    messageText: string,
    replyToMessageId?: string
  ): Promise<{ message: SimpleMessage | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: this.currentAccount.id,
          message_text: messageText,
          reply_to_message_id: replyToMessageId || null
        })
        .select(`
          id,
          chat_id,
          sender_id,
          message_text,
          created_at,
          seq,
          status,
          reply_to_message_id,
          deleted_at
        `)
        .single();

      if (error) throw error;

      const message: SimpleMessage = {
        id: data.id,
        chat_id: data.chat_id,
        sender_id: data.sender_id,
        sender_name: this.currentAccount.name,
        sender_profile_pic: this.currentAccount.profile_pic,
        text: data.message_text || '',
        created_at: data.created_at,
        seq: data.seq,
        status: data.status,
        reply_to_message_id: data.reply_to_message_id,
        reactions: [],
        attachments: [],
        deleted_at: data.deleted_at
      };

      return { message, error: null };
    } catch (err) {
      return { message: null, error: err as Error };
    }
  }

  // ==========================================================================
  // REALTIME SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribe to new messages in a chat
   */
  subscribeToChat(
    chatId: string,
    onNewMessage: (message: SimpleMessage) => void
  ): () => void {
    // Cleanup old subscription if exists
    if (this.activeSubscriptions.has(chatId)) {
      this.activeSubscriptions.get(chatId)?.unsubscribe();
      this.activeSubscriptions.delete(chatId);
    }

    // Create new subscription
    const channel = this.supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Fetch sender details
          const { data: sender } = await this.supabase
            .from('accounts')
            .select('name, profile_pic')
            .eq('id', newMsg.sender_id)
            .single();

          const message: SimpleMessage = {
            id: newMsg.id,
            chat_id: newMsg.chat_id,
            sender_id: newMsg.sender_id,
            sender_name: sender?.name || 'Unknown',
            sender_profile_pic: sender?.profile_pic,
            text: newMsg.message_text || '',
            created_at: newMsg.created_at,
            seq: newMsg.seq,
            status: newMsg.status,
            reply_to_message_id: newMsg.reply_to_message_id,
            reactions: [],
            attachments: [],
            deleted_at: newMsg.deleted_at
          };

          onNewMessage(message);
        }
      )
      .subscribe();

    this.activeSubscriptions.set(chatId, channel);

    // Return cleanup function
    return () => {
      channel.unsubscribe();
      this.activeSubscriptions.delete(chatId);
    };
  }

  /**
   * Cleanup all active subscriptions
   */
  cleanup() {
    this.activeSubscriptions.forEach((channel) => channel.unsubscribe());
    this.activeSubscriptions.clear();
  }

  // ==========================================================================
  // CHAT MANAGEMENT
  // ==========================================================================

  /**
   * Get a specific chat by ID
   */
  async getChatById(chatId: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      const { data: chat, error } = await this.supabase
        .from('chats')
        .select(`
          id,
          type,
          name,
          last_message_at,
          created_at,
          chat_participants!inner(
            user_id,
            accounts!inner(id, name, profile_pic)
          )
        `)
        .eq('id', chatId)
        .single();

      if (error) throw error;

      const simpleChat: SimpleChat = {
        id: chat.id,
        type: chat.type,
        name: chat.name,
        photo: undefined, // No photo column in chats table
        participants: chat.chat_participants.map((p: any) => ({
          id: p.accounts.id,
          name: p.accounts.name,
          profile_pic: p.accounts.profile_pic
        })),
        messages: [],
        last_message_at: chat.last_message_at,
        unreadCount: 0
      };

      return { chat: simpleChat, error: null };
    } catch (err) {
      return { chat: null, error: err as Error };
    }
  }

  /**
   * Create a direct chat with another user
   */
  async createDirectChat(otherUserId: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      // Check if chat already exists
      const { data: existingChats, error: searchError } = await this.supabase
        .from('chat_participants')
        .select('chat_id, chats!inner(type)')
        .eq('user_id', this.currentAccount.id);

      if (!searchError && existingChats) {
        for (const participant of existingChats) {
          if (participant.chats.type === 'direct') {
            const { data: otherParticipants } = await this.supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', participant.chat_id);

            if (otherParticipants?.length === 2 && 
                otherParticipants.some((p: any) => p.user_id === otherUserId)) {
              return this.getChatById(participant.chat_id);
            }
          }
        }
      }

      // Create new chat
      const { data: newChat, error: chatError } = await this.supabase
        .from('chats')
        .insert({
          type: 'direct',
          created_by: this.currentAccount.id
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: this.currentAccount.id },
          { chat_id: newChat.id, user_id: otherUserId }
        ]);

      if (participantsError) throw participantsError;

      return this.getChatById(newChat.id);
    } catch (err) {
      return { chat: null, error: err as Error };
    }
  }

  /**
   * Get media attachments for a chat
   */
  async getChatMedia(chatId: string): Promise<{ media: MediaAttachment[]; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('attachments')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const media: MediaAttachment[] = (data || []).map((a: any) => ({
        id: a.id,
        file_url: a.file_url,
        file_type: a.file_type,
        thumbnail_url: a.thumbnail_url
      }));

      return { media, error: null };
    } catch (err) {
      return { media: [], error: err as Error };
    }
  }

  // ==========================================================================
  // TYPING INDICATORS (Stub for compatibility)
  // ==========================================================================

  /**
   * Subscribe to typing indicators (stub for now)
   */
  subscribeToTyping(chatId: string, onTyping: (userIds: string[]) => void): () => void {
    // Stub implementation - can be enhanced later
    return () => {};
  }

  /**
   * Send typing indicator (stub for now)
   */
  sendTypingIndicator(chatId: string, isTyping: boolean): void {
    // Stub implementation - can be enhanced later
  }

  // ==========================================================================
  // REACTIONS
  // ==========================================================================

  async addReaction(
    messageId: string,
    emoji: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: this.currentAccount.id,
          emoji
        });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async removeReaction(
    messageId: string,
    emoji: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', this.currentAccount.id)
        .eq('emoji', emoji);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  // ==========================================================================
  // MESSAGE MANAGEMENT
  // ==========================================================================

  async deleteMessage(messageId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', this.currentAccount.id);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async markAsRead(chatId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', this.currentAccount.id);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }
}

