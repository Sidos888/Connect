"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";
import { ArrowLeft, MessageCircle, Share, Edit, UserPlus, Trash2, Settings, Images, Users, MoreVertical } from "lucide-react";
import { ChevronLeftIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";
import ConnectionsModal from "@/components/chat/ConnectionsModal";

interface UserProfile {
  id: string;
  name: string;
  profile_pic?: string;
  bio?: string;
  phone?: string;
  email?: string;
}

interface GroupProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  created_by: string;
  participants: Array<{
    id: string;
    name: string;
    profile_pic?: string;
    connect_id?: string;
  }>;
  bio?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const chatId = searchParams.get('chatId');
  const { account } = useAuth();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [groupProfile, setGroupProfile] = useState<GroupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(true);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [mutualConnections, setMutualConnections] = useState<any[]>([]);
  const [mutualCount, setMutualCount] = useState(0);

  const isGroupProfile = !!chatId;
  const isUserProfile = !!userId;

  console.log('Profile page loaded:', { userId, chatId, isUserProfile, isGroupProfile });

  // Hide bottom nav on mobile profile page
  useEffect(() => {
    const hideBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
        (bottomNav as HTMLElement).style.visibility = 'hidden';
        (bottomNav as HTMLElement).style.opacity = '0';
        (bottomNav as HTMLElement).style.transform = 'translateY(100%)';
      }
      document.body.style.paddingBottom = '0';
    };

    const showBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
        (bottomNav as HTMLElement).style.visibility = '';
        (bottomNav as HTMLElement).style.opacity = '';
        (bottomNav as HTMLElement).style.transform = '';
      }
      document.body.style.paddingBottom = '';
    };
    
    hideBottomNav();
    
    return () => {
      showBottomNav();
    };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!account?.id) return;

      try {
        setLoading(true);
        setError(null);

        if (isUserProfile && userId) {
          // Load user profile
          const { contacts } = await simpleChatService.getContacts(account.id);
          const userData = contacts.find(contact => contact.id === userId);

          if (userData) {
            setUserProfile({
              id: userData.id,
              name: userData.name,
              profile_pic: userData.profile_pic,
              bio: userData.bio || 'Bio not available'
            });

            // Load connection status and mutual connections
            try {
              const { status } = await simpleChatService.getConnectionStatus(account.id, userId);
              setConnectionStatus(status);

              const { count } = await simpleChatService.getMutualConnectionsCount(account.id, userId);
              setMutualCount(count);

              const { connections } = await simpleChatService.getMutualConnections(account.id, userId, 3);
              setMutualConnections(connections);
            } catch (connError) {
              console.error('Profile page: Error loading connection data:', connError);
              // Fallback: if we're viewing a contact, assume they're connected
              setConnectionStatus('accepted');
            }
          } else {
            setError('User profile not found');
          }
        } else if (isGroupProfile && chatId) {
          // Load group profile
          const { chat, error: chatError } = await simpleChatService.getChatById(chatId);

          if (chat && !chatError) {
            setGroupProfile({
              id: chat.id,
              name: chat.name || 'Group Chat',
              avatarUrl: (chat as any).avatarUrl,
              created_by: (chat as any).created_by,
              participants: chat.participants.map(p => ({
                id: p.id,
                name: p.name,
                profile_pic: p.profile_pic,
                connect_id: (p as any).connect_id,
              })),
            });
          } else {
            setError(chatError?.message || 'Group chat not found');
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, chatId, account?.id, isUserProfile, isGroupProfile]);

  const handleStartChat = async () => {
    if (!userId || !account?.id) return;

    try {
      // Check if direct chat already exists
      const { chat: existingChat } = await simpleChatService.findExistingDirectChat(account.id, userId);
      
      if (existingChat) {
        router.push(`/chat/individual?chat=${existingChat.id}`);
      } else {
        // Create new direct chat
        const { chat } = await simpleChatService.createDirectChat(userId, account.id);
        if (chat) {
          router.push(`/chat/individual?chat=${chat.id}`);
        }
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleParticipantClick = (participantId: string) => {
    router.push(`/chat/profile?userId=${participantId}`);
  };

  const handleViewProfile = () => {
    console.log('View Profile clicked!');
    console.log('Current showDetailedView:', showDetailedView);
    console.log('UserProfile:', userProfile);
    setShowDetailedView(true);
  };

  const handleBackToSummary = () => {
    setShowDetailedView(false);
  };

  const handleConnectionsClick = () => {
    setShowConnectionsModal(true);
  };

  const handleRemoveFriend = (removedUserId: string) => {
    // Update connection status
    setConnectionStatus('none');
    setMutualConnections([]);
    setMutualCount(0);
  };

  const isAdmin = account?.id === groupProfile?.created_by;

  return (
    <div className="h-screen flex flex-col bg-white relative">
      {/* Floating Action Buttons */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={showDetailedView ? handleBackToSummary : () => router.back()}
            className="p-2 hover:bg-gray-100 transition-colors rounded-full"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            {isGroupProfile ? 'Group Info' : userProfile?.name || 'Profile'}
          </h1>
        </div>
        {isUserProfile && userProfile && (
          <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={() => { /* handle menu for detailed view */ }} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MoreVertical className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : error || (!userProfile && !groupProfile) ? (
          <div className="text-center text-gray-600">
            <p>{error || 'Profile data not available.'}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mt-4"
            >
              Go Back
            </button>
          </div>
        ) : isUserProfile && userProfile ? (
          showDetailedView ? (
            /* Detailed Profile View */
            <>
              {/* Profile Header */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-6">
                  <Avatar
                    src={userProfile.profile_pic}
                    name={userProfile.name}
                    size={140}
                  />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">{userProfile.name}</h3>
                <p className="text-gray-600 text-lg">{userProfile.bio}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-8 justify-center mb-8">
                <button
                  onClick={handleStartChat}
                  className="flex flex-col items-center space-y-3"
                >
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-8 h-8 text-black" />
                  </div>
                  <span className="text-sm font-medium text-black">Message</span>
                </button>

                <button className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <UserPlus className="w-8 h-8 text-black" />
                  </div>
                  <span className="text-sm font-medium text-black">Invite</span>
                </button>

                <button className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <Share className="w-8 h-8 text-black" />
                  </div>
                  <span className="text-sm font-medium text-black">Share</span>
                </button>
              </div>

              {/* Connection Status */}
              <div 
                className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleConnectionsClick}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <Users className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-black font-medium">
                      {connectionStatus === 'accepted' ? 'Me: Friends' : 
                       connectionStatus === 'pending' ? 'Friend Request Sent' : 
                       'Add Friend'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {mutualConnections.length > 0 && (
                      <div className="flex -space-x-2">
                        {mutualConnections.slice(0, 3).map((mutual, index) => (
                          <div key={mutual.id} className="w-6 h-6 bg-white border border-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
                            <Avatar
                              src={mutual.profile_pic}
                              name={mutual.name}
                              size={24}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {mutualCount > 3 && (
                      <span className="text-black text-sm">+{mutualCount - 3}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Sections */}
              <div className="space-y-4">
                <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl p-4 text-left font-medium hover:bg-gray-50 transition-colors shadow-sm">
                  View Photos
                </button>
                <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl p-4 text-left font-medium hover:bg-gray-50 transition-colors shadow-sm">
                  View Achievements
                </button>
              </div>
            </>
          ) : (
            /* Summary Profile View - Not used since we always show detailed view */
            <></>
          )
        ) : isGroupProfile && groupProfile ? (
          <>
            {/* Group Profile Section */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <Avatar
                  src={groupProfile.avatarUrl}
                  name={groupProfile.name}
                  size={140}
                />
                {isAdmin && (
                  <button className="absolute bottom-0 right-0 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">{groupProfile.name}</h3>
              {isAdmin && (
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mx-auto mt-4">
                  <Edit className="w-4 h-4" />
                  Edit Group Name
                </button>
              )}
            </div>

            {/* Participants Section */}
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Participants ({groupProfile.participants.length})</h4>
              <div className="space-y-4">
                {groupProfile.participants.map((participant) => (
                  <button
                    key={participant.id}
                    onClick={() => handleParticipantClick(participant.id)}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors w-full text-left"
                  >
                    <Avatar
                      src={participant.profile_pic}
                      name={participant.name}
                      size={50}
                    />
                    <div>
                      <p className="font-medium text-gray-900 text-lg">{participant.name}</p>
                      <p className="text-sm text-gray-500">@{participant.connect_id}</p>
                    </div>
                  </button>
                ))}
              </div>
              {isAdmin && (
                <button className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium text-lg mt-6 w-full justify-center shadow-lg">
                  <UserPlus className="w-5 h-5" />
                  Add Participants
                </button>
              )}
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="border-t border-gray-100 pt-8">
                <button className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium text-lg w-full justify-center shadow-lg">
                  <Trash2 className="w-5 h-5" />
                  Delete Group
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Connections Modal */}
      {isUserProfile && userProfile && (
        <ConnectionsModal
          isOpen={showConnectionsModal}
          onClose={() => setShowConnectionsModal(false)}
          userId={userProfile.id}
          onRemoveFriend={handleRemoveFriend}
        />
      )}
    </div>
  );
}
