"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useAppStore } from "@/lib/store";
import { ArrowLeft } from "lucide-react";
import MessageBubble from "@/components/chat/MessageBubble";
import MessageActionModal from "@/components/chat/MessageActionModal";
import MediaUploadButton, { UploadedMedia } from "@/components/chat/MediaUploadButton";
import MediaPreview from "@/components/chat/MediaPreview";
import GalleryModal from "@/components/chat/GalleryModal";
import MediaViewer from "@/components/chat/MediaViewer";
import type { SimpleMessage, MediaAttachment } from "@/lib/types";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";

export default function IndividualChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
  // Removed old store methods - using chatService directly
  type Participant = { id: string; name: string; profile_pic?: string | null };
  type ConversationLite = { id: string; title: string; avatarUrl: string | null; isGroup: boolean };
  type ChatMessage = { id: string; text: string; sender_id: string };

  const [conversation, setConversation] = useState<ConversationLite | null>(null);
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
  const [pendingMedia, setPendingMedia] = useState<UploadedMedia[]>([]);
  const unsubscribeReactionsRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);

  // FIX: Set body background to transparent to prevent white overlay
  useEffect(() => {
    // Store original background
    const originalBackground = document.body.style.background;
    const originalBackgroundColor = document.body.style.backgroundColor;
    
    // Set body background to transparent
    document.body.style.background = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    
    // Cleanup: restore original background on unmount
    return () => {
      document.body.style.background = originalBackground;
      document.body.style.backgroundColor = originalBackgroundColor;
    };
  }, []);
  
  // Media viewer states
  const [showGallery, setShowGallery] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState<SimpleMessage | null>(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [allChatMedia, setAllChatMedia] = useState<MediaAttachment[]>([]);

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
        // Load conversation from database
        if (!chatService) {
          console.error('IndividualChatPage: ChatService not available');
          setError('Chat service not available');
          setLoading(false);
          return;
        }
        
        const { chat, error: chatError } = await chatService.getChatById(chatId);
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
            ? (otherParticipant?.name || 'Unknown User')
            : (chat.name || 'Group Chat'),
          avatarUrl: chat.type === 'direct' 
            ? (otherParticipant?.profile_pic || null)
            : (chat.photo || null),
          isGroup: chat.type === 'group'
        };

        console.log('Individual chat page: Chat data loaded from database:', chat);
        console.log('Individual chat page: Conversation avatarUrl:', conversation.avatarUrl);
        console.log('Individual chat page: Conversation isGroup:', conversation.isGroup);
        setConversation(conversation);

        // Load messages
        if (chatService) {
          const { messages: chatMessages, error: messagesError } = await chatService.getChatMessages(chatId, 50, 0);
          if (!messagesError && chatMessages) {
            setMessages(chatMessages);
          } else if (messagesError) {
            console.error('Error loading messages:', messagesError);
          }
        }

        // Load all chat media for the viewer
        if (chatService) {
          try {
            const { media, error: mediaError } = await chatService.getChatMedia(chatId);
            if (!mediaError && media) {
              setAllChatMedia(media);
            }
          } catch (error) {
            console.error('Failed to load chat media:', error);
            // Don't fail the entire chat load if media loading fails
          }
        }

        setLoading(false);

        // TODO: Add reaction subscriptions when implemented
        // Reactions feature not yet implemented in ChatService

        // Subscribe to real-time messages for this chat
        if (chatId && account?.id && chatService) {
          console.log('Individual chat page: Subscribing to real-time messages for chat:', chatId);
          const unsubscribeMessages = chatService.subscribeToChat(
            chatId,
            (newMessage: SimpleMessage) => {
              console.log('Individual chat page: New message received:', newMessage);
              setMessages(prev => {
                // Check if message already exists to avoid duplicates
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) {
                  console.log('Individual chat page: Message already exists, skipping');
                  return prev;
                }
                console.log('Individual chat page: Adding new message to list');
                return [...prev, newMessage];
              });
            }
          );
          
          // Store the unsubscribe function in ref for cleanup
          unsubscribeMessagesRef.current = unsubscribeMessages;
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
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
    };
  }, [account?.id, chatId]);

  // Scroll to bottom when messages change or when loading completes
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          } else if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
          }
        }, 50);
      });
    }
  }, [messages, loading]);

  // Mark messages as read when chat is loaded
  useEffect(() => {
    if (!hasMarkedAsRead.current && account?.id && chatId && conversation && chatService) {
      chatService.markMessagesAsRead(chatId, account.id);
      hasMarkedAsRead.current = true;
    }
  }, [conversation, chatId, account?.id, chatService]);


  // Handle sending messages
  const handleSendMessage = async () => {
    if ((messageText.trim() || pendingMedia.length > 0) && account?.id && conversation?.id && chatService) {
      try {
        // Convert pendingMedia to MediaAttachment format
        // Note: UploadedMedia needs to be uploaded first, then we get URLs
        // For now, we'll send the message without attachments and handle upload separately
        const attachments: MediaAttachment[] = [];

        // Send message with attachments
        const { message: newMessage, error: messageError } = await chatService.sendMessage(
          conversation.id,
          messageText.trim() || '',
          attachments.length > 0 ? attachments : undefined
        );

        if (messageError || !newMessage) {
          console.error('Failed to send message:', messageError);
          return;
        }

        // Add message to local state immediately (optimistic update)
        setMessages(prev => [...prev, newMessage]);

        // Clear the form
        setMessageText("");
        setReplyToMessage(null);
        setPendingMedia([]);

        // Refresh messages to show the new message with attachments
        const { messages: updatedMessages } = await chatService?.getChatMessages(conversation.id);
        if (updatedMessages) {
          setMessages(updatedMessages);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
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

  const handleDelete = async (messageId: string) => {
    // TODO: Implement deleteMessage in ChatService
    console.log('Delete message not yet implemented:', messageId);
  };

  const handleDeleteFromModal = async (message: SimpleMessage) => {
    // Wrapper for MessageActionModal which expects SimpleMessage
    await handleDelete(message.id);
  };

  const handleReact = async (message: SimpleMessage, emoji: string) => {
    // TODO: Implement addReaction in ChatService
    console.log('Add reaction not yet implemented:', message.id, emoji);
  };

  const handleMediaSelected = (media: UploadedMedia[]) => {
    setPendingMedia(media);
  };

  const handleRemoveMedia = (index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = (message: SimpleMessage) => {
    setGalleryMessage(message);
    setShowGallery(true);
  };

  const handleGalleryImageClick = (index: number) => {
    // Find the starting index in allChatMedia for this message's attachments
    let startIndex = 0;
    for (let i = 0; i < allChatMedia.length; i++) {
      if (allChatMedia[i].id === galleryMessage?.attachments?.[0]?.id) {
        startIndex = i;
        break;
      }
    }
    
    setViewerStartIndex(startIndex + index);
    setShowMediaViewer(true);
    setShowGallery(false);
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

  // Profile card component for leftSection
  const profileCard = (
    <button 
      onClick={() => {
        if (!conversation.isGroup) {
          const otherParticipant = participants.find((p: any) => p.id !== account?.id);
          if (otherParticipant) {
            router.push(`/chat/profile?userId=${otherParticipant.id}`);
          }
        } else {
          router.push(`/chat/profile?chatId=${conversation.id}`);
        }
      }}
      className="absolute left-1/2 transform -translate-x-1/2 flex items-center"
      style={{
        top: '0', // Align with back button top position
        padding: '6px 12px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.96)',
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        willChange: 'transform, box-shadow',
        maxWidth: '240px',
        height: '44px', // Match back button height (44px on mobile)
        display: 'flex',
        alignItems: 'center', // Center content vertically within the button
        gap: '8px' // Space between avatar and text
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
      }}
    >
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
        {conversation.avatarUrl ? (
          <Image
            src={conversation.avatarUrl}
            alt={conversation.title}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 text-xs font-semibold">
            {conversation.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="text-left min-w-0 flex-1">
        <div className="font-semibold text-gray-900 text-xs truncate">{conversation.title}</div>
      </div>
    </button>
  );

  return (
    <div 
      className="relative h-screen" 
      style={{ 
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        background: 'transparent',
        zIndex: 1
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
      
      {/* PageHeader - Now safe to add back since we're using paddingTop instead of top offset */}
      <PageHeader
        title=""
        backButton={true}
        onBack={() => router.push('/chat')}
        leftSection={profileCard}
      />

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
                Replying to {replyToMessage.sender_name || 'Unknown'}
              </div>
              <div className="text-sm text-gray-800 truncate">
                {typeof replyToMessage.text === 'string' ? replyToMessage.text : 'Media message'}
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

      {/* Media Preview */}
      {pendingMedia.length > 0 && (
        <div className="fixed left-0 right-0 z-30 px-4" style={{ bottom: '80px' }}>
          <MediaPreview 
            pendingMedia={pendingMedia}
            onRemove={handleRemoveMedia}
          />
        </div>
      )}

      {/* Fixed Input - Just the three components, no overlay */}
      <div 
        className="fixed left-0 right-0 z-20"
        style={{ 
          left: '22px', // Match TabBar padding from explore page
          right: '22px', // Match TabBar padding from explore page
          bottom: 'max(env(safe-area-inset-bottom, 20px), 20px)', // Match TabBar positioning from explore page
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'transparent'
        }}
      >
        {/* Add Media Button */}
        <MediaUploadButton 
          onMediaSelected={handleMediaSelected}
          disabled={false}
        />
        
        {/* Input field */}
        <div className="flex-1 relative flex items-center">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder=""
            className="w-full h-11 bg-white rounded-full border-[0.4px] border-[#E5E7EB] focus:outline-none focus:border-[0.8px] focus:border-[#D1D5DB] focus:bg-white transition-all duration-200 resize-none text-sm text-black caret-black"
            style={{
              margin: 0,
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '16px',
              paddingRight: '46px', // Make room for send button (32px button + 6px spacing on right + 8px buffer)
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
          
          {/* Send Button - Inside input box */}
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() && pendingMedia.length === 0}
            className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              messageText.trim() || pendingMedia.length > 0
                ? "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer" 
                : "bg-white text-gray-400 cursor-not-allowed"
            }`}
            style={{
              top: '6px', // Even spacing from top (44px textarea - 32px button) / 2 = 6px
              right: '6px', // Even spacing from right to match top/bottom spacing
              border: messageText.trim() || pendingMedia.length > 0 
                ? '0.4px solid #E5E7EB' 
                : '0.4px solid #E5E7EB',
              boxShadow: `
                0 0 1px rgba(100, 100, 100, 0.25),
                inset 0 0 2px rgba(27, 27, 27, 0.25)
              `
            }}
            onMouseEnter={(e) => {
              if (messageText.trim() || pendingMedia.length > 0) {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 17a1 1 0 01-1-1V6.414l-2.293 2.293a1 1 0 11-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Section - Scrollable messages area - Use paddingTop instead of top offset to avoid white gap */}
      <div 
        className="px-4 overflow-y-auto"
        style={{
          height: '100vh', // Full viewport height - input overlays on top
          paddingTop: '126px', // Space for header (110px) + first message spacing (16px)
          paddingBottom: '80px', // Space for input area (80px) - creates scrollable space
          position: 'relative',
          overflowY: 'scroll',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: 'transparent'
          // NO top offset - use paddingTop instead to avoid creating white gap
          // Full height with paddingBottom ensures no gap at bottom
        }}
        ref={(el) => {
          messagesContainerRef.current = el;
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
                message={message}
                currentUserId={account?.id || ''}
                onReactionToggle={(emoji: string, msgId: string) => {
                  if (msgId === message.id) {
                    handleReact(message, emoji);
                  }
                }}
                onAttachmentClick={handleAttachmentClick}
                onReply={handleReply}
                onDelete={handleDelete}
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
        onDelete={handleDeleteFromModal}
        onReact={handleReact}
        isMe={selectedMessage?.sender_id === account?.id}
      />

      {/* Gallery Modal */}
      <GalleryModal 
        isOpen={showGallery}
        message={galleryMessage}
        onClose={() => setShowGallery(false)}
        onImageClick={handleGalleryImageClick}
      />

      {/* Media Viewer */}
      <MediaViewer
        isOpen={showMediaViewer}
        allMedia={allChatMedia}
        initialIndex={viewerStartIndex}
        onClose={() => setShowMediaViewer(false)}
      />

    </div>
  );
}