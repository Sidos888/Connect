"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { connectionsService, FriendRequest, User as ConnectionUser } from "@/lib/connectionsService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ThreeDotLoadingBounce from "@/components/ThreeDotLoadingBounce";
import { UserPlus, Clock } from "lucide-react";

interface AddPageProps {
  onBack: () => void;
  onOpenFriendRequests: () => void;
}

export default function AddPage({ onBack, onOpenFriendRequests }: AddPageProps) {
  const { account } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'none' | 'pending_sent' | 'pending_received' | 'connected'>>({});

  // Fetch friend requests (incoming)
  const { data: friendRequests = [], isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['friend-requests', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      const { requests, error } = await connectionsService.getPendingRequests(account.id);
      if (error) {
        console.error('Error loading friend requests:', error);
        return [];
      }
      return requests || [];
    },
    enabled: !!account?.id,
    staleTime: 0, // Always refetch
  });

  // Fetch sent requests (outgoing/pending)
  const { data: sentRequests = [], isLoading: isLoadingSentRequests } = useQuery({
    queryKey: ['sent-requests', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      const { requests, error } = await connectionsService.getSentRequests(account.id);
      if (error) {
        console.error('Error loading sent requests:', error);
        return [];
      }
      return requests || [];
    },
    enabled: !!account?.id,
    staleTime: 0,
  });

  // Fetch suggested friends (all accounts user is not friends with)
  const { data: suggestedFriends = [], isLoading: isLoadingSuggested } = useQuery({
    queryKey: ['suggested-friends', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      const { users, error } = await connectionsService.getSuggestedFriends(account.id);
      if (error) {
        console.error('Error loading suggested friends:', error);
        return [];
      }
      return users || [];
    },
    enabled: !!account?.id,
    staleTime: 0,
  });

  // Load connection statuses for suggested friends
  useEffect(() => {
    const loadConnectionStatuses = async () => {
      if (!account?.id || suggestedFriends.length === 0) return;
      
      console.log('Loading connection statuses for', suggestedFriends.length, 'suggested friends');
      const statusPromises = suggestedFriends.map(async (user) => {
        const { status, error } = await connectionsService.getConnectionStatus(account.id, user.id);
        if (error) {
          console.error('Error getting connection status for user', user.id, ':', error);
        }
        return { userId: user.id, status: status || 'none' as const };
      });
      
      const statuses = await Promise.all(statusPromises);
      const statusMap: Record<string, 'none' | 'pending_sent' | 'pending_received' | 'connected'> = {};
      statuses.forEach(({ userId, status }) => {
        statusMap[userId] = status;
      });
      console.log('Loaded connection statuses:', statusMap);
      setConnectionStatuses(prev => ({ ...prev, ...statusMap }));
    };

    loadConnectionStatuses();
  }, [account?.id, suggestedFriends]);


  // Accept friend request
  const handleConfirm = async (request: FriendRequest) => {
    if (!account?.id || !request.id) return;

    try {
      const { error } = await connectionsService.acceptFriendRequest(request.id);
      if (error) {
        console.error('Error accepting friend request:', error);
        return;
      }

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['friend-requests', account.id] });
      queryClient.invalidateQueries({ queryKey: ['connections', account.id] });
      queryClient.invalidateQueries({ queryKey: ['chats', 'list'] });
      
      // Refetch requests
      await refetchRequests();
    } catch (error) {
      console.error('Error in handleConfirm:', error);
    }
  };

  // Delete friend request
  const handleDelete = async (request: FriendRequest) => {
    if (!account?.id || !request.id) return;

    try {
      const { error } = await connectionsService.deleteFriendRequest(request.id);
      if (error) {
        console.error('Error deleting friend request:', error);
        return;
      }

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['friend-requests', account.id] });
      
      // Refetch requests
      await refetchRequests();
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  };

  // Send friend request
  const handleSendFriendRequest = async (userId: string) => {
    if (!account?.id) return;

    // Optimistically update UI immediately for smooth animation
    setConnectionStatuses(prev => ({ ...prev, [userId]: 'pending_sent' }));

    try {
      console.log('Sending friend request to user:', userId);
      const { error } = await connectionsService.sendFriendRequest(account.id, userId);
      if (error) {
        console.error('Error sending friend request:', error);
        // Revert optimistic update on error
        setConnectionStatuses(prev => ({ ...prev, [userId]: 'none' }));
        
        // Show user-friendly error message
        if (error.message?.includes('already friends')) {
          alert('You are already friends with this person');
        } else if (error.message?.includes('already sent')) {
          alert('Friend request already sent');
        } else {
          alert('Failed to send friend request. Please try again.');
        }
        return;
      }

      console.log('Friend request sent successfully to user:', userId);
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['sent-requests', account.id] });
      queryClient.invalidateQueries({ queryKey: ['suggested-friends', account.id] });
    } catch (error) {
      console.error('Error in handleSendFriendRequest:', error);
      // Revert optimistic update on error
      setConnectionStatuses(prev => ({ ...prev, [userId]: 'none' }));
      alert('Failed to send friend request. Please try again.');
    }
  };

  // Cancel friend request (direct, no modal)
  const handleCancelFriendRequest = async (userId: string) => {
    if (!account?.id) return;

    // Optimistically update UI immediately for smooth animation
    setConnectionStatuses(prev => ({ ...prev, [userId]: 'none' }));

    try {
      const { error } = await connectionsService.cancelFriendRequest(account.id, userId);
      if (error) {
        console.error('Error cancelling friend request:', error);
        // Revert optimistic update on error
        setConnectionStatuses(prev => ({ ...prev, [userId]: 'pending_sent' }));
        return;
      }
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['sent-requests', account.id] });
      queryClient.invalidateQueries({ queryKey: ['suggested-friends', account.id] });
    } catch (error) {
      console.error('Error in handleCancelFriendRequest:', error);
      // Revert optimistic update on error
      setConnectionStatuses(prev => ({ ...prev, [userId]: 'pending_sent' }));
    }
  };

  // Display first 5 requests - ensure friendRequests is an array
  const displayedRequests = Array.isArray(friendRequests) ? friendRequests.slice(0, 5) : [];
  const hasMoreRequests = Array.isArray(friendRequests) && friendRequests.length > 5;
  const totalRequestsCount = Array.isArray(friendRequests) ? friendRequests.length : 0;

  return (
    <div className="space-y-6">
      {/* Friend Requests Section - Only show if there are requests or still loading */}
      {(isLoadingRequests || displayedRequests.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Friend Requests</h2>
          
          {isLoadingRequests ? (
            <div className="flex items-center justify-center py-8">
              <ThreeDotLoadingBounce />
            </div>
          ) : displayedRequests.length > 0 ? (
            <div className="space-y-3">
              {displayedRequests.map((request) => {
                const sender = request.sender;
                if (!sender) return null;

                return (
                  <div
                    key={request.id}
                    className="bg-white rounded-2xl p-4 min-h-[70px] transition-all duration-200 hover:-translate-y-[1px] w-full cursor-pointer"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onClick={() => {
                      if (sender.id) {
                        router.push(`/profile?id=${sender.id}&from=add-person`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Profile Picture */}
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {sender.profile_pic ? (
                          <Image
                            src={sender.profile_pic}
                            alt={sender.name || 'User'}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">
                            {sender.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {sender.name || 'Unknown User'}
                        </h3>
                      </div>

                      {/* Confirm and Delete Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleConfirm(request)}
                          className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                          style={{
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleDelete(request)}
                          className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                          style={{
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* View All Card */}
              {hasMoreRequests && (
                <button
                  onClick={onOpenFriendRequests}
                  className="w-full bg-white rounded-2xl p-4 min-h-[70px] transition-all duration-200 hover:-translate-y-[1px] flex items-center justify-between"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <span className="text-sm font-semibold text-gray-900">View All</span>
                  <span className="text-sm font-medium text-gray-600">{totalRequestsCount}</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Pending Requests Section (Outgoing) */}
      {sentRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Pending</h2>
          
          {isLoadingSentRequests ? (
            <div className="flex items-center justify-center py-8">
              <ThreeDotLoadingBounce />
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((request) => {
                const receiver = request.receiver;
                if (!receiver) return null;

                return (
                  <div
                    key={request.id}
                    className="bg-white rounded-2xl p-4 min-h-[70px] transition-all duration-200 hover:-translate-y-[1px] cursor-pointer w-full"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onClick={() => {
                      if (receiver.id) {
                        router.push(`/profile?id=${receiver.id}&from=add-person`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Profile Picture */}
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {receiver.profile_pic ? (
                          <Image
                            src={receiver.profile_pic}
                            alt={receiver.name || 'User'}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">
                            {receiver.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {receiver.name || 'Unknown User'}
                        </h3>
                      </div>

                      {/* Pending Button */}
                      <div className="flex items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleCancelFriendRequest(receiver.id)}
                          className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-2 px-3 text-sm font-semibold text-gray-600 transition-all duration-200 hover:-translate-y-[1px] flex items-center justify-center gap-2"
                          style={{
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          }}
                        >
                          <Clock size={16} className="text-gray-600" strokeWidth={2.5} />
                          <span>Pending</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Suggested Friends Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Suggested Friends</h2>
        
        {isLoadingSuggested ? (
          <div className="flex items-center justify-center py-8">
            <ThreeDotLoadingBounce />
          </div>
        ) : (
          <div className="space-y-3">
            {suggestedFriends.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl p-4 min-h-[70px] transition-all duration-200 hover:-translate-y-[1px] cursor-pointer w-full"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onClick={() => {
                  router.push(`/profile?id=${user.id}&from=add-person`);
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Profile Picture */}
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.profile_pic ? (
                      <Image
                        src={user.profile_pic}
                        alt={user.name || 'User'}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm font-medium">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {user.name || 'Unknown User'}
                    </h3>
                  </div>

                  {/* Add Friend/Pending Button */}
                  <div className="flex items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      const status = connectionStatuses[user.id] || 'none';
                      const isPending = status === 'pending_sent';
                      
                      return isPending ? (
                        <button
                          onClick={() => handleCancelFriendRequest(user.id)}
                          className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-2 px-3 text-sm font-semibold text-gray-600 transition-all duration-200 hover:-translate-y-[1px] flex items-center justify-center gap-2"
                          style={{
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          }}
                        >
                          <Clock size={16} className="text-gray-600" strokeWidth={2.5} />
                          <span>Pending</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(user.id)}
                          className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-2 px-3 text-sm font-semibold text-gray-900 transition-all duration-200 hover:-translate-y-[1px] flex items-center justify-center gap-2"
                          style={{
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          }}
                        >
                          <UserPlus size={16} className="text-gray-900" strokeWidth={2.5} />
                          <span>Add Friend</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}





