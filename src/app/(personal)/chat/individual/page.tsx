"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { simpleChatService } from "@/lib/simpleChatService";
import { useAppStore } from "@/lib/store";
import { ArrowLeft } from "lucide-react";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageActionModal from "@/components/chat/MessageActionModal";
import MediaUploadButton from "@/components/chat/MediaUploadButton";
import type { SimpleMessage } from "@/lib/simpleChatService";

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
  const [selectedMessage, setSelectedMessage] = useState<SimpleMessage | null>(null);
  const [selectedMessageElement, setSelectedMessageElement] = useState<HTMLElement | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<SimpleMessage | null>(null);
  const [pendingMedia, setPendingMedia] = useState<string[]>([]);
  const unsubscribeReactionsRef = useRef<(() => void) | null>(null);

  // Simple mobile optimization - prevent body scroll
  useEffect(() => {
    // Prevent body scroll on mobile chat but allow chat container to scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, []);

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

        // Subscribe to reaction changes for real-time updates
        if (chatId) {
          const unsubscribeReactions = simpleChatService.subscribeToReactions(
            chatId,
            (messageId) => {
              console.log('Individual chat page: Reaction update received for message:', messageId);
              // Refresh the specific message to get updated reactions
              setMessages(prev => {
                return prev.map(msg => {
                  if (msg.id === messageId) {
                    // Trigger a re-render by updating the message
                    return { ...msg, reactions: msg.reactions || [] };
                  }
                  return msg;
                });
              });
            }
          );
          unsubscribeReactionsRef.current = unsubscribeReactions;
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load conversation');
        setLoading(false);
      }
    };

    loadData();

    // Cleanup function
    return () => {
      if (unsubscribeReactionsRef.current) {
        unsubscribeReactionsRef.current();
        unsubscribeReactionsRef.current = null;
      }
    };
  }, [account?.id, chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
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
      await sendMessage(conversation.id, messageText.trim(), account.id, replyToMessage?.id, pendingMedia.length > 0 ? pendingMedia : undefined);
      setMessageText("");
      setReplyToMessage(null);
      setPendingMedia([]);
    }
  };

  // Message action handlers
  const handleMessageLongPress = (message: SimpleMessage) => {
    setSelectedMessage(message);
  };

  const handleReply = (message: SimpleMessage) => {
    setReplyToMessage(message);
    setSelectedMessage(null);
  };

  const handleCopy = (message: SimpleMessage) => {
    navigator.clipboard.writeText(message.text || '');
  };

  const handleDelete = async (message: SimpleMessage) => {
    if (account?.id) {
      await simpleChatService.deleteMessage(message.id, account.id);
    }
  };

  const handleReact = async (message: SimpleMessage, emoji: string) => {
    if (account?.id) {
      await simpleChatService.addReaction(message.id, account.id, emoji);
    }
  };

  const handleMediaSelected = (urls: string[]) => {
    setPendingMedia(urls);
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const cancelMedia = () => {
    setPendingMedia([]);
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
      className="bg-white relative h-screen" 
      style={{ 
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        backgroundColor: 'white'
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
        className="bg-white fixed left-0 right-0 z-20"
        style={{ 
          paddingTop: '50px',
          top: '0px',
          backgroundColor: 'white',
          height: '132px'
        }}
        ref={(el) => {
          if (el) {
            console.log('🔍 Header height calculation:', {
              offsetHeight: el.offsetHeight,
              paddingTop: el.style.paddingTop,
              computedHeight: window.getComputedStyle(el).height,
              styleHeight: el.style.height
            });
          }
        }}
      >
        {/* Header Row - All elements on same horizontal line */}
        <div className="px-4 lg:px-6 py-3 flex items-center justify-center">
          {/* Back Button */}
          <button
            onClick={() => router.push('/chat')}
            className="p-2 rounded-full hover:bg-gray-100 absolute left-4"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Profile Card - Centered and narrower */}
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
            className="bg-white border border-gray-200 rounded-lg px-6 py-2 flex items-center gap-3 shadow-sm hover:bg-gray-50 transition-colors max-w-xs"
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
            <div className="text-center">
              <div className="font-semibold text-gray-900">{conversation.title}</div>
            </div>
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

      {/* Reply Preview - Only show when actually replying */}
      {replyToMessage && (
        <div 
          className="bg-gray-50 border-t border-gray-200 px-4 fixed left-0 right-0 z-30"
          style={{ 
            height: '60px', 
            paddingTop: '8px', 
            paddingBottom: '8px',
            bottom: '80px'
          }}
        >
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">
                Replying to {replyToMessage.sender_name}
              </div>
              <div className="text-sm text-gray-800 truncate">
                {replyToMessage.text || 'Media message'}
              </div>
            </div>
            <button
              onClick={cancelReply}
              className="ml-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}


      {/* Fixed Input */}
      <div 
        className="bg-white border-t border-gray-200 px-4 fixed left-0 right-0 z-20"
        style={{ 
          height: '80px', 
          paddingTop: '8px', 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          bottom: '0px',
          backgroundColor: 'white'
        }}
        ref={(el) => {
          if (el) {
            console.log('🔍 Input area height calculation:', {
              offsetHeight: el.offsetHeight,
              styleHeight: el.style.height,
              computedHeight: window.getComputedStyle(el).height,
              paddingBottom: el.style.paddingBottom
            });
          }
        }}
      >
        <div className="flex items-center gap-3">
          {/* Add/Media Button - White card with icon */}
          <button
            onClick={() => {
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              fileInput?.click();
            }}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white text-gray-900 hover:bg-gray-50 transition-colors border-[0.4px] border-[#E5E7EB]"
            title="Add photos or videos"
            style={{
              boxShadow: `
                0 0 1px rgba(100, 100, 100, 0.25),
                inset 0 0 2px rgba(27, 27, 27, 0.25)
              `
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          {/* Hidden file input for media upload */}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={async (event) => {
              const files = event.target.files;
              if (!files || files.length === 0) return;

              try {
                const urls: string[] = [];
                for (const file of Array.from(files)) {
                  // Simple file handling - you can enhance this with actual upload logic
                  const url = URL.createObjectURL(file);
                  urls.push(url);
                }
                handleMediaSelected(urls);
              } catch (error) {
                console.error('Media selection error:', error);
              }
            }}
            className="hidden"
          />
          
          {/* Input field - 44px height with centered text */}
          <div className="flex-1 relative flex items-center">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder=""
              className="w-full h-11 px-4 bg-white rounded-full border-[0.4px] border-[#E5E7EB] focus:outline-none focus:border-[0.8px] focus:border-[#D1D5DB] focus:bg-white transition-all duration-200 resize-none text-sm text-black caret-black"
              style={{
                margin: 0,
                paddingTop: '10px',
                paddingBottom: '10px',
                lineHeight: '1.2',
                boxSizing: 'border-box',
                verticalAlign: 'middle',
                boxShadow: `
                  0 0 1px rgba(100, 100, 100, 0.25),
                  inset 0 0 2px rgba(27, 27, 27, 0.25)
                `
              }}
              onFocus={(e) => e.target.style.boxShadow = `0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)`}
              onBlur={(e) => e.target.style.boxShadow = `0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)`}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && messageText.trim()) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          
          {/* Send Button - White card that turns black when active */}
          <button
            onClick={handleSendMessage}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors border-[0.4px] border-[#E5E7EB] ${
              messageText.trim() || pendingMedia.length > 0
                ? "bg-gray-900 text-white hover:bg-gray-800" 
                : "bg-white text-gray-400 cursor-not-allowed"
            }`}
            style={{
              boxShadow: `
                0 0 1px rgba(100, 100, 100, 0.25),
                inset 0 0 2px rgba(27, 27, 27, 0.25)
              `
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 17a1 1 0 01-1-1V6.414l-2.293 2.293a1 1 0 11-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Section - Scrollable messages area */}
      <div 
        className="px-4 overflow-y-auto bg-white"
        style={{
          height: 'calc(100vh - 200px)', // Header (132px) + Input (80px) = 212px, but using 200px to eliminate gap
          paddingTop: '16px', // Add space at top for first message
          paddingBottom: '16px', // Add space at bottom for last message
          position: 'relative',
          overflowY: 'scroll',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: 'white',
          top: '132px' // Position below the header
        }}
        ref={(el) => {
          if (el) {
            console.log('🔍 Chat container height calculation:', {
              viewportHeight: window.innerHeight,
              dvh: window.innerHeight,
              calculatedHeight: window.innerHeight - 200,
              actualHeight: el.offsetHeight,
              style: el.style.height,
              computedStyle: window.getComputedStyle(el).height,
              top: el.style.top,
              paddingTop: el.style.paddingTop,
              paddingBottom: el.style.paddingBottom
            });
          }
        }}
      >
        {messages.map((message, index) => {
          const isMe = message.sender_id === account?.id;
          return (
            <div key={message.id} style={{ marginBottom: index < messages.length - 1 ? '12px' : '12px' }}>
              <MessageBubble
                ref={(el) => {
                  if (selectedMessage?.id === message.id && el) {
                    setSelectedMessageElement(el);
                  }
                }}
                message={message}
                isMe={isMe}
                isSelected={selectedMessage?.id === message.id}
                participants={participants}
                onLongPress={handleMessageLongPress}
                onReactionClick={handleReact}
                onProfileClick={(userId) => router.push(`/chat/profile?user=${userId}`)}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} style={{ height: '0px', margin: '0px', padding: '0px' }} />
      </div>

      {/* Message Action Modal */}
      <MessageActionModal
        selectedMessage={selectedMessage}
        messageElement={selectedMessageElement}
        onClose={() => {
          setSelectedMessage(null);
          setSelectedMessageElement(null);
        }}
        onReply={handleReply}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onReact={handleReact}
        isMe={selectedMessage?.sender_id === account?.id}
      />

    </div>
  );
}