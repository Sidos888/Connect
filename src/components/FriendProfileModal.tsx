"use client";

import React from 'react';
import { X } from 'lucide-react';

interface FriendProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: {
    id: string;
    name: string;
    bio?: string;
    profile_pic?: string;
    connect_id?: string;
  };
}

export default function FriendProfileModal({ isOpen, onClose, friend }: FriendProfileModalProps) {
  if (!isOpen) return null;

  const handleMessage = () => {
    // TODO: Navigate to chat with this friend
    console.log('Message friend:', friend.name);
    onClose();
  };

  const handleShare = () => {
    // TODO: Share friend's profile
    console.log('Share friend profile:', friend.name);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Profile Picture */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {friend.profile_pic ? (
                <img 
                  src={friend.profile_pic} 
                  alt={friend.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-2xl font-medium">
                  {friend.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="text-center mb-2">
            <h3 className="text-2xl font-bold text-gray-900">{friend.name}</h3>
          </div>

          {/* Account Type */}
          <div className="text-center mb-2">
            <span className="text-sm text-gray-500">Personal Account</span>
          </div>

          {/* Connect ID */}
          <div className="text-center mb-6">
            <span className="text-sm text-gray-400">Connect {friend.connect_id || 'N/A'}</span>
          </div>

          {/* Bio */}
          {friend.bio && (
            <div className="text-center mb-8">
              <p className="text-gray-700 text-sm leading-relaxed">{friend.bio}</p>
            </div>
          )}

          {/* Action Buttons - Circular Style */}
          <div className="flex space-x-6 justify-center">
            {/* Message Button */}
            <button
              onClick={handleMessage}
              className="flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center hover:shadow-md hover:border-gray-300 transition-all duration-200">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Message</span>
            </button>

            {/* Share Profile Button */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center hover:shadow-md hover:border-gray-300 transition-all duration-200">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
