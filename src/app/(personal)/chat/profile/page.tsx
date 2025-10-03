"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";
import { ArrowLeft, MessageCircle, Share, Edit, UserPlus, Trash2, Settings, Images } from "lucide-react";
import { ChevronLeftIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";

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

  const isGroupProfile = !!chatId;
  const isUserProfile = !!userId;

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
              avatarUrl: chat.avatarUrl,
              created_by: chat.created_by,
              participants: chat.participants.map(p => ({
                id: p.id,
                name: p.name,
                profile_pic: p.profile_pic,
                connect_id: p.connect_id,
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

  const isAdmin = account?.id === groupProfile?.created_by;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
        <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <button
            onClick={() => router.back()}
            className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Go back"
          >
            <span className="back-btn-circle">
              <ChevronLeftIcon className="h-5 w-5" />
            </span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>
            {isGroupProfile ? 'Group Info' : 'Profile'}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8">
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
          <>
            {/* Profile Card Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <Avatar
                    src={userProfile.profile_pic}
                    name={userProfile.name}
                    size={120}
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{userProfile.name}</h3>
                <p className="text-gray-600 mb-4">{userProfile.bio}</p>
                
                <button className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-200 transition-colors text-sm font-medium">
                  View Profile
                </button>
              </div>
            </div>

            {/* Action Buttons - Circular Card Style */}
            <div className="flex space-x-6 justify-center mb-8">
              {/* Message Button */}
              <button
                onClick={handleStartChat}
                className="flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center hover:shadow-md hover:border-gray-300 transition-all duration-200">
                  <MessageCircle className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Message</span>
              </button>

              {/* Share Profile Button */}
              <button className="flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 hover:scale-105">
                <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center hover:shadow-md hover:border-gray-300 transition-all duration-200">
                  <Share className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Share</span>
              </button>
            </div>

            {/* Media Section */}
            <div className="mb-4">
              <button className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm">
                <Images className="w-5 h-5" />
                View Media
              </button>
            </div>

            {/* Settings Section */}
            <div>
              <button className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm">
                <Settings className="w-5 h-5" />
                Chat Settings
              </button>
            </div>
          </>
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
    </div>
  );
}
