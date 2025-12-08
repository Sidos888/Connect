import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
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
      console.log('🔵 useChats: Fetching chats', { userId });
      if (!chatService) throw new Error('Chat service not available');
      if (!userId) throw new Error('User ID not available');
      const result = await chatService.getUserChats(userId);
      if (result.error) throw result.error;
      console.log('🔵 useChats: Fetched chats', { 
        count: result.chats.length,
        unreadCounts: result.chats.map(c => ({ id: c.id, unread_count: c.unread_count }))
      });
      return result.chats;
    },
    enabled: !!chatService && !!userId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent loops
    refetchOnMount: true, // Refetch on mount if data is stale (after invalidation)
  });
}

/**
 * Hook to get a specific chat by ID
 * - Cached for 2 minutes
 * - Eliminates duplicate fetches when navigating between desktop/mobile views
 * - Automatically shares cache between ChatLayout and individual chat page
 */
export function useChatById(chatService: ChatService | null, chatId: string | null) {
  return useQuery({
    queryKey: chatKeys.detail(chatId || ''),
    queryFn: async () => {
      if (!chatService || !chatId) throw new Error('Chat service or chat ID not available');
      const result = await chatService.getChatById(chatId);
      if (result.error) throw result.error;
      return result.chat;
    },
    enabled: !!chatService && !!chatId,
    staleTime: 2 * 60 * 1000, // 2 minutes - chat details don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
    },
  });
}

/**
 * Hook to manually refresh chat data
 * Useful for pull-to-refresh or manual refresh buttons
 * Returns a stable function reference to prevent unnecessary re-renders
 */
export function useRefreshChats() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    // Invalidate queries first (marks them as stale)
    queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    
    // Force immediate refetch (bypasses cache)
    await queryClient.refetchQueries({ 
      queryKey: chatKeys.lists(),
      type: 'active' // Only refetch active queries
    });
  }, [queryClient]);
}

/**
 * Hook to get unread chats count (for badge display)
 * - Cached for 30 seconds
 * - Auto-refreshes periodically
 * - Used to show badge on chats icon
 */
export function useUnreadChatsCount(chatService: ChatService | null, userId: string | null) {
  return useQuery({
    queryKey: ['unread-chats-count', userId],
    queryFn: async () => {
      if (!chatService) throw new Error('Chat service not available');
      if (!userId) throw new Error('User ID not available');
      const result = await chatService.getUnreadChatsCount(userId);
      if (result.error) throw result.error;
      return result.count;
    },
    enabled: !!chatService && !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes in cache
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
}

/**
 * Hook to mark inbox as viewed (removes badge from chats icon)
 * - Invalidates unread count query
 * - Called when chats page is opened
 */
export function useMarkInboxAsViewed(chatService: ChatService | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!chatService) throw new Error('Chat service not available');
      const result = await chatService.markInboxAsViewed(userId);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (_, userId) => {
      // Invalidate unread count to update badge
      queryClient.invalidateQueries({ queryKey: ['unread-chats-count', userId] });
    },
  });
}

/**
 * Hook to mark messages as read
 * - Invalidates chat list to update unread counts on chat cards
 * - Invalidates unread count query to update badge
 * - Called when user opens a chat
 */
export function useMarkMessagesAsRead(chatService: ChatService | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, userId }: { chatId: string; userId: string }) => {
      console.log('🔵 useMarkMessagesAsRead: Mutation called', { chatId, userId });
      if (!chatService) throw new Error('Chat service not available');
      const result = await chatService.markMessagesAsRead(chatId, userId);
      if (result.error) throw result.error;
      console.log('🔵 useMarkMessagesAsRead: Mutation completed successfully');
      return result;
    },
    onSuccess: async (_, { userId }) => {
      console.log('🔵 useMarkMessagesAsRead: onSuccess called, invalidating queries', { userId });
      
      // Invalidate chat list query (marks as stale)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      console.log('🔵 useMarkMessagesAsRead: Invalidated chat list query');
      
      // Force immediate refetch of chat list regardless of active status
      // This ensures the data is fresh when user navigates back
      await queryClient.refetchQueries({ 
        queryKey: chatKeys.lists(),
        type: 'all' // Refetch all matching queries, not just active ones
      });
      console.log('🔵 useMarkMessagesAsRead: Refetched chat list query');
      
      // Invalidate unread count to update badge
      queryClient.invalidateQueries({ queryKey: ['unread-chats-count', userId] });
      console.log('🔵 useMarkMessagesAsRead: Invalidated unread count query');
    },
    onError: (error) => {
      console.error('🔵 useMarkMessagesAsRead: Mutation error', error);
    },
  });
}

