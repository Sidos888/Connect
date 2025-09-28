"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { chatService } from "@/lib/chatService";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function GroupSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account } = useAuth();
  const [groupName, setGroupName] = useState("");
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

        const { contacts } = await chatService.getContacts(user.id);
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
      const { chat, error } = await chatService.createGroupChat(
        groupName.trim(),
        [user.id, ...selectedContactIds]
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
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">New Group</h1>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || isCreating}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Group Name Input */}
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              {groupName.length}/50 characters
            </p>
          </div>

          {/* Selected Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Members ({selectedContacts.length + 1})
            </label>
            <div className="space-y-2">
              {/* Current user */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {account?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {account?.name || 'You'}
                </span>
              </div>
              
              {/* Selected contacts */}
              {selectedContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {contact.name?.charAt(0) || 'C'}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {contact.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
