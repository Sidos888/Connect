"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";
import { useAppStore } from "@/lib/store";
import { ArrowLeft } from "lucide-react";

export default function IndividualChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('id');
  const { account } = useAuth();
  const { sendMessage } = useAppStore();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation and messages
  useEffect(() => {
    const loadData = async () => {
      if (!account?.id || !chatId) {
        setError('User not authenticated or chat ID missing');
        setLoading(false);
        return;
      }

      try {
        // Get chat details
        const { chat, error: chatError } = await simpleChatService.getChatById(chatId);
        if (chatError || !chat) {
          setError('Conversation not found');
          setLoading(false);
          return;
        }

        // Convert to conversation format
        const otherParticipant = chat.participants.find(p => p.id !== account.id);
        const conversation = {
          id: chat.id,
          title: chat.type === 'direct' 
            ? otherParticipant?.name || 'Unknown User'
            : chat.name || 'Group Chat',
          avatarUrl: chat.type === 'direct' 
            ? otherParticipant?.profile_pic || null
            : null,
          isGroup: chat.type === 'group'
        };

        setConversation(conversation);

        // Load messages
        const { messages, error: messagesError } = await simpleChatService.getChatMessages(chatId, account.id);
        if (!messagesError) {
          setMessages(messages);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load conversation');
        setLoading(false);
      }
    };

    loadData();
  }, [account?.id, chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hide bottom navigation on individual chat page
  useEffect(() => {
    document.body.classList.add('hide-bottom-nav');
    return () => {
      document.body.classList.remove('hide-bottom-nav');
    };
  }, []);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (messageText.trim() && account?.id && conversation?.id) {
      await sendMessage(conversation.id, messageText.trim(), account.id);
      setMessageText("");
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error</div>
          <div className="text-gray-500 mb-4">{error || 'Conversation not found'}</div>
          <button
            onClick={() => router.push('/chat')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:opacity-90"
          >
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-12 pb-2 flex items-center gap-3">
        <button
          onClick={() => router.push('/chat')}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* Profile Card */}
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
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
            <div>
              <div className="font-semibold text-gray-900">{conversation.title}</div>
            </div>
          </div>
        </div>

        <button className="p-2 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((message) => {
          const isMe = message.sender_id === account?.id;
          return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {/* Profile picture for received messages */}
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
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
              )}
              
              {/* Message bubble - white background for mobile */}
              <div className={`
                max-w-[70%] px-4 py-3 rounded-2xl shadow-sm
                ${isMe 
                  ? 'bg-white text-gray-900 border border-gray-200' 
                  : 'bg-white text-gray-900 border border-gray-200'
                }
              `}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 pb-8 pt-2">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          {/* Input field - cursor height only */}
          <div className="flex-1 relative max-w-xs">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full px-3 py-1 bg-white border-[1.5px] border-gray-300 rounded-full focus:outline-none focus:border-gray-900 transition-colors duration-200 text-sm shadow-sm"
              placeholder=""
              onKeyDown={(e) => {
                if (e.key === 'Enter' && messageText.trim()) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          
          {messageText.trim() && (
            <button
              onClick={handleSendMessage}
              className="p-2 rounded-full bg-orange-500 text-white hover:opacity-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}