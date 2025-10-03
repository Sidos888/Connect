import React, { useState } from 'react';
import { ArrowLeft, Camera, Users } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { simpleChatService } from '@/lib/simpleChatService';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Avatar from '@/components/Avatar';

interface InlineGroupSetupProps {
  selectedContacts: Array<{
    id: string;
    name: string;
    profile_pic?: string;
  }>;
  onClose: () => void;
  onComplete: (chatId: string) => void;
}

export default function InlineGroupSetup({ 
  selectedContacts, 
  onClose, 
  onComplete 
}: InlineGroupSetupProps) {
  const { account } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Debug: Log the selected contacts data
  console.log('InlineGroupSetup: selectedContacts received:', selectedContacts);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) return;

    setIsCreating(true);
    try {
      // Get current user ID
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Create group chat
      const { chat, error } = await simpleChatService.createGroupChat(
        groupName.trim(),
        [user.id, ...selectedContacts.map(c => c.id)],
        groupPhoto || undefined
      );

      if (error) {
        console.error('Error creating group chat:', error);
        alert('Failed to create group chat. Please try again.');
        return;
      }

      if (chat) {
        console.log('Group chat created successfully:', chat.id);
        onComplete(chat.id);
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
      alert('Failed to create group chat. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="relative flex items-center justify-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Group</h2>
          <button
            onClick={onClose}
            className="absolute left-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || isCreating}
            className="absolute right-0 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Group Profile Section */}
          <div className="text-center space-y-4">
            {/* Group Profile Photo */}
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto">
                {groupPhoto ? (
                  <img
                    src={groupPhoto}
                    alt="Group photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => {
                  // TODO: Implement photo picker
                  alert('Photo picker coming soon!');
                }}
                className="absolute bottom-0 right-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            
            {/* Group Name Input */}
            <div>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="text-lg font-semibold text-center bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 w-full"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                {groupName.length}/50 characters
              </p>
            </div>
          </div>

          {/* Participants Section */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Participants ({selectedContacts.length + 1})
            </h3>
            
            <div className="space-y-2">
              {/* Current user */}
              <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <Avatar
                  src={account?.profile_pic || undefined}
                  name={account?.name || 'You'}
                  size={40}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {account?.name || 'You'}
                  </h4>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
              
              {/* Selected contacts */}
              {selectedContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <Avatar
                    src={contact.profile_pic || undefined}
                    name={contact.name}
                    size={40}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {contact.name}
                    </h4>
                    <p className="text-xs text-gray-500">Member</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
