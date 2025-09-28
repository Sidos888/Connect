'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { chatService } from '@/lib/chatService';
import MobileTitle from '@/components/MobileTitle';
import { ArrowLeft, Check } from 'lucide-react';

export default function CreateGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account } = useAuth();
  
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get participant IDs from URL params
  const participantIds = searchParams.get('participants')?.split(',') || [];

  useEffect(() => {
    if (!account?.id) {
      router.push('/chat');
      return;
    }
    
    if (participantIds.length === 0) {
      router.push('/chat');
      return;
    }
  }, [account?.id, participantIds, router]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (!account?.id) {
      setError('You must be logged in to create a group');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const { chat, error } = await chatService.createGroupChat(
        groupName.trim(),
        participantIds
      );

      if (error) {
        throw error;
      }

      // Navigate to the new group chat
      router.push(`/chat/${chat.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!account?.id || participantIds.length === 0) {
    return null;
  }

  return (
    <div className="lg:hidden h-screen bg-white overflow-hidden flex flex-col">
      {/* Mobile Title */}
      <MobileTitle 
        title="Create Group" 
        action={
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || isCreating}
            className="text-orange-500 hover:text-orange-600 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        }
      />
      
      <div className="flex-1 overflow-y-auto px-4 py-6 pt-[120px]">
        <div className="max-w-md mx-auto space-y-6">
          {/* Group Name Input */}
          <div className="space-y-2">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
              maxLength={50}
            />
            <p className="text-xs text-gray-500">
              {groupName.length}/50 characters
            </p>
          </div>

          {/* Participants Count */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{participantIds.length + 1}</span> participants
              (including you)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Create Button (for larger screens) */}
          <div className="hidden lg:block">
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || isCreating}
              className={`w-full py-3 rounded-xl text-white font-semibold transition-colors ${
                !groupName.trim() || isCreating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {isCreating ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
