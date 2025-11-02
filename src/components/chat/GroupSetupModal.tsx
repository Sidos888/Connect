"use client";

import React, { useEffect, useState } from 'react';
import { X, Camera, Users } from 'lucide-react';
import { newMessageFlow } from '@/lib/chat/newMessageFlow';
import Avatar from '../Avatar';

interface GroupSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (chatId: string) => void;
}

export default function GroupSetupModal({ 
  isOpen, 
  onClose, 
  onComplete 
}: GroupSetupModalProps) {
  const [context, setContext] = useState(newMessageFlow.getContext());
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = newMessageFlow.subscribe(setContext);
    
    // Initialize group name if not set
    if (!context.groupSetupData.name) {
      const participantNames = context.selectedContacts
        .slice(0, 3)
        .map(c => c.name)
        .join(', ');
      const initialName = participantNames + 
        (context.selectedContacts.length > 3 ? ` +${context.selectedContacts.length - 3} more` : '');
      setGroupName(initialName);
      newMessageFlow.updateGroupSetupData({ name: initialName });
    } else {
      setGroupName(context.groupSetupData.name);
    }

    return unsubscribe;
  }, [isOpen, context.selectedContacts, context.groupSetupData.name]);

  useEffect(() => {
    if (context.state === 'completed') {
      onClose();
      newMessageFlow.reset();
    }
  }, [context.state, onClose]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGroupName(value);
    newMessageFlow.updateGroupSetupData({ name: value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload photo to storage and get URL
      // For now, just create a local URL
      const photoUrl = URL.createObjectURL(file);
      newMessageFlow.updateGroupSetupData({ photo: photoUrl });
    }
  };

  const handleCreateGroup = () => {
    newMessageFlow.createGroup();
  };

  const handleBack = () => {
    newMessageFlow.updateContext({ state: 'selecting_contacts' });
  };

  const handleClose = () => {
    newMessageFlow.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-0 bg-transparent"
              aria-label="Back"
            >
              <span className="action-btn-circle">
                <ArrowLeft className="w-5 h-5 text-gray-900" />
              </span>
            </button>
            <h2 className="text-xl font-semibold text-gray-900 text-center">Create Group</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-0 bg-transparent"
            aria-label="Close"
          >
            <span className="action-btn-circle">
              <X className="w-5 h-5 text-gray-900" />
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Group Photo */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {context.groupSetupData.photo ? (
                  <img 
                    src={context.groupSetupData.photo} 
                    alt="Group photo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
                <Camera className="w-3 h-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">Group photo (optional)</p>
          </div>

          {/* Group Name */}
          <div>
            <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={handleNameChange}
              placeholder="Enter group name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              {groupName.length}/50 characters
            </p>
          </div>

          {/* Participants */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Participants ({context.selectedContacts.length})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {context.selectedContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <Avatar
                    src={contact.profile_pic}
                    name={contact.name}
                    size={32}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.name}
                    </p>
                    {contact.connect_id && (
                      <p className="text-xs text-gray-500 truncate">
                        @{contact.connect_id}
                      </p>
                    )}
                  </div>
                  {contact.type === 'business' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Business
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {context.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{context.error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || context.isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {context.isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Group...
              </div>
            ) : (
              'Create Group'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
