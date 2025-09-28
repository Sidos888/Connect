"use client";

import React, { useEffect, useState } from 'react';
import { X, Search, Users, Building2 } from 'lucide-react';
import { newMessageFlow, Contact } from '@/lib/chat/newMessageFlow';
import UserListItem from './UserListItem';
import AvatarChip from './AvatarChip';
import { simpleChatService } from '@/lib/simpleChatService';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (chatId: string) => void;
  onShowGroupSetup?: () => void;
}

export default function NewMessageModal({ 
  isOpen, 
  onClose, 
  onComplete,
  onShowGroupSetup 
}: NewMessageModalProps) {
  const [context, setContext] = useState(newMessageFlow.getContext());

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = newMessageFlow.subscribe(setContext);
    
    // Start the flow when modal opens
    newMessageFlow.startFlow();

    return unsubscribe;
  }, [isOpen]);

  useEffect(() => {
    if (context.state === 'completed') {
      onClose();
      newMessageFlow.reset();
    } else if (context.state === 'group_setup') {
      // Navigate to group creation page
      const participantIds = context.selectedContacts.map(c => c.id).join(',');
      window.location.href = `/chat/create-group?participants=${participantIds}`;
    }
  }, [context.state, onClose, context.selectedContacts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    newMessageFlow.updateSearchQuery(e.target.value);
  };

  const handleContactToggle = (contactId: string) => {
    newMessageFlow.toggleContactSelection(contactId);
  };

  const handleRemoveContact = (contactId: string) => {
    newMessageFlow.toggleContactSelection(contactId);
  };

  const handleProceed = async () => {
    if (context.selectedContacts.length === 1) {
      // Create direct message
      try {
        // Get current user ID
        const { data: { user } } = await getSupabaseClient().auth.getUser();
        if (!user) {
          console.error('User not authenticated');
          return;
        }
        
        const { chat, error } = await simpleChatService.createDirectChat(context.selectedContacts[0].id, user.id);
        if (error) {
          console.error('Error creating direct chat:', error);
          return;
        }
        if (chat) {
          onComplete(chat.id);
        }
      } catch (error) {
        console.error('Error creating direct chat:', error);
      }
    } else if (context.selectedContacts.length > 1) {
      // Show group setup
      if (onShowGroupSetup) {
        onShowGroupSetup();
      }
    }
  };

  const handleClose = () => {
    newMessageFlow.reset();
    onClose();
  };

  if (!isOpen) return null;

  const { friends, businesses } = newMessageFlow.getGroupedContacts();
  const hasContacts = friends.length > 0 || businesses.length > 0;

  return (
    <div className="fixed inset-0 z-[1000] bg-white">
      {/* Modal */}
      <div className="h-full w-full flex flex-col">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b border-gray-200">
          <button
            onClick={handleClose}
            className="absolute left-6 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">New Chat</h2>
          {context.selectedContacts.length > 0 && (
            <button
              onClick={handleProceed}
              disabled={!newMessageFlow.canProceed() || context.isLoading}
              className="absolute right-6 text-orange-500 hover:text-orange-600 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {context.isLoading ? 'Processing...' : 
               context.selectedContacts.length === 1 ? 'Create' : 'Continue'}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="p-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={context.searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Selected Contacts */}
        {context.selectedContacts.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              {context.selectedContacts.map((contact) => (
                <AvatarChip
                  key={contact.id}
                  contact={contact}
                  onRemove={handleRemoveContact}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {context.error && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{context.error}</p>
            </div>
          </div>
        )}

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto px-6">
          {context.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-black"></div>
            </div>
          ) : !hasContacts ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="w-16 h-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No contacts found
              </h3>
              <p className="text-sm text-center max-w-sm">
                {context.searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Add some friends or follow businesses to start messaging'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {/* Friends Section */}
              {friends.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                      Friends ({friends.length})
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {friends.map((contact) => (
                      <UserListItem
                        key={contact.id}
                        contact={contact}
                        isSelected={context.selectedContacts.some(c => c.id === contact.id)}
                        onToggle={handleContactToggle}
                        disabled={contact.is_blocked}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Businesses Section */}
              {businesses.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                      Following ({businesses.length})
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {businesses.map((contact) => (
                      <UserListItem
                        key={contact.id}
                        contact={contact}
                        isSelected={context.selectedContacts.some(c => c.id === contact.id)}
                        onToggle={handleContactToggle}
                        disabled={contact.is_blocked}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
