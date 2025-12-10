"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { listingsService, ListingInvite } from "@/lib/listingsService";
import { connectionsService, FriendRequest } from "@/lib/connectionsService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import ListingCard from "@/components/listings/ListingCard";
import { useMarkNotificationsPageAsViewed } from "@/lib/notificationsQueries";
import Loading8 from "@/components/Loading8";

/**
 * Notifications - Unified component for Notifications page
 * Used by both mobile route and web modal
 */
export default function Notifications() {
  const router = useRouter();
  const { account } = useAuth();
  const queryClient = useQueryClient();

  // Mark notifications page as viewed when component loads (removes badges from menu and bell icons)
  const markNotificationsPageAsViewed = useMarkNotificationsPageAsViewed();
  useEffect(() => {
    if (account?.id) {
      markNotificationsPageAsViewed.mutate(account.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]); // Only run once when component loads

  // Fetch listing invitations
  const { data: invitesData, isLoading } = useQuery({
    queryKey: ['listing-invites', account?.id],
    queryFn: async () => {
      if (!account?.id) return { invites: [], error: null };
      return await listingsService.getListingInvites(account.id);
    },
    enabled: !!account?.id,
    staleTime: 30 * 1000,
  });

  // Fetch pending friend requests
  const { data: friendRequestsData, isLoading: isLoadingFriendRequests } = useQuery({
    queryKey: ['friend-requests', account?.id],
    queryFn: async () => {
      if (!account?.id) return { requests: [], error: null };
      return await connectionsService.getPendingRequests(account.id);
    },
    enabled: !!account?.id,
    staleTime: 30 * 1000,
  });

  const invites = invitesData?.invites || [];
  const friendRequests = friendRequestsData?.requests || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatListingDateTime = (dateString: string | null) => {
    if (!dateString) return "Date and Time";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Date and Time";
    }
  };

  const handleAccept = async (invite: ListingInvite) => {
    if (!account?.id) return;

    const { success, error } = await listingsService.acceptListingInvite(invite.id, account.id);
    
    if (success) {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['listing-invites', account.id] });
      queryClient.invalidateQueries({ queryKey: ['listing-participant'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
    } else {
      console.error('Error accepting invite:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const handleDecline = async (invite: ListingInvite, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!account?.id) return;

    const { success, error } = await listingsService.declineListingInvite(invite.id, account.id);
    
    if (success) {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['listing-invites', account.id] });
    } else {
      console.error('Error declining invite:', error);
      alert('Failed to decline invitation. Please try again.');
    }
  };

  const handleCardClick = (invite: ListingInvite) => {
    // Navigate to listing page with return path to notifications
    const returnPath = encodeURIComponent('/notifications');
    router.push(`/listing?id=${invite.listing_id}&from=${returnPath}`);
  };

  const handleFriendRequestCardClick = () => {
    // Navigate to add person page with return path to notifications
    const returnPath = encodeURIComponent('/notifications');
    router.push(`/menu?view=add-person&from=${returnPath}`);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* Notifications Section */}
      <div className="mb-6">
        {isLoading || isLoadingFriendRequests ? (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-white">
            <Loading8 />
          </div>
        ) : friendRequests.length === 0 && invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-500 text-lg">No notifications :)</p>
          </div>
        ) : (
          <>
            {/* Friend Requests Section - Only show if there are friend requests */}
            {friendRequests.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Friend requests</h3>
                <div className="mb-6">
                  <div
                    onClick={handleFriendRequestCardClick}
                    className="bg-white rounded-2xl border border-gray-200 transition-all duration-200 hover:-translate-y-[1px] cursor-pointer relative"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                      backgroundColor: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                  >
                    <div className="flex items-center justify-between" style={{ padding: '16px' }}>
                      <p className="text-sm text-gray-900">
                        {friendRequests[0]?.sender?.name || 'Unknown'}
                        {friendRequests.length > 1 && (
                          <span className="text-gray-500"> +{friendRequests.length - 1} {friendRequests.length === 2 ? 'other' : 'others'}</span>
                        )}
                      </p>
                    </div>
                    {/* Red dot indicator - always shown if there are friend requests (on the right side) */}
                    <div
                      className="absolute rounded-full bg-red-500 flex-shrink-0"
                      style={{
                        width: '12px',
                        height: '12px',
                        top: '12px',
                        right: '12px',
                        boxShadow: '0 0 0 1px rgba(255, 255, 255, 1)',
                        zIndex: 10
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Recent Section */}
            {invites.length > 0 && (
          <>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Recent</h3>
        <div className="space-y-3">
            {invites.map((invite) => {
              if (!invite.listing || !invite.inviter) return null;

              return (
            <div
                  key={invite.id}
                  className="relative mb-6"
                >
                  <div
                    onClick={() => handleCardClick(invite)}
                    className="bg-white rounded-2xl border border-gray-200 transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                      backgroundColor: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                  >
                    <div className="flex items-center gap-3" style={{ padding: '16px' }}>
                      {/* Listing Image - Squared with even spacing */}
                      <div 
                        className="bg-gray-200 rounded-lg overflow-hidden flex-shrink-0"
                        style={{
                          width: '96px',
                          height: '96px',
                          borderWidth: '0.5px',
                          borderStyle: 'solid',
                          borderColor: 'rgba(0, 0, 0, 0.08)'
                        }}
                      >
                        {invite.listing.photo_urls && invite.listing.photo_urls.length > 0 ? (
                          <Image
                            src={invite.listing.photo_urls[0]}
                            alt={invite.listing.title}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400 text-sm font-semibold">
                              {invite.listing.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content - Vertically Centered */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {/* First line: (name) invited you to */}
                        <p className="text-sm text-gray-900 mb-1">
                          <span className="font-semibold">{invite.inviter.name}</span> invited you to
                        </p>
                        
                        {/* Second line: (listing name) (listing date and time) */}
                        <p className="text-sm text-gray-900 mb-3">
                          <span className="font-semibold">{invite.listing.title}</span>{" "}
                          <span className="text-gray-500">{formatListingDateTime(invite.listing.start_date)}</span>
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(invite);
                            }}
                            className="flex-1 px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
                            style={{
                              borderWidth: '0.4px',
                              borderColor: '#E5E7EB',
                              borderStyle: 'solid',
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
                            Accept
                          </button>
                          <button
                            onClick={(e) => handleDecline(invite, e)}
                            className="flex-1 px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
                            style={{
                              borderWidth: '0.4px',
                              borderColor: '#E5E7EB',
                              borderStyle: 'solid',
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
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp - Outside the card, bottom right, below the card */}
                  <div className="absolute" style={{ bottom: '-20px', right: '0' }}>
                    <span className="text-xs text-gray-500 font-medium">{formatTime(invite.created_at)}</span>
                  </div>
                </div>
              );
            })}
                </div>
              </>
            )}
          </>
                )}
      </div>
    </div>
  );

}

