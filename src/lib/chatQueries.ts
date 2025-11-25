import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService } from './chatService';
import { SimpleChat, SimpleMessage } from './types';

/**
 * React Query Hooks for Chat System
 * 
 * This provides proper caching with automatic invalidation:
 * - Chat list is cached and auto-refreshes
 * - Messages are cached per chat
 * - Sending messages triggers cache updates
 * - No manual cache management needed
 */

// Query Keys - Centralized cache key management
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filters: string) => [...chatKeys.lists(), { filters }] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  messages: (chatId: string) => [...chatKeys.all, 'messages', chatId] as const,
};

/**
 * Hook to get all chats for the current user
 * - Cached for 5 minutes
 * - Auto-refreshes on window focus
 * - Background updates when new messages arrive
 */
export function useChats(chatService: ChatService | null, userId: string | null) {
  return useQuery({
    queryKey: chatKeys.lists(),
    queryFn: async () => {
      if (!chatService) throw new Error('Chat service not available');
      if (!userId) throw new Error('User ID not available');
      console.log('📡 useChats: Fetching chats from database...');
      const result = await chatService.getUserChats(userId);
      if (result.error) throw result.error;
      console.log('📡 useChats: Received chats:', result.chats.length, 'chats');
      // Log timestamps for debugging
      result.chats.forEach(chat => {
        console.log(`  - Chat ${chat.id}: last_message_at = ${chat.last_message_at}`);
      });
      return result.chats;
    },
    enabled: !!chatService && !!userId,
    staleTime: 0, // Always consider data stale - refetch on every invalidation
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
  });
}

/**
 * Hook to get messages for a specific chat
 * - Cached per chat
 * - Shorter cache time for messages (more real-time)
 */
export function useChatMessages(chatService: ChatService | null, chatId: string | null, limit: number = 50) {
  return useQuery({
    queryKey: chatKeys.messages(chatId || ''),
    queryFn: async () => {
      if (!chatService || !chatId) throw new Error('Chat service or chat ID not available');
      const result = await chatService.getChatMessages(chatId, limit);
      if (result.error) throw result.error;
      return result.messages;
    },
    enabled: !!chatService && !!chatId,
    staleTime: 30 * 1000, // 30 seconds for messages (more real-time)
    gcTime: 2 * 60 * 1000, // 2 minutes in cache
  });
}

/**
 * Hook to send a message
 * - Optimistic updates
 * - Auto-refreshes chat list and messages
 */
export function useSendMessage(chatService: ChatService | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      if (!chatService) throw new Error('Chat service not available');
      const result = await chatService.sendMessage(chatId, content);
      if (result.error) throw result.error;
      return result.message;
    },
    onSuccess: (message, { chatId }) => {
      // Invalidate and refetch chat list (to update last message)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      
      // Invalidate and refetch messages for this chat
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
      
      console.log('✅ Message sent, cache updated');
    },
    onError: (error) => {
      console.error('❌ Failed to send message:', error);
    },
  });
}

/**
 * Hook to create a group chat
 * - Auto-refreshes chat list after creation
 */
export function useCreateGroupChat(chatService: ChatService | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, participantIds }: { name: string; participantIds: string[] }) => {
      if (!chatService) throw new Error('Chat service not available');
      const result = await chatService.createGroupChat(name, participantIds);
      if (result.error) throw result.error;
      return result.chat;
    },
    onSuccess: () => {
      // Refresh chat list to show the new group
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      console.log('✅ Group chat created, cache updated');
    },
    onError: (error) => {
      console.error('❌ Failed to create group chat:', error);
    },
  });
}

/**
 * Hook to manually refresh chat data
 * Useful for pull-to-refresh or manual refresh buttons
 */
export function useRefreshChats() {
  const queryClient = useQueryClient();

  return async () => {
    console.log('🔄 Starting chat list refresh...');
    // Invalidate queries first (marks them as stale)
    queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    
    // Force immediate refetch (bypasses cache)
    const result = await queryClient.refetchQueries({ 
      queryKey: chatKeys.lists(),
      type: 'active' // Only refetch active queries
    });
    
    console.log('✅ Chat list refresh complete:', {
      refetched: result.length,
      queries: result.map(r => ({ 
        state: r.state.status,
        dataUpdatedAt: r.dataUpdatedAt 
      }))
    });
  };
}


import { SimpleChat, SimpleMessage } from './types';

