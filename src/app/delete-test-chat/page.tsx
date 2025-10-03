"use client";

import { useState } from 'react';
import { simpleChatService } from '@/lib/simpleChatService';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function DeleteTestChat() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadChats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (!user) {
        setMessage('Not authenticated');
        return;
      }

      const { conversations } = await simpleChatService.getConversations(user.id);
      setChats(conversations);
      setMessage(`Found ${conversations.length} chats`);
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    setLoading(true);
    try {
      const { success, error } = await simpleChatService.deleteChat(chatId);
      if (success) {
        setMessage(`Chat ${chatId} deleted successfully`);
        loadChats(); // Reload the list
      } else {
        setMessage(`Error deleting chat: ${error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Delete Test Chat</h1>
      
      <div className="space-y-4">
        <button
          onClick={loadChats}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Chats'}
        </button>

        {message && (
          <div className="p-4 bg-gray-100 rounded">
            {message}
          </div>
        )}

        <div className="space-y-2">
          {chats.map((chat) => (
            <div key={chat.id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <div className="font-semibold">
                  {chat.type === 'direct' ? 'Direct Chat' : `Group: ${chat.name || 'Unnamed'}`}
                </div>
                <div className="text-sm text-gray-600">
                  Participants: {chat.participants.map(p => p.name).join(', ')}
                </div>
                <div className="text-xs text-gray-500">
                  ID: {chat.id}
                </div>
              </div>
              <button
                onClick={() => deleteChat(chat.id)}
                disabled={loading}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
