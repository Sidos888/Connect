import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { X, Search, Users, Building2, ArrowLeft } from 'lucide-react';
import { newMessageFlow, Contact } from '@/lib/chat/newMessageFlow';
import UserListItem from './UserListItem';
import AvatarChip from './AvatarChip';
import { simpleChatService } from '@/lib/simpleChatService';

interface InlineContactSelectorProps {
  onClose: () => void;
  onComplete: (chatId: string) => void;
  onShowGroupSetup?: (selectedContacts: any[]) => void;
}

export default function InlineContactSelector({ 
  onClose, 
  onComplete,
  onShowGroupSetup
}: InlineContactSelectorProps) {
  const [context, setContext] = useState(newMessageFlow.getContext());
  const [friends, setFriends] = useState<Contact[]>([]);
  const [businesses, setBusinesses] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { account } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!account?.id) {
      setLoading(false);
      setError('Please log in to see your contacts');
      return;
    }
    
  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user ID
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      console.log('InlineContactSelector: User from auth:', user?.id);
      if (!user) {
        setError('User not authenticated');
        return;
      }
      
      // Use real chat service
      console.log('InlineContactSelector: Calling chatService.getContacts with userId:', user.id);
      const { contacts, error: contactsError } = await simpleChatService.getContacts(user.id);
      console.log('InlineContactSelector: ChatService response:', { contacts, error: contactsError });
      
      if (contactsError) {
        console.error('Error loading contacts:', contactsError);
        setError('Failed to load contacts');
        return;
      }
      
      // Convert contacts to the expected format
      const friendsList: Contact[] = contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        profile_pic: contact.profile_pic,
        type: 'person' as const,
      }));
      
      setFriends(friendsList);
      setBusinesses([]); // No businesses for now
      
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

    loadContacts();
  }, [account?.id]);

  useEffect(() => {
    const unsubscribe = newMessageFlow.subscribe(setContext);
    newMessageFlow.startFlow();

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (context.state === 'completed') {
      onClose();
      newMessageFlow.reset();
    } else if (context.state === 'group_setup') {
      // Show inline group setup
      if (onShowGroupSetup) {
        onShowGroupSetup(context.selectedContacts);
      }
    }
  }, [context.state, onClose, context.selectedContacts, onShowGroupSetup]);

  const handleSearchChange = (query: string) => {
    newMessageFlow.updateSearchQuery(query);
  };

  const handleContactSelect = (contactId: string) => {
    console.log('Contact selected:', contactId);
    newMessageFlow.toggleContactSelection(contactId);
    console.log('After toggle, selected contacts:', newMessageFlow.getContext().selectedContacts);
  };

  const handleRemoveContact = (contactId: string) => {
    newMessageFlow.toggleContactSelection(contactId);
  };

  const handleProceed = async () => {
    console.log('Next button clicked, selected contacts:', context.selectedContacts);
    console.log('Can proceed:', newMessageFlow.canProceed());
    
    if (context.selectedContacts.length === 1) {
      // Check for existing direct message or create new one
      try {
        // Get current user ID
        const { data: { user } } = await getSupabaseClient().auth.getUser();
        if (!user) {
          console.error('User not authenticated');
          return;
        }
        
        // Use the current session user ID (exists in REST API accounts table)
        const correctUserId = user.id; // 4f04235f-d166-48d9-ae07-a97a6421a328
        
        console.log('Looking for existing chat between:', correctUserId, 'and', context.selectedContacts[0].id);
        
        // First, check if a chat already exists
        const { chat: existingChat, error: findError } = await simpleChatService.findExistingDirectChat(correctUserId, context.selectedContacts[0].id);
        
        if (findError) {
          console.error('Error finding existing chat:', findError);
          // Continue to create new chat if finding fails
        } else if (existingChat) {
          console.log('Found existing chat:', existingChat.id);
          onComplete(existingChat.id);
          return;
        }
        
        // No existing chat found, create a new one
        console.log('Creating new direct chat between:', correctUserId, 'and', context.selectedContacts[0].id);
        const { chat, error } = await simpleChatService.createDirectChat(context.selectedContacts[0].id, correctUserId);
        
        if (error) {
          console.error('Error creating direct chat:', error);
          // Show user-friendly error message
          alert('Failed to create chat. Please try again.');
          return;
        }
        
        if (chat) {
          console.log('Chat created successfully:', chat.id);
          onComplete(chat.id);
        } else {
          console.error('No chat returned from createDirectChat');
        }
      } catch (error) {
        console.error('Error creating direct chat:', error);
      }
    } else if (context.selectedContacts.length > 1) {
      // Show inline group setup
      console.log('Showing group setup for', context.selectedContacts.length, 'contacts');
      console.log('InlineContactSelector: selectedContacts being passed:', context.selectedContacts);
      if (onShowGroupSetup) {
        onShowGroupSetup(context.selectedContacts);
      }
    }
  };

  const filteredFriends = useMemo(() => {
    if (!context.searchQuery) return friends;
    return friends.filter(friend => 
      friend.name.toLowerCase().includes(context.searchQuery.toLowerCase()) ||
      friend.connectId?.toLowerCase().includes(context.searchQuery.toLowerCase())
    );
  }, [friends, context.searchQuery]);

  const filteredBusinesses = useMemo(() => {
    if (!context.searchQuery) return businesses;
    return businesses.filter(business => 
      business.name.toLowerCase().includes(context.searchQuery.toLowerCase()) ||
      business.connectId?.toLowerCase().includes(context.searchQuery.toLowerCase())
    );
  }, [businesses, context.searchQuery]);

  const getButtonText = () => {
    if (context.selectedContacts.length === 0) return 'Select contacts';
    if (context.selectedContacts.length === 1) return 'Chat';
    return 'Continue';
  };

  const isButtonDisabled = context.selectedContacts.length === 0 || context.isLoading;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="relative flex items-center justify-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Chat</h2>
          <button
            onClick={onClose}
            className="absolute left-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          {context.selectedContacts.length > 0 && (
            <button
              onClick={handleProceed}
              disabled={!newMessageFlow.canProceed() || context.isLoading}
              className="absolute right-0 text-orange-500 hover:text-orange-600 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {context.isLoading ? 'Processing...' : 
               context.selectedContacts.length === 1 ? 'Chat' : 'Continue'}
            </button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={context.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Selected Contacts */}
      {context.selectedContacts.length > 0 && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 max-h-32 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {context.selectedContacts.map(contact => (
              <AvatarChip
                key={contact.id}
                contact={contact}
                onRemove={handleRemoveContact}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-black"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="text-red-500 mb-2">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Try again
            </button>
          </div>
        ) : filteredFriends.length === 0 && filteredBusinesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No contacts found</p>
            <p className="text-gray-400 text-sm">Add some friends or follow businesses to start messaging</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Friends Section */}
            {filteredFriends.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">Friends</h3>
                </div>
                <div className="space-y-1">
                  {filteredFriends.map(friend => (
                    <UserListItem
                      key={friend.id}
                      contact={friend}
                      isSelected={context.selectedContacts.some(c => c.id === friend.id)}
                      onToggle={handleContactSelect}
                      disabled={friend.id === account?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Businesses Section */}
            {filteredBusinesses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">Following</h3>
                </div>
                <div className="space-y-1">
                  {filteredBusinesses.map(business => (
                    <UserListItem
                      key={business.id}
                      contact={business}
                      isSelected={context.selectedContacts.some(c => c.id === business.id)}
                      onToggle={handleContactSelect}
                      disabled={business.id === account?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleProceed}
          disabled={isButtonDisabled}
          className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${
            isButtonDisabled 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-brand hover:bg-orange-600'
          }`}
        >
          {context.isLoading ? (
            <div className="flex items-center justify-center">
              {context.selectedContacts.length === 1 ? 'Starting chat...' : 'Creating Group...'}
            </div>
          ) : (
            getButtonText()
          )}
        </button>
      </div>
    </div>
  );
}
