"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";
import { useAppStore } from "@/lib/store";
import MobileMessageDisplay from "../MobileMessageDisplay";
import MobileTitle from "@/components/MobileTitle";
import { ArrowLeft } from "lucide-react";

export default function IndividualChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('id');
  const { account } = useAuth();
  const { sendMessage } = useAppStore();
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  // Hide bottom navigation when on chat page
  useEffect(() => {
    document.body.classList.add('hide-bottom-nav');
    return () => {
      document.body.classList.remove('hide-bottom-nav');
    };
  }, []);

  useEffect(() => {
    const loadConversation = async () => {
      if (!account?.id || !chatId) {
        setError('User not authenticated or chat ID missing');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading conversation for chat ID:', chatId);
        
        // Get the chat details
        const { chat, error: chatError } = await simpleChatService.getChatById(chatId);
        
        if (chatError || !chat) {
          console.error('Error loading chat:', chatError);
          setError('Conversation not found');
          setLoading(false);
          return;
        }

        // Convert SimpleChat to Conversation format
        const otherParticipant = chat.participants.find(p => p.id !== account.id);
        const conversation = {
          id: chat.id,
          title: chat.type === 'direct' 
            ? otherParticipant?.name || 'Unknown User'
            : chat.name || 'Group Chat',
          avatarUrl: chat.type === 'direct' 
            ? otherParticipant?.profile_pic || null
            : null,
          isGroup: chat.type === 'group',
          unreadCount: 0,
          messages: []
        };

        setConversation(conversation);
        setLoading(false);
      } catch (error) {
        console.error('Error loading conversation:', error);
        setError('Failed to load conversation');
        setLoading(false);
      }
    };

    loadConversation();
  }, [account?.id, chatId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <MobileTitle 
          title="Chat" 
          showBackButton={true}
          onBackClick={() => router.push('/chat')}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-white">
        <MobileTitle 
          title="Chat" 
          showBackButton={true}
          onBackClick={() => router.push('/chat')}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error</div>
            <div className="text-gray-500">{error || 'Conversation not found'}</div>
            <button
              onClick={() => router.push('/chat')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Back to Chats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Section - Fixed at top */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
        style={{ 
          paddingTop: '44px',
          height: '88px'
        }}
      >
        <div className="flex items-center gap-3 px-4 py-4 h-full">
          {/* Back Button */}
          <button
            onClick={() => router.push('/chat')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Centered Profile Card */}
          <div className="flex-1 flex justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 flex items-center gap-3 max-w-xs">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {conversation.avatarUrl ? (
                  <img
                    src={conversation.avatarUrl}
                    alt={conversation.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-lg font-semibold">
                    {conversation.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{conversation.title}</div>
                <div className="text-sm text-gray-500">
                  {conversation.isGroup ? 'Group Chat' : 'Direct Message'}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Dots Menu */}
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Messages Display - Scrollable with padding for fixed header and bottom */}
      <div 
        className="px-4 py-4 overflow-y-auto"
        style={{ 
          paddingTop: '88px',
          paddingBottom: '88px',
          minHeight: '100vh'
        }}
      >
        <MobileMessageDisplay conversation={conversation} />
      </div>

      {/* Bottom Input Section - Fixed at bottom */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
        style={{ paddingBottom: '34px' }}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          {/* + Button */}
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {/* Chat Input Box */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-gray-100 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && messageText.trim() && account?.id && conversation?.id) {
                  e.preventDefault();
                  await sendMessage(conversation.id, messageText.trim(), account.id);
                  setMessageText("");
                }
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={async () => {
              if (messageText.trim() && account?.id && conversation?.id) {
                await sendMessage(conversation.id, messageText.trim(), account.id);
                setMessageText("");
              }
            }}
            disabled={!messageText.trim()}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
