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
  const { conversations, loadConversations, isHydrated } = useAppStore();
  const { account } = useAuth();
  useModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
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
    } else if (isHydrated && !account?.id) {
      console.log('Store hydrated but no user authenticated, skipping conversation loading');
    }
  }, [isHydrated, account?.id, loadConversations]);

  // Debug logging
  useEffect(() => {
    console.log('ChatLayout - conversations:', conversations);
    console.log('ChatLayout - selectedChatId:', selectedChatId);
    console.log('ChatLayout - searchParams:', searchParams.toString());
    console.log('ChatLayout - showNewMessageSelector:', showNewMessageSelector);
  }, [conversations, selectedChatId, searchParams, showNewMessageSelector]);

  // Using the new intuitive time formatting utility

  const getLastMessage = (conversation: { messages: Array<{ text: string }> }) => {
    if (!conversation.messages || conversation.messages.length === 0) return "No messages yet";
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.text || "No messages yet";
  };

  const getLastMessageTime = (conversation: { messages: Array<{ createdAt: string }> }) => {
    if (!conversation.messages || conversation.messages.length === 0) return "";
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.createdAt ? formatMessageTimeShort(lastMessage.createdAt) : "";
  };

  // Category filtering
  const getFilteredConversations = () => {
    const filtered = conversations.filter(conv => 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (activeCategory) {
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

  const filteredConversations = getFilteredConversations();

  // Category counts
  const getCategoryCounts = () => {
    const unreadCount = conversations.filter(conv => conv.unreadCount > 0).length;
    const dmCount = conversations.filter(conv => !conv.isGroup).length;
    const groupCount = conversations.filter(conv => conv.isGroup).length;
    
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

  const handleSelectChat = (chatId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Always navigate to the main chat page with selected chat (desktop layout)
    router.push(`/chat?chat=${chatId}`);
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
            {/* Mobile Layout - Similar to My Life */}
            <div className="lg:hidden min-h-screen bg-white">
              {/* Mobile Title - Same as My Life */}
              <div 
                className="fixed top-0 left-0 right-0 z-50"
                style={{ zIndex: 60, backgroundColor: 'white' }}
              >
                <div className="pt-safe-top px-4 pb-2 pt-8 bg-white h-[96px] flex items-end">
                  <div className="flex items-center justify-between w-full h-full">
                    <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
                    <div className="flex items-center justify-center h-full min-w-[40px] relative z-10">
                      <button onClick={handleNewMessageClick} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <Plus className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area - Same structure as My Life */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-[120px] lg:pt-6">
                {/* Search Bar - Same position as My Life profile card */}
                <div className="mb-4 lg:mb-8">
                  <div className="max-w-lg mx-auto lg:max-w-xl">
                    <div className="relative">
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search" className="w-full pl-10 pr-4 py-3 bg-white border-[1.5px] border-gray-300 rounded-xl focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-neutral-400 transition-colors" />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="mb-4">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1 -mx-1">
                    {categories.map((category) => (
                      <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full whitespace-nowrap transition-colors focus:outline-none shadow-sm ${activeCategory === category.id ? 'bg-white text-neutral-900' : 'bg-white text-neutral-700'}`}>
                        <span className="text-sm font-medium leading-none">{category.label}</span>
                        {category.count !== null && (
                          <span className={`ml-2 text-xs leading-none ${activeCategory === category.id ? 'text-neutral-700' : 'text-neutral-500'}`}>{category.count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat List */}
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <div key={conversation.id} onClick={() => handleSelectChat(conversation.id)} className={`p-4 rounded-xl cursor-pointer transition-shadow bg-white border border-gray-200 ${selectedChatId === conversation.id ? 'shadow-[0_0_12px_rgba(0,0,0,0.12)]' : 'hover:shadow-[0_0_12px_rgba(0,0,0,0.12)]'}`}>
                      <div className="flex items-center space-x-3">
                        <Avatar src={conversation.avatarUrl} name={conversation.title} size={48} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{conversation.title}</h3>
                            <span className="text-xs text-gray-500">{getLastMessageTime(conversation)}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">{getLastMessage(conversation) || 'No messages yet'}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div className="bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{conversation.unreadCount}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Layout - Keep existing */}
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
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search" className="w-full pl-10 pr-4 py-2 bg-white border-[1.5px] border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-neutral-400 transition-colors" />
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
                      <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full whitespace-nowrap border-[1.5px] transition-colors focus:outline-none ${activeCategory === category.id ? 'bg-white border-gray-900 text-neutral-900' : 'bg-white border-gray-300 text-neutral-700 hover:border-gray-400'} shadow-sm`}>
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
                      {filteredConversations.map((conversation) => (
                        <div key={conversation.id} onClick={(e) => handleSelectChat(conversation.id, e)} className={`bg-white rounded-xl cursor-pointer w-full transition-shadow border border-gray-200 ${selectedChatId === conversation.id ? 'shadow-[0_0_12px_rgba(0,0,0,0.12)]' : 'shadow-sm hover:shadow-[0_0_12px_rgba(0,0,0,0.12)]'}`}>
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
                                <p className={`text-xs truncate leading-relaxed ${conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{getLastMessage(conversation)}</p>
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
      <div className="hidden lg:flex flex-1 flex-col h-full overflow-hidden">
        {selectedConversation ? (
          <PersonalChatPanel conversation={selectedConversation} />
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
