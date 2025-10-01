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
  const { sendMessage, markMessagesAsRead } = useAppStore();
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  // Hide bottom navigation when on chat page and handle keyboard
  useEffect(() => {
    document.body.classList.add('hide-bottom-nav');
    
    // Handle viewport height changes when keyboard appears/disappears
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set initial viewport height
    handleResize();
    
    // Listen for resize events (keyboard show/hide)
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      document.body.classList.remove('hide-bottom-nav');
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
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

  // Mark messages as read when conversation loads
  useEffect(() => {
    if (conversation && account?.id) {
      markMessagesAsRead(conversation.id, account.id);
    }
  }, [conversation, account?.id, markMessagesAsRead]);

  if (loading) {
    return (
      <div className="h-full bg-white">
        <MobileTitle 
          title="Chat" 
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="h-full bg-white">
        <MobileTitle 
          title="Chat" 
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
    <div className="chat-mobile-container relative h-screen bg-white overflow-hidden">
      {/* Fixed Top Header - Always visible with absolute positioning */}
      <div 
        className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-2" 
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={() => router.push('/chat')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

        {/* Centered Profile Card */}
        <div className="flex-1 flex justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1.5 flex items-center gap-2 max-w-2xl">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {conversation.avatarUrl ? (
                  <img
                    src={conversation.avatarUrl}
                    alt={conversation.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-sm font-semibold">
                    {conversation.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">{conversation.title}</div>
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

      {/* Scrollable Messages Area - Positioned between header and input */}
      <div 
        className="absolute left-0 right-0 overflow-y-auto px-4 py-4"
        style={{ 
          top: 'calc(env(safe-area-inset-top, 0px) + 76px)', // Height of header
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' // Height of input
        }}
      >
        <MobileMessageDisplay conversation={conversation} />
      </div>

      {/* Bottom Input - WhatsApp style, positioned higher up */}
      <div 
        className="absolute left-0 right-0 z-50 bg-white border-t border-gray-200" 
        style={{ 
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
          padding: '8px 16px'
        }}
      >
        <div className="flex items-center gap-2">
          {/* + Button - Smaller */}
          <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {/* Chat Input Box - unified border system */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-full border-[1.5px] border-gray-300 focus:border-gray-900 focus:outline-none focus:ring-0 transition-colors text-sm"
              style={{ 
                height: '36px',
                fontSize: '16px', // Prevent zoom on iOS
                caretColor: '#FF6600' // Orange text cursor
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && messageText.trim() && account?.id && conversation?.id) {
                  e.preventDefault();
                  await sendMessage(conversation.id, messageText.trim(), account.id);
                  setMessageText("");
                }
              }}
            />
          </div>

          {/* Send Button - Only show when there's text, smaller */}
          {messageText.trim() && (
            <button
              onClick={async () => {
                if (messageText.trim() && account?.id && conversation?.id) {
                  await sendMessage(conversation.id, messageText.trim(), account.id);
                  setMessageText("");
                }
              }}
              className="p-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
