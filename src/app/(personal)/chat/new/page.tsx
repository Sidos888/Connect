"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAppStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Avatar from "@/components/Avatar";
import MobileTitle from "@/components/MobileTitle";
import { ArrowLeft, Search, MessageCircle, Users } from "lucide-react";

interface ConnectionUser {
  id: string;
  name: string;
  profile_pic?: string;
  connect_id?: string;
}

export default function NewChatPage() {
  const router = useRouter();
  const { account } = useAuth();
  const { createDirectChat } = useAppStore();
  const supabase = getSupabaseClient();
  const [friends, setFriends] = useState<ConnectionUser[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<ConnectionUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);

  // Load friends when component mounts
  useEffect(() => {
    if (account?.id) {
      loadFriends();
    }
  }, [account?.id, loadFriends]);

  // Filter friends based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.connect_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [searchQuery, friends]);

  const loadFriends = useCallback(async () => {
    if (!account?.id || !supabase) {
      console.log('Cannot load friends: missing account.id or supabase client');
      return;
    }
    
    setLoading(true);
    try {
      // Get user's connections (friends)
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          user1_id,
          user2_id,
          accounts!connections_user1_id_fkey(id, name, profile_pic, connect_id),
          accounts!connections_user2_id_fkey(id, name, profile_pic, connect_id)
        `)
        .or(`user1_id.eq.${account.id},user2_id.eq.${account.id}`);

      if (error) {
        console.error('Error loading friends:', error);
        // Create a more detailed error message
        const errorMessage = error.message || 'Failed to load friends';
        console.error('Detailed error:', {
          message: errorMessage,
          code: error.code,
          details: error.details
        });
        setFriends([]);
        return;
      }

      // Extract friend data from connections
      const friendsList: ConnectionUser[] = [];
      connections?.forEach(connection => {
        if (connection.user1_id === account.id && connection.accounts) {
          // @ts-expect-error - Supabase join result
          const friend = connection.accounts.find((acc: any) => acc.id === connection.user2_id);
          if (friend) {
            friendsList.push({
              id: friend.id,
              name: friend.name,
              profile_pic: friend.profile_pic,
              connect_id: friend.connect_id
            });
          }
        } else if (connection.user2_id === account.id && connection.accounts) {
          // @ts-expect-error - Supabase join result
          const friend = connection.accounts.find((acc: any) => acc.id === connection.user1_id);
          if (friend) {
            friendsList.push({
              id: friend.id,
              name: friend.name,
              profile_pic: friend.profile_pic,
              connect_id: friend.connect_id
            });
          }
        }
      });

      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [account?.id, supabase]);

  const handleCreateChat = async (friend: ConnectionUser) => {
    if (!account?.id || creatingChat) return;
    
    setCreatingChat(friend.id);
    try {
      console.log('Creating chat with friend:', friend.name);
      const conversation = await createDirectChat(account.id, friend.id);
      
      if (conversation) {
        // Navigate to the new chat
        router.push(`/chat/${conversation.id}`);
      } else {
        console.error('Failed to create chat');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreatingChat(null);
    }
  };

  // Show loading or redirect if not authenticated
  if (!account?.id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
          <p className="text-sm text-gray-400 mt-2">Please make sure you&apos;re logged in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Title */}
      <MobileTitle 
        title="New Chat" 
        action={
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        }
      />

      {/* Search */}
      <div className="p-4 border-b border-gray-200 pt-[120px] lg:pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No friends found' : 'No friends to chat with yet'}
            </h3>
            <p className="text-sm text-center max-w-sm">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Add some friends first to start chatting with them'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/menu?view=connections')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Friends
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            <div className="mb-4 px-2">
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Your Friends ({filteredFriends.length})
              </h2>
            </div>
            {filteredFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleCreateChat(friend)}
                disabled={creatingChat === friend.id}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100 last:border-b-0"
              >
                <Avatar
                  src={friend.profile_pic}
                  name={friend.name}
                  size="lg"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 text-lg">{friend.name}</p>
                  {friend.connect_id && (
                    <p className="text-sm text-gray-500">@{friend.connect_id}</p>
                  )}
                </div>
                {creatingChat === friend.id ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                ) : (
                  <div className="p-2 rounded-full bg-blue-50 text-blue-500">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
