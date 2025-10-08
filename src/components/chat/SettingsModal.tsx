"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  userId: string;
  userName?: string;
}

interface UserProfile {
  id: string;
  name: string;
  profile_pic?: string;
  bio?: string;
}

export default function SettingsModal({ isOpen, onClose, onBack, userId, userName }: SettingsModalProps) {
  const { account } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        // Load user profile
        const { data: userProfile, error: profileError } = await simpleChatService.getSupabaseClient()
          .from('accounts')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(userProfile);

        // Load connection status
        if (account?.id) {
          const { status } = await simpleChatService.getConnectionStatus(account.id, userId);
          setConnectionStatus(status);
        }
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
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

        // Close the modal
        onClose();
      } else {
        console.error('Error removing friend:', error);
      }
    } catch (error) {
      console.error('Error in handleRemoveFriend:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 transition-opacity duration-300 ease-in-out"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
        onClick={onClose}
      />
      <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative mx-4">
        {/* Header */}
        <div className="flex items-center justify-center relative w-full p-6">
          <button
            onClick={onBack}
            className="absolute left-6 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Back to profile"
          >
            <span className="back-btn-circle">
              <ArrowLeft size={20} className="text-gray-700" />
            </span>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Settings</h2>
          <div className="w-9"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : showRemoveConfirm ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center px-6">
              {/* Question */}
              <h2 className="text-xl font-semibold text-gray-900 mb-8">
                Are you sure you want to unfriend
              </h2>
              
              {/* Profile Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 max-w-sm w-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {profile?.profile_pic ? (
                      <img 
                        src={profile.profile_pic} 
                        alt={profile.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium text-lg">
                        {(profile?.name || userName || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {profile?.name || userName}
                    </h3>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="w-full max-w-sm space-y-3">
                <button
                  onClick={handleRemoveFriend}
                  className="w-full px-6 py-4 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  className="w-full px-6 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-end">
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
  );
}
