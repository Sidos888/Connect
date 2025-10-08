"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';
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
}

export default function SettingsModal({ isOpen, onClose, onBack, userId, userName }: SettingsModalProps) {
  const { account } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [currentView, setCurrentView] = useState<'settings' | 'confirm'>('settings');

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        // Load user profile
        const supabase = simpleChatService.getSupabaseClient();
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
            onClick={currentView === 'confirm' ? () => setCurrentView('settings') : onBack}
            className="absolute left-6 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label={currentView === 'confirm' ? "Back to settings" : "Back to profile"}
          >
            <span className="back-btn-circle">
              <ArrowLeft size={20} className="text-gray-700" />
            </span>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>
            {currentView === 'settings' ? 'Settings' : 'Are you sure you want to unfriend?'}
          </h2>
          <div className="w-9"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
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
          )}
        </div>
      </div>
    </div>
  );
}
