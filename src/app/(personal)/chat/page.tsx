"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import MobileTitle from "@/components/MobileTitle";
import { useAppStore } from "@/lib/store";
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
  const { conversations, loadConversations, isHydrated } = useAppStore();
  const router = useRouter();
  const { account } = useAuth();
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

  useEffect(() => {
    if (isHydrated && account?.id) {
      console.log('Store hydrated, loading real conversations for user:', account.id);
      // Use real chat service
      loadConversations(account.id);
    } else if (isHydrated && !account?.id) {
      console.log('Store hydrated but no user authenticated, skipping conversation loading');
    }
  }, [isHydrated, account?.id, loadConversations]);

  // Add another effect to log when conversations change
  useEffect(() => {
    console.log('Conversations state changed:', conversations);
  }, [conversations]);


  // Modal handlers
  const handleNewMessageComplete = (chatId: string) => {
    setShowNewMessageModal(false);
    setShowGroupSetupModal(false);
    // Refresh conversations to include the new chat
    if (account?.id) {
      loadConversations(account.id);
    }
    // Navigate to the chat within the same layout
    router.push(`/chat?chat=${chatId}`);
  };

  const handleNewMessageClose = () => {
    setShowNewMessageModal(false);
    setShowGroupSetupModal(false);
  };

  const handleNewMessageClick = () => {
    setShowNewMessageModal(true);
  };

  console.log('Current conversations:', conversations);

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

  const getLastMessage = (conversation: { messages: Array<{ text: string }> }) => {
    if (!conversation.messages || conversation.messages.length === 0) return "No messages yet";
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.text || "No messages yet";
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

  // Show loading state while store is hydrating - with timeout
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isHydrated) {
        console.log('Chat page: Loading timeout reached');
        setLoadingTimeout(true);
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeout);
  }, [isHydrated]);

  if (!isHydrated && !loadingTimeout) {
    return (
      <div className="flex h-screen bg-white items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500">Loading chats...</p>
        </div>
      </div>
    );
  }


  // Show chat content if authenticated
  return (
    <ProtectedRoute title="Chats" description="Log in / sign up to view your chats and messages" buttonText="Log in">
      <div className="h-full bg-white">
        {/* Desktop Layout */}
        <div className="hidden lg:block h-full">
          <ChatLayout />
        </div>

        {/* Mobile Layout - Same structure as My Life */}
        <div className="lg:hidden min-h-screen bg-white">
          {/* Mobile Title - Same as My Life */}
          <div 
            className="fixed top-0 left-0 right-0 z-50"
            style={{
              zIndex: 60,
              backgroundColor: 'white'
            }}
          >
            <div className="pt-safe-top px-4 pb-2 pt-8 bg-white h-[96px] flex items-end">
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
          </div>

          {/* Content Area - Same structure as My Life */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-[120px] lg:pt-6">
            {/* Search Bar - Same position as My Life profile card */}
            <div className="mb-4 lg:mb-8">
              <div className="max-w-lg mx-auto lg:max-w-xl">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-3 bg-white border-[1.5px] border-gray-300 rounded-xl focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-neutral-400 transition-colors"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Pills - Below search bar */}
            <div className="mb-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[...mobileCategoriesTop, ...mobileCategoriesBottom].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setMobileActiveCategory(category.id)}
                    className={`inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full whitespace-nowrap border-[1.5px] transition-colors focus:outline-none ${
                      mobileActiveCategory === category.id
                        ? 'bg-white border-gray-900 text-neutral-900'
                        : 'bg-white border-gray-300 text-neutral-700 hover:border-gray-400'
                    } shadow-sm`}
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

            {/* Chat List - Below category pills */}
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
                      router.push(`/chat/individual?id=${conversation.id}`);
                    }}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                      selectedChatId === conversation.id
                        ? 'bg-white border-2 border-gray-900 shadow-lg'
                        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                    }`}
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


