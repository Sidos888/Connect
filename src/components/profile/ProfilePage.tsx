"use client";

import Avatar from "@/components/Avatar";
import { Pencil, Settings, MoreVertical, Users, UserPlus, Link, Check, MessageCircle, Clock, X, Cake, ChevronRight, Calendar, UserCheck, GraduationCap, Briefcase, Heart, Home, Sparkles, MoreHorizontal, Share } from "lucide-react";
import Image from "next/image";
import { PageHeader } from "@/components/layout/PageSystem";
import ProfileTopActions from "@/components/layout/ProfileTopActions";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { connectionsService } from "@/lib/connectionsService";
import { useChatService } from "@/lib/chatProvider";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Profile = {
  id?: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  profile_visibility?: 'public' | 'private';
  dateOfBirth?: string;
  createdAt?: string;
  connectId?: string; // For compatibility
  connect_id?: string; // From database
};

// Helper to get category icon
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'education':
      return <GraduationCap size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    case 'career':
      return <Briefcase size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    case 'relationships':
      return <Heart size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    case 'life-changes':
      return <Home size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    case 'experiences':
      return <Sparkles size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    default:
      return <MoreHorizontal size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
  }
};

// Helper to get moment type label
const getMomentTypeLabel = (momentType: string): string => {
  const labelMap: Record<string, string> = {
    'preschool': 'Preschool',
    'primary-school': 'Primary School',
    'high-school': 'High School',
    'university-tafe': 'University/Tafe',
    'course-certificate': 'Course / Certificate',
    'first-job': 'First Job',
    'new-job': 'New Job',
    'promotion': 'Promotion',
    'business-started': 'Business Started',
    'relationship-started': 'Relationship Started',
    'engagement': 'Engagement',
    'marriage': 'Marriage',
    'child-born': 'Child Born',
    'moved-house': 'Moved House',
    'bought-home': 'Bought a Home',
    'major-transition': 'Major Transition',
    'major-trip': 'Major Trip',
    'big-achievement': 'Big Achievement',
    'important-memory': 'Important Memory',
    'personal-milestone': 'Personal Milestone',
    'custom-moment': 'Custom Moment'
  };
  
  return labelMap[momentType] || momentType;
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
  onOpenFullLife,
  onOpenHighlightDetail,
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
  onOpenFullLife?: () => void;
  onOpenHighlightDetail?: (highlightId: string) => void;
  onThreeDotsMenu?: () => void;
  showBackButton?: boolean;
}) {
  // Immediately clear body padding on mount to prevent whitespace issues
  useEffect(() => {
    document.body.style.paddingBottom = '0';
    return () => {
      // Cleanup will be handled by parent component
    };
  }, []);

  // Selected pill state
  const [selectedPill, setSelectedPill] = useState<'life' | 'highlights' | 'badges'>('life');
  const [customMomentsCount, setCustomMomentsCount] = useState(0);
  const [customMomentsPreview, setCustomMomentsPreview] = useState<any[]>([]);
  const [loadingMoments, setLoadingMoments] = useState(true);

  // Fetch custom moments for preview and count
  useEffect(() => {
    const fetchMoments = async () => {
      if (!profile?.id) {
        setLoadingMoments(false);
        return;
      }
      
      const supabase = await import('@/lib/supabaseClient').then(m => m.getSupabaseClient());
      
      if (!supabase) {
        setLoadingMoments(false);
        return;
      }
      
      // Fetch all moments for count and preview
      const { data, error, count } = await supabase
        .from('user_moments')
        .select('*', { count: 'exact' })
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false })
        .limit(10); // Fetch more than we need for preview

      if (!error) {
        if (count !== null) {
          setCustomMomentsCount(count);
        }
        setCustomMomentsPreview(data || []);
      }
      
      setLoadingMoments(false);
    };

    fetchMoments();
  }, [profile?.id]);

  // Fetch highlights for the profile user
  useEffect(() => {
    const fetchHighlights = async () => {
      if (!profile?.id) {
        setLoadingHighlights(false);
        return;
      }

      try {
        setLoadingHighlights(true);
        const supabase = getSupabaseClient();
        if (!supabase) {
          setLoadingHighlights(false);
          return;
        }

        // Fetch highlights with count
        const { data, error: fetchError, count } = await supabase
          .from('user_highlights')
          .select('*', { count: 'exact' })
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(8); // Limit to 8 for preview grid (2 rows of 4)

        if (fetchError) {
          throw fetchError;
        }

        setHighlights(data || []);
        if (count !== null) {
          setHighlightsCount(count);
        }
      } catch (err: any) {
        console.error('Error loading highlights:', err);
        setHighlights([]);
        setHighlightsCount(0);
      } finally {
        setLoadingHighlights(false);
      }
    };

    fetchHighlights();
  }, [profile?.id]);
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
  const [hasLinks, setHasLinks] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [loadingHighlights, setLoadingHighlights] = useState(true);
  const router = useRouter();
  const chatService = useChatService();
  
  // Determine if full profile should be visible (calculate early to avoid uninitialized variable error)
  // Default to private if undefined (safe fallback)
  const isPrivateProfile = !profile?.profile_visibility || profile?.profile_visibility === 'private';
  const showFullProfile = isOwnProfile || !isPrivateProfile || areFriends;
  
  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { getSupabaseClient } = await import('@/lib/supabaseClient');
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Check if user has links (only for other users' profiles)
  // For own profile, always show link button (users need to add/view their links)
  // Use LinksService to match the same query pattern used by the Links component
  // Only check when profile is fully visible (showFullProfile) to avoid RLS issues
  useEffect(() => {
    const checkUserLinks = async () => {
      if (isOwnProfile) {
        // Own profile: always show link button (users need to manage their links)
        setHasLinks(true);
        setLoadingLinks(false);
        return;
      }

      if (!profile?.id || !showFullProfile) {
        // Don't check links if profile isn't fully visible yet (might be private)
        setLoadingLinks(false);
        setHasLinks(false);
        return;
      }

      try {
        setLoadingLinks(true);
        const { LinksService } = await import('@/lib/linksService');
        const linksService = new LinksService();
        
        console.log('🔗 ProfilePage: Checking links for user:', profile.id);
        const { links, error } = await linksService.getUserLinks(profile.id);

        console.log('🔗 ProfilePage: Links query result:', { 
          links, 
          error, 
          hasLinks: !!links, 
          linksLength: links?.length,
          profileId: profile.id,
          showFullProfile,
          linksArray: links ? JSON.stringify(links) : 'null'
        });

        // Also try a direct query to verify RLS isn't silently blocking
        if (!error && (!links || links.length === 0)) {
          const { getSupabaseClient } = await import('@/lib/supabaseClient');
          const supabase = getSupabaseClient();
          if (supabase) {
            const { data: directData, error: directError, count } = await supabase
              .from('user_links')
              .select('*', { count: 'exact' })
              .eq('user_id', profile.id);
          
            console.log('🔗 ProfilePage: Direct query check:', {
              directData,
              directError,
              count,
              hasDirectData: !!directData,
              directDataLength: directData?.length
            });
          }
        }

        if (error) {
          console.error('🔗 ProfilePage: Error querying links:', error);
          // If RLS blocks the query, we can't determine if links exist
          // Default to not showing link button if we can't check
          setHasLinks(false);
        } else if (links && links.length > 0) {
          console.log('🔗 ProfilePage: User has links, showing link button');
          setHasLinks(true);
        } else {
          console.log('🔗 ProfilePage: User has no links');
          setHasLinks(false);
        }
      } catch (error) {
        console.error('🔗 ProfilePage: Exception checking user links:', error);
        setHasLinks(false);
      } finally {
        setLoadingLinks(false);
      }
    };

    checkUserLinks();
  }, [profile?.id, isOwnProfile, showFullProfile, areFriends, profile?.profile_visibility]);
  
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

  // Build action buttons for PageHeader
  // For own profile: always show link button (users need to add/view their links)
  // For other users: show share button always, link button only if they have links
  // When both share and link buttons are present, use ProfileTopActions component
  const { actionButtons, customActions } = useMemo(() => {
    if (!showFullProfile) {
      return { actionButtons: undefined, customActions: undefined };
    }

    if (isOwnProfile) {
      // Own profile: always show link button (single button)
      return {
        actionButtons: [{
          icon: <Link className="h-5 w-5 text-gray-900" strokeWidth={2.5} />,
      onClick: () => {
            router.push('/links');
      },
      label: "Link"
        }],
        customActions: undefined
      };
    } else {
      // Other users' profiles
      const shareButton = {
        icon: <Share className="h-5 w-5 text-gray-900" strokeWidth={2.5} />,
        onClick: () => {
          // Navigate to share profile page with current full URL (including query params) as 'from' parameter
          // This ensures we can navigate back to the exact page the user came from
          const currentUrl = typeof window !== 'undefined' 
            ? `${window.location.pathname}${window.location.search}`
            : '';
          const fromParam = currentUrl ? `&from=${encodeURIComponent(currentUrl)}` : '';
          const profileConnectId = profile?.connect_id || profile?.connectId;
          
          if (profile?.id) {
            router.push(`/profile/share?id=${profile.id}${profileConnectId ? `&connectId=${profileConnectId}` : ''}${fromParam}`);
          } else if (profileConnectId) {
            router.push(`/profile/share?connectId=${profileConnectId}${fromParam}`);
          }
        },
        label: "Share"
      };

      // If user has links, show both buttons in shared component
      if (hasLinks && !loadingLinks) {
        return {
          actionButtons: undefined,
          customActions: (
            <ProfileTopActions
              onShareClick={shareButton.onClick}
              onLinkClick={() => {
                if (profile?.id) {
                  router.push(`/links?userId=${profile.id}`);
                }
              }}
            />
          )
        };
      } else {
        // Only share button (single button)
        return {
          actionButtons: [shareButton],
          customActions: undefined
        };
      }
    }
  }, [isOwnProfile, showFullProfile, hasLinks, loadingLinks, profile?.id, router]);

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
        customActions={customActions}
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
          {/* Pills - Timeline, Highlights, Badges */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 -mx-1" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
              {[
                { 
                  id: 'life' as const, 
                  label: 'Timeline', 
                  count: (() => {
                    let count = 1; // Today always exists
                    if (profile?.createdAt) count++;
                    if (profile?.dateOfBirth) count++;
                    count += customMomentsCount; // Add custom moments
                    return count;
                  })()
                },
                { id: 'highlights' as const, label: 'Highlights', count: highlightsCount },
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
          {selectedPill === 'life' && (
            <div className="space-y-3">
              {/* Moments Title */}
          <button 
                onClick={onOpenFullLife}
                className="flex items-center gap-1 mb-4"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  {(() => {
                    let count = isOwnProfile ? 1 : 0; // Today only for own profile
                    if (profile?.createdAt) count++;
                    if (profile?.dateOfBirth) count++;
                    count += customMomentsCount; // Add custom moments
                    return count;
                  })()} Moments
                </h3>
                <ChevronRight size={20} className="text-gray-400" strokeWidth={2} />
              </button>

              {/* Moments Preview (Max 5) */}
              {(() => {
                // Group all moments
                const allMoments: Array<{ date: Date; type: string; data: any }> = [];
                
                // Add Today only for own profile
                if (isOwnProfile) {
                  allMoments.push({ 
                    date: new Date(), 
                    type: 'today', 
                    data: null 
                  });
                }
                
                // Add custom moments
                customMomentsPreview.forEach(moment => {
                  allMoments.push({
                    date: new Date(moment.start_date),
                    type: 'custom',
                    data: moment
                  });
                });
                
                // Add Joined Connect
                if (profile?.createdAt) {
                  allMoments.push({
                    date: new Date(profile.createdAt),
                    type: 'joined',
                    data: null
                  });
                }
                
                // Add Born
                if (profile?.dateOfBirth) {
                  allMoments.push({
                    date: new Date(profile.dateOfBirth),
                    type: 'born',
                    data: null
                  });
                }
                
                // Sort by date (newest first) and take first 5
                allMoments.sort((a, b) => b.date.getTime() - a.date.getTime());
                const previewMoments = allMoments.slice(0, 5);
                
                return previewMoments.map((moment, index) => {
                  const momentDate = moment.date;
                  
                  if (moment.type === 'today') {
                    // Today Moment
                    return (
                      <div key="today" className="flex items-center gap-3">
                        <div 
                          className="bg-white rounded-full flex flex-col items-center justify-center flex-shrink-0"
                          style={{
                            width: '48px',
                            height: '48px',
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            padding: '4px',
                            gap: '1px',
                          }}
                        >
                          <div className="text-xs text-gray-900" style={{ fontSize: '9px', lineHeight: '11px', fontWeight: 500 }}>
                            {momentDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                          </div>
                          <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
                            {momentDate.getDate()}
                          </div>
                        </div>
                        <div 
                          className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
                          style={{
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            minHeight: '80px',
                          }}
                        >
                          <Calendar size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Today</span>
                            <span className="text-xs text-gray-500 mt-0.5">
                              {momentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  if (moment.type === 'joined') {
                    // Joined Connect Moment
                    return (
                      <div key="joined" className="flex items-center gap-3">
                        <div 
                          className="bg-white rounded-full flex flex-col items-center justify-center flex-shrink-0"
                          style={{
                            width: '48px',
                            height: '48px',
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            padding: '4px',
                            gap: '1px',
                          }}
                        >
                          <div className="text-xs text-gray-900" style={{ fontSize: '9px', lineHeight: '11px', fontWeight: 500 }}>
                            {momentDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                          </div>
                          <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
                            {momentDate.getDate()}
                          </div>
                        </div>
                        <div 
                          className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
                          style={{
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            minHeight: '80px',
                          }}
                        >
                          <UserCheck size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Joined Connect</span>
                            <span className="text-xs text-gray-500 mt-0.5">
                              {momentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  if (moment.type === 'born') {
                    // Born Moment
                    return (
                      <div key="born" className="flex items-center gap-3">
                        <div 
                          className="bg-white rounded-full flex flex-col items-center justify-center flex-shrink-0"
                          style={{
                            width: '48px',
                            height: '48px',
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            padding: '4px',
                            gap: '1px',
                          }}
                        >
                          <div className="text-xs text-gray-900" style={{ fontSize: '9px', lineHeight: '11px', fontWeight: 500 }}>
                            {momentDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                          </div>
                          <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
                            {momentDate.getDate()}
                          </div>
                        </div>
                        <div 
                          className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ 
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            minHeight: '80px',
                          }}
                        >
                          <Cake size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Born</span>
                            <span className="text-xs text-gray-500 mt-0.5">
                              {momentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Custom Moment
                  const customData = moment.data;
                  return (
                    <div key={`custom-${index}`} className="flex items-center gap-3">
                      <div 
                        className="bg-white rounded-full flex flex-col items-center justify-center flex-shrink-0"
                        style={{
                          width: '48px',
                          height: '48px',
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          padding: '4px',
                          gap: '1px',
                        }}
                      >
                        <div className="text-xs text-gray-900" style={{ fontSize: '9px', lineHeight: '11px', fontWeight: 500 }}>
                          {momentDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </div>
                        <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
                          {momentDate.getDate()}
                        </div>
                      </div>
                      <div 
                        className="flex-1 bg-white rounded-xl px-4 py-3"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          minHeight: '80px',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getCategoryIcon(customData.category)}
                              <span className="text-xs text-gray-500">
                                {getMomentTypeLabel(customData.moment_type)}
                              </span>
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {customData.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {momentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {customData.end_date && ` - ${new Date(customData.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                            </p>
                          </div>
                          {customData.photos && customData.photos.length > 0 && (
                            <div className="flex-shrink-0">
                              {customData.photos.length === 1 ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden">
                                  <Image
                                    src={customData.photos[0]}
                                    alt=""
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-0.5 w-16 h-16 rounded-lg overflow-hidden">
                                  {customData.photos.slice(0, 4).map((photo: string, photoIndex: number) => (
                                    <div key={photoIndex} className="w-full h-full">
                                      <Image
                                        src={photo}
                                        alt=""
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* Highlights Section Content */}
          {selectedPill === 'highlights' && (
            <div className="space-y-3">
              {/* Highlights Title */}
              <button 
                onClick={onOpenHighlights}
                className="flex items-center gap-1 mb-4"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  {highlightsCount} Highlights
                </h3>
                <ChevronRight size={20} className="text-gray-400" strokeWidth={2} />
              </button>

              {/* Highlights Grid */}
              {loadingHighlights ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-400 text-sm">Loading highlights...</p>
                </div>
              ) : highlights.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">No highlights yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {highlights.map((highlight) => (
                    <button
                      key={highlight.id}
                      onClick={() => {
                        if (onOpenHighlightDetail) {
                          onOpenHighlightDetail(highlight.id);
                        }
                      }}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:opacity-90"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                      }}
                    >
                      {highlight.image_url ? (
                        <img 
                          src={highlight.image_url} 
                          alt={highlight.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-xs">{highlight.title}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Placeholder for badges */}
          {selectedPill === 'badges' && (
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


