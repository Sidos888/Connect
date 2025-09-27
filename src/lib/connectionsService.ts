import { getSupabaseClient } from './supabaseClient';

export interface User {
  id: string;
  name: string;
  bio?: string;
  profile_pic?: string;
  connect_id?: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
}

export interface Connection {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user1?: User;
  user2?: User;
}

export class ConnectionsService {
  private supabase = getSupabaseClient();

  // Search for users by name only
  async searchUsers(query: string, currentUserId: string): Promise<{ users: User[]; error: Error | null }> {
    try {
      console.log('Searching users with query:', query, 'for user:', currentUserId);
      
      if (!query.trim()) {
        return { users: [], error: null };
      }

      // Build query - exclude current user only if we have a valid currentUserId
      let queryBuilder = this.supabase
        .from('accounts')
        .select('id, name, bio, profile_pic, connect_id, created_at')
        .ilike('name', `%${query}%`)
        .limit(20);

      // Only exclude current user if we have a valid ID
      if (currentUserId && currentUserId !== '') {
        queryBuilder = queryBuilder.neq('id', currentUserId);
      }

      const { data: nameResults, error: nameError } = await queryBuilder;

      console.log('Name search results:', { nameResults, nameError });

      if (nameError) {
        console.error('Error searching users by name:', nameError);
        return { users: [], error: nameError };
      }

      console.log('Final search results:', nameResults?.length || 0, 'users');
      return { users: nameResults || [], error: null };
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return { users: [], error: error as Error };
    }
  }

  // Get suggested friends (all users except current user)
  async getSuggestedFriends(currentUserId: string): Promise<{ users: User[]; error: Error | null }> {
    try {
      console.log('Getting suggested friends for user:', currentUserId);
      
      // Build query - exclude current user only if we have a valid currentUserId
      let queryBuilder = this.supabase
        .from('accounts')
        .select('id, name, bio, profile_pic, connect_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      // Only exclude current user if we have a valid ID
      if (currentUserId && currentUserId !== '') {
        queryBuilder = queryBuilder.neq('id', currentUserId);
      }

      const { data, error } = await queryBuilder;

      console.log('Suggested friends query result:', { data, error });

      if (error) {
        console.error('Error getting suggested friends:', error);
        return { users: [], error };
      }

      console.log('Successfully got suggested friends:', data?.length || 0, 'users');
      return { users: data || [], error: null };
    } catch (error) {
      console.error('Error in getSuggestedFriends:', error);
      return { users: [], error: error as Error };
    }
  }

  // Send friend request
  async sendFriendRequest(senderId: string, receiverId: string): Promise<{ error: Error | null }> {
    try {
      console.log('ConnectionsService: Sending friend request from', senderId, 'to', receiverId);
      
      const { data, error } = await this.supabase
        .from('friend_requests')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          status: 'pending'
        })
        .select();

      console.log('Friend request insert result:', { data, error });

      if (error) {
        console.error('Error sending friend request:', error);
        return { error };
      }

      console.log('Friend request sent successfully:', data);
      return { error: null };
    } catch (error) {
      console.error('Error in sendFriendRequest:', error);
      return { error: error as Error };
    }
  }

  // Accept friend request
  async acceptFriendRequest(requestId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting friend request:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in acceptFriendRequest:', error);
      return { error: error as Error };
    }
  }

  // Reject friend request
  async rejectFriendRequest(requestId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting friend request:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in rejectFriendRequest:', error);
      return { error: error as Error };
    }
  }

  // Get pending friend requests (received)
  async getPendingRequests(userId: string): Promise<{ requests: FriendRequest[]; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('friend_requests')
        .select(`
          id, sender_id, receiver_id, status, created_at, updated_at,
          sender:accounts!sender_id(id, name, bio, profile_pic, connect_id, created_at)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting pending requests:', error);
        return { requests: [], error };
      }

      return { requests: data || [], error: null };
    } catch (error) {
      console.error('Error in getPendingRequests:', error);
      return { requests: [], error: error as Error };
    }
  }

  // Get sent friend requests
  async getSentRequests(userId: string): Promise<{ requests: FriendRequest[]; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('friend_requests')
        .select(`
          id, sender_id, receiver_id, status, created_at, updated_at,
          receiver:accounts!receiver_id(id, name, bio, profile_pic, connect_id, created_at)
        `)
        .eq('sender_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting sent requests:', error);
        return { requests: [], error };
      }

      return { requests: data || [], error: null };
    } catch (error) {
      console.error('Error in getSentRequests:', error);
      return { requests: [], error: error as Error };
    }
  }

  // Get connections (friends)
  async getConnections(userId: string): Promise<{ connections: Connection[]; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('connections')
        .select(`
          id, user1_id, user2_id, created_at,
          user1:accounts!user1_id(id, name, bio, profile_pic, connect_id, created_at),
          user2:accounts!user2_id(id, name, bio, profile_pic, connect_id, created_at)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting connections:', error);
        return { connections: [], error };
      }

      return { connections: data || [], error: null };
    } catch (error) {
      console.error('Error in getConnections:', error);
      return { connections: [], error: error as Error };
    }
  }

  // Check if users are connected
  async areConnected(user1Id: string, user2Id: string): Promise<{ connected: boolean; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('connections')
        .select('id')
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .limit(1);

      if (error) {
        console.error('Error checking connection:', error);
        return { connected: false, error };
      }

      return { connected: (data && data.length > 0), error: null };
    } catch (error) {
      console.error('Error in areConnected:', error);
      return { connected: false, error: error as Error };
    }
  }

  // Check if friend request exists
  async hasPendingRequest(senderId: string, receiverId: string): Promise<{ exists: boolean; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('friend_requests')
        .select('id')
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .eq('status', 'pending')
        .limit(1);

      if (error) {
        console.error('Error checking friend request:', error);
        return { exists: false, error };
      }

      return { exists: (data && data.length > 0), error: null };
    } catch (error) {
      console.error('Error in hasPendingRequest:', error);
      return { exists: false, error: error as Error };
    }
  }
}

export const connectionsService = new ConnectionsService();
