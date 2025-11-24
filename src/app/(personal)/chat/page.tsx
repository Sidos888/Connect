"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import { useAppStore } from "@/lib/store";
import type { Conversation } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ChatLayout from "./ChatLayout";
import PersonalChatPanel from "./PersonalChatPanel";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useChats } from "@/lib/chatQueries";
import { useModal } from "@/lib/modalContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NewMessageModal from "@/components/chat/NewMessageModal";
import GroupSetupModal from "@/components/chat/GroupSetupModal";
import { Plus } from "lucide-react";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import ProfileModal from "@/components/profile/ProfileModal";

function MessagesPageContent() {
  const { isHydrated } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const { account, user } = useAuth();
  const chatService = useChatService();
  const { showAddFriend } = useModal();
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get("chat");
  
  // Use React Query to fetch chats
  const { data: chats = [], isLoading, error } = useChats(chatService, user?.id || null);
  
  // Convert chats to conversations format
  const conversations = useMemo(() => {
    if (!account?.id) return [];
    
    return chats.map(chat => {
      // For direct chats, find the other participant
      const otherParticipant = chat.type === 'direct' 
        ? chat.participants?.find((p: any) => p.user_id !== account.id)
        : null;
      
      // Determine title and avatar
      const title = chat.type === 'direct'
        ? (otherParticipant?.user_name || 'Unknown User')
        : (chat.name || 'Group Chat');
      
      const avatarUrl = chat.type === 'direct'
        ? (otherParticipant?.user_profile_pic || null)
        : (chat.photo || null); // Use group photo for group chats
      
      // Format last message
      let lastMessageText: string | undefined = undefined;
      if (chat.last_message) {
        if (chat.last_message.message_text) {
          lastMessageText = chat.last_message.message_text;
        } else if (chat.last_message.message_type === 'image') {
          lastMessageText = '📷 Image';
        }
      }
      
      return {
        id: chat.id,
        title,
        avatarUrl,
        isGroup: chat.type === 'event_group' || chat.type === 'group',
        unreadCount: chat.unread_count || 0,
        last_message: lastMessageText,
        last_message_at: chat.last_message_at,
        messages: []
      };
    });
  }, [chats, account?.id]);
  
  // Find the selected conversation
  const selectedConversation = selectedChatId ? conversations.find(c => c.id === selectedChatId) : null;
  
  // Mobile-specific state
  const [mobileActiveCategory, setMobileActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Lock body scroll on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) { // lg breakpoint
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  
  // Modal state
  const { showLogin } = useModal();
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showGroupSetupModal, setShowGroupSetupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load specific chat if requested but not in conversations list
  useEffect(() => {
    const loadSpecificChat = async () => {
      if (selectedChatId && !selectedConversation && account?.id && isHydrated && chatService) {
        try {
          const { chat, error } = await chatService.getChatById(selectedChatId);
          if (error) {
            console.error('Error loading specific chat:', error);
            // Don't crash the app, just log the error
            return;
          }
          if (chat && !error) {
            console.log('Chat loaded successfully:', chat.id);
            // React Query will handle the cache update automatically
          } else {
            console.error('Error loading specific chat:', error);
          }
        } catch (error) {
          console.error('Error in loadSpecificChat:', error);
        }
      }
    };

    loadSpecificChat();
  }, [selectedChatId, selectedConversation, account?.id, isHydrated, chatService]);

  // Note: loadConversations is called by ChatLayout, not here
  // Removed duplicate call to prevent parallel loads

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

  // Add another effect to log when chats change
  useEffect(() => {
    console.log('MessagesPage: chats changed:', chats);
  }, [chats]);


  // Modal handlers
  const handleNewMessageComplete = (chatId: string) => {
    setShowNewMessageModal(false);
    setShowGroupSetupModal(false);
    // Navigate to the main chat page (desktop layout)
    // ChatLayout will refresh chats via its own effect
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
    // Use last_message string if available (new format)
    if (conversation.last_message && typeof conversation.last_message === 'string') {
      if (conversation.last_message.trim()) {
        return conversation.last_message;
      }
    }
    
    // Fallback to messages array (old format)
    if (conversation.messages && conversation.messages.length > 0) {
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
    }
    
    return "No messages yet";
  };

  const getLastMessageTime = (conversation: Conversation) => {
    // Use last_message_at if available (new format)
    if (conversation.last_message_at) {
      return formatTime(conversation.last_message_at);
    }
    
    // Fallback to messages array (old format)
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      return lastMessage.createdAt ? formatTime(lastMessage.createdAt) : "";
    }
    
    return "";
  };

  // Mobile category filtering
  const getMobileFilteredConversations = () => {
    if (!conversations || !Array.isArray(conversations)) {
      console.warn('⚠️ getMobileFilteredConversations: conversations is not an array:', conversations);
      return [];
    }
    const filtered = conversations.filter(conv => 
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="hidden sm:block h-screen overflow-hidden" style={{ maxHeight: '100vh' }}>
          <ChatLayout />
        </div>

        {/* Mobile Layout - Connect design system */}
        <div className="sm:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
          <MobilePage>
            <PageHeader
              title="Chats"
              customBackButton={
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    padding: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  aria-label="Switch account"
                >
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden">
                  <Avatar 
                    src={account?.profile_pic} 
                    name={account?.name || ""} 
                    size={36} 
                  />
                </div>
                </button>
              }
              actions={[
                {
                  icon: <Plus size={20} className="text-gray-900" />,
                  onClick: () => setShowNewMessageModal(true),
                  label: "New message"
                }
              ]}
            />

            <div
              className="flex-1 px-4 lg:px-8 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto scrollbar-hide"
              style={{
                paddingTop: 'var(--saved-content-padding-top, 140px)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="space-y-6 pb-6">
                {/* Search Card */}
                <div
                  className="rounded-2xl bg-white px-4 py-4 transition-all duration-200"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search"
                      className="w-full pl-10 pr-2 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                      style={{
                        fontSize: '16px',
                        WebkitAppearance: 'none',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Category Pills */}
                <div>
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
                          color: mobileActiveCategory === category.id ? '#111827' : '#374151',
                          willChange: 'transform, box-shadow'
                        }}
                      >
                        <span className="text-sm font-medium leading-none">{category.label}</span>
                        {category.count !== null && (
                          <span
                            className={`ml-2 text-xs leading-none ${
                              mobileActiveCategory === category.id ? 'text-neutral-700' : 'text-neutral-500'
                            }`}
                          >
                            {category.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat List */}
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
                        className="p-4 rounded-2xl cursor-pointer transition-all duration-200 bg-white"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: selectedChatId === conversation.id ? '#D1D5DB' : '#E5E7EB',
                          borderStyle: 'solid',
                          boxShadow: selectedChatId === conversation.id
                            ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                            : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          willChange: 'transform, box-shadow'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = selectedChatId === conversation.id
                            ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                            : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
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
          </MobilePage>
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
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          name={account?.name || "User"}
          avatarUrl={account?.profile_pic}
          onViewProfile={() => router.push(`/profile?id=${account?.id}&from=${encodeURIComponent(pathname)}`)}
          onShareProfile={() => router.push(`/menu?view=share-profile&from=${encodeURIComponent(pathname)}`)}
          onAddBusiness={() => router.push('/create-business')}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
