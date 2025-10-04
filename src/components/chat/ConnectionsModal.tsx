"use client";

import React, { useState, useEffect } from 'react';
import { X, MoreVertical, UserPlus, Users, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';
import Avatar from '@/components/Avatar';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onRemoveFriend?: (userId: string) => void;
}

interface UserProfile {
  id: string;
  name: string;
  profile_pic?: string;
  bio?: string;
}

interface Connection {
  id: string;
  name: string;
  profile_pic?: string;
  bio?: string;
  connected_at: string;
}

export default function ConnectionsModal({ isOpen, onClose, userId, onRemoveFriend }: ConnectionsModalProps) {
  const { account } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [following, setFollowing] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'following'>('friends');
  const [showMenu, setShowMenu] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');

  useEffect(() => {
    const loadData = async () => {
      if (!userId || !account?.id || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        // Load user profile
        const { data: profileData, error: profileError } = await simpleChatService.getSupabaseClient()
          .from('accounts')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Load connection status
        const { status } = await simpleChatService.getConnectionStatus(account.id, userId);
        setConnectionStatus(status);

        // Load connections (friends)
        const { connections: friendsData } = await simpleChatService.getUserConnections(userId);
        setConnections(friendsData);

        // Load following (placeholder for now)
        setFollowing([]);

      } catch (err: any) {
        console.error('Error loading connections data:', err);
        setError(err.message || 'Failed to load connections');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, account?.id, isOpen]);

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
        setShowMenu(false);
        
        // Notify parent component
        if (onRemoveFriend) {
          onRemoveFriend(userId);
        }
      } else {
        console.error('Error removing friend:', error);
      }
    } catch (error) {
      console.error('Error in handleRemoveFriend:', error);
    }
  };

  const handleAddFriend = async () => {
    if (!account?.id || !userId) return;

    try {
      const { success, error } = await simpleChatService.addConnection(account.id, userId);
      
      if (success) {
        setConnectionStatus('pending');
      } else {
        console.error('Error adding friend:', error);
      }
    } catch (error) {
      console.error('Error in handleAddFriend:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimming overlay */}
      <div 
        className="fixed inset-0 transition-opacity duration-300 ease-in-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: isOpen ? 1 : 0
        }}
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            >
              <MoreVertical className="w-6 h-6 text-gray-600" />
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {connectionStatus === 'accepted' && (
                    <button
                      onClick={handleRemoveFriend}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Friend
                    </button>
                  )}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
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
          ) : (
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
                <p className="text-gray-600 text-lg mb-4">{profile.bio}</p>
                
                {/* Connection Status */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-black" />
                  </div>
                  <span className="text-black font-medium">
                    {connectionStatus === 'accepted' ? 'Friends' : 
                     connectionStatus === 'pending' ? 'Friend Request Sent' : 
                     'Not Connected'}
                  </span>
                </div>

                {/* Add Friend Button */}
                {connectionStatus === 'none' && (
                  <button
                    onClick={handleAddFriend}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Add Friend
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'friends'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Friends
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'following'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Following
                </button>
              </div>

              {/* Content based on active tab */}
              {activeTab === 'friends' ? (
                <div className="space-y-3">
                  {connections.length > 0 ? (
                    connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <Avatar
                          src={connection.profile_pic}
                          name={connection.name}
                          size={40}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{connection.name}</p>
                          {connection.bio && (
                            <p className="text-sm text-gray-600">{connection.bio}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No friends yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {following.length > 0 ? (
                    following.map((follow) => (
                      <div
                        key={follow.id}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <Avatar
                          src={follow.profile_pic}
                          name={follow.name}
                          size={40}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{follow.name}</p>
                          {follow.bio && (
                            <p className="text-sm text-gray-600">{follow.bio}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Not following anyone yet</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
