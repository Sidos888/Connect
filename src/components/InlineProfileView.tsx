"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, Share, Images, Settings, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';
import Avatar from '@/components/Avatar';
import ConnectionsModal from './chat/ConnectionsModal';

interface InlineProfileViewProps {
  userId: string;
  onBack: () => void;
  onStartChat?: (chatId: string) => void;
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
  onStartChat
}: InlineProfileViewProps) {
  const { account } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [mutualConnections, setMutualConnections] = useState<any[]>([]);
  const [mutualCount, setMutualCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
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
    setShowConnectionsModal(true);
  };

  const handleRemoveFriend = (removedUserId: string) => {
    // Update connection status
    setConnectionStatus('none');
    setMutualConnections([]);
    setMutualCount(0);
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
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 transition-colors rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <div className="w-16"></div> {/* Spacer for centering */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Profile Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <Avatar
              src={profile.profile_pic}
              name={profile.name}
              size={120}
            />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h3>
          <p className="text-gray-600 text-sm">{profile.bio}</p>
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
              <Users className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-medium text-black">Invite</span>
          </button>

          <button className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
              <Share className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-medium text-black">Share</span>
          </button>
        </div>

        {/* Connection Status */}
        <div 
          className="bg-white border border-gray-200 rounded-xl p-3 mb-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
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
          <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-lg p-3 text-left font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm">
            View Photos
          </button>
          <button className="w-full bg-white border border-gray-200 text-gray-700 rounded-lg p-3 text-left font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm">
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
    </div>
  );
}
