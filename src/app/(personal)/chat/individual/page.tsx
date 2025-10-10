"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";
import { useAppStore } from "@/lib/store";
import { ArrowLeft } from "lucide-react";

export default function IndividualChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const { sendMessage, markMessagesAsRead, getConversations } = useAppStore();
  type Participant = { id: string; name: string; profile_pic?: string | null };
  type ConversationLite = { id: string; title: string; avatarUrl: string | null; isGroup: boolean };
  type ChatMessage = { id: string; text: string; sender_id: string };

  const [conversation, setConversation] = useState<ConversationLite | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const hasMarkedAsRead = useRef(false);

  // Load conversation and messages
  useEffect(() => {
    const loadData = async () => {
      if (!account?.id || !chatId) {
        setError('User not authenticated or chat ID missing');
        setLoading(false);
        return;
      }

      try {
        // First try to get conversation from store
        const storeConversations = getConversations();
        const storeConversation = storeConversations.find(c => c.id === chatId);
        
        if (storeConversation) {
          console.log('Individual chat page: Using conversation from store:', storeConversation);
          console.log('Individual chat page: Store conversation avatarUrl:', storeConversation.avatarUrl);
          console.log('Individual chat page: Store conversation isGroup:', storeConversation.isGroup);
          console.log('Individual chat page: Store conversation title:', storeConversation.title);
          
          // For group chats, always refresh from database to get latest photo
          if (storeConversation.isGroup) {
            console.log('Individual chat page: Group chat detected, refreshing from database for latest photo');
            const { chat, error: chatError } = await simpleChatService.getChatById(chatId);
            if (!chatError && chat) {
              setParticipants(chat.participants || []);
              
              // Update the conversation with fresh data
              const updatedConversation = {
                ...storeConversation,
                avatarUrl: chat.photo || null
              };
              console.log('Individual chat page: Updated conversation with fresh photo:', updatedConversation.avatarUrl);
              setConversation(updatedConversation);
            } else {
              setConversation(storeConversation);
            }
          } else {
            setConversation(storeConversation);
            
            // Still need to load participants for profile modal
            const { chat, error: chatError } = await simpleChatService.getChatById(chatId);
            if (!chatError && chat) {
              setParticipants(chat.participants || []);
            }
          }
        } else {
          // Fallback to loading from database
          console.log('Individual chat page: Conversation not in store, loading from database');
          const { chat, error: chatError } = await simpleChatService.getChatById(chatId);
          if (chatError || !chat) {
            setError('Conversation not found');
            setLoading(false);
            return;
          }

          // Store participants for profile modal
          setParticipants(chat.participants || []);

          // Convert to conversation format
          const otherParticipant = chat.participants.find((p: Participant) => p.id !== account.id);
          const conversation = {
            id: chat.id,
            title: chat.type === 'direct' 
              ? otherParticipant?.name || 'Unknown User'
              : chat.name || 'Group Chat',
            avatarUrl: chat.type === 'direct' 
              ? otherParticipant?.profile_pic || null
              : chat.photo || null,
            isGroup: chat.type === 'group'
          };

          console.log('Individual chat page: Chat data loaded from database:', chat);
          console.log('Individual chat page: Chat photo:', chat.photo);
          console.log('Individual chat page: Chat type:', chat.type);
          console.log('Individual chat page: Conversation avatarUrl:', conversation.avatarUrl);
          console.log('Individual chat page: Conversation isGroup:', conversation.isGroup);
          setConversation(conversation);
        }

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

  // Mark messages as read when chat is loaded
  useEffect(() => {
    if (!hasMarkedAsRead.current && account?.id && chatId && conversation) {
      markMessagesAsRead(chatId, account.id);
      hasMarkedAsRead.current = true;
    }
  }, [conversation, chatId, account?.id, markMessagesAsRead]);


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
    const screenWidth = window.innerWidth;
    
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
        height: '100dvh', // Use dynamic viewport height for mobile
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        position: 'relative',
        overflow: 'hidden'
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
          <button 
            onClick={() => {
                     if (!conversation.isGroup) {
                       // Direct message - find the other participant
                       const otherParticipant = participants.find((p: any) => p.id !== account?.id);
                       if (otherParticipant) {
                         router.push(`/chat/profile?userId=${otherParticipant.id}`);
                       }
                     } else {
                       // Group chat
                       router.push(`/chat/profile?chatId=${conversation.id}`);
                     }
            }}
            className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {conversation.avatarUrl ? (
                <Image
                  src={conversation.avatarUrl}
                  alt={conversation.title}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-sm font-semibold">
                  {conversation.title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">{conversation.title}</div>
            </div>
          </button>
          
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
        className="bg-white border-t border-gray-200 px-4 fixed left-0 right-0 z-20"
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
          <div className="flex-1 relative max-w-xs sm:max-w-none">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder=""
              className="w-full px-3 py-1 bg-white rounded-full border-[1.5px] border-gray-300 focus:outline-none focus:border-gray-300 focus:bg-white focus:shadow-[0_0_12px_rgba(0,0,0,0.12)] transition-colors resize-none text-sm sm:px-4 sm:py-3 sm:rounded-xl"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && messageText.trim()) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            className={`p-2 rounded-full transition-colors ${
              messageText.trim() 
                ? "bg-gray-900 text-white hover:bg-gray-800" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 17a1 1 0 01-1-1V6.414l-2.293 2.293a1 1 0 11-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Section - Scrollable messages area */}
      <div 
        className="px-4 overflow-y-auto space-y-3"
        style={{
          height: 'calc(100dvh - 210px)',
          paddingBottom: '0px', // No bottom padding needed since bottom nav is hidden
          position: 'relative'
        }}
      >
        {messages.map((message) => {
          const isMe = message.sender_id === account?.id;
          return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {/* Profile picture for received messages */}
              {!isMe && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Find the sender of this specific message
                    const messageSender = participants.find((p) => p.id === message.sender_id);
                    if (messageSender) {
                      // Navigate to the profile page for the sender
                      router.push(`/chat/profile?user=${messageSender.id}`);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  {(() => {
                    // For group chats, show the individual sender's profile picture
                    if (conversation.isGroup) {
                      const sender = participants.find((p) => p.id === message.sender_id);
                      if (sender?.profile_pic) {
                        return (
                          <Image
                            src={sender.profile_pic}
                            alt={sender.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        );
                      } else {
                        return (
                          <div className="text-gray-400 text-sm font-semibold">
                            {sender?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        );
                      }
                    } else {
                      // For direct messages, show the other participant's profile picture
                      if (conversation.avatarUrl) {
                        return (
                          <Image
                            src={conversation.avatarUrl}
                            alt={conversation.title}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        );
                      } else {
                        return (
                          <div className="text-gray-400 text-sm font-semibold">
                            {conversation.title.charAt(0).toUpperCase()}
                          </div>
                        );
                      }
                    }
                  })()}
                </button>
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