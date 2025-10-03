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
      conv.title.toLowerCase().includes(mobileSearchQuery.toLowerCase())
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

        {/* Mobile Layout */}
        <div className="chat-container lg:hidden h-full bg-white flex flex-col">
          {/* Mobile Header */}
          <MobileTitle 
            title="Chats" 
            action={
              <button
                onClick={handleNewMessageClick}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            }
          />
          
          {/* Mobile Content - Scrollable area below fixed header */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-[60px] lg:pt-6">

            {/* Mobile Category Filter Pills - unified border system */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
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

            {filteredMobileConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <p className="text-gray-500 text-lg">
                  {account?.id ? "No chats yet" : "Please log in to see your chats"}
                </p>
                <BearEmoji size="6xl" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMobileConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/chat/individual?id=${conversation.id}`);
                    }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <Avatar 
                            src={conversation.avatarUrl ?? undefined} 
                            name={conversation.title} 
                            size={48}
                          />
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-medium">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="min-w-0 flex-1 mr-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                  {conversation.title}
                                </h3>
                                {conversation.isGroup && (
                                  <div className="flex items-center justify-center w-4 h-4 bg-gray-100 rounded-full">
                                    <svg className="w-2.5 h-2.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {getLastMessageTime(conversation)}
                            </span>
                          </div>
                          <p className={`text-sm truncate leading-relaxed ${
                            conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                          }`}>
                            {getLastMessage(conversation)}
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


