"use client";

import React, { useState, useEffect } from 'react';
import { X, Share, MessageCircle, MoreVertical, Settings, Images } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';
import Avatar from '@/components/Avatar';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId || !isOpen) return;

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
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
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
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
