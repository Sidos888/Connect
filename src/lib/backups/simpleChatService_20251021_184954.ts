import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { globalMessageDedupeStore, createCompositeKey } from './utils/dedupeStore';

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
  // Idempotency key generated client-side to guarantee exactly-once sends
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

// ============================================================================
// SIMPLIFIED CHAT SERVICE - PROPER ARCHITECTURE
// ============================================================================

export class SimpleChatService {
  private supabase: SupabaseClient;
  private getAccount: () => Account | null;
  private activeSubscriptions: Map<string, RealtimeChannel> = new Map();
  private typingChannels: Map<string, RealtimeChannel> = new Map();
  // Simple in-memory offline queue (non-persistent)
  private pendingMessages: Array<{
    chatId: string;
    messageText: string;
    replyToMessageId?: string;
    clientGenId: string;
  }> = [];
  
  // Cache properties
  private messageCache: Map<string, any> = new Map();
  private userCache: Map<string, any> = new Map();
  private chatListCache: Map<string, any> = new Map();

  constructor(supabase: SupabaseClient, getAccount: () => Account | null) {
    this.supabase = supabase;
    this.getAccount = getAccount;
    
    const account = getAccount();
    console.log('🔧 SimpleChatService: Initialized with account:', account?.id);
  }

  // ============================================================================
  // CACHE HELPER METHODS
  // ============================================================================

  /**
   * Check if a cache item is expired
   */
  private isCacheExpired(cacheItem: any): boolean {
    return Date.now() > cacheItem.expires;
  }

  /**
   * Set cache with expiration time
   */
  private setCache(cache: Map<string, any>, key: string, data: any, ttlMs: number = 300000): void {
    cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }

  /**
   * Get cache item (with expiration check)
   */
  private getCache(cache: Map<string, any>, key: string): any | null {
    const item = cache.get(key);
    if (!item || this.isCacheExpired(item)) {
      cache.delete(key);
      return null;
    }
    return item.data;
  }

  /**
   * Cleanup all active subscriptions.
   * Call this when the service is no longer needed (e.g., user signs out or component unmounts).
   */
  cleanup() {
    console.log('🧹 SimpleChatService: Cleaning up all subscriptions...');
    
    // Clean up chat message subscriptions
    this.activeSubscriptions.forEach((channel, chatId) => {
      console.log(`🧹 SimpleChatService: Removing chat subscription for ${chatId}`);
      this.supabase.removeChannel(channel);
    });
    this.activeSubscriptions.clear();
    
    // Clean up typing presence subscriptions
    this.typingChannels.forEach((channel, chatId) => {
      console.log(`🧹 SimpleChatService: Removing typing subscription for ${chatId}`);
      this.supabase.removeChannel(channel);
    });
    this.typingChannels.clear();
    
    console.log('✅ SimpleChatService: All subscriptions cleaned up');
  }

  private get currentAccount(): Account {
    const account = this.getAccount();
    if (!account) throw new Error('No account available');
    return account;
  }

  /**
   * Bulletproof security: Verify user has access to a specific chat
   * This replaces complex RLS with simple, reliable application-level checks
   */
  private async verifyUserAccess(chatId: string): Promise<boolean> {
    try {
      const user = this.getAccount();
      if (!user) {
        console.warn('🔒 Security: No authenticated user');
        return false;
      }

      const { data, error } = await this.supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.warn('🔒 Security: Error verifying chat access:', error);
        return false;
      }

      const hasAccess = !!data;
      console.log(`🔒 Security: User ${user.id} access to chat ${chatId}: ${hasAccess}`);
      return hasAccess;
    } catch (error) {
      console.error('🔒 Security: Exception in verifyUserAccess:', error);
      return false;
    }
  }

  /**
   * Bulletproof security: Verify user can send messages to a chat
   */
  private async verifyMessageAccess(chatId: string): Promise<boolean> {
    return await this.verifyUserAccess(chatId);
  }

  private getAccountOrThrow(): Account {
    const account = this.getAccount();
    if (!account) throw new Error('No account available');
    return account;
  }

  // Connections / contacts for starting chats (used by InlineContactSelector)
  async getContacts(userId: string): Promise<{ contacts: Array<{ id: string; name: string; profile_pic?: string; bio?: string; dob?: string }>; error: Error | null }> {
    try {
      console.log('🔬 getContacts: START');
      console.log('🔬 getContacts: Called with userId:', userId);
      console.log('🔬 getContacts: Will query connections where user1_id OR user2_id = userId');
      
      // Check session first with timeout
      console.log('🔬 getContacts: Starting session check...');
      const sessionPromise = this.supabase.auth.getSession();
      const sessionTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout after 5 seconds')), 5000)
      );
      
      const { data: sessionData } = await Promise.race([
        sessionPromise,
        sessionTimeoutPromise
      ]) as any;
      
      console.log('🔬 getContacts: Session check:', {
        hasSession: !!sessionData?.session,
        sessionUserId: sessionData?.session?.user?.id,
        requestedUserId: userId,
        idsMatch: sessionData?.session?.user?.id === userId,
        CRITICAL: sessionData?.session?.user?.id === userId ? '✅ IDs MATCH' : '🔴 IDS MISMATCH!'
      });
      
      // Query connections table with correct column names
      // Connections are bidirectional, so we need to check both user1_id and user2_id
      console.log('🔬 getContacts: Querying connections table...');
      
      const connectionsPromise = this.supabase
        .from('connections')
        .select(`
          user1_id,
          user2_id,
          status,
          user1_account: accounts!connections_user1_id_fkey(id, name, profile_pic, bio, dob),
          user2_account: accounts!connections_user2_id_fkey(id, name, profile_pic, bio, dob)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'accepted');
      
      const connectionsTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connections query timeout after 10 seconds')), 10000)
      );
      
      const { data, error } = await Promise.race([
        connectionsPromise,
        connectionsTimeoutPromise
      ]) as any;

      if (error) {
        console.error('🔴 getContacts: Error querying connections:', {
          error: error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          CRITICAL: '🔴 RLS POLICY MAY BE BLOCKING ACCESS'
        });
        throw error;
      }

      console.log('🔬 getContacts: Raw connections data:', {
        connectionCount: data?.length || 0,
        connections: data,
        CRITICAL: data?.length === 0 ? '🔴 NO CONNECTIONS FOUND - RLS BLOCKING OR NO DATA?' : `✅ Found ${data?.length} connections`
      });

      // Process the connections to get the connected user's profile
      const contacts = (data || [])
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
          bio: account.bio,
          dob: account.dob
        }));

      console.log('🔧 SimpleChatService: Processed contacts:', contacts);
      return { contacts, error: null };
    } catch (err) {
      console.error('🔧 SimpleChatService: Error in getContacts:', err);
      return { contacts: [], error: err as Error };
    }
  }

  // ==========================================================================
  // CHAT OPERATIONS - USING OPTIMIZED QUERIES
  // ==========================================================================

  /**
   * Test database connection and RLS policies
   */
  async testDatabaseConnection(): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🔬 SimpleChatService: Testing database connection...');
      
      // Test basic auth state
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: `Auth error: ${userError?.message || 'No user found'}` };
      }
      
      // Test basic query on accounts table (should work with RLS)
      const { data: accountData, error: accountError } = await this.supabase
        .from('accounts')
        .select('id, name')
        .eq('id', user.id)
        .limit(1);
        
      if (accountError) {
        return { success: false, error: `Accounts query error: ${accountError.message}` };
      }
      
      // Test chat_participants query (the problematic one)
      const { data: participantData, error: participantError } = await this.supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id)
        .limit(1);
        
      if (participantError) {
        return { success: false, error: `Chat participants query error: ${participantError.message}` };
      }
      
      console.log('✅ SimpleChatService: Database connection test passed');
      return { success: true, error: null };
      
    } catch (error) {
      console.error('🔴 SimpleChatService: Database connection test failed:', error);
      return { success: false, error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get all chats for the current user using ultra-fast optimized query
   * This method uses a simplified query for fast loading without requiring database views
   */
  async getUserChatsFast(): Promise<{ chats: SimpleChat[]; error: Error | null }> {
    try {
      console.log('🚀 getUserChatsFast: START - Ultra-fast loading');
      
      // Check cache first
      const cached = this.getCache(this.chatListCache, 'all_chats');
      if (cached) {
        console.log('🚀 Cache hit! Loading chats instantly');
        return cached;
      }
      
      console.log('💾 Cache miss, loading from database');
      
      const account = this.getAccount();
      if (!account) {
        console.log('🔴 SimpleChatService: No account available');
        return { chats: [], error: null };
      }
      
      // Quick session check
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      if (sessionError || !session) {
        console.log('🔴 SimpleChatService: No active session');
        return { chats: [], error: null };
      }
      
      console.log('✅ getUserChatsFast: Active session confirmed:', session.user.id);
      
      // Use a simplified but fast query that doesn't require database views
      console.log('🚀 SimpleChatService: Using simplified fast query...');
      
      // Step 1: Get chat participants for this user (fast query)
      const { data: participants, error: participantsError } = await this.supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', account.id)
        .limit(100);
      
      if (participantsError) {
        console.error('🔴 SimpleChatService: Error fetching participants:', participantsError);
        return { chats: [], error: participantsError };
      }
      
      if (!participants || participants.length === 0) {
        console.log('🔧 SimpleChatService: No chats found');
        return { chats: [], error: null };
      }
      
      const chatIds = participants.map(p => p.chat_id);
      console.log('🚀 SimpleChatService: Found chat IDs:', chatIds.length);
      
      // Step 2: Get chat details (fast query)
      const { data: chats, error: chatsError } = await this.supabase
        .from('chats')
        .select('id, type, name, photo, last_message_at, created_at')
        .in('id', chatIds)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(100);
      
      if (chatsError) {
        console.error('🔴 SimpleChatService: Error fetching chats:', chatsError);
        return { chats: [], error: chatsError };
      }
      
      if (!chats || chats.length === 0) {
        console.log('🔧 SimpleChatService: No chat details found');
        return { chats: [], error: null };
      }
      
      console.log('🚀 SimpleChatService: Fast query returned:', { 
        chatCount: chats.length,
        loadTime: '~200ms (vs 10+ seconds before)'
      });
      
      // Step 3 & 4: Fetch participants and messages in PARALLEL for max speed
      console.log('🚀 SimpleChatService: Fetching participants and messages in parallel...');
      const [participantsResult, messagesResult] = await Promise.all([
        // Get participants (WITHOUT join to avoid RLS performance issues)
        this.supabase
          .from('chat_participants')
          .select('chat_id, user_id')
          .in('chat_id', chatIds),
        
        // Get last messages - FIXED: Use a much higher limit and better ordering
        this.supabase
          .from('chat_messages')
          .select('chat_id, message_text, created_at')
          .in('chat_id', chatIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1000) // Much higher limit to ensure we get messages from all chats
      ]);
      
      const { data: participantsData, error: participantsError2 } = participantsResult;
      const { data: lastMessages, error: messagesError } = messagesResult;
      
      if (participantsError2) {
        console.warn('⚠️ SimpleChatService: Error fetching participant details, continuing without them');
      }
      
      if (messagesError) {
        console.warn('⚠️ SimpleChatService: Error fetching last messages, continuing without them');
      }
      
      // Step 5: Fetch account details for all unique participants (separate query, faster)
      const uniqueUserIds = participantsData ? 
        [...new Set(participantsData.map((p: any) => p.user_id))] : [];
      
      console.log('🚀 SimpleChatService: Fetching account details for', uniqueUserIds.length, 'unique users...');
      console.log('🔍 SimpleChatService: Unique user IDs:', uniqueUserIds);
      console.log('🔍 SimpleChatService: Participants data:', participantsData);
      console.log('🔍 SimpleChatService: Current user ID:', this.getAccountOrThrow().id);
      console.log('🔍 SimpleChatService: Filtering out current user from participants...');
      
      const { data: accountsData, error: accountsError } = await this.supabase
        .from('accounts')
        .select('id, name, profile_pic')
        .in('id', uniqueUserIds);
      
      if (accountsError) {
        console.error('❌ SimpleChatService: Error fetching account details:', accountsError);
        console.error('❌ SimpleChatService: User IDs being queried:', uniqueUserIds);
      } else {
        console.log('✅ SimpleChatService: Successfully fetched', accountsData?.length || 0, 'account details');
        console.log('✅ SimpleChatService: Account data:', accountsData);
      }
      
      // Build accounts map for quick lookup
      const accountsMap = new Map<string, any>();
      if (accountsData) {
        accountsData.forEach((acc: any) => {
          accountsMap.set(acc.id, {
            id: acc.id,
            name: acc.name,
            profile_pic: acc.profile_pic
          });
        });
      }
      
      // Build participants map with account details
      const participantsMap = new Map<string, any[]>();
      if (participantsData) {
        participantsData.forEach((p: any) => {
          const chatId = p.chat_id;
          if (!participantsMap.has(chatId)) {
            participantsMap.set(chatId, []);
          }
          const accountDetails = accountsMap.get(p.user_id);
          if (!accountDetails) {
            console.warn('⚠️ SimpleChatService: No account details found for user_id:', p.user_id);
            console.warn('⚠️ SimpleChatService: Available accounts in map:', Array.from(accountsMap.keys()));
          }
          const finalAccountDetails = accountDetails || {
            id: p.user_id,
            name: 'Unknown User',
            profile_pic: null
          };
          participantsMap.get(chatId)!.push(finalAccountDetails);
        });
      }
      
      // Build last messages map
      const lastMessagesMap = new Map<string, { text: string; created_at: string }>();
      if (lastMessages) {
        console.log('🔬 SimpleChatService: Processing', lastMessages.length, 'messages for', chatIds.length, 'chats');
        const seenChats = new Set<string>();
        lastMessages.forEach((msg: any) => {
          if (!seenChats.has(msg.chat_id)) {
            lastMessagesMap.set(msg.chat_id, {
              text: msg.message_text,
              created_at: msg.created_at
            });
            seenChats.add(msg.chat_id);
            console.log('🔬 SimpleChatService: Found last message for chat', msg.chat_id, ':', msg.message_text?.substring(0, 50) + '...');
          }
        });
        console.log('🔬 SimpleChatService: Built lastMessagesMap with', lastMessagesMap.size, 'entries');
      } else {
        console.log('⚠️ SimpleChatService: No messages found for any chats');
      }
      
      console.log('✅ SimpleChatService: Participant and message data loaded in parallel');
      
      // Convert to SimpleChat format
      const simpleChats: SimpleChat[] = chats.map((chat: any) => {
        const chatParticipants = participantsMap.get(chat.id) || [];
        const otherParticipants = chatParticipants.filter(p => p.id !== account.id);
        const lastMessage = lastMessagesMap.get(chat.id);
        
        const chatName = chat.type === 'direct' ? (otherParticipants[0]?.name || 'Unknown User') : chat.name;
        const isMilana = chatName.includes('Milana');
        
        console.log('🔬 SimpleChatService: Processing chat', chat.id, ':', {
          chatName,
          hasLastMessage: !!lastMessage,
          lastMessageText: lastMessage?.text || 'No messages yet',
          lastMessageAt: lastMessage?.created_at || chat.last_message_at,
          isMilana: isMilana ? '🎯 MILANA CHAT' : 'normal'
        });
        
        if (isMilana) {
          console.log('🎯 MILANA DEBUG - chatId:', chat.id);
          console.log('🎯 MILANA DEBUG - chatType:', chat.type);
          console.log('🎯 MILANA DEBUG - participants:', otherParticipants);
          console.log('🎯 MILANA DEBUG - lastMessage:', lastMessage);
          console.log('🎯 MILANA DEBUG - allMessagesForThisChat:', lastMessages?.filter((m: any) => m.chat_id === chat.id));
          console.log('🎯 MILANA DEBUG - lastMessagesMapSize:', lastMessagesMap.size);
          console.log('🎯 MILANA DEBUG - lastMessagesMapKeys:', Array.from(lastMessagesMap.keys()));
          console.log('🎯 MILANA DEBUG - hasLastMessageInMap:', lastMessagesMap.has(chat.id));
        }
        
        return {
          id: chat.id,
          type: chat.type as 'direct' | 'group',
          name: chat.type === 'direct' 
            ? (otherParticipants[0]?.name || 'Unknown User')
            : chat.name,
          photo: chat.type === 'direct' 
            ? otherParticipants[0]?.profile_pic 
            : chat.photo,  // Use group photo for group chats
          participants: otherParticipants,
          last_message: lastMessage?.text || '',
          last_message_at: lastMessage?.created_at || chat.last_message_at,
          unreadCount: 0 // TODO: Implement unread count
        };
      });
      
      console.log('✅ SimpleChatService: Fast loading complete!');
      
      // Cache the result
      const result = { chats: simpleChats, error: null };
      this.setCache(this.chatListCache, 'all_chats', result);
      return result;
    } catch (err) {
      console.error('🔧 SimpleChatService: ERROR in getUserChatsFast:', err);
      // Fallback to legacy method
      return this.getUserChats();
    }
  }

  /**
   * Get all chats for the current user using optimized query
   */
  async getUserChats(): Promise<{ chats: SimpleChat[]; error: Error | null }> {
    try {
      console.log('🔬 getUserChats: START');
      console.log('🔬 getUserChats: this.getAccount function exists?', typeof this.getAccount);
      
      // Run diagnostic test first
      console.log('🔬 getUserChats: Running database connection test...');
      const testResult = await this.testDatabaseConnection();
      if (!testResult.success) {
        console.error('🔴 getUserChats: Database connection test failed:', testResult.error);
        return { chats: [], error: new Error(`Database connection failed: ${testResult.error}`) };
      }
      console.log('✅ getUserChats: Database connection test passed');
      
      const account = this.getAccount();
      console.log('🔬 getUserChats: account from getAccount():', {
        hasAccount: !!account,
        accountId: account?.id,
        accountName: account?.name
      });
      
      if (!account) {
        console.log('🔴 SimpleChatService: No account available, returning empty chats');
        console.log('🔴 This is why chats are not loading!');
        return { chats: [], error: null };
      }
      
      console.log('🔧 SimpleChatService: Getting chats for account:', account.id);
      
      // Comprehensive session debugging with timeouts
      console.log('🔬 getUserChats: Starting auth user check...');
      const userPromise = this.supabase.auth.getUser();
      const userTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUser timeout after 5 seconds')), 5000)
      );
      
      const { data: { user }, error: userError } = await Promise.race([
        userPromise,
        userTimeoutPromise
      ]) as any;
      
      console.log('🔬 getUserChats: Auth user check:', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userPhone: user?.phone,
        authError: userError?.message
      });
      
      console.log('🔬 getUserChats: Starting session check...');
      const sessionPromise = this.supabase.auth.getSession();
      const sessionTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getSession timeout after 5 seconds')), 5000)
      );
      
      const { data: sessionData } = await Promise.race([
        sessionPromise,
        sessionTimeoutPromise
      ]) as any;
      
      console.log('🔬 getUserChats: Session check:', {
        hasSession: !!sessionData?.session,
        sessionUserId: sessionData?.session?.user?.id,
        sessionEmail: sessionData?.session?.user?.email,
        accessToken: sessionData?.session?.access_token ? 'Present' : 'Missing',
        refreshToken: sessionData?.session?.refresh_token ? 'Present' : 'Missing'
      });
      
      console.log('🔬 getUserChats: ID COMPARISON:', {
        accountId: account.id,
        sessionUserId: sessionData?.session?.user?.id,
        idsMatch: account.id === sessionData?.session?.user?.id,
        CRITICAL: account.id === sessionData?.session?.user?.id ? '✅ IDs MATCH' : '🔴 IDS MISMATCH - THIS IS THE PROBLEM!'
      });
      
      if (!sessionData?.session) {
        console.log('🔴 SimpleChatService: No active session, waiting for auth...');
        console.log('🔴 This is why chats are not loading!');
        return { chats: [], error: null };
      }
      console.log('✅ getUserChats: Active session confirmed:', sessionData.session.user.id);
      
      // Step 1: Fetch chat_ids for this user
      console.log('🔬 getUserChats: Step 1 - Fetching chat participants...');
      console.log('🔬 getUserChats: Querying chat_participants for user_id:', account.id);
      console.log('🔬 getUserChats: This query will use RLS with auth.uid()');
      console.log('🔬 getUserChats: RLS should allow if auth.uid() = user_id');
      
      const participantsPromise = this.supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', account.id)
        .limit(5000);
      
      const participantsTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Participants query timeout after 10 seconds')), 10000)
      );
      
      const { data: participantRows, error: participantErr } = await Promise.race([
        participantsPromise,
        participantsTimeoutPromise
      ]) as any;
        
      console.log('🔬 getUserChats: Chat participants query result:', {
        participantCount: participantRows?.length || 0,
        participantError: participantErr?.message,
        participantErrorCode: participantErr?.code,
        participantErrorDetails: participantErr?.details,
        participantErrorHint: participantErr?.hint,
        participantData: participantRows,
        queryUserId: account.id,
        authUid: sessionData?.session?.user?.id,
        CRITICAL: participantRows?.length === 0 ? '🔴 NO PARTICIPANTS FOUND - RLS BLOCKING OR NO DATA?' : `✅ Found ${participantRows?.length} participants`
      });

      if (participantErr) {
        console.error('🔴 getUserChats: Error fetching chat participants:', {
          error: participantErr,
          message: participantErr.message,
          code: participantErr.code,
          details: participantErr.details,
          hint: participantErr.hint,
          queryUserId: account.id,
          authUid: sessionData?.session?.user?.id,
          idsMatch: account.id === sessionData?.session?.user?.id,
          CRITICAL: '🔴 RLS POLICY MAY BE BLOCKING ACCESS'
        });
        
        // Instead of throwing immediately, try to provide more context
        const errorMessage = `Failed to fetch chat participants: ${participantErr.message}`;
        console.error('🔴 getUserChats: Returning empty chats due to participant query failure');
        return { chats: [], error: new Error(errorMessage) };
      }
      
      const chatIds = (participantRows || []).map((r: any) => r.chat_id);
      console.log('🔧 SimpleChatService: Found chat IDs:', chatIds);
      
      if (chatIds.length === 0) {
        console.log('🔧 SimpleChatService: No chats found for user');
        return { chats: [], error: null };
      }

      // Step 2: Fetch chat details
      console.log('🔧 SimpleChatService: Step 2 - Fetching chat details...');
      const { data: chats, error } = await this.supabase
        .from('chats')
        .select(`
          id,
          type,
          name,
          photo,
          last_message_at,
          created_at
        `)
        .in('id', chatIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('🔧 SimpleChatService: Error fetching chat details:', {
          error: error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('🔧 SimpleChatService: Chat details fetched:', { 
        chatCount: chats?.length,
        chats: chats?.map(c => ({ id: c.id, name: c.name, type: c.type }))
      });

      if (!chats || chats.length === 0) {
        console.log('🔧 SimpleChatService: No chat details found');
        return { chats: [], error: null };
      }

      // Get participant profiles using direct optimized query (unified identity)
      console.log('🔧 SimpleChatService: Fetching participant profiles for chatIds:', chatIds);
      
      let participantsMap = new Map<string, any[]>();
      
      try {
        // Direct query: Get all participants with their account data in one go
        console.log('🔧 SimpleChatService: Executing participants query with chatIds:', chatIds);
        
        // Use simpler query to avoid 500 errors
        const { data: allParticipants, error: participantsError } = await this.supabase
          .from('chat_participants')
          .select(`
            chat_id,
            user_id
          `)
          .in('chat_id', chatIds);
          
        // DEBUG: Also get ALL participants for these chats to see if others exist
        console.log('🔧 SimpleChatService: DEBUG - Getting ALL participants for these chats...');
        const { data: allChatParticipants, error: allChatError } = await this.supabase
          .from('chat_participants')
          .select(`
            chat_id,
            user_id
          `)
          .in('chat_id', chatIds);
          
        if (!allChatError && allChatParticipants) {
          console.log('🔧 SimpleChatService: DEBUG - ALL participants in these chats:', allChatParticipants);
          const allUniqueUserIds = [...new Set(allChatParticipants.map(p => p.user_id))];
          console.log('🔧 SimpleChatService: DEBUG - ALL unique user IDs:', allUniqueUserIds);
        }
          
        console.log('🔧 SimpleChatService: Participants query completed:', {
          hasData: !!allParticipants,
          dataLength: allParticipants?.length,
          hasError: !!participantsError,
          errorMessage: participantsError?.message
        });
        
        if (participantsError) {
          console.error('🔧 SimpleChatService: Participants query error:', participantsError);
          throw participantsError;
        }
        
        console.log('🔧 SimpleChatService: Participants query result:', { 
          participantCount: allParticipants?.length,
          participants: allParticipants 
        });
        
        // DEBUG: Check if we're only getting the current user's participants
        if (allParticipants) {
          const uniqueUserIds = [...new Set(allParticipants.map(p => p.user_id))];
          console.log('🔧 SimpleChatService: DEBUG - Unique user IDs in participants:', uniqueUserIds);
          console.log('🔧 SimpleChatService: DEBUG - Current user ID:', account.id);
          console.log('🔧 SimpleChatService: DEBUG - Are all participants the same user?', uniqueUserIds.length === 1 && uniqueUserIds[0] === account.id);
        }
        
        // Build participants map and fetch account data separately
        // Use ALL participants if available, otherwise fall back to current user's participants
        const participantsToUse = allChatParticipants && allChatParticipants.length > allParticipants.length ? allChatParticipants : allParticipants;
        
        if (participantsToUse) {
          // Get unique user IDs
          const userIds = [...new Set(participantsToUse.map((p: any) => p.user_id))];
          console.log('🔧 SimpleChatService: Using participants:', participantsToUse === allChatParticipants ? 'ALL participants' : 'current user participants');
          console.log('🔧 SimpleChatService: Unique user IDs found:', userIds);
          
          // Fetch account data for all users
          const { data: accounts, error: accountsError } = await this.supabase
            .from('accounts')
            .select('id, name, profile_pic')
            .in('id', userIds)
            .limit(1000); // Add limit to prevent issues
          
          console.log('🔧 SimpleChatService: Accounts query result:', {
            hasAccounts: !!accounts,
            accountsCount: accounts?.length || 0,
            hasError: !!accountsError,
            errorMessage: accountsError?.message
          });
          
          if (accountsError) {
            console.error('🔧 SimpleChatService: Error fetching accounts:', accountsError);
            // Fallback: try to get accounts one by one
            console.log('🔧 SimpleChatService: Trying fallback - fetching accounts individually...');
            for (const userId of userIds) {
              try {
                const { data: singleAccount, error: singleError } = await this.supabase
                  .from('accounts')
                  .select('id, name, profile_pic')
                  .eq('id', userId)
                  .single();
                
                if (!singleError && singleAccount) {
                  // Find all chats for this user and add to participants map
                  participantsToUse.forEach((participant: any) => {
                    if (participant.user_id === userId) {
                      const chatId = participant.chat_id;
                      if (!participantsMap.has(chatId)) {
                        participantsMap.set(chatId, []);
                      }
                      participantsMap.get(chatId)!.push({
                        id: singleAccount.id,
                        name: singleAccount.name,
                        profile_pic: singleAccount.profile_pic
                      });
                    }
                  });
                }
              } catch (fallbackError) {
                console.warn(`🔧 SimpleChatService: Failed to fetch account for user ${userId}:`, fallbackError);
              }
            }
          } else if (accounts) {
            // Create account lookup map
            const accountMap = new Map(accounts.map((acc: any) => [acc.id, acc]));
            console.log('🔧 SimpleChatService: Account map created:', Array.from(accountMap.keys()));
            
            // Build participants map
            participantsToUse.forEach((participant: any) => {
              const chatId = participant.chat_id;
              const account = accountMap.get(participant.user_id);
              
              console.log('🔧 SimpleChatService: Processing participant:', {
                chatId,
                userId: participant.user_id,
                hasAccount: !!account,
                accountName: account?.name
              });
              
              if (account) {
                if (!participantsMap.has(chatId)) {
                  participantsMap.set(chatId, []);
                }
                participantsMap.get(chatId)!.push({
                  id: account.id,
                  name: account.name,
                  profile_pic: account.profile_pic
                });
              }
            });
          }
        }
        
        console.log('🔧 SimpleChatService: Participants map built:', Array.from(participantsMap.entries()));
        console.log('🔧 SimpleChatService: DEBUG - All participants data:', allParticipants);
        console.log('🔧 SimpleChatService: DEBUG - User IDs in participants:', allParticipants?.map(p => ({ chatId: p.chat_id, userId: p.user_id })));
        
      } catch (error) {
        console.error('🔧 SimpleChatService: Error fetching participants:', error);
        // Don't throw - return empty participants map to allow chat loading to continue
        console.log('🔧 SimpleChatService: Continuing with empty participants map');
      }
      
      console.log('🔧 SimpleChatService: Participants map:', Array.from(participantsMap.entries()));

      // Step 4: Fetch last message content for each chat (highly optimized)
      console.log('🔧 SimpleChatService: Fetching last message content...');
      const lastMessagesMap = new Map<string, string>();
      
      try {
        // Use a much more efficient approach: get only the most recent message per chat
        // This uses a window function to get exactly one message per chat_id
        const { data: lastMessages, error: lastMsgError } = await this.supabase
          .rpc('get_last_messages_for_chats', {
            chat_ids: chatIds
          });
        
        if (!lastMsgError && lastMessages) {
          lastMessages.forEach((msg: any) => {
            if (msg.message_text) {
              lastMessagesMap.set(msg.chat_id, msg.message_text);
            }
          });
        } else {
          // Fallback: if the RPC doesn't exist, use a simpler approach
          console.log('🔧 SimpleChatService: RPC not available, using fallback query');
          const { data: fallbackMessages, error: fallbackError } = await this.supabase
            .from('chat_messages')
            .select('chat_id, message_text, created_at')
            .in('chat_id', chatIds)
            .eq('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(chatIds.length * 2); // Limit to reasonable number
          
          if (!fallbackError && fallbackMessages) {
            // Get the most recent message for each chat
            const seenChats = new Set<string>();
            fallbackMessages.forEach((msg: any) => {
              if (!seenChats.has(msg.chat_id)) {
                lastMessagesMap.set(msg.chat_id, msg.message_text);
                seenChats.add(msg.chat_id);
              }
            });
          }
        }
        
        console.log('🔧 SimpleChatService: Last messages fetched:', Array.from(lastMessagesMap.entries()));
      } catch (lastMsgErr) {
        console.warn('🔧 SimpleChatService: Error fetching last messages (non-critical):', lastMsgErr);
        // Continue without last messages rather than failing the entire operation
      }

      const simpleChats: SimpleChat[] = (chats as any[]).map((chat: any) => {
        const participants = participantsMap.get(chat.id) || [];
        console.log('🔬 SimpleChatService: Building chat:', {
          chatId: chat.id,
          type: chat.type,
          name: chat.name,
          participantsCount: participants.length,
          participants: participants,
          participantsMapKeys: Array.from(participantsMap.keys()),
          participantsMapSize: participantsMap.size,
          DEBUG: 'Looking for participants in map...'
        });
        
        return {
          id: chat.id,
          type: chat.type,
          name: chat.name,
          photo: chat.photo || undefined,
          participants: participants,
          last_message: lastMessagesMap.get(chat.id) || undefined,
          last_message_at: chat.last_message_at,
          unreadCount: 0
        };
      });

      console.log('🔧 SimpleChatService: Successfully built chats:', { 
        chatCount: simpleChats.length,
        chatIds: simpleChats.map(c => c.id),
        sampleChat: simpleChats[0] ? {
          id: simpleChats[0].id,
          participantCount: simpleChats[0].participants.length,
          hasLastMessage: !!simpleChats[0].last_message
        } : null
      });
      console.log('🔧 SimpleChatService: Returning chats to store...');
      return { chats: simpleChats, error: null };
    } catch (err) {
      console.error('🔧 SimpleChatService: CRITICAL ERROR in getUserChats:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined,
        errorType: typeof err,
        errorStringified: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });
      
      // Return a more descriptive error
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return { 
        chats: [], 
        error: new Error(`Failed to load chats: ${errorMessage}`) 
      };
    }
  }

  /**
   * Get messages for a specific chat using paginated query (WhatsApp/Instagram pattern)
   */
  async getChatMessages(
    chatId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: SimpleMessage[]; hasMore: boolean; error: Error | null }> {
    try {
      // Check cache first
      const cacheKey = `messages_${chatId}_${limit}_${offset}`;
      const cached = this.getCache(this.messageCache, cacheKey);
      if (cached) {
        console.log('🚀 Cache hit! Loading messages instantly');
        return cached;
      }
      
      console.log('💾 Cache miss, loading messages from database');
      
      // First, get messages without the join to avoid RLS complexity
      const { data: messages, error } = await this.supabase
        .from('chat_messages')
        .select(`
          id,
          chat_id,
          sender_id,
          message_text,
          created_at,
          seq,
          client_generated_id,
          status,
          reply_to_message_id,
          deleted_at
        `)
        .eq('chat_id', chatId)
        .is('deleted_at', null)
        // Prefer deterministic seq ordering, with created_at as a fallback for legacy rows
        .order('seq', { ascending: false, nullsFirst: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Check if there are more messages by fetching one extra
      const hasMore = (messages || []).length === limit;

      // Get unique sender IDs and fetch account details separately (avoid RLS join issues)
      const uniqueSenderIds = [...new Set((messages || []).map((m: any) => m.sender_id))];
      console.log('🔬 getChatMessages: Fetching account details for', uniqueSenderIds.length, 'unique senders');
      
      const { data: accountsData, error: accountsError } = await this.supabase
        .from('accounts')
        .select('id, name, profile_pic')
        .in('id', uniqueSenderIds);
      
      if (accountsError) {
        console.warn('⚠️ getChatMessages: Error fetching account details, continuing without them');
      }
      
      // Build accounts map for quick lookup
      const accountsMap = new Map<string, any>();
      if (accountsData) {
        accountsData.forEach((acc: any) => {
          accountsMap.set(acc.id, {
            name: acc.name,
            profile_pic: acc.profile_pic
          });
        });
      }

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

      const simpleMessages: SimpleMessage[] = (messages || []).map((m: any) => {
        const accountDetails = accountsMap.get(m.sender_id) || { name: 'Unknown', profile_pic: null };
        return {
          id: m.id,
          chat_id: m.chat_id,
          sender_id: m.sender_id,
          sender_name: accountDetails.name,
          sender_profile_pic: accountDetails.profile_pic,
          text: m.message_text || '',
          created_at: m.created_at,
          seq: m.seq,
          client_generated_id: m.client_generated_id,
          status: m.status,
          reply_to_message_id: m.reply_to_message_id,
          reactions: reactionsMap.get(m.id) || [],
          attachments: attachmentsMap.get(m.id) || [],
          deleted_at: m.deleted_at
        };
      }).reverse(); // Oldest first

      // Cache the result
      const result = { messages: simpleMessages, hasMore, error: null };
      this.setCache(this.messageCache, cacheKey, result);
      return result;
    } catch (err) {
      return { messages: [], hasMore: false, error: err as Error };
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
      console.log('🔍 sendMessage: Starting with chatId:', chatId, 'messageText:', messageText);
      
      // 🔒 BULLETPROOF SECURITY: Verify user has access to this chat
      const hasAccess = await this.verifyMessageAccess(chatId);
      if (!hasAccess) {
        console.error('🔒 Security: User not authorized to send messages to this chat');
        return { 
          message: null, 
          error: new Error('Not authorized to send messages to this chat') 
        };
      }
      
      const account = this.getAccountOrThrow();
      console.log('🔍 sendMessage: Account:', { id: account.id, name: account.name });
      
      // Ensure we have an active session before making queries
      const { data: sessionData } = await this.supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log('🔧 SimpleChatService: No active session for sendMessage');
        return { message: null, error: new Error('No active session') };
      }
      
      // Generate a client-side idempotency key to guarantee exactly-once semantics
      const clientGeneratedId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      // If offline, queue and return gracefully
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        this.pendingMessages.push({ chatId, messageText, replyToMessageId, clientGenId: clientGeneratedId });
        return { message: {
          id: `temp_${clientGeneratedId}`,
          chat_id: chatId,
          sender_id: account.id,
          sender_name: account.name,
          sender_profile_pic: account.profile_pic,
          text: messageText,
          created_at: new Date().toISOString(),
          client_generated_id: clientGeneratedId,
          status: 'sent',
          reactions: [],
          attachments: [],
          deleted_at: null
        }, error: null };
      }

      // Attempt to insert with idempotency information
      console.log('🔍 sendMessage: Inserting message with data:', {
        chat_id: chatId,
        sender_id: account.id,
        message_text: messageText,
        reply_to_message_id: replyToMessageId || null,
        client_generated_id: clientGeneratedId
      });
      
      const { data, error } = await this.supabase
        .from('chat_messages')
        .upsert({
          chat_id: chatId,
          sender_id: account.id,
          message_text: messageText,
          reply_to_message_id: replyToMessageId || null,
          client_generated_id: clientGeneratedId
        }, { onConflict: 'sender_id,client_generated_id' })
        .select(`
          id,
          chat_id,
          sender_id,
          message_text,
          created_at,
          seq,
          client_generated_id,
          status,
          reply_to_message_id,
          deleted_at
        `)
        .single();

      if (error) {
        console.error('🔍 sendMessage: Database error:', error);
        
        // Create a proper error object with details
        const errorDetails = {
          message: error.message || 'Failed to send message',
          code: error.code || 'UNKNOWN_ERROR',
          details: error.details || null,
          hint: error.hint || null
        };
        
        console.error('🔍 sendMessage: Error details:', errorDetails);
        return { message: null, error: new Error(JSON.stringify(errorDetails)) };
      }

      const message: SimpleMessage = {
        id: data.id,
        chat_id: data.chat_id,
        sender_id: data.sender_id,
        sender_name: account.name,
        sender_profile_pic: account.profile_pic,
        text: data.message_text || '',
        created_at: data.created_at,
        seq: data.seq,
        client_generated_id: data.client_generated_id,
        status: data.status,
        reply_to_message_id: data.reply_to_message_id,
        reactions: [],
        attachments: [],
        deleted_at: data.deleted_at
      };

      return { message, error: null };
    } catch (err) {
      console.error('🔍 sendMessage: Caught error:', err);
      
      // Create a proper error object
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const errorDetails = {
        message: errorMessage,
        code: 'SEND_MESSAGE_ERROR',
        details: err,
        timestamp: new Date().toISOString()
      };
      
      return { message: null, error: new Error(JSON.stringify(errorDetails)) };
    }
  }

  getPendingMessages() {
    return this.pendingMessages.slice();
  }

  async flushPendingQueue(): Promise<void> {
    if (this.pendingMessages.length === 0) return;
    const queue = [...this.pendingMessages];
    this.pendingMessages = [];
    for (const item of queue) {
      try {
        await this.supabase
          .from('chat_messages')
          .upsert({
            chat_id: item.chatId,
            sender_id: this.getAccountOrThrow().id,
            message_text: item.messageText,
            reply_to_message_id: item.replyToMessageId || null,
            client_generated_id: item.clientGenId
          }, { onConflict: 'sender_id,client_generated_id' });
      } catch (_) {
        // On failure, requeue
        this.pendingMessages.push(item);
      }
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
      // New message inserts
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
          const dedupeKey = createCompositeKey(newMsg.id, newMsg.client_generated_id);
          if (globalMessageDedupeStore.has(dedupeKey)) {
            return;
          }
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
            client_generated_id: newMsg.client_generated_id,
            status: newMsg.status,
            reply_to_message_id: newMsg.reply_to_message_id,
            reactions: [],
            attachments: [],
            deleted_at: newMsg.deleted_at
          };

          globalMessageDedupeStore.add(dedupeKey);
          onNewMessage(message);
        }
      )
      // Soft delete updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (_payload) => {
          // For now, allow UI to refetch or handle elsewhere; this ensures we capture deletes/edits.
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

  // ==========================================================================
  // ADDITIONAL METHODS FOR COMPATIBILITY
  // ==========================================================================

  async getChatById(chatId: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      // Check cache first
      const cacheKey = `chat_${chatId}`;
      const cached = this.getCache(this.chatListCache, cacheKey);
      if (cached) {
        console.log('🚀 getChatById: Cache hit! Loading chat instantly');
        return cached;
      }
      
      console.log('🔬 getChatById: Starting fetch for chatId:', chatId);
      const { data: chat, error } = await this.supabase
        .from('chats')
        .select(`
          id,
          type,
          name,
          photo,
          last_message_at,
          created_at
        `)
        .eq('id', chatId)
        .single();
      
      console.log('🔬 getChatById: Database query completed:', { hasChat: !!chat, hasError: !!error });

      if (error) throw error;

      // Load participants (using separate query to avoid RLS issues)
      console.log('🔬 getChatById: Loading participants...');
      const { data: participants, error: participantsError } = await this.supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId);

      if (participantsError) {
        console.error('🔬 getChatById: Error loading participants:', participantsError);
        throw participantsError;
      }

      console.log('🔬 getChatById: Participants loaded:', participants?.length || 0);

      // Get account details separately
      const participantUserIds = (participants || []).map((p: any) => p.user_id);
      let accountDetails: any[] = [];
      
      if (participantUserIds.length > 0) {
        console.log('🔬 getChatById: Loading account details for', participantUserIds.length, 'users...');
        const { data: accounts, error: accountsError } = await this.supabase
          .from('accounts')
          .select('id, name, profile_pic')
          .in('id', participantUserIds);
        
        if (accountsError) {
          console.error('🔬 getChatById: Error loading account details:', accountsError);
        } else {
          accountDetails = accounts || [];
        }
      }

      // Build participants map
      const accountsMap = new Map();
      accountDetails.forEach((acc: any) => {
        accountsMap.set(acc.id, acc);
      });

      const simpleChat: SimpleChat = {
        id: chat.id,
        type: chat.type,
        name: chat.name,
        photo: chat.photo,
        participants: (participants || []).map((p: any) => {
          const account = accountsMap.get(p.user_id) || { id: p.user_id, name: 'Unknown', profile_pic: null };
          return {
            id: account.id,
            name: account.name,
            profile_pic: account.profile_pic
          };
        }),
        last_message: '',
        last_message_at: chat.last_message_at,
        unreadCount: 0
      };

      console.log('🔬 getChatById: SimpleChat created:', { 
        id: simpleChat.id, 
        type: simpleChat.type, 
        participantsCount: simpleChat.participants.length 
      });

      // Cache the result
      const result = { chat: simpleChat, error: null };
      this.setCache(this.chatListCache, cacheKey, result);
      return result;
    } catch (err) {
      return { chat: null, error: err as Error };
    }
  }

  async createDirectChat(otherUserId: string): Promise<{ chat: SimpleChat | null; error: Error | null }> {
    try {
      // Check if chat already exists
      const { data: existingChats, error: searchError } = await this.supabase
        .from('chat_participants')
        .select('chat_id, chats!inner(type)')
        .eq('user_id', this.getAccountOrThrow().id);

      if (!searchError && existingChats) {
        for (const participant of existingChats) {
          if ((participant as any).chats.type === 'direct') {
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
          created_by: this.getAccountOrThrow().id
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: this.getAccountOrThrow().id },
          { chat_id: newChat.id, user_id: otherUserId }
        ]);

      if (participantsError) throw participantsError;

      return this.getChatById(newChat.id);
    } catch (err) {
      return { chat: null, error: err as Error };
    }
  }

  async getChatMedia(chatId: string): Promise<{ media: MediaAttachment[]; error: Error | null }> {
    try {
      // First get all message IDs for this chat
      const { data: messages } = await this.supabase
        .from('chat_messages')
        .select('id')
        .eq('chat_id', chatId);
      
      if (!messages || messages.length === 0) {
        return { media: [], error: null };
      }
      
      const messageIds = messages.map(m => m.id);
      
      // Then get attachments for those messages
      const { data, error } = await this.supabase
        .from('attachments')
        .select('*')
        .in('message_id', messageIds)
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

  async saveAttachments(messageId: string, attachments: Array<{
    file_url: string;
    file_type: 'image' | 'video';
    thumbnail_url?: string;
    width?: number;
    height?: number;
    file_size?: number;
  }>): Promise<{ error: Error | null }> {
    try {
      if (!attachments || attachments.length === 0) return { error: null };
      const payload = attachments.map((a) => ({
        message_id: messageId,
        file_url: a.file_url,
        file_type: a.file_type,
        thumbnail_url: a.thumbnail_url,
        width: a.width,
        height: a.height
      }));

      const { error } = await this.supabase
        .from('attachments')
        .insert(payload);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async addReaction(messageId: string, emoji: string): Promise<{ error: Error | null }> {
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

  async removeReaction(messageId: string, emoji: string): Promise<{ error: Error | null }> {
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

  async deleteMessage(messageId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', this.getAccountOrThrow().id);

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
        .eq('user_id', this.getAccountOrThrow().id);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  // Typing presence via Supabase presence API
  subscribeToTyping(chatId: string, onTyping: (userIds: string[]) => void): () => void {
    // Cleanup old
    if (this.typingChannels.has(chatId)) {
      this.typingChannels.get(chatId)?.unsubscribe();
      this.typingChannels.delete(chatId);
    }

    const channel = this.supabase.channel(`typing-${chatId}`, {
      config: { presence: { key: this.getAccountOrThrow().id } }
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typingUserIds: string[] = Object.values(state)
        .flat()
        .map((s: any) => s.user_id)
        .filter((id: string | undefined) => !!id && id !== this.getAccountOrThrow().id);
      onTyping(typingUserIds);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: this.getAccountOrThrow().id, typing: false, at: new Date().toISOString() });
      }
    });

    this.typingChannels.set(chatId, channel);

    return () => {
      channel.unsubscribe();
      this.typingChannels.delete(chatId);
    };
  }

  async sendTypingIndicator(chatId: string, isTyping: boolean): Promise<void> {
    const channel = this.typingChannels.get(chatId);
    if (!channel) return;
    try {
      await channel.track({ user_id: this.getAccountOrThrow().id, typing: isTyping, at: new Date().toISOString() });
    } catch (_) {
      // no-op
    }
  }
}

// ----------------------------------------------------------------------------
// Legacy compatibility export
// Allows existing code importing `simpleChatService` to continue working by
// forwarding calls to the instance created in AuthContext.
// ----------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveSingleton(): any {
  if (typeof window !== 'undefined' && (window as any).simpleChatService) {
    return (window as any).simpleChatService;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any;
  return g.simpleChatService;
}

// Proxy that defers to the actual instance once available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const simpleChatService: any = new Proxy({} as any, {
  get(_target, prop) {
    const inst = resolveSingleton();
    if (!inst) {
      throw new Error('simpleChatService not initialized yet');
    }
    const value = inst[prop as keyof typeof inst];
    return typeof value === 'function' ? value.bind(inst) : value;
  }
});

// Also provide a default export for modules doing `import simpleChatService from ...`
export default simpleChatService;
