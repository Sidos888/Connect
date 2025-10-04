"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, MoreVertical, Share, MessageCircle, Settings, Images, UserPlus, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';
import Avatar from '@/components/Avatar';
import ConnectionsModal from './ConnectionsModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onStartChat: (chatId: string) => void;
}

interface UserProfile {
  id: string;
  name: string;
  profile_pic?: string;
  bio?: string;
  phone?: string;
  email?: string;
}

export default function UserProfileModal({ isOpen, onClose, userId, onStartChat }: UserProfileModalProps) {
  const { account } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [mutualConnections, setMutualConnections] = useState<any[]>([]);
  const [mutualCount, setMutualCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId || !isOpen) return;

      console.log('UserProfileModal: Loading profile for userId:', userId);
      console.log('UserProfileModal: isOpen:', isOpen);
      console.log('UserProfileModal: account?.id:', account?.id);

      try {
        setLoading(true);
        setError(null);

        // Get user profile from contacts or accounts table
        const { contacts } = await simpleChatService.getContacts(account?.id || '');
        const userProfile = contacts.find(contact => contact.id === userId);

        if (userProfile) {
          console.log('UserProfileModal: Found profile:', userProfile);
          setProfile({
            id: userProfile.id,
            name: userProfile.name,
            profile_pic: userProfile.profile_pic,
            bio: userProfile.bio || 'Bio not available'
          });

          // Load connection status and mutual connections
          if (account?.id) {
            console.log('UserProfileModal: Loading connection data for:', account.id, 'and', userId);
            
            try {
              const { status } = await simpleChatService.getConnectionStatus(account.id, userId);
              console.log('UserProfileModal: Connection status:', status);
              setConnectionStatus(status);

              const { count } = await simpleChatService.getMutualConnectionsCount(account.id, userId);
              console.log('UserProfileModal: Mutual count:', count);
              setMutualCount(count);

              const { connections } = await simpleChatService.getMutualConnections(account.id, userId, 3);
              console.log('UserProfileModal: Mutual connections:', connections);
              setMutualConnections(connections);
            } catch (connError) {
              console.error('UserProfileModal: Error loading connection data:', connError);
              // Fallback: if we're viewing a contact, assume they're connected
              if (userProfile) {
                setConnectionStatus('accepted');
              }
            }
          } else {
            console.log('UserProfileModal: No account ID available, skipping connection data');
            // Fallback: if we're viewing a contact, assume they're connected
            if (userProfile) {
              setConnectionStatus('accepted');
            }
          }
        } else {
          console.log('UserProfileModal: Profile not found');
          setError('User profile not found');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, isOpen, account?.id]);

  const handleStartChat = async () => {
    if (!userId || !account?.id) return;

    try {
      // Check if direct chat already exists
      const { chat: existingChat } = await simpleChatService.findExistingDirectChat(account.id, userId);
      
      if (existingChat) {
        onStartChat(existingChat.id);
        onClose();
      } else {
        // Create new direct chat
        const { chat } = await simpleChatService.createDirectChat(userId, account.id);
        if (chat) {
          onStartChat(chat.id);
          onClose();
        }
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleViewProfile = () => {
    console.log('View Profile clicked!');
    console.log('Current showDetailedView:', showDetailedView);
    console.log('Profile:', profile);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimming overlay with smooth transition */}
      <div 
        className="fixed inset-0 transition-opacity duration-300 ease-in-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: isOpen ? 1 : 0
        }}
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
        {/* Floating Action Buttons */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {showDetailedView && (
              <button
                onClick={handleBackToSummary}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white/80 backdrop-blur-sm shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white/80 backdrop-blur-sm pointer-events-auto shadow-sm"
          >
            {showDetailedView ? (
              <MoreVertical className="w-6 h-6 text-gray-600" />
            ) : (
              <X className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : error || !profile ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : showDetailedView ? (
            /* Detailed Profile View - Inside Same Modal */
            <>
              {/* Profile Header */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-6">
                  <Avatar
                    src={profile.profile_pic}
                    name={profile.name}
                    size={140}
                  />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">{profile.name}</h3>
                <p className="text-gray-600 text-lg">{profile.bio}</p>
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
            /* Summary Profile View */
            <>
              {/* Profile Card Section */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar
                      src={profile.profile_pic}
                      name={profile.name}
                      size={120}
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h3>
                  <p className="text-gray-600 mb-4">{profile.bio}</p>
                  
                  <button 
                    onClick={(e) => {
                      console.log('Button clicked!', e);
                      handleViewProfile();
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors text-sm font-medium shadow-md"
                  >
                    View Profile
                  </button>
                </div>
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
          )}
        </div>
      </div>

      {/* Connections Modal */}
      <ConnectionsModal
        isOpen={showConnectionsModal}
        onClose={() => setShowConnectionsModal(false)}
        userId={userId}
        onRemoveFriend={handleRemoveFriend}
      />
    </div>
  );
}
