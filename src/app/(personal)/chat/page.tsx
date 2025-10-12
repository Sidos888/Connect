"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import MobileTitle from "@/components/MobileTitle";
import { useAppStore } from "@/lib/store";
import type { Conversation } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import ChatLayout from "./ChatLayout";
import PersonalChatPanel from "./PersonalChatPanel";
import { useAuth } from "@/lib/authContext";
import { useModal } from "@/lib/modalContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NewMessageModal from "@/components/chat/NewMessageModal";
import GroupSetupModal from "@/components/chat/GroupSetupModal";
import { Plus, ArrowLeft } from "lucide-react";

export default function MessagesPage() {
  const { conversations, loadConversations, isHydrated, setConversations, getConversations } = useAppStore();
  const router = useRouter();
  const { account, chatService } = useAuth();
  const { showAddFriend } = useModal();
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get("chat");
  
  // Find the selected conversation
  const selectedConversation = selectedChatId ? conversations.find(c => c.id === selectedChatId) : null;
  
  // Mobile-specific state
  const [mobileActiveCategory, setMobileActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const { showLogin } = useModal();
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showGroupSetupModal, setShowGroupSetupModal] = useState(false);

  // Load specific chat if requested but not in conversations list
  useEffect(() => {
    const loadSpecificChat = async () => {
      if (selectedChatId && !selectedConversation && account?.id && isHydrated) {
        try {
          const { chat, error } = await simpleChatService.getChatById(selectedChatId);
          if (error) {
            console.error('Error loading specific chat:', error);
            // Don't crash the app, just log the error
            return;
          }
          if (chat && !error) {
            // Add the chat to conversations if it's not already there
            const currentConversations = getConversations();
            const existingChat = currentConversations.find(c => c.id === selectedChatId);
            if (!existingChat) {
              const otherParticipant = chat.participants.find(p => p.id !== account.id);
              const newConversation = {
                id: chat.id,
                title: chat.type === 'direct' 
                  ? otherParticipant?.name || 'Unknown User'
                  : chat.name || 'Group Chat',
                avatarUrl: chat.type === 'direct' 
                  ? otherParticipant?.profile_pic || null
                  : chat.photo || null,
                isGroup: chat.type === 'group',
                unreadCount: 0,
                messages: []
              };
              setConversations([...currentConversations, newConversation]);
            }
          } else {
            console.error('Error loading specific chat:', error);
          }
        } catch (error) {
          console.error('Error in loadSpecificChat:', error);
        }
      }
    };

    loadSpecificChat();
  }, [selectedChatId, selectedConversation, account?.id, isHydrated, setConversations, getConversations]);

  useEffect(() => {
    if (isHydrated && account?.id && chatService) {
      // Use real chat service
      loadConversations(account.id, chatService);
    } else if (isHydrated && !account?.id) {
    }
  }, [isHydrated, account?.id, loadConversations, chatService]);

  // Handle keyboard behavior on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      // Prevent the page from sliding up when keyboard appears
      const preventPageSlide = () => {
        // Lock the body in place
        document.body.style.position = 'fixed';
        document.body.style.top = '0';
        document.body.style.left = '0';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
      };

      // Restore normal behavior when keyboard hides
      const restorePageSlide = () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
      };

      // Listen for focus events on input elements
      const handleInputFocus = () => {
        preventPageSlide();
      };

      const handleInputBlur = () => {
        // Delay to ensure keyboard is fully hidden
        setTimeout(restorePageSlide, 300);
      };

      // Add event listeners to all input elements
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('blur', handleInputBlur);
      });

      // Cleanup
      return () => {
        inputs.forEach(input => {
          input.removeEventListener('focus', handleInputFocus);
          input.removeEventListener('blur', handleInputBlur);
        });
      };
    }
  }, []);

  // Add another effect to log when conversations change
  useEffect(() => {
  }, [conversations]);


  // Modal handlers
  const handleNewMessageComplete = (chatId: string) => {
    setShowNewMessageModal(false);
    setShowGroupSetupModal(false);
    // Refresh conversations to include the new chat
    if (account?.id && chatService) {
      loadConversations(account.id, chatService);
    }
    // Navigate to the main chat page (desktop layout)
    router.push(`/chat?chat=${chatId}`);
  };

  const handleNewMessageClose = () => {
    setShowNewMessageModal(false);
    setShowGroupSetupModal(false);
  };

  const handleNewMessageClick = () => {
    setShowNewMessageModal(true);
  };


  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getLastMessage = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) return "No messages yet";
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    
    // Check if message has attachments
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      const attachment = lastMessage.attachments[0];
      const mediaType = attachment.file_type === 'video' ? 'video' : 'photo';
      const mediaIcon = attachment.file_type === 'video' ? '🎥' : '📷';
      
      // For group chats, include sender name
      if (conversation.isGroup && lastMessage.senderName) {
        return `${lastMessage.senderName}: ${mediaIcon} ${mediaType}`;
      }
      
      return `${mediaIcon} ${mediaType}`;
    }
    
    // For text messages in group chats, include sender name
    if (conversation.isGroup && lastMessage.senderName && lastMessage.text) {
      return `${lastMessage.senderName}: ${lastMessage.text}`;
    }
    
    // If message has text, show it
    if (lastMessage.text && lastMessage.text.trim()) {
      return lastMessage.text;
    }
    
    // If no text and no attachments, show "No messages yet"
    return "No messages yet";
  };

  const getLastMessageTime = (conversation: { messages: Array<{ createdAt: string }> }) => {
    if (!conversation.messages || conversation.messages.length === 0) return "";
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.createdAt ? formatTime(lastMessage.createdAt) : "";
  };

  // Mobile category filtering
  const getMobileFilteredConversations = () => {
    const filtered = conversations.filter(conv => 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (mobileActiveCategory) {
      case "unread":
        return filtered.filter(conv => conv.unreadCount > 0);
      case "dm":
        return filtered.filter(conv => !conv.isGroup);
      case "group":
        return filtered.filter(conv => conv.isGroup);
      default:
        return filtered;
    }
  };

  const filteredMobileConversations = getMobileFilteredConversations();

  // Mobile category counts
  const getMobileCategoryCounts = () => {
    const unreadCount = conversations.filter(conv => conv.unreadCount > 0).length;
    const dmCount = conversations.filter(conv => !conv.isGroup).length;
    const groupCount = conversations.filter(conv => conv.isGroup).length;
    
    return { unreadCount, dmCount, groupCount };
  };

  const { unreadCount: mobileUnreadCount, dmCount: mobileDmCount, groupCount: mobileGroupCount } = getMobileCategoryCounts();

  const mobileCategoriesTop = [
    { id: "all", label: "All", count: null },
    { id: "unread", label: "Unread", count: mobileUnreadCount },
  ];

  const mobileCategoriesBottom = [
    { id: "dm", label: "DM", count: mobileDmCount },
    { id: "group", label: "Groups", count: mobileGroupCount },
  ];

  // Force hydration immediately to prevent loading state issues
  useEffect(() => {
    if (!isHydrated) {
      useAppStore.setState({ isHydrated: true });
    }
  }, [isHydrated]);



  // Show chat content if authenticated
  return (
    <ProtectedRoute title="Chats" description="Log in / sign up to view your chats and messages" buttonText="Log in">
      <div className="h-full bg-white">
        {/* Desktop Layout */}
        <div className="hidden sm:block h-full">
          <ChatLayout />
        </div>

        {/* Mobile Layout - Locked viewport to prevent keyboard scroll */}
        <div 
          className="sm:hidden bg-white chat-mobile-container"
          style={{ 
            position: 'fixed !important',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: '100vh',
            height: '100dvh',
            overflow: 'hidden !important',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        >
          {/* Mobile Title - Absolutely positioned header */}
          <div 
            className="absolute top-0 left-0 right-0 z-50"
            style={{
              zIndex: 60,
              backgroundColor: 'white',
              height: '96px'
            }}
          >
            <div className="pt-safe-top px-4 pb-2 pt-8 bg-white h-full flex items-end">
              <div className="flex items-center justify-between w-full h-full">
                <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
                <div className="flex items-center justify-center h-full min-w-[40px] relative z-10">
                  <button
                    onClick={handleNewMessageClick}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            {/* Horizontal line below title section */}
            <div className="absolute left-0 right-0 border-b border-gray-200" style={{ bottom: '0px' }}></div>
          </div>

          {/* Content Area - Scrollable within fixed container */}
          <div 
            className="absolute left-0 right-0 overflow-y-auto"
            style={{
              top: '96px',
              bottom: '0px',
              padding: '24px 16px'
            }}
          >
            {/* Search Bar - Full width */}
            <div className="mb-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-0 placeholder:text-neutral-400 transition-all duration-200"
                  style={{
                    fontSize: '16px', // Prevents zoom on iOS
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                  }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'}
                  onBlur={(e) => e.target.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Category Pills - Full width with gap matching cards */}
            <div className="mb-2">
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1 -mx-1">
                
                {[...mobileCategoriesTop, ...mobileCategoriesBottom].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setMobileActiveCategory(category.id)}
                    className="inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: mobileActiveCategory === category.id ? '#D1D5DB' : '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: mobileActiveCategory === category.id 
                        ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      color: mobileActiveCategory === category.id ? '#111827' : '#374151'
                    }}
                  >
                    <span className="text-sm font-medium leading-none">{category.label}</span>
                    {category.count !== null && (
                      <span className={`ml-2 text-xs leading-none ${
                        mobileActiveCategory === category.id 
                          ? 'text-neutral-700' 
                          : 'text-neutral-500'
                      }`}>
                        {category.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat List - Full width */}
            <div className="space-y-2">
              {filteredMobileConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <p className="text-gray-500 text-lg">
                    {account?.id ? "No chats yet" : "Please log in to see your chats"}
                  </p>
                  <BearEmoji size="6xl" />
                </div>
              ) : (
                filteredMobileConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/chat?chat=${conversation.id}`);
                    }}
                    className="p-4 rounded-xl cursor-pointer transition-all duration-200 bg-white"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: selectedChatId === conversation.id ? '#D1D5DB' : '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: selectedChatId === conversation.id 
                        ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={conversation.avatarUrl}
                        name={conversation.title}
                        size={48}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {conversation.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {getLastMessageTime(conversation)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {getLastMessage(conversation) || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <NewMessageModal
          isOpen={showNewMessageModal}
          onClose={handleNewMessageClose}
          onComplete={handleNewMessageComplete}
          onShowGroupSetup={() => setShowGroupSetupModal(true)}
        />
        <GroupSetupModal
          isOpen={showGroupSetupModal}
          onClose={handleNewMessageClose}
          onComplete={handleNewMessageComplete}
        />
      </div>
    </ProtectedRoute>
  );
}


