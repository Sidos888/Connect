"use client";

import Avatar from "@/components/Avatar";
import { Pencil, Settings, MoreVertical, Users, UserPlus, Link2, Check, MessageCircle, Clock, X, Cake } from "lucide-react";
import { PageHeader } from "@/components/layout/PageSystem";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { connectionsService } from "@/lib/connectionsService";
import { useChatService } from "@/lib/chatProvider";

type Profile = {
  id?: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  profile_visibility?: 'public' | 'private';
  dateOfBirth?: string;
};

export default function ProfilePage({
  profile,
  isOwnProfile = true,
  onClose,
  onEdit,
  onSettings,
  onShare,
  onOpenTimeline,
  onOpenHighlights,
  onOpenBadges,
  onOpenConnections,
  onThreeDotsMenu,
  showBackButton = false,
}: {
  profile: Profile;
  isOwnProfile?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onSettings?: () => void;
  onShare?: () => void;
  onOpenTimeline?: () => void;
  onOpenHighlights?: () => void;
  onOpenBadges?: () => void;
  onOpenConnections?: () => void;
  onThreeDotsMenu?: () => void;
  showBackButton?: boolean;
}) {
  // Selected pill state
  const [selectedPill, setSelectedPill] = useState<'life' | 'highlights' | 'badges'>('life');
  // Platform detection for responsive padding
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [connectionStats, setConnectionStats] = useState({ friends: 0, following: 0, mutuals: 0 });
  const [areFriends, setAreFriends] = useState(false);
  const [mutualFriendsCount, setMutualFriendsCount] = useState(0);
  const [mutualsForFriends, setMutualsForFriends] = useState(0);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const router = useRouter();
  const chatService = useChatService();
  
  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { getSupabaseClient } = await import('@/lib/supabaseClient');
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sending friend request
  const handleSendFriendRequest = async () => {
    if (!currentUserId || !profile?.id || isSendingRequest) return;
    
    setIsSendingRequest(true);
    try {
      const { error } = await connectionsService.sendFriendRequest(currentUserId, profile.id);
      
      if (error) {
        console.error('Error sending friend request:', error);
        alert('Failed to send friend request');
      } else {
        // Update status to pending
        setFriendshipStatus('pending');
      }
    } catch (err) {
      console.error('Error in handleSendFriendRequest:', err);
      alert('Failed to send friend request');
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Handle canceling friend request
  const handleCancelRequest = async () => {
    if (!currentUserId || !profile?.id || isSendingRequest) return;
    
    setIsSendingRequest(true);
    setShowCancelRequestModal(false);
    
    try {
      const { error } = await connectionsService.cancelFriendRequest(currentUserId, profile.id);
      
      if (error) {
        console.error('Error canceling friend request:', error);
        alert('Failed to cancel friend request');
      } else {
        // Update status back to none
        setFriendshipStatus('none');
      }
    } catch (err) {
      console.error('Error in handleCancelRequest:', err);
      alert('Failed to cancel friend request');
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Handle opening/creating DM
  const handleMessageClick = async () => {
    if (!currentUserId || !profile?.id || !chatService) return;
    
    try {
      console.log('Opening/creating chat with user:', profile.id);
      
      // Check if a DM already exists
      const { chats, error: chatsError } = await chatService.getUserChats(currentUserId);
      if (chatsError) {
        console.error('Error loading chats:', chatsError);
        alert('Failed to open chat');
        return;
      }
      
      // Find existing DM with this user
      const existingChat = chats.find(chat => 
        chat.type === 'direct' && 
        chat.participants?.some(p => p.user_id === profile.id)
      );
      
      if (existingChat) {
        // Navigate to existing chat immediately
        console.log('Found existing chat:', existingChat.id);
        router.push(`/chat/individual?chat=${existingChat.id}`);
      } else {
        // Create new chat and navigate immediately
        console.log('Creating new chat with user:', profile.id);
        const { chat, error: createError } = await chatService.createDirectChat(profile.id);
        
        if (createError || !chat) {
          console.error('Failed to create chat:', createError);
          alert('Failed to create chat');
          return;
        }
        
        // Navigate to new chat immediately
        console.log('Created new chat:', chat.id);
        router.push(`/chat/individual?chat=${chat.id}`);
      }
    } catch (error) {
      console.error('Error in handleMessageClick:', error);
      alert('Failed to open chat');
    }
  };

  // Fetch connection stats and friendship status
  useEffect(() => {
    const fetchConnectionStats = async () => {
      console.log('🔍 ProfilePage: Starting connection stats fetch', {
        profileId: profile?.id,
        hasProfile: !!profile,
      });

      if (!profile?.id || !currentUserId) {
        console.log('🔍 ProfilePage: No profile ID or current user ID, skipping fetch');
        return;
      }

      try {
        const { getSupabaseClient } = await import('@/lib/supabaseClient');
        const supabase = getSupabaseClient();
        
        console.log('🔍 ProfilePage: Supabase client available:', !!supabase);
        
        if (!supabase) {
          console.log('🔍 ProfilePage: No Supabase client, aborting');
          return;
        }

        // Check friendship status
        if (!isOwnProfile) {
          const { status: connectionStatus, error: statusError } = await connectionsService.getConnectionStatus(currentUserId, profile.id);
          
          if (!statusError) {
            if (connectionStatus === 'connected') {
              setFriendshipStatus('friends');
              setAreFriends(true);
            } else if (connectionStatus === 'pending_sent') {
              setFriendshipStatus('pending');
            } else {
              setFriendshipStatus('none');
              setAreFriends(false);
            }
          }
        }

        // Get connection stats using SECURITY DEFINER function (bypasses RLS)
        console.log('🔍 ProfilePage: Fetching connection stats for user:', profile.id);
        
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_public_connection_stats', { target_user_id: profile.id });

        console.log('🔍 ProfilePage: Stats result:', {
          data: statsData,
          error: statsError
        });

        if (statsError) {
          console.error('🔍 ProfilePage: Error fetching stats:', statsError);
        }

        const stats = statsData?.[0] || { friends_count: 0, following_count: 0, mutuals_count: 0 };

        // Fetch mutuals count if viewing another user's profile
        let mutualsCount = 0;
        if (!isOwnProfile && currentUserId && profile.id) {
          const { data: mutualsData, error: mutualsError } = await supabase
            .rpc('get_mutual_connections_count', { 
              p_user1_id: currentUserId, 
              p_user2_id: profile.id 
            });

          if (!mutualsError && mutualsData !== null) {
            mutualsCount = mutualsData;
            setMutualsForFriends(mutualsData);
          }
        }

        console.log('🔍 ProfilePage: Setting connection stats:', {
          friends: stats.friends_count,
          following: stats.following_count,
          mutuals: mutualsCount
        });

        setConnectionStats({
          friends: stats.friends_count || 0,
          following: stats.following_count || 0,
          mutuals: mutualsCount
        });
      } catch (error) {
        console.error('🔍 ProfilePage: Error fetching connection stats:', error);
      }
    };

    fetchConnectionStats();
  }, [profile?.id, currentUserId, isOwnProfile]);

  // Check friendship status for private profiles
  useEffect(() => {
    const checkFriendship = async () => {
      if (isOwnProfile || !profile?.id) {
        setAreFriends(true);
        return;
      }

      try {
        const { getSupabaseClient } = await import('@/lib/supabaseClient');
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        // Check if users are friends
        const { data, error } = await supabase
          .from('connections')
          .select('id')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${user.id})`)
          .limit(1);

        const friends = !error && data && data.length > 0;
        setAreFriends(friends);

        if (friends) {
          setFriendshipStatus('friends');
        } else {
          // Check for pending friend requests
          const { data: pendingRequest } = await supabase
            .from('friend_requests')
            .select('id')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
            .eq('status', 'pending')
            .limit(1);

          if (pendingRequest && pendingRequest.length > 0) {
            setFriendshipStatus('pending');
          } else {
            setFriendshipStatus('none');
          }
        }

        // Get mutual friends count for non-friend profiles
        if (!friends && !isOwnProfile) {
          console.log('🔍 ProfilePage: Fetching mutuals count');
          const { data: mutualsData, error: mutualsError } = await supabase
            .rpc('get_mutual_connections_count', { 
              user1_id: user.id, 
              user2_id: profile.id 
            });

          console.log('🔍 ProfilePage: Mutuals result:', {
            data: mutualsData,
            error: mutualsError
          });

          if (!mutualsError && mutualsData !== null) {
            setMutualFriendsCount(mutualsData);
          }
        }
      } catch (error) {
        console.error('Error checking friendship:', error);
      }
    };

    checkFriendship();
  }, [profile?.id, isOwnProfile]);

  // Determine if full profile should be visible
  // Default to private if undefined (safe fallback)
  const isPrivateProfile = !profile?.profile_visibility || profile?.profile_visibility === 'private';
  const showFullProfile = isOwnProfile || !isPrivateProfile || areFriends;

  console.log('🔐 ProfilePage: Visibility check', {
    profileId: profile?.id,
    profileName: profile?.name,
    profileVisibility: profile?.profile_visibility,
    isPrivateProfile,
    isOwnProfile,
    areFriends,
    friendshipStatus,
    showFullProfile
  });

  // Reset scroll position to top whenever component mounts or profile changes
  useEffect(() => {
    if (contentRef.current) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 0);
    }
  }, [profile?.id]);

  // Build action buttons for PageHeader - Link icon only for public/friend profiles
  const actionButtons = showFullProfile ? [
    {
      icon: <Link2 className="h-5 w-5 text-gray-900" strokeWidth={2.5} />,
      onClick: () => {
        console.log('Link button clicked - placeholder');
      },
      label: "Link"
    }
  ] : undefined;

  const contentPaddingTop = isMobile ? '140px' : '104px';

  return (
    <div 
      className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto bg-white lg:rounded-3xl w-full lg:max-w-[680px] lg:w-[680px] h-screen lg:h-[620px] overflow-hidden flex flex-col lg:shadow-2xl transform transition-all duration-300 ease-out scale-100"
      style={{ '--saved-content-padding-top': contentPaddingTop } as React.CSSProperties}
    >
      <PageHeader
        title=""
        backButton
        backIcon={showBackButton ? "arrow" : "close"}
        onBack={onClose}
        actions={actionButtons}
      />

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto lg:overflow-hidden px-4 lg:px-8 pb-8 scrollbar-hide" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-md mx-auto">
          {/* Profile Picture - Top Left Aligned */}
          <div className="flex justify-start mb-4 mt-8">
            <Avatar src={profile?.avatarUrl ?? undefined} name={profile?.name ?? 'User'} size={96} />
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {profile?.name ?? (isOwnProfile ? 'Your Name' : 'User')}
          </h1>

          {/* Bio */}
          {profile?.bio && (
            <p className="text-base text-gray-600 mb-4">{profile.bio}</p>
          )}

          {/* Friends • Following • Mutuals OR Mutuals only for non-friends */}
          {showFullProfile ? (
            <button
              onClick={onOpenConnections}
              className="mb-6 text-sm"
            >
              <span className="font-bold text-gray-900">{connectionStats.friends}</span>
              <span className="text-gray-500"> Friends</span>
              <span className="mx-2 text-gray-500">•</span>
              <span className="font-bold text-gray-900">{connectionStats.following}</span>
              <span className="text-gray-500"> Following</span>
              {!isOwnProfile && connectionStats.mutuals > 0 && (
                <>
                  <span className="mx-2 text-gray-500">•</span>
                  <span className="font-bold text-gray-900">{connectionStats.mutuals}</span>
                  <span className="text-gray-500"> Mutuals</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenConnections}
              className="mb-6 text-sm"
            >
              <span className="font-bold text-gray-900">{mutualFriendsCount}</span>
              <span className="text-gray-500"> Mutuals</span>
            </button>
          )}

          {/* Action Buttons */}
          {isOwnProfile ? (
            <div className="flex gap-2 mb-6">
              <button
                onClick={onEdit}
                className="flex-1 bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-4 text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              >
                Edit Profile
              </button>
              <button
                onClick={onShare}
                className="flex-1 bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-4 text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              >
                Share Profile
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-6">
              {/* Status Button (Add Friend/Pending/Friends) - Always same width */}
              {friendshipStatus === 'friends' ? (
                <button
                  className="flex-1 bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-4 text-sm font-semibold text-gray-900 transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                >
                  <Check size={16} className="text-gray-900" strokeWidth={2.5} />
                  <span>Friends</span>
                </button>
              ) : friendshipStatus === 'pending' ? (
                <button
                  onClick={() => setShowCancelRequestModal(true)}
                  className="flex-1 bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-4 text-sm font-semibold text-gray-600 transition-all duration-200 hover:-translate-y-[1px] flex items-center justify-center gap-2"
                  style={{
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                >
                  <Clock size={16} className="text-gray-600" strokeWidth={2.5} />
                  <span>Pending</span>
                </button>
              ) : (
                <button
                  onClick={handleSendFriendRequest}
                  disabled={isSendingRequest}
                  className="flex-1 bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-4 text-sm font-semibold text-gray-900 transition-all duration-200 hover:-translate-y-[1px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                >
                  <UserPlus size={16} className="text-gray-900" strokeWidth={2.5} />
                  <span>{isSendingRequest ? 'Sending...' : 'Add Friend'}</span>
                </button>
              )}

              {/* Message + More buttons - only show if friends or public */}
              {showFullProfile ? (
                <>
                  <button
                    onClick={handleMessageClick}
                    className="flex-1 bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-4 text-sm font-semibold text-gray-900 transition-all duration-200 hover:-translate-y-[1px] flex items-center justify-center gap-2"
                    style={{
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    }}
                  >
                    <MessageCircle size={16} className="text-gray-900" strokeWidth={2.5} />
                    <span>Message</span>
                  </button>

                  <button
                    className="bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3 px-3 text-sm font-semibold text-gray-900 transition-all duration-200 hover:-translate-y-[1px] flex items-center justify-center"
                    style={{
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      width: '48px',
                    }}
                  >
                    <MoreVertical size={18} className="text-gray-900" strokeWidth={2.5} />
                  </button>
                </>
              ) : (
                <>
                  {/* Invisible placeholders to maintain button width */}
                  <div className="flex-1" />
                  <div style={{ width: '48px' }} />
                </>
              )}
            </div>
          )}

          {/* Grey Line Separator - Only show for public/friend profiles */}
          {showFullProfile && (
            <div className="h-[0.4px] bg-gray-300 mb-6" />
          )}

          {/* Show full profile content only for public/friends */}
          {showFullProfile && (
            <>
          {/* Pills - Life, Highlights, Badges */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 -mx-1" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
              {[
                { id: 'life' as const, label: 'Life', count: 10 },
                { id: 'highlights' as const, label: 'Highlights', count: 10 },
                { id: 'badges' as const, label: 'Badges', count: 10 }
              ].map((pill) => {
                const isActive = selectedPill === pill.id;
                return (
                  <div
                    key={pill.id}
                    className="flex-shrink-0"
                    style={{
                      paddingLeft: isActive ? '2px' : '0',
                      paddingRight: isActive ? '2px' : '0',
                      paddingTop: isActive ? '2px' : '0',
                      paddingBottom: isActive ? '2px' : '0',
                    }}
                  >
                    <button
                      onClick={() => setSelectedPill(pill.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                      style={{
                        minHeight: isActive ? '44px' : '40px',
                        paddingLeft: isActive ? '18px' : '16px',
                        paddingRight: isActive ? '18px' : '16px',
                        paddingTop: isActive ? '12px' : '10px',
                        paddingBottom: isActive ? '12px' : '10px',
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        color: isActive ? '#111827' : '#6B7280',
                        willChange: 'transform, box-shadow',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        e.currentTarget.style.transform = isActive ? 'scale(1.05) translateY(-1px)' : 'scale(1) translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1)';
                      }}
                    >
                      <span className="text-sm font-medium leading-none">{pill.label}</span>
                      {pill.count !== null && (
                        <span
                          className={`ml-2 text-xs leading-none ${
                            isActive ? 'text-neutral-700' : 'text-neutral-500'
                          }`}
                        >
                          {pill.count}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Life Section Content */}
          {selectedPill === 'life' && profile?.dateOfBirth && (
            <div className="space-y-3">
              {/* Born Component */}
              <div className="flex items-center gap-3">
                {/* Circular Date Badge */}
                <div 
                  className="bg-white rounded-full flex flex-col items-center justify-center flex-shrink-0"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    padding: '4px',
                    gap: '0px',
                  }}
                >
                  <div className="text-xs text-gray-900" style={{ fontSize: '8px', lineHeight: '9px', fontWeight: 500 }}>
                    {new Date(profile.dateOfBirth).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                  <div className="text-xl font-bold text-gray-900" style={{ fontSize: '15px', lineHeight: '17px', fontWeight: 700 }}>
                    {new Date(profile.dateOfBirth).getDate()}
                  </div>
                  <div className="text-xs text-gray-500" style={{ fontSize: '7px', lineHeight: '8px', fontWeight: 400 }}>
                    {new Date(profile.dateOfBirth).getFullYear()}
                  </div>
                </div>

                {/* Born Card */}
                <div 
                  className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    height: '64px',
                  }}
                >
                  <Cake size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
                  <span className="text-sm font-medium text-gray-900">Born</span>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other pills */}
          {(selectedPill === 'highlights' || selectedPill === 'badges') && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Content will appear here...</p>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Blur */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
        <div className="absolute bottom-0 left-0 right-0" style={{
          height: '80px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
        }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '20px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '20px', backdropFilter: 'blur(0.3px)', WebkitBackdropFilter: 'blur(0.3px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '40px', height: '20px', backdropFilter: 'blur(0.15px)', WebkitBackdropFilter: 'blur(0.15px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '60px', height: '20px', backdropFilter: 'blur(0.05px)', WebkitBackdropFilter: 'blur(0.05px)' }} />
      </div>

      {/* Cancel Request Modal */}
      {showCancelRequestModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 z-[100]"
            style={{ 
              opacity: 1,
              transition: 'opacity 0.3s ease-in-out'
            }}
            onClick={() => setShowCancelRequestModal(false)}
          />
          
          {/* Modal */}
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white z-[101]"
            style={{
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              maxHeight: '40vh',
              paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Friend Request</h2>
              <button
                onClick={() => setShowCancelRequestModal(false)}
                className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-600" strokeWidth={2.5} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <button
                onClick={handleCancelRequest}
                disabled={isSendingRequest}
                className="w-full bg-white rounded-xl border-[0.4px] border-[#E5E7EB] py-3.5 px-4 text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              >
                {isSendingRequest ? 'Canceling...' : 'Cancel Request'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


