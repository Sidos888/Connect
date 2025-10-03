"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, Users } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Avatar from "@/components/Avatar";

export default function GroupSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);

  // Get selected contact IDs from URL params
  const selectedContactIds = searchParams.get('contacts')?.split(',') || [];

  // Load contact details
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const { data: { user } } = await getSupabaseClient().auth.getUser();
        if (!user) return;

        const { contacts } = await simpleChatService.getContacts(user.id);
        const selected = contacts.filter(contact => 
          selectedContactIds.includes(contact.id)
        );
        setSelectedContacts(selected);
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    };

    if (selectedContactIds.length > 0) {
      loadContacts();
    }
  }, [selectedContactIds]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContactIds.length === 0) return;

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
        [user.id, ...selectedContactIds],
        groupPhoto || undefined
      );

      if (error) {
        console.error('Error creating group chat:', error);
        alert('Failed to create group chat. Please try again.');
        return;
      }

      if (chat) {
        console.log('Group chat created successfully:', chat.id);
        // Navigate to the new chat
        router.push(`/chat?chat=${chat.id}`);
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
      alert('Failed to create group chat. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Spacer for fixed header */}
      <div style={{ height: '130px' }}></div>
      
      {/* Fixed Header */}
      <div 
        className="bg-white fixed left-0 right-0 z-20"
        style={{ 
          paddingTop: '50px',
          top: '0px'
        }}
      >
        {/* Header Row */}
        <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Title */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">New Group</h1>
          </div>
          
          {/* Create Button */}
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || isCreating}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
        
        {/* Horizontal line below header */}
        <div 
          className="absolute left-0 right-0 border-b border-gray-200"
          style={{ 
            bottom: '0px'
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ paddingTop: '24px' }}>
        <div className="max-w-lg mx-auto space-y-8">
          
          {/* Group Profile Section */}
          <div className="text-center space-y-4">
            {/* Group Profile Photo */}
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto">
                {groupPhoto ? (
                  <img
                    src={groupPhoto}
                    alt="Group photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => {
                  // TODO: Implement photo picker
                  alert('Photo picker coming soon!');
                }}
                className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            {/* Group Name Input */}
            <div>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="text-xl font-semibold text-center bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 w-full"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                {groupName.length}/50 characters
              </p>
            </div>
          </div>

          {/* Participants Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Participants ({selectedContacts.length + 1})
            </h2>
            
            <div className="space-y-3">
              {/* Current user */}
              <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <Avatar
                  src={account?.profile_pic}
                  name={account?.name || 'You'}
                  size={48}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {account?.name || 'You'}
                  </h3>
                  <p className="text-sm text-gray-500">Admin</p>
                </div>
              </div>
              
              {/* Selected contacts */}
              {selectedContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <Avatar
                    src={contact.profile_pic}
                    name={contact.name}
                    size={48}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-gray-500">Member</p>
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
