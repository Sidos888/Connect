import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from './notificationsService';

/**
 * React Query Hooks for Notification System
 * 
 * Provides proper caching with automatic invalidation:
 * - Unread count is cached and auto-refreshes
 * - Marking as viewed invalidates cache
 * - Real-time subscriptions can update cache
 */

/**
 * Hook to get unread notifications count (for badge display)
 * - Cached for 30 seconds
 * - Auto-refreshes periodically
 * - Used to show badge on menu and bell icons
 */
export function useUnreadNotificationsCount(userId: string | null) {
  return useQuery({
    queryKey: ['unread-notifications-count', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID not available');
      const result = await notificationsService.getUnreadNotificationsCount(userId);
      if (result.error) throw result.error;
      return result.count;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes in cache
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
}

/**
 * Hook to mark notifications page as viewed (removes badges from menu and bell icons)
 * - Invalidates unread count query
 * - Called when notifications page is opened
 */
export function useMarkNotificationsPageAsViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await notificationsService.markNotificationsPageAsViewed(userId);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (_, userId) => {
      // Invalidate unread count to update badges
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', userId] });
      // Also invalidate listing invites and friend requests queries
      queryClient.invalidateQueries({ queryKey: ['listing-invites', userId] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests', userId] });
    },
  });
}

/**
 * Hook to mark listing invite card as opened (for card-level indicators)
 * - Optional: Used to show red circles on individual cards
 */
export function useMarkListingInviteCardOpened() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteId, userId }: { inviteId: string; userId: string }) => {
      const result = await notificationsService.markListingInviteCardOpened(inviteId, userId);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (_, { userId }) => {
      // Invalidate listing invites to update card indicators
      queryClient.invalidateQueries({ queryKey: ['listing-invites', userId] });
    },
  });
}

/**
 * Hook to mark friend request card as opened (for card-level indicators)
 * - Optional: Used to show red circles on individual cards
 */
export function useMarkFriendRequestCardOpened() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, userId }: { requestId: string; userId: string }) => {
      const result = await notificationsService.markFriendRequestCardOpened(requestId, userId);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (_, { userId }) => {
      // Invalidate friend requests to update card indicators
      queryClient.invalidateQueries({ queryKey: ['friend-requests', userId] });
    },
  });
}

