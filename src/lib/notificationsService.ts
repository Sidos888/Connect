import { getSupabaseClient } from './supabaseClient';

/**
 * NotificationsService - Unified service for notification-related operations
 * Handles all notification types: listing invites, friend requests, etc.
 */
export class NotificationsService {
  private supabase = getSupabaseClient();

  /**
   * Get count of unread notifications (all types)
   * Uses last_notifications_page_view_at to determine if user has viewed notifications page
   */
  async getUnreadNotificationsCount(userId: string): Promise<{ count: number; error: Error | null }> {
    if (!this.supabase) {
      return { count: 0, error: new Error('Supabase client not available') };
    }

    try {
      const { data, error } = await this.supabase.rpc('get_unread_notifications_count', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting unread notifications count:', error);
        return { count: 0, error };
      }

      return { count: data || 0, error: null };
    } catch (error) {
      console.error('Error in getUnreadNotificationsCount:', error);
      return { count: 0, error: error as Error };
    }
  }

  /**
   * Mark notifications page as viewed (removes badges from menu and bell icons)
   * Updates user's last_notifications_page_view_at timestamp when notifications page is viewed
   */
  async markNotificationsPageAsViewed(userId: string): Promise<{ error: Error | null }> {
    if (!this.supabase) {
      return { error: new Error('Supabase client not available') };
    }

    try {
      const { error } = await this.supabase.rpc('mark_notifications_page_as_viewed', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error marking notifications page as viewed:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in markNotificationsPageAsViewed:', error);
      return { error: error as Error };
    }
  }

  /**
   * Mark individual listing invite card as opened (for card-level indicators)
   * Updates opened_at timestamp when individual notification card is opened
   */
  async markListingInviteCardOpened(inviteId: string, userId: string): Promise<{ error: Error | null }> {
    if (!this.supabase) {
      return { error: new Error('Supabase client not available') };
    }

    try {
      const { error } = await this.supabase.rpc('mark_listing_invite_card_opened', {
        p_invite_id: inviteId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error marking listing invite card as opened:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in markListingInviteCardOpened:', error);
      return { error: error as Error };
    }
  }

  /**
   * Mark individual friend request card as opened (for card-level indicators)
   * Updates opened_at timestamp when individual notification card is opened
   */
  async markFriendRequestCardOpened(requestId: string, userId: string): Promise<{ error: Error | null }> {
    if (!this.supabase) {
      return { error: new Error('Supabase client not available') };
    }

    try {
      const { error } = await this.supabase.rpc('mark_friend_request_card_opened', {
        p_request_id: requestId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error marking friend request card as opened:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in markFriendRequestCardOpened:', error);
      return { error: error as Error };
    }
  }
}

export const notificationsService = new NotificationsService();

