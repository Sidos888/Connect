"use client";

import React, { useState, useEffect } from 'react';
import { X, Phone, MessageCircle, MoreVertical } from 'lucide-react';
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
            bio: 'Bio not available',
            phone: 'Phone not available',
            email: 'Email not available'
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
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
              {/* Profile Section */}
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <Avatar
                    src={profile.profile_pic}
                    name={profile.name}
                    size={120}
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h3>
                <p className="text-gray-600 mb-6">{profile.bio}</p>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleStartChat}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                </div>
              </div>

              {/* Details Section */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                  <p className="text-gray-900">{profile.phone}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                  <p className="text-gray-900">{profile.email}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Connect ID</h4>
                  <p className="text-gray-900 text-sm font-mono">{profile.id}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
