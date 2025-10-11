
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import { useAppStore } from "@/lib/store";
import PersonalChatPanel from "./PersonalChatPanel";
import type { Conversation } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
// Removed unused showAddFriend
import { useModal } from "@/lib/modalContext";
import InlineContactSelector from "@/components/chat/InlineContactSelector";
import InlineGroupSetup from "@/components/chat/InlineGroupSetup";
import { Plus } from "lucide-react";
import { simpleChatService } from "@/lib/simpleChatService";
import { formatMessageTimeShort } from "@/lib/messageTimeUtils";

export default function ChatLayout() {
  const { conversations, loadConversations, isHydrated, getChatTyping, setConversations, getConversations } = useAppStore();
  const { account } = useAuth();
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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  type SelectedContact = { id: string; name: string; profile_pic?: string };
  const [selectedContactsForGroup, setSelectedContactsForGroup] = useState<SelectedContact[]>([]);

  useEffect(() => {
    if (isHydrated && account?.id) {
      console.log('Store hydrated, loading real conversations for user:', account.id);
      // Use real chat service
      loadConversations(account.id);
      
      // On mobile, if there's a selected chat in URL, redirect to individual page
      if (selectedChatId && typeof window !== 'undefined' && window.innerWidth < 640) {
        console.log('🔥 Mobile detected with selected chat, redirecting to individual page');
        router.push(`/chat/individual?chat=${selectedChatId}`);
      }
    } else if (isHydrated && !account?.id) {
      console.log('Store hydrated but no user authenticated, skipping conversation loading');
    }
  }, [isHydrated, account?.id, loadConversations, selectedChatId, router]);

  // Debug logging
  useEffect(() => {
    console.log('ChatLayout - conversations:', conversations);
    console.log('ChatLayout - selectedChatId:', selectedChatId);
    console.log('ChatLayout - searchParams:', searchParams.toString());
    console.log('ChatLayout - showNewMessageSelector:', showNewMessageSelector);
  }, [conversations, selectedChatId, searchParams, showNewMessageSelector]);

        // Subscribe to typing indicators for all conversations
        useEffect(() => {
          if (!account?.id || conversations.length === 0) return;

          console.log('ChatLayout: Setting up typing subscriptions for', conversations.length, 'conversations');
          
          const subscriptions: (() => void)[] = [];
          
          conversations.forEach((conversation: any) => {
            console.log('ChatLayout: Subscribing to typing for chat:', conversation.id);
            
            const unsubscribe = simpleChatService.subscribeToTyping(
              conversation.id,
              account.id,
              (typingUserIds) => {
                console.log('ChatLayout: Typing update for chat:', conversation.id, 'users:', typingUserIds);
                const { updateChatTyping } = useAppStore.getState();
                updateChatTyping(conversation.id, typingUserIds);
              }
            );
            
            subscriptions.push(unsubscribe);
          });
          
          return () => {
            console.log('ChatLayout: Cleaning up typing subscriptions');
            subscriptions.forEach(unsubscribe => unsubscribe());
          };
        }, [account?.id, conversations]);

        // Live-update conversation list ordering and previews on new messages
        useEffect(() => {
          if (!isHydrated || !account?.id || conversations.length === 0) return;

          const unsubscribes: Array<() => void> = [];
          conversations.forEach((conv: any) => {
            const off = simpleChatService.subscribeToMessages(conv.id, (newMessage) => {
              // Update last message preview and move conversation to top
              const current = getConversations();
              const updated = current.map((c: any) => {
                if (c.id !== conv.id) return c;
                const last = {
                  id: newMessage.id,
                  conversationId: conv.id,
                  sender: newMessage.sender_id === account.id ? 'me' as const : 'them' as const,
                  text: newMessage.text || '',
                  createdAt: newMessage.created_at,
                  read: newMessage.sender_id === account.id
                };
                return { ...c, messages: [...(c.messages || []), last] };
              });
              // Move the updated conversation to the top
              const sorted = updated.sort((a: any, b: any) => {
                const at = a.messages.length ? new Date(a.messages[a.messages.length - 1].createdAt).getTime() : 0;
                const bt = b.messages.length ? new Date(b.messages[b.messages.length - 1].createdAt).getTime() : 0;
                return bt - at;
              });
              setConversations(sorted);
            });
            unsubscribes.push(off);
          });

          return () => {
            unsubscribes.forEach(u => u());
          };
        }, [isHydrated, account?.id, conversations]);

  // Using the new intuitive time formatting utility

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

  const getDisplayMessage = (conversation: Conversation) => {
    // Check if anyone is typing in this chat
    const typingState = getChatTyping(conversation.id);
    
    if (typingState && typingState.typingUsers.length > 0 && !typingState.typingUsers.includes(account?.id || '')) {
      // Someone is typing - show typing indicator
      if (conversation.isGroup) {
        // For groups, show the first name of the person typing
        if (typingState.typingUsers.length === 1) {
          // For now, use a placeholder - we'll improve this with participant caching
          return "Someone: Typing...";
        } else {
          return `${typingState.typingUsers.length} people: Typing...`;
        }
      } else {
        // For DMs, just show "Typing..."
        return "Typing...";
      }
    }
    
    // No one is typing - show normal last message
    return getLastMessage(conversation);
  };

  const getLastMessageTime = (conversation: { messages: Array<{ createdAt: string }> }) => {
    if (!conversation.messages || conversation.messages.length === 0) return "";
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.createdAt ? formatMessageTimeShort(lastMessage.createdAt) : "";
  };

  // Category filtering
  const getFilteredConversations = () => {
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
  };

  const filteredConversations = getFilteredConversations();

  // Category counts
  const getCategoryCounts = () => {
    const unreadCount = conversations.filter((conv: any) => conv.unreadCount > 0).length;
    const dmCount = conversations.filter((conv: any) => !conv.isGroup).length;
    const groupCount = conversations.filter((conv: any) => conv.isGroup).length;
    
    return { unreadCount, dmCount, groupCount };
  };

  const { unreadCount, dmCount, groupCount } = getCategoryCounts();

  // Fetch selected conversation from simple chat service
  useEffect(() => {
    const fetchSelectedConversation = async () => {
      if (selectedChatId) {
        console.log('ChatLayout: Fetching conversation for chatId:', selectedChatId);
        const { chat } = await simpleChatService.getChatById(selectedChatId);
        if (chat && account?.id) {
          // Convert SimpleChat to Conversation format
          const conversation: Conversation = {
            id: chat.id,
            title: chat.type === 'direct' 
              ? chat.participants.find(p => p.id !== account.id)?.name || 'Unknown'
              : chat.name || 'Group Chat',
            avatarUrl: chat.type === 'direct' 
              ? chat.participants.find(p => p.id !== account.id)?.profile_pic || null
              : null,
            isGroup: chat.type === 'group',
            unreadCount: 0,
            messages: []
          };
          setSelectedConversation(conversation);
          console.log('ChatLayout: Set selected conversation:', conversation);
        } else {
          setSelectedConversation(null);
          console.log('ChatLayout: No conversation found for chatId:', selectedChatId);
        }
      } else {
        setSelectedConversation(null);
      }
    };

    fetchSelectedConversation();
  }, [selectedChatId, account?.id]);
  
  // Auto-select first conversation if none is selected and conversations exist - DISABLED TO TEST SLIDE-UP ISSUE
  // useEffect(() => {
  //   if (conversations.length > 0 && !selectedChatId && isHydrated) {
  //     console.log('Auto-selecting first conversation:', conversations[0].id);
  //     router.push(`/chat?chat=${conversations[0].id}`);
  //   }
  // }, [conversations, selectedChatId, router, isHydrated]);

  // Modal handlers
  const handleNewMessageComplete = (chatId: string) => {
    console.log('ChatLayout: handleNewMessageComplete called with chatId:', chatId);
    setShowNewMessageSelector(false);
    setShowGroupSetup(false);
    // Refresh conversations to include the new chat
    if (account?.id) {
      loadConversations(account.id);
    }
    // Navigate to the chat within the same layout
    console.log('Navigating to chat:', chatId);
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
    console.log('🔥 handleSelectChat called with chatId:', chatId);
    console.log('🔥 Window width:', typeof window !== 'undefined' ? window.innerWidth : 'N/A');
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Check if we're on mobile (screen width < 640px which is sm breakpoint)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    console.log('🔥 isMobile:', isMobile);
    
    if (isMobile) {
      // On mobile, navigate to the individual chat page
      console.log('🔥 Navigating to mobile chat page:', `/chat/individual?chat=${chatId}`);
      router.push(`/chat/individual?chat=${chatId}`);
    } else {
      // On desktop, stay on the main chat page with selected chat
      console.log('🔥 Navigating to desktop chat page:', `/chat?chat=${chatId}`);
      router.push(`/chat?chat=${chatId}`);
    }
  };

  const categories = [
    { id: "all", label: "All", count: null },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "dm", label: "DM", count: dmCount },
    { id: "group", label: "Groups", count: groupCount },
  ];

  
  // Show loading state while store is hydrating
  if (!isHydrated) {
    return (
      <div className="flex h-full bg-white items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500">Loading chats...</p>
          <p className="text-xs text-gray-400">Debug: isHydrated = {isHydrated ? 'true' : 'false'}</p>
        </div>
      </div>
    );
  }

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
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Chats</h1>
                    <button onClick={handleNewMessageClick} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <Plus className="w-5 h-5 text-gray-600" />
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
        {selectedConversation ? (
          <PersonalChatPanel key={selectedConversation.id} conversation={selectedConversation} />
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
}
