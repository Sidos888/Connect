"use client";

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';
import Avatar from '@/components/Avatar';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onRemoveFriend?: (userId: string) => void;
  onBack?: () => void;
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

export default function ConnectionsModal({ isOpen, onClose, userId, onRemoveFriend, onBack }: ConnectionsModalProps) {
  const { account } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [following, setFollowing] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'following'>('friends');

  // Reset profile when userId changes to ensure proper loading behavior
  useEffect(() => {
    setProfile(null);
    setConnections([]);
    setFollowing([]);
    setLoading(false);
    setError(null);
  }, [userId]);

  useEffect(() => {
    const loadData = async () => {
      if (!userId || !account?.id || !isOpen) return;

      try {
        // Only show loading on initial load, not when navigating between modals
        if (!profile) {
          setLoading(true);
        }
        setError(null);

        // Load user profile
        const { data: profileData, error: profileError } = await simpleChatService.getSupabaseClient()
          .from('accounts')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);


        // Load connections (friends) - get the profile user's friends, not current user's friends
        const { connections: friendsData } = await simpleChatService.getUserConnections(userId);
        console.log('ConnectionsModal: Friends data:', friendsData);
        
        // Filter out the selected user (the getUserConnections function already filters for accepted status)
        const filteredFriends = friendsData.filter(friend => 
          friend.id !== userId
        );
        setConnections(filteredFriends);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
      <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
        {/* Floating Action Buttons */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <button
            onClick={onBack || onClose}
            className="p-2 hover:bg-gray-100 transition-colors rounded-full pointer-events-auto"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-9"></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6" style={{ paddingTop: '80px' }}>
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
              {/* User Profile Card */}
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={profile.profile_pic}
                    name={profile.name}
                    size={60}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{profile.name}</h3>
                    <p className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
                      {activeTab === 'friends' ? connections.length : following.length} {activeTab === 'friends' ? 'friends' : 'following'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex mb-6 justify-center">
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
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:bg-white transition-all mx-auto max-w-md"
                      >
              <div className="flex items-center gap-4">
                          <Avatar
                            src={connection.profile_pic}
                            name={connection.name}
                            size={50}
                          />
                          <div className="flex-1 flex items-center justify-center min-w-0">
                            <p className="font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{connection.name}</p>
                          </div>
                          <div style={{ width: 50 }} />
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
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:bg-white transition-all mx-auto max-w-md"
                      >
              <div className="flex items-center gap-4">
                          <Avatar
                            src={follow.profile_pic}
                            name={follow.name}
                            size={50}
                          />
                          <div className="flex-1 flex items-center justify-center min-w-0">
                            <p className="font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{follow.name}</p>
                          </div>
                          <div style={{ width: 50 }} />
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
