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
      console.log('🔍 ConnectionsService: Searching users with query:', query, 'for user:', currentUserId);
      console.log('🔍 ConnectionsService: Supabase client available:', !!this.supabase);
      
      if (!query.trim()) {
        return { users: [], error: null };
      }

      // First, let's test if we can query the accounts table at all
      console.log('🔍 ConnectionsService: Testing basic accounts query...');
      const { data: testData, error: testError } = await this.supabase
        .from('accounts')
        .select('id, name')
        .limit(5);
      
      console.log('🔍 ConnectionsService: Test query result:', { testData, testError });

      if (testError) {
        console.error('🔍 ConnectionsService: Basic accounts query failed:', testError);
        return { users: [], error: testError };
      }

      // Build query - search by name and exclude current user
      let queryBuilder = this.supabase
        .from('accounts')
        .select('id, name, bio, profile_pic, connect_id, created_at')
        .ilike('name', `%${query.trim()}%`)
        .limit(50); // Increased limit for better search results

      // Only exclude current user if we have a valid ID
      if (currentUserId && currentUserId !== '') {
        queryBuilder = queryBuilder.neq('id', currentUserId);
      }

      const { data: nameResults, error: nameError } = await queryBuilder;

      console.log('🔍 ConnectionsService: Name search results:', { 
        query: query.trim(),
        resultsCount: nameResults?.length || 0, 
        error: nameError,
        sampleResults: nameResults?.slice(0, 3).map(u => ({ id: u.id, name: u.name }))
      });

      if (nameError) {
        console.error('🔍 ConnectionsService: Error searching users by name:', nameError);
        return { users: [], error: nameError };
      }

      // Filter out users who already have pending or accepted connections
      let filteredUsers = nameResults || [];
      if (currentUserId && currentUserId !== '') {
        try {
          // Get pending requests and existing connections to filter out
          const { requests: pendingRequests } = await this.getPendingRequests(currentUserId);
          const { requests: sentRequests } = await this.getSentRequests(currentUserId);
          const { connections: existingConnections } = await this.getConnections(currentUserId);
          
          const excludedUserIds = new Set([
            ...pendingRequests.map(r => r.sender?.id).filter(Boolean),
            ...sentRequests.map(r => r.receiver?.id).filter(Boolean),
            ...existingConnections.map(c => c.user1_id === currentUserId ? c.user2_id : c.user1_id)
          ]);
          
          filteredUsers = filteredUsers.filter(user => !excludedUserIds.has(user.id));
          
          console.log('🔍 ConnectionsService: Filtered search results:', {
            originalCount: nameResults?.length || 0,
            filteredCount: filteredUsers.length,
            excludedCount: (nameResults?.length || 0) - filteredUsers.length,
            excludedUserIds: Array.from(excludedUserIds)
          });
        } catch (filterError) {
          console.error('🔍 ConnectionsService: Error filtering search results:', filterError);
          // Continue with unfiltered results if filtering fails
        }
      }

      console.log('🔍 ConnectionsService: Final search results:', filteredUsers.length, 'users');
      return { users: filteredUsers, error: null };
    } catch (error) {
      console.error('🔍 ConnectionsService: Error in searchUsers:', error);
      return { users: [], error: error as Error };
    }
  }

  // Get suggested friends (all users except current user)
  async getSuggestedFriends(currentUserId: string): Promise<{ users: User[]; error: Error | null }> {
    try {
      console.log('🔍 ConnectionsService: Getting suggested friends for user:', currentUserId);
      console.log('🔍 ConnectionsService: Supabase client available:', !!this.supabase);
      
      // First, let's test if we can query the accounts table at all
      console.log('🔍 ConnectionsService: Testing basic accounts query for suggestions...');
      const { data: testData, error: testError } = await this.supabase
        .from('accounts')
        .select('id, name')
        .limit(5);
      
      console.log('🔍 ConnectionsService: Test query result for suggestions:', { testData, testError });
      
      if (testError) {
        console.error('🔍 ConnectionsService: Basic accounts query failed:', testError);
        return { users: [], error: testError };
      }

      // Build query - exclude current user and already connected users
      let queryBuilder = this.supabase
        .from('accounts')
        .select('id, name, bio, profile_pic, connect_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50); // Increased limit to get more suggestions

      // Only exclude current user if we have a valid ID
      if (currentUserId && currentUserId !== '') {
        queryBuilder = queryBuilder.neq('id', currentUserId);
        
        // Also exclude users who already have pending/accepted friend requests
        // This requires a more complex query, but for now we'll filter in memory
      }

      const { data, error } = await queryBuilder;

      console.log('🔍 ConnectionsService: Raw suggested friends query result:', { 
        dataCount: data?.length || 0, 
        error,
        sampleUsers: data?.slice(0, 3).map(u => ({ id: u.id, name: u.name }))
      });

      if (error) {
        console.error('🔍 ConnectionsService: Error getting suggested friends:', error);
        return { users: [], error };
      }

      // Filter out users who already have pending or accepted connections
      let filteredUsers = data || [];
      if (currentUserId && currentUserId !== '') {
        try {
          // Get pending requests
          const { requests: pendingRequests } = await this.getPendingRequests(currentUserId);
          const { requests: sentRequests } = await this.getSentRequests(currentUserId);
          const { connections: existingConnections } = await this.getConnections(currentUserId);
          
          const excludedUserIds = new Set([
            ...pendingRequests.map(r => r.sender?.id).filter(Boolean),
            ...sentRequests.map(r => r.receiver?.id).filter(Boolean),
            ...existingConnections.map(c => c.user1_id === currentUserId ? c.user2_id : c.user1_id)
          ]);
          
          filteredUsers = filteredUsers.filter(user => !excludedUserIds.has(user.id));
          
          console.log('🔍 ConnectionsService: Filtered suggested friends:', {
            originalCount: data?.length || 0,
            filteredCount: filteredUsers.length,
            excludedCount: (data?.length || 0) - filteredUsers.length,
            excludedUserIds: Array.from(excludedUserIds)
          });
        } catch (filterError) {
          console.error('🔍 ConnectionsService: Error filtering suggested friends:', filterError);
          // Continue with unfiltered results if filtering fails
        }
      }

      console.log('🔍 ConnectionsService: Successfully got suggested friends:', filteredUsers.length, 'users');
      return { users: filteredUsers, error: null };
    } catch (error) {
      console.error('🔍 ConnectionsService: Error in getSuggestedFriends:', error);
      return { users: [], error: error as Error };
    }
  }

  // Send friend request
  async sendFriendRequest(senderId: string, receiverId: string): Promise<{ error: Error | null }> {
    try {
      console.log('ConnectionsService: Sending friend request from', senderId, 'to', receiverId);
      
      // First check if users are already connected
      const { connected } = await this.areConnected(senderId, receiverId);
      if (connected) {
        console.log('Users are already connected');
        return { error: new Error('Users are already friends') };
      }

      // Check if a pending request already exists
      const { exists } = await this.hasPendingRequest(senderId, receiverId);
      if (exists) {
        console.log('Friend request already exists');
        return { error: new Error('Friend request already sent') };
      }
      
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

  // Cancel friend request (delete pending request)
  async cancelFriendRequest(senderId: string, receiverId: string): Promise<{ error: Error | null }> {
    try {
      console.log('🔍 ConnectionsService: Cancelling friend request from', senderId, 'to', receiverId);
      
      const { data, error } = await this.supabase
        .from('friend_requests')
        .delete()
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .eq('status', 'pending')
        .select(); // Add .select() to get deleted data for debugging

      console.log('🔍 ConnectionsService: Delete operation result:', { data, error });

      if (error) {
        console.error('🔍 ConnectionsService: Error cancelling friend request:', error);
        console.error('🔍 ConnectionsService: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { error };
      }

      console.log('🔍 ConnectionsService: Friend request cancelled successfully, deleted records:', data);
      return { error: null };
    } catch (error) {
      console.error('🔍 ConnectionsService: Error in cancelFriendRequest:', error);
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

  // Get connection status between two users
  async getConnectionStatus(currentUserId: string, otherUserId: string): Promise<{ status: 'none' | 'pending_sent' | 'pending_received' | 'connected'; error: Error | null }> {
    try {
      console.log('Getting connection status between:', currentUserId, 'and', otherUserId);
      
      // Check if already connected
      const { connected, error: connectionError } = await this.areConnected(currentUserId, otherUserId);
      if (connectionError) {
        console.error('Error checking connection:', connectionError);
        return { status: 'none', error: connectionError };
      }

      if (connected) {
        console.log('Users are already connected');
        return { status: 'connected', error: null };
      }

      // Check for pending request from current user to other user
      const { data: sentRequestData, error: sentRequestError } = await this.supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', currentUserId)
        .eq('receiver_id', otherUserId)
        .eq('status', 'pending')
        .single();

      if (sentRequestError && sentRequestError.code !== 'PGRST116') {
        console.error('Error checking sent request:', sentRequestError);
        return { status: 'none', error: sentRequestError };
      }

      if (sentRequestData) {
        console.log('Friend request already sent');
        return { status: 'pending_sent', error: null };
      }

      // Check for pending request from other user to current user
      const { data: receivedRequestData, error: receivedRequestError } = await this.supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', otherUserId)
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending')
        .single();

      if (receivedRequestError && receivedRequestError.code !== 'PGRST116') {
        console.error('Error checking received request:', receivedRequestError);
        return { status: 'none', error: receivedRequestError };
      }

      if (receivedRequestData) {
        console.log('Friend request received from user');
        return { status: 'pending_received', error: null };
      }

      console.log('No existing connection or request');
      return { status: 'none', error: null };
    } catch (error) {
      console.error('Error in getConnectionStatus:', error);
      return { status: 'none', error: error as Error };
    }
  }

  // Remove friend (delete connection)
  async removeFriend(currentUserId: string, friendId: string): Promise<{ error: Error | null }> {
    try {
      console.log('ConnectionsService: Removing friend connection between', currentUserId, 'and', friendId);
      
      const { data, error } = await this.supabase
        .from('connections')
        .delete()
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${currentUserId})`)
        .select();

      console.log('Remove friend result:', { data, error });

      if (error) {
        console.error('Error removing friend:', error);
        return { error };
      }

      console.log('Friend removed successfully:', data);
      return { error: null };
    } catch (error) {
      console.error('Error in removeFriend:', error);
      return { error: error as Error };
    }
  }
}

export const connectionsService = new ConnectionsService();
