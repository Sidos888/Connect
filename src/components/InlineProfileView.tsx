"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, Share, Images, Settings, Users, ArrowLeft, X, MoreVertical, Trash2, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';
import Avatar from '@/components/Avatar';
import ConnectionsModal from './chat/ConnectionsModal';

interface InlineProfileViewProps {
  userId: string;
  onBack: () => void;
  onStartChat?: (chatId: string) => void;
  onOpenConnections?: (userId: string) => void;
  entryPoint?: 'chat' | 'connections' | 'menu'; // Context for different back behaviors
}

interface UserProfile {
  id: string;
  name: string;
  profile_pic?: string;
  bio?: string;
  phone?: string;
  email?: string;
}

export default function InlineProfileView({ 
  userId, 
  onBack,
  onStartChat,
  onOpenConnections,
  entryPoint = 'connections'
}: InlineProfileViewProps) {
  const { account } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [mutualConnections, setMutualConnections] = useState<any[]>([]);
  const [mutualCount, setMutualCount] = useState(0);

  // Reset profile when userId changes to ensure proper loading behavior
  useEffect(() => {
    setProfile(null);
    setConnectionStatus('none');
    setMutualConnections([]);
    setMutualCount(0);
    setLoading(false);
    setError(null);
  }, [userId]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;

      try {
        // Only show loading on initial load, not when navigating between modals
        if (!profile) {
          setLoading(true);
        }
        setError(null);

        // Get user profile from contacts or accounts table
        const { contacts } = await simpleChatService.getContacts(account?.id || '');
        const userProfile = contacts.find(contact => contact.id === userId);

        if (userProfile) {
          setProfile({
            id: userProfile.id,
            name: userProfile.name,
            profile_pic: userProfile.profile_pic,
            bio: userProfile.bio || 'Bio not available'
          });

          // Load connection status and mutual connections
          if (account?.id) {
            try {
              const { status } = await simpleChatService.getConnectionStatus(account.id, userId);
              setConnectionStatus(status);

              const { count } = await simpleChatService.getMutualConnectionsCount(account.id, userId);
              setMutualCount(count);

              const { connections } = await simpleChatService.getMutualConnections(account.id, userId, 3);
              setMutualConnections(connections);
            } catch (connError) {
              console.error('InlineProfileView: Error loading connection data:', connError);
              // Fallback: if we're viewing a contact, assume they're connected
              if (userProfile) {
                setConnectionStatus('accepted');
              }
            }
          } else {
            // Fallback: if we're viewing a contact, assume they're connected
            if (userProfile) {
              setConnectionStatus('accepted');
            }
          }
        } else {
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
  }, [userId, account?.id]);

  const handleStartChat = async () => {
    if (!userId || !account?.id) return;

    try {
      // Check if direct chat already exists
      const { chat: existingChat } = await simpleChatService.findExistingDirectChat(account.id, userId);
      
      if (existingChat) {
        if (onStartChat) {
          onStartChat(existingChat.id);
        }
        onBack();
      } else {
        // Create new direct chat
        const { chat } = await simpleChatService.createDirectChat(userId, account.id);
        if (chat && onStartChat) {
          onStartChat(chat.id);
          onBack();
        }
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };


  const handleConnectionsClick = () => {
    if (onOpenConnections) {
      onOpenConnections(userId);
    } else {
      setShowConnectionsModal(true);
    }
  };

  const handleRemoveFriend = async () => {
    if (!account?.id || !userId) return;

    try {
      // Remove connection
      const { success, error } = await simpleChatService.removeConnection(account.id, userId);
      
      if (success) {
        // Find and hide any existing chat
        const { chat: existingChat } = await simpleChatService.findExistingDirectChat(account.id, userId);
        if (existingChat) {
          await simpleChatService.hideChat(existingChat.id, account.id);
        }

        // Update UI
        setConnectionStatus('none');
        setMutualConnections([]);
        setMutualCount(0);
        setShowSettingsModal(false);
        setShowRemoveConfirm(false);
        
        // Close the profile modal
        onBack();
      } else {
        console.error('Error removing friend:', error);
      }
    } catch (error) {
      console.error('Error in handleRemoveFriend:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  // Always show the detailed view (universal profile section)
  return (
    <div className="flex flex-col h-full">
      {/* Floating Action Buttons */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 transition-colors rounded-full pointer-events-auto"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 transition-colors rounded-full pointer-events-auto">
          <MoreVertical className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6" style={{ paddingTop: '80px' }}>
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
        <div className="flex space-x-6 justify-center mb-6">
          <button
            onClick={handleStartChat}
            className="flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <MessageCircle className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-medium text-black">Message</span>
          </button>

          <button className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <Share className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-medium text-black">Share</span>
          </button>

          <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <Settings className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-medium text-black">Settings</span>
          </button>
        </div>

        {/* Connection Status */}
        <div 
          className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm cursor-pointer hover:shadow-md hover:bg-white transition-all min-h-[80px] flex flex-col justify-center"
          onClick={handleConnectionsClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4 text-black" />
              </div>
              <span className="text-sm font-medium text-black">
                {connectionStatus === 'accepted' ? 'Me: Friends' : 
                 connectionStatus === 'pending' ? 'Friend Request Sent' : 
                 'Add Friend'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {mutualConnections.length > 0 && (
                <div className="flex -space-x-1">
                  {mutualConnections.slice(0, 3).map((mutual, index) => (
                    <div key={mutual.id} className="w-5 h-5 bg-white border border-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
                      <Avatar
                        src={mutual.profile_pic}
                        name={mutual.name}
                        size={20}
                      />
                    </div>
                  ))}
                </div>
              )}
              {mutualCount > 3 && (
                <span className="text-xs text-black">+{mutualCount - 3}</span>
              )}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-3 mb-4">
          <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-2xl p-4 text-left font-medium hover:shadow-md hover:bg-white transition-all shadow-sm min-h-[80px] flex items-center">
            View Photos
          </button>
          <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-2xl p-4 text-left font-medium hover:shadow-md hover:bg-white transition-all shadow-sm min-h-[80px] flex items-center">
            View Achievements
          </button>
        </div>
      </div>

      {/* Connections Modal */}
      <ConnectionsModal
        isOpen={showConnectionsModal}
        onClose={() => setShowConnectionsModal(false)}
        userId={userId}
        onRemoveFriend={handleRemoveFriend}
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => {
              setShowSettingsModal(false);
              setShowRemoveConfirm(false);
            }}
          />
          <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowRemoveConfirm(false);
                }}
                className="p-2 hover:bg-gray-100 transition-colors rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <div className="w-9"></div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-6">
              {showRemoveConfirm ? (
                <div className="flex-1 flex flex-col justify-center items-center">
                  <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Remove Friend</h3>
                    <p className="text-gray-600 mb-8">
                      Are you sure you want to remove {profile?.name} from your friends? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowRemoveConfirm(false)}
                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRemoveFriend}
                        className="flex-1 px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                      >
                        Remove Friend
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center">
                  {connectionStatus === 'accepted' && (
                    <button
                      onClick={() => setShowRemoveConfirm(true)}
                      className="w-full flex items-center gap-3 px-4 py-4 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <span className="font-medium">Remove Friend</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
