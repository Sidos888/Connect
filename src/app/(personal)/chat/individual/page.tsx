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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);

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


  // Handle sending messages
  const handleSendMessage = async () => {
    if (messageText.trim() && account?.id && conversation?.id) {
      await sendMessage(conversation.id, messageText.trim(), account.id);
      setMessageText("");
    }
  };

  // Handle swipe gestures - RIGHT swipe (drag from left to right)
  const minSwipeDistance = 100;
  const edgeThreshold = 50; // Only trigger on edges

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    const startX = touch.clientX;
    const screenWidth = window.innerWidth;
    
    // Only start swipe if touch is near the left edge
    if (startX <= edgeThreshold) {
      setStartX(startX);
      setTouchStart(startX);
      setTouchEnd(null);
      setIsDragging(true);
      setDragOffset(0);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !startX) return;
    
    const touch = e.targetTouches[0];
    const currentX = touch.clientX;
    const deltaX = currentX - startX;
    
    // Only allow rightward movement (positive deltaX) - dragging from left to right
    if (deltaX > 0) {
      setDragOffset(Math.min(deltaX, screenWidth * 0.3)); // Limit to 30% of screen width
      setTouchEnd(currentX);
    }
  };

  const onTouchEnd = () => {
    if (!isDragging || !touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchEnd - touchStart;
    const isRightSwipe = distance > minSwipeDistance;

    if (isRightSwipe) {
      // Complete the swipe animation and navigate back
      setDragOffset(window.innerWidth);
      setTimeout(() => {
        router.push('/chat');
      }, 200);
    } else {
      // Snap back to original position
      setDragOffset(0);
    }
    
    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
    setStartX(null);
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
    <div 
      className="h-screen bg-white relative" 
      style={{ 
        height: '100vh',
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe indicator */}
      {isDragging && (
        <div 
          className="absolute top-1/2 left-0 w-1 bg-orange-500 rounded-r-full z-30"
          style={{ 
            height: '60px',
            transform: 'translateY(-50%)',
            opacity: Math.min(dragOffset / 50, 1)
          }}
        />
      )}
      {/* Fixed Header */}
      <div 
        className="bg-white absolute left-0 right-0 z-20"
        style={{ 
          paddingTop: '50px',
          top: '0px'
        }}
      >
        {/* Header Row - All elements on same horizontal line */}
        <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={() => router.push('/chat')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Profile Card */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
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
              <div className="font-semibold text-gray-900">{conversation.title}</div>
            </div>
          </div>
          
          {/* Menu Button */}
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
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

      {/* Fixed Input */}
      <div 
        className="bg-white border-t border-gray-200 px-4 absolute left-0 right-0 z-20"
        style={{ 
          height: '80px', 
          paddingTop: '8px', 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          bottom: '0px'
        }}
      >
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          {/* Input field */}
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

      {/* Chat Section - Scrollable messages area */}
      <div 
        className="px-4 overflow-y-auto space-y-3 absolute left-0 right-0"
        style={{
          top: '130px',
          bottom: '80px'
        }}
      >
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
    </div>
  );
}