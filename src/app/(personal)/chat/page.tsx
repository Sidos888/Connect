"use client";

import { useEffect, useState } from "react";
import MobileTitle from "@/components/MobileTitle";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import ChatLayout from "./ChatLayout";
import { useAuth } from "@/lib/authContext";
import AuthButton from "@/components/auth/AuthButton";
import { useModal } from "@/lib/modalContext";

export default function MessagesPage() {
  const { conversations, seedConversations, clearAll } = useAppStore();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Mobile-specific state
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileActiveCategory, setMobileActiveCategory] = useState("all");
  
  // Modal state
  const { showLogin } = useModal();

  useEffect(() => {
    console.log('Seeding conversations...');
    seedConversations();
  }, [seedConversations]);

  // Add another effect to log when conversations change
  useEffect(() => {
    console.log('Conversations state changed:', conversations);
  }, [conversations]);

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
    if (conversation.messages.length === 0) return "No messages yet";
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.text;
  };

  const getLastMessageTime = (conversation: { messages: Array<{ createdAt: string }> }) => {
    if (conversation.messages.length === 0) return "";
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return formatTime(lastMessage.createdAt);
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
    { id: "all", label: "All Chats", count: null },
    { id: "unread", label: "Unread", count: mobileUnreadCount },
  ];

  const mobileCategoriesBottom = [
    { id: "dm", label: "DM", count: mobileDmCount },
    { id: "group", label: "Groups", count: mobileGroupCount },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="text-center w-full max-w-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Chats
            </h1>
            <div className="text-gray-600 mb-8 h-12 flex items-center justify-center">
              <p className="text-center">
                Log in / sign up to view chats
              </p>
            </div>
            <div className="mt-6 w-full flex justify-center">
              <AuthButton onClick={() => showLogin()}>
                Continue
              </AuthButton>
            </div>
          </div>
        </div>

      </>
    );
  }

  // Show chat content if authenticated
  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <ChatLayout />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-gray-50">
        {/* Mobile Title */}
        <MobileTitle title="Chat" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {/* Mobile Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Mobile Category Filter Cards - Horizontal Scroll */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
            {[...mobileCategoriesTop, ...mobileCategoriesBottom].map((category) => (
              <button
                key={category.id}
                onClick={() => setMobileActiveCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
                  mobileActiveCategory === category.id
                    ? 'bg-neutral-200 text-neutral-800'
                    : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm font-medium">{category.label}</span>
                {category.count !== null && (
                  <span className={`ml-1 text-xs ${
                    mobileActiveCategory === category.id 
                      ? 'text-white text-opacity-70' 
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
              <p className="text-gray-500 text-lg">No chats here :)</p>
              <BearEmoji size="6xl" />
              <button 
                onClick={() => {
                  console.log('Force clearing and reseeding...');
                  clearAll();
                  setTimeout(() => {
                    seedConversations();
                  }, 100);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Force Reseed Chats
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMobileConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
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
    </>
  );
}


