
"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import PersonalChatPanel from "./PersonalChatPanel";
import type { Conversation } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { useChats, useRefreshChats, useChatById } from "@/lib/chatQueries";
// Removed unused showAddFriend
import { useModal } from "@/lib/modalContext";
import InlineContactSelector from "@/components/chat/InlineContactSelector";
import InlineGroupSetup from "@/components/chat/InlineGroupSetup";
import { Plus, Image as ImageIcon } from "lucide-react";
import { formatMessageTimeShort } from "@/lib/messageTimeUtils";
import Loading8 from "@/components/Loading8";

const ChatLayoutContent = () => {
  const { account, user } = useAuth();
  const chatService = useChatService();
  const { data: chats = [], isLoading, error, refetch } = useChats(chatService, user?.id || null);
  
  // Log when chats data changes (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && chats.length > 0) {
    console.log('🔵 ChatLayout: chats data changed', {
        chatsCount: chats.length
    });
    }
  }, [chats]);
  
  const refreshChats = useRefreshChats();
  
  // Refetch chats when component mounts or when navigating back to chat page
  // This ensures chats are refreshed after sending a profile or other actions
  // NOTE: React Query already handles refetchOnMount, so this is only for explicit refresh scenarios
  useEffect(() => {
    // Only refetch if we have all required dependencies AND chats are empty (initial load)
    // This prevents excessive re-fetching when data already exists
    if (account?.id && chatService && user?.id && chats.length === 0 && !isLoading) {
      // Use refreshChats which properly invalidates and refetches
      refreshChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id, chatService, user?.id]); // Removed refreshChats and chats from deps to prevent loops
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
  const [typingUsersByChat, setTypingUsersByChat] = useState<Map<string, string[]>>(new Map());
  const typingUnsubscribesRef = useRef<Map<string, () => void>>(new Map());

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
      const trimmed = conversation.last_message.trim();
      
      // Log if it's a profile URL that should have been formatted
      if (/\/p\/([A-Z0-9]+)/i.test(trimmed)) {
        console.log('🔵 ChatLayout.getLastMessage: WARNING - Profile URL still in last_message!', {
          conversationId: conversation.id,
          lastMessage: trimmed,
          expectedFormat: 'Should be "Sent a profile" or "(Name): Sent a profile"'
        });
      }
      
      if (trimmed) {
        return trimmed;
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

  // Subscribe to typing indicators for all conversations
  useEffect(() => {
    if (!chatService || !account?.id) return;

    // Subscribe to typing indicators for each conversation
    chats.forEach((chat) => {
      // Skip if already subscribed
      if (typingUnsubscribesRef.current.has(chat.id)) return;

      const unsubscribe = chatService.subscribeToTyping(chat.id, (userIds) => {
        setTypingUsersByChat((prev) => {
          const newMap = new Map(prev);
          if (userIds.length > 0) {
            newMap.set(chat.id, userIds);
          } else {
            newMap.delete(chat.id);
          }
          return newMap;
        });
      });

      typingUnsubscribesRef.current.set(chat.id, unsubscribe);
    });

    // Cleanup: unsubscribe from conversations that no longer exist
    const currentChatIds = new Set(chats.map((c) => c.id));
    typingUnsubscribesRef.current.forEach((unsubscribe, chatId) => {
      if (!currentChatIds.has(chatId)) {
        unsubscribe();
        typingUnsubscribesRef.current.delete(chatId);
      }
    });

    return () => {
      // Cleanup on unmount
      typingUnsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      typingUnsubscribesRef.current.clear();
    };
  }, [chats, chatService, account?.id]);

  // Store chat data with participants for typing names
  const [chatsWithParticipants, setChatsWithParticipants] = useState<Map<string, any>>(new Map());
  
  useEffect(() => {
    // Store chats with participants for typing name lookup
    const newMap = new Map();
    chats.forEach((chat) => {
      newMap.set(chat.id, chat);
    });
    setChatsWithParticipants(newMap);
  }, [chats]);

  // Get typing user name from chat participants
  const getTypingUserName = useCallback((chatId: string, typingUserIds: string[]) => {
    if (typingUserIds.length === 0) return null;
    
    // Filter out current user from typing users
    const otherTypingUserIds = typingUserIds.filter(id => id !== account?.id);
    
    if (otherTypingUserIds.length === 0) return null;
    
    const chat = chatsWithParticipants.get(chatId);
    
    if (!chat || !chat.participants) return 'Someone';
    
    // Find the typing user from participants - check all possible ID fields
    const typingUserId = otherTypingUserIds[0];
    const typingUser = chat.participants.find((p: any) => 
      p.user_id === typingUserId || 
      p.id === typingUserId ||
      p.accounts?.id === typingUserId
    );
    
    // Get full name and extract first name only
    let fullName = '';
    if (typingUser?.user_name) {
      fullName = typingUser.user_name;
    } else if (typingUser?.name) {
      fullName = typingUser.name;
    } else if (typingUser?.accounts?.name) {
      fullName = typingUser.accounts.name;
    } else if (chat.type === 'direct') {
      // For direct chats, use the chat title (which is the other person's name)
      fullName = chat.title || 'Someone';
    } else {
      fullName = 'Someone';
    }
    
    // Extract first name only
    return fullName.split(' ')[0];
  }, [chatsWithParticipants, account?.id]);

  const getDisplayMessage = useCallback((conversation: Conversation) => {
    // Check if someone is typing
    const typingUserIds = typingUsersByChat.get(conversation.id) || [];
    
    if (typingUserIds.length > 0) {
      const typingUserName = getTypingUserName(conversation.id, typingUserIds);
      return `${typingUserName} is typing...`;
    }
    
    // Otherwise show the last message
    const lastMsg = getLastMessage(conversation);
    
    // Log if this conversation should have formatted text but doesn't
    if (conversation.last_message && typeof conversation.last_message === 'string') {
      if (/\/p\/([A-Z0-9]+)/i.test(conversation.last_message) && lastMsg === conversation.last_message) {
        console.log('🔵 ChatLayout.getDisplayMessage: ERROR - Profile URL not formatted!', {
          conversationId: conversation.id,
          last_message: conversation.last_message,
          returnedText: lastMsg
        });
      }
    }
    
    return lastMsg;
  }, [getLastMessage, typingUsersByChat, getTypingUserName]);

  // Helper component to render message with icon instead of emoji
  const MessageTextWithIcon = ({ text }: { text: string }) => {
    if (text.includes('📷')) {
      const parts = text.split('📷');
      return (
        <>
          {parts[0]}
          <ImageIcon size={16} strokeWidth={2.5} className="inline-block text-gray-500 align-middle" />
          {parts[1]}
        </>
      );
    }
    return <>{text}</>;
  };

  const getLastMessageTime = useCallback((conversation: Conversation) => {
    // Use the new last_message_at field from SimpleChat interface
    return conversation.last_message_at ? formatMessageTimeShort(conversation.last_message_at) : "";
  }, []);

  // Convert chats to conversations format for compatibility
  const conversations = useMemo(() => {
    // Reduced logging - only log in development and when there are actual changes
    if (process.env.NODE_ENV === 'development' && chats.length > 0) {
    console.log('🔵 ChatLayout: conversations useMemo running', {
        chatsCount: chats.length
    });
    }
    
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
      let lastMessageText: string = 'No messages yet';
      if (chat.last_message) {
        // Get attachment count - check both the field and query if needed
        const attachmentCount = chat.last_message.attachment_count ?? 0;
        const isFromCurrentUser = chat.last_message.sender_id === account.id;
        const fullName = chat.last_message.sender_name || 'Unknown';
        // Extract first name only
        const senderName = fullName.split(' ')[0];
        const messageText = chat.last_message.message_text || '';
        const hasText = messageText.trim().length > 0;
        const messageType = chat.last_message.message_type;
        
        // Check if message contains a profile URL pattern (check BEFORE other conditions)
        const profileUrlPattern = /\/p\/([A-Z0-9]+)/i;
        const hasProfileUrl = profileUrlPattern.test(messageText);
        
        // Priority 1: Listing message
        if (messageType === 'listing') {
          if (isFromCurrentUser) {
            // You sent it: "Sent a listing"
            lastMessageText = 'Sent a listing';
          } else {
            // Someone else sent it: "Name: Sent a listing"
            lastMessageText = `${senderName}: Sent a listing`;
          }
        } else if (hasProfileUrl) {
          // Priority 2: Profile message (detect /p/{connectId} pattern)
          // This check happens regardless of hasText, as profile URLs might be the only content
          if (isFromCurrentUser) {
            // You sent it: "Sent a profile"
            lastMessageText = 'Sent a profile';
            console.log('🔵 ChatLayout: Setting lastMessageText to "Sent a profile"', {
              chatId: chat.id,
              originalText: messageText
            });
          } else {
            // Someone else sent it: "Name: Sent a profile"
            lastMessageText = `${senderName}: Sent a profile`;
            console.log('🔵 ChatLayout: Setting lastMessageText to', lastMessageText, {
              chatId: chat.id,
              originalText: messageText
            });
          }
        } else if (hasText) {
          // Priority 3: Regular text message (no profile URL)
          if (isFromCurrentUser) {
            // You sent it: just show the message
            lastMessageText = messageText;
          } else {
            // Someone else sent it: "John: Hello whats up?"
            lastMessageText = `${senderName}: ${messageText}`;
          }
        } else if (attachmentCount > 0 || (!hasText && messageType === 'image')) {
          // Priority 4: If message has attachments, show attachment count with icon
          const count = attachmentCount > 0 ? attachmentCount : 1; // Default to 1 if message_type is image but no count
          if (isFromCurrentUser) {
            // You sent it: "3 📷 Attachments"
            lastMessageText = `${count} 📷 Attachment${count > 1 ? 's' : ''}`;
          } else {
            // Someone else sent it: "John 3 📷 Attachments"
            lastMessageText = `${senderName} ${count} 📷 Attachment${count > 1 ? 's' : ''}`;
          }
        } else if (messageType === 'image') {
          // Priority 4: Legacy image message (no attachment_count)
          if (isFromCurrentUser) {
          lastMessageText = '📷 Image';
          } else {
            lastMessageText = `${senderName} 📷 Image`;
          }
        }
      }
      
      // Log final formatted message for profile URLs
      if (chat.last_message?.message_text && /\/p\/([A-Z0-9]+)/i.test(chat.last_message.message_text)) {
        console.log('🔵 ChatLayout: Final formatted last message:', {
          chatId: chat.id,
          originalText: chat.last_message.message_text,
          formattedText: lastMessageText,
          isFromCurrentUser: chat.last_message.sender_id === account.id
        });
      }
      
      const conversation = {
        id: chat.id,
        title,
        avatarUrl,
        isGroup: chat.type === 'group',
        isArchived: chat.is_archived || false,
        unreadCount: chat.unread_count || 0,
        last_message: lastMessageText,
        last_message_at: chat.last_message_at,
        messages: [] // Empty array for compatibility
      };
      
      // Log if this conversation has a profile URL that was formatted
      if (chat.last_message?.message_text && /\/p\/([A-Z0-9]+)/i.test(chat.last_message.message_text)) {
        console.log('🔵 ChatLayout: Conversation created with formatted last_message:', {
          conversationId: conversation.id,
          last_message: conversation.last_message,
          originalMessageText: chat.last_message.message_text
        });
      }
      
      return conversation;
    });
  }, [chats, account?.id]);

  // Memoize filtered conversations to prevent recalculation on every render
  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter((conv: any) => 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (activeCategory) {
      case "unread":
        return filtered.filter((conv: any) => conv.unreadCount > 0 && !conv.isArchived);
      case "dm":
        return filtered.filter((conv: any) => !conv.isGroup && !conv.isArchived);
      case "group":
        return filtered.filter((conv: any) => conv.isGroup && !conv.isArchived);
      case "archived":
        return filtered.filter((conv: any) => conv.isArchived);
      default:
        // "all" shows only non-archived chats
        return filtered.filter((conv: any) => !conv.isArchived);
    }
  }, [conversations, searchQuery, activeCategory]);

  // Memoize category counts
  const { unreadCount, dmCount, groupCount, archivedCount } = useMemo(() => {
    const unreadCount = conversations.filter((conv: any) => conv.unreadCount > 0 && !conv.isArchived).length;
    const dmCount = conversations.filter((conv: any) => !conv.isGroup && !conv.isArchived).length;
    const groupCount = conversations.filter((conv: any) => conv.isGroup && !conv.isArchived).length;
    const archivedCount = conversations.filter((conv: any) => conv.isArchived).length;
    
    return { unreadCount, dmCount, groupCount, archivedCount };
  }, [conversations]);

  // Use React Query hook to fetch selected conversation (with caching)
  const { data: selectedChat, isLoading: isLoadingChat } = useChatById(chatService, selectedChatId);
  
  // Create a STABLE conversation object reference using useMemo
  const stableSelectedConversation = useMemo(() => {
    if (!selectedChat || !account?.id) {
      return null;
    }
    
    const stable = {
      id: selectedChat.id,
      title: selectedChat.name || 'Unknown Chat',
      avatarUrl: selectedChat.photo || null,
      isGroup: selectedChat.type === 'group',
      unreadCount: 0,
      messages: []
    };
    
    return stable;
  }, [selectedChat?.id, selectedChat?.name, selectedChat?.photo, selectedChat?.type, account?.id]);
  
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Check if we're on mobile (screen width < 640px which is sm breakpoint)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    if (isMobile) {
      // On mobile, navigate to the individual chat page
      router.push(`/chat/individual?chat=${chatId}`);
    } else {
      // On desktop, stay on the main chat page with selected chat
      router.push(`/chat?chat=${chatId}`);
    }
  };

  const categories = [
    { id: "all", label: "All", count: null },
    ...(unreadCount > 0 ? [{ id: "unread", label: "Unread", count: unreadCount }] : []),
    { id: "dm", label: "DM", count: dmCount },
    { id: "group", label: "Groups", count: groupCount },
    { id: "archived", label: "Archived", count: archivedCount },
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

                {/* Filter Pills Section - Desktop - Only show after data loads */}
                {!isLoading && (
                  <div className="py-3 bg-white mb-1" style={{ marginLeft: '-16px', marginRight: '-16px' }}>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ paddingTop: '2px', paddingBottom: '2px', paddingLeft: '20px', paddingRight: '20px' }}>
                    {categories.map((category) => {
                      const isActive = activeCategory === category.id;
                      return (
                        <div
                          key={category.id}
                          className="flex-shrink-0"
                          style={{
                            paddingLeft: isActive ? '2px' : '0',
                            paddingRight: isActive ? '2px' : '0',
                            paddingTop: isActive ? '2px' : '0',
                            paddingBottom: isActive ? '2px' : '0',
                          }}
                        >
                          <button 
                            onClick={() => setActiveCategory(category.id)} 
                            className="inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                            style={{
                              minHeight: isActive ? '44px' : '40px',
                              paddingLeft: isActive ? '18px' : '16px',
                              paddingRight: isActive ? '18px' : '16px',
                              paddingTop: isActive ? '12px' : '10px',
                              paddingBottom: isActive ? '12px' : '10px',
                              borderWidth: '0.4px',
                              borderColor: '#E5E7EB',
                              borderStyle: 'solid',
                              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                              color: isActive ? '#111827' : '#6B7280',
                              willChange: 'transform, box-shadow',
                              transform: isActive ? 'scale(1.05)' : 'scale(1)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                              e.currentTarget.style.transform = isActive ? 'scale(1.05) translateY(-1px)' : 'scale(1) translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                              e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1)';
                            }}
                          >
                            <span className="text-sm font-medium leading-none">{category.label}</span>
                            {category.count !== null && (
                              <span className={`ml-2 text-xs leading-none ${isActive ? 'text-neutral-700' : 'text-neutral-500'}`}>{category.count}</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}

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
                                  <div className="relative flex-shrink-0">
                                    <span 
                                      className="text-xs text-gray-500"
                                    >
                                      {getLastMessageTime(conversation)}
                                    </span>
                                    {conversation.unreadCount > 0 && (
                                      <div 
                                        className="absolute right-0 top-full mt-0.5 rounded-full flex items-center justify-center"
                                        style={{ 
                                          backgroundColor: '#EF4444', // red-500
                                          width: '20px',
                                          height: '20px',
                                          minWidth: '20px'
                                        }}
                                      >
                                        <span className="text-xs text-white font-medium leading-none">
                                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className={`text-xs leading-relaxed flex items-center gap-1 ${conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                  <span
                                    style={{
                                      maxWidth: 'calc(100% - 60px)', // Cut off about 60px before right edge
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-block',
                                      minWidth: 0 // Allow flex child to shrink
                                    }}
                                  >
                                  {(() => {
                                    const displayText = getDisplayMessage(conversation);
                                    // Log if this conversation has a profile URL that wasn't formatted
                                    if (conversation.last_message && typeof conversation.last_message === 'string' && /\/p\/([A-Z0-9]+)/i.test(conversation.last_message) && displayText === conversation.last_message) {
                                      console.log('🔵 ChatLayout: RENDERING - Profile URL not formatted!', {
                                        conversationId: conversation.id,
                                        last_message: conversation.last_message,
                                        displayText: displayText
                                      });
                                    }
                                    return <MessageTextWithIcon text={displayText} />;
                                  })()}
                                  </span>
                                </p>
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
        <Loading8 />
      </div>
    }>
      <ChatLayoutContent />
      {/* HappeningNowBanner removed - only show on initial inbox page (/chat/) */}
    </Suspense>
  );
};

export default ChatLayout;
