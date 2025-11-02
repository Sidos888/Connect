"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { connectionsService } from '@/lib/connectionsService';
import { formatNameForDisplay } from '@/lib/utils';

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
  dob?: string;
}

export default function SettingsModal({ isOpen, onClose, onBack, userId, userName }: SettingsModalProps) {
  const { account, supabase } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [currentView, setCurrentView] = useState<'settings' | 'confirm' | 'edit'>('settings');

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        // Load user profile
        if (!supabase) throw new Error('Supabase client not available');
        
        const { data: userProfile, error: profileError } = await supabase
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
      console.log('Removing friend connection between', account.id, 'and', userId);
      
      // Remove the friend connection from the connections table
      const { error: removeError } = await connectionsService.removeFriend(account.id, userId);
      
      if (removeError) {
        console.error('Error removing friend connection:', removeError);
        return;
      }

      // Find and hide any existing chat
      const { chat: existingChat } = await simpleChatService.findExistingDirectChat(account.id, userId);
      if (existingChat) {
        console.log('Hiding existing chat:', existingChat.id);
        const { success: hideSuccess, error: hideError } = await simpleChatService.hideChat(existingChat.id, account.id);
        
        if (!hideSuccess) {
          console.error('Error hiding chat:', hideError);
        }
      }

      console.log('Friend removed successfully');
      
      // Close the modal
      onClose();
      
      // Optionally refresh the page to update the UI
      window.location.reload();
      
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
            onClick={currentView === 'confirm' ? () => setCurrentView('settings') : currentView === 'edit' ? () => setCurrentView('settings') : onBack}
            className="absolute left-6 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label={currentView === 'confirm' ? "Back to settings" : currentView === 'edit' ? "Back to settings" : "Back to profile"}
          >
            <span className="action-btn-circle">
              <ArrowLeft size={20} className="text-gray-700" />
            </span>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>
            {currentView === 'settings' ? 'Settings' : currentView === 'edit' ? 'Edit Profile' : 'Are you sure you want to unfriend?'}
          </h2>
          <div className="w-9"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : currentView === 'edit' ? (
            <div className="flex-1 flex flex-col">
              {/* Edit Profile Form */}
              <div className="space-y-4">
                {/* Profile Picture */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                    {profile?.profile_pic ? (
                      <img 
                        src={profile.profile_pic} 
                        alt={profile.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium text-3xl">
                        {(profile?.name || userName || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                    Change Photo
                  </button>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    defaultValue={profile?.name || userName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    defaultValue={profile?.bio || ''}
                    rows={3}
                    className="w-full px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    style={{ 
                      padding: '12px',
                      lineHeight: '1.5',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      verticalAlign: 'baseline'
                    }}
                    placeholder="Tell us about yourself"
                  />
                </div>

                {/* Date of Birth Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    defaultValue={profile?.dob ? new Date(profile.dob).toISOString().split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-auto pt-6">
                <button className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          ) : currentView === 'confirm' ? (
            <div className="flex-1 flex flex-col justify-center items-center px-6">
              {/* Profile Card - Centered */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 max-w-sm w-full">
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
                  <div className="flex-1 flex justify-center items-center">
                    <h3 className="text-lg font-medium text-gray-900 text-center w-full">
                      {formatNameForDisplay(profile?.name || userName || '')}
                    </h3>
                  </div>
                </div>
              </div>
              
              {/* Confirm Button - Separate, at bottom */}
              <button
                onClick={handleRemoveFriend}
                className="w-full max-w-sm px-6 py-4 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Profile Card */}
              <div className="bg-gray-100 rounded-2xl p-4 mb-6">
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
                      {formatNameForDisplay(profile?.name || userName || '')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setCurrentView('edit')}
                    className="text-blue-600 underline text-sm font-medium hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Settings Options */}
              <div className="flex-1 flex flex-col justify-end">
                {connectionStatus === 'accepted' && (
                  <button
                    onClick={() => setCurrentView('confirm')}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Remove Friend</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
