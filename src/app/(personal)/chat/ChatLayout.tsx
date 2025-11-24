
"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import PersonalChatPanel from "./PersonalChatPanel";
import type { Conversation } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useChats, useRefreshChats } from "@/lib/chatQueries";
// Removed unused showAddFriend
import { useModal } from "@/lib/modalContext";
import InlineContactSelector from "@/components/chat/InlineContactSelector";
import InlineGroupSetup from "@/components/chat/InlineGroupSetup";
import { Plus } from "lucide-react";
import { formatMessageTimeShort } from "@/lib/messageTimeUtils";

const ChatLayoutContent = () => {
  const { account, user } = useAuth();
  const chatService = useChatService();
  const { data: chats = [], isLoading, error, refetch } = useChats(chatService, user?.id || null);
  const refreshChats = useRefreshChats();
  useModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  
  const [showNewMessageSelector, setShowNewMessageSelector] = useState(false);
  const [showGroupSetup, setShowGroupSetup] = useState(false);
  type ConversationLite = { id: string; title: string; avatarUrl: string | null; isGroup: boolean; unreadCount: number; messages: Array<{ text: string; createdAt?: string }> } | null;
  type SelectedContact = { id: string; name: string; profile_pic?: string };
  const [selectedContactsForGroup, setSelectedContactsForGroup] = useState<SelectedContact[]>([]);

  // Show empty inbox immediately if not authenticated - no loading screen
  if (!account || !chatService) {
    return (
      <div className="flex h-full bg-white">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
            <button
              onClick={() => setShowNewMessageSelector(true)}
              className="p-0 bg-transparent"
            >
              <span className="action-btn-circle">
                <Plus className="w-5 h-5 text-gray-900" />
              </span>
            </button>
          </div>
          
          {/* Empty state */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <BearEmoji size="6xl" />
              <p className="text-gray-500 text-lg">Please log in to see your chats</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // React Query handles loading automatically - no manual useEffect needed!
  console.log('🔬 ChatLayout: React Query state:', {
    isLoading,
    hasError: !!error,
    chatCount: chats.length,
    hasAccount: !!account,
    hasChatService: !!chatService
  });

  // Handle mobile redirect
  useEffect(() => {
    if (selectedChatId && typeof window !== 'undefined' && window.innerWidth < 640) {
      router.push(`/chat/individual?chat=${selectedChatId}`);
    }
  }, [selectedChatId, router]);

  // React Query handles real-time updates automatically
  // No manual subscriptions needed!

  // Using the new intuitive time formatting utility
  // Memoize helper functions to prevent recreation on every render
  const getLastMessage = useCallback((conversation: Conversation) => {
    // Use last_message string if available (new format)
    if (conversation.last_message && typeof conversation.last_message === 'string') {
      if (conversation.last_message.trim()) {
        return conversation.last_message;
      }
      // Special case: if last_message is exactly "..." (failed attachment), show it
      if (conversation.last_message === "...") {
        return "...";
      }
    }
    
    // Fallback to messages array (old format)
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage.text && lastMessage.text.trim()) {
        return lastMessage.text;
      }
    }
    
    return "No messages yet";
  }, []);

  const getDisplayMessage = useCallback((conversation: Conversation) => {
    // For now, just show the last message - typing indicators will be added later with React Query
    return getLastMessage(conversation);
  }, [getLastMessage]);

  const getLastMessageTime = useCallback((conversation: Conversation) => {
    // Use the new last_message_at field from SimpleChat interface
    return conversation.last_message_at ? formatMessageTimeShort(conversation.last_message_at) : "";
  }, []);

  // Convert chats to conversations format for compatibility
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
        messages: [] // Empty array for compatibility
      };
    });
  }, [chats, account?.id]);

  // Memoize filtered conversations to prevent recalculation on every render
  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter((conv: any) => 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (activeCategory) {
      case "unread":
        return filtered.filter((conv: any) => conv.unreadCount > 0);
      case "dm":
        return filtered.filter((conv: any) => !conv.isGroup);
      case "group":
        return filtered.filter((conv: any) => conv.isGroup);
      default:
        return filtered;
    }
  }, [conversations, searchQuery, activeCategory]);

  // Memoize category counts
  const { unreadCount, dmCount, groupCount } = useMemo(() => {
    const unreadCount = conversations.filter((conv: any) => conv.unreadCount > 0).length;
    const dmCount = conversations.filter((conv: any) => !conv.isGroup).length;
    const groupCount = conversations.filter((conv: any) => conv.isGroup).length;
    
    return { unreadCount, dmCount, groupCount };
  }, [conversations]);

  // Fetch selected conversation from simple chat service
  // Store raw conversation data separately to prevent re-renders
  const [selectedConversationData, setSelectedConversationData] = useState<{
    id: string;
    title: string;
    avatarUrl: string | null;
    isGroup: boolean;
  } | null>(null);
  
  useEffect(() => {
    const fetchSelectedConversation = async () => {
      if (selectedChatId && chatService) {
        console.log('🔬 ChatLayout: Fetching selected conversation for chatId:', selectedChatId);
        console.log('🔬 ChatLayout: chatService available:', !!chatService);
        console.log('🔬 ChatLayout: account available:', !!account);
        const result = await chatService.getChatById(selectedChatId);
        console.log('🔬 ChatLayout: getChatById result:', { result, hasChat: !!result?.chat, hasError: !!result?.error });
        console.log('🔬 ChatLayout: Full result object:', result);
        if (!result) return;
        
        const { chat, error } = result;
        if (error) {
          console.error('ChatLayout: Error fetching chat:', error);
          setSelectedConversationData(null);
          return;
        }
        if (chat && account?.id) {
          console.log('🔬 ChatLayout: Chat data received:', chat);
          console.log('🔬 ChatLayout: Chat participants:', chat.participants);
          console.log('🔬 ChatLayout: Chat name:', chat.name);
          console.log('🔬 ChatLayout: Chat photo:', chat.photo);
          console.log('🔬 ChatLayout: Chat type:', chat.type);
          console.log('🔬 ChatLayout: Account ID:', account.id);
          
          // Store minimal data to prevent unnecessary re-renders
          const conversationData = {
            id: chat.id,
            title: chat.name || 'Unknown Chat',
            avatarUrl: chat.photo || null,
            isGroup: chat.type === 'event_group' || chat.type === 'group',
          };
          
          console.log('🔬 ChatLayout: Conversation data created:', conversationData);
          
          // Only update if data actually changed
          setSelectedConversationData(prev => {
            console.log('🔬 ChatLayout: Previous conversation data:', prev);
            if (!prev || prev.id !== conversationData.id) {
              console.log('🔬 ChatLayout: Updating conversation data');
              return conversationData;
            }
            console.log('🔬 ChatLayout: No update needed');
            return prev;
          });
        } else {
          console.log('🔬 ChatLayout: No chat or account, setting conversation data to null');
          setSelectedConversationData(null);
        }
      } else {
        setSelectedConversationData(null);
      }
    };

    fetchSelectedConversation();
  }, [selectedChatId, account?.id]);
  
  // Create a STABLE conversation object reference using useMemo
  const stableSelectedConversation = useMemo(() => {
    console.log('🔬 ChatLayout: Creating stable conversation from data:', selectedConversationData);
    if (!selectedConversationData) {
      console.log('🔬 ChatLayout: No conversation data, returning null');
      return null;
    }
    
    const stable = {
      id: selectedConversationData.id,
      title: selectedConversationData.title,
      avatarUrl: selectedConversationData.avatarUrl,
      isGroup: selectedConversationData.isGroup,
      unreadCount: 0,
      messages: []
    };
    
    console.log('🔬 ChatLayout: Stable conversation created:', stable);
    return stable;
  }, [selectedConversationData?.id, selectedConversationData?.title, selectedConversationData?.avatarUrl, selectedConversationData?.isGroup]);
  
  // Auto-select first conversation if none is selected and conversations exist - DISABLED TO TEST SLIDE-UP ISSUE
  // useEffect(() => {
  //   if (conversations.length > 0 && !selectedChatId && isHydrated) {
  //     console.log('Auto-selecting first conversation:', conversations[0].id);
  //     router.push(`/chat?chat=${conversations[0].id}`);
  //   }
  // }, [conversations, selectedChatId, router, isHydrated]);

  // Modal handlers
  const handleNewMessageComplete = (chatId: string) => {
    setShowNewMessageSelector(false);
    setShowGroupSetup(false);
    // Navigate to the chat within the same layout
    // The existing effect will refresh conversations automatically
    router.push(`/chat?chat=${chatId}`);
  };

  const handleNewMessageClose = () => {
    setShowNewMessageSelector(false);
    setShowGroupSetup(false);
  };

  const handleNewMessageClick = () => {
    setShowNewMessageSelector(true);
  };

  const handleGroupSetup = (selectedContacts: any[]) => {
    setSelectedContactsForGroup(selectedContacts);
    setShowNewMessageSelector(false);
    setShowGroupSetup(true);
  };

  const handleGroupSetupClose = () => {
    setShowGroupSetup(false);
    setSelectedContactsForGroup([]);
  };

  const handleSelectChat = (chatId: string, e?: React.MouseEvent | React.TouchEvent) => {
    console.log('🔬 ChatLayout: handleSelectChat called with chatId:', chatId);
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Check if we're on mobile (screen width < 640px which is sm breakpoint)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    console.log('🔬 ChatLayout: isMobile:', isMobile);
    
    if (isMobile) {
      // On mobile, navigate to the individual chat page
      console.log('🔬 ChatLayout: Navigating to mobile chat page:', `/chat/individual?chat=${chatId}`);
      router.push(`/chat/individual?chat=${chatId}`);
    } else {
      // On desktop, stay on the main chat page with selected chat
      console.log('🔬 ChatLayout: Navigating to desktop chat:', `/chat?chat=${chatId}`);
      router.push(`/chat?chat=${chatId}`);
    }
  };

  const categories = [
    { id: "all", label: "All", count: null },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "dm", label: "DM", count: dmCount },
    { id: "group", label: "Groups", count: groupCount },
  ];

  
  // Show inbox immediately with subtle loading indicator - no full screen loading

  return (
    <div className="chat-container flex h-full min-h-0 bg-white overflow-hidden relative">
      {/* Chat List Sidebar */}
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-white border-r border-gray-200 flex flex-col h-full min-h-0 overflow-hidden relative" style={{ borderRightWidth: '1px', borderRightColor: 'rgb(229 231 235)' }}>
        {showNewMessageSelector ? (
          <InlineContactSelector
            onClose={handleNewMessageClose}
            onComplete={handleNewMessageComplete}
            onShowGroupSetup={handleGroupSetup}
          />
        ) : showGroupSetup ? (
          <InlineGroupSetup
            selectedContacts={selectedContactsForGroup}
            onClose={handleGroupSetupClose}
            onComplete={handleNewMessageComplete}
          />
        ) : (
          <>
            {/* Desktop Layout */}
            <div className="hidden lg:block w-full lg:w-[380px] xl:w-[420px] bg-white border-r border-gray-200 flex flex-col h-full min-h-0 relative" style={{ borderRightWidth: '1px', borderRightColor: 'rgb(229 231 235)' }}>
              {/* Unified scroll container with sticky header */}
              <div className="flex-1 overflow-y-auto no-scrollbar min-h-0" style={{ height: 'calc(100vh - 0px)' }}>
                {/* Sticky header */}
                <div className="px-4 py-3 lg:p-6 border-b border-gray-200 bg-white sticky top-0 z-20">
                  <div className="flex items-center justify-between">
                    <h1 className="text-xl lg:text-3xl font-bold text-gray-900 transition-all">Chats</h1>
                    <button onClick={handleNewMessageClick} className="p-0 bg-transparent">
                      <span className="action-btn-circle">
                        <Plus className="w-5 h-5 text-gray-900" />
                      </span>
                    </button>
                  </div>
                </div>

                {/* Search Section - Desktop (double gap above, quarter gap below) */}
                <div className="px-4 pt-4 pb-1 lg:pt-6 lg:pb-1 bg-white relative z-10 mb-1">
                  <div className="relative">
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Search" 
                        className="w-full pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-0 placeholder:text-neutral-400 transition-all duration-200 bg-white"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          borderStyle: 'solid',
                          boxShadow: isSearchFocused 
                            ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                            : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        }}
                        onFocus={() => setIsSearchFocused(true)} 
                        onBlur={() => setIsSearchFocused(false)} 
                      />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Filter Pills Section - Desktop */}
                <div className="px-4 py-3 bg-white mb-1">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1 -mx-1">
                    {categories.map((category) => (
                      <button 
                        key={category.id} 
                        onClick={() => setActiveCategory(category.id)} 
                        className="inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: activeCategory === category.id ? '#D1D5DB' : '#E5E7EB',
                          borderStyle: 'solid',
                          boxShadow: activeCategory === category.id 
                            ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                            : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          color: activeCategory === category.id ? '#111827' : '#374151'
                        }}
                      >
                        <span className="text-sm font-medium leading-none">{category.label}</span>
                        {category.count !== null && (
                          <span className={`ml-2 text-xs leading-none ${activeCategory === category.id ? 'text-neutral-700' : 'text-neutral-500'}`}>{category.count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversations List */}
                <div className="bg-white mt-2 flex-1 min-h-0">
                  {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
                      <p className="text-gray-500 text-lg">{account?.id ? "No chats yet" : "Please log in to see your chats"}</p>
                      <BearEmoji size="4xl" />
                    </div>
                  ) : (
                    <div className="p-4 space-y-3 pb-32">
                      {filteredConversations.map((conversation: any) => (
                        <div key={conversation.id} onClick={(e) => handleSelectChat(conversation.id, e)} className="bg-white rounded-xl cursor-pointer w-full transition-all duration-200"
                          style={{
                            borderWidth: '0.4px',
                            borderColor: selectedChatId === conversation.id ? '#D1D5DB' : '#E5E7EB',
                            borderStyle: 'solid',
                            boxShadow: selectedChatId === conversation.id 
                              ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                              : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                          }}>
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="relative flex-shrink-0">
                                <Avatar src={conversation.avatarUrl ?? undefined} name={conversation.title} size={48} />
                                {conversation.unreadCount > 0 && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white font-medium">{conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}</span>
                                  </div>
                                )}
                              </div>

                              {/* Conversation Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">{conversation.title}</h3>
                                    {conversation.isGroup && (
                                      <div className="flex items-center justify-center w-4 h-4 bg-gray-100 rounded-full">
                                        <svg className="w-2.5 h-2.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 flex-shrink-0">{getLastMessageTime(conversation)}</span>
                                </div>
                                <p className={`text-xs truncate leading-relaxed ${conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{getDisplayMessage(conversation)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chat Panel - Hidden on mobile */}
      <div className="hidden sm:flex flex-1 flex-col h-full overflow-hidden">
        {stableSelectedConversation ? (
          <PersonalChatPanel key={stableSelectedConversation.id} conversation={stableSelectedConversation} />
        ) : (
          <div className="flex flex-col h-full bg-white">
            {/* Empty header to match PersonalChatPanel structure */}
            <div className="flex-shrink-0 px-6 py-4 bg-white">
              {/* Empty header space */}
            </div>
            
            {/* Empty State Content - matches PersonalChatPanel messages container */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">💬</div>
                <h2 className="text-xl font-semibold text-gray-900">Select a conversation</h2>
                <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

const ChatLayout = () => {
  return (
    <Suspense fallback={
      <div className="flex h-full bg-white items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <ChatLayoutContent />
    </Suspense>
  );
};

export default ChatLayout;
