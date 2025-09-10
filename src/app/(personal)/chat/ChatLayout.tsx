"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import { useAppStore } from "@/lib/store";
import PersonalChatPanel from "./PersonalChatPanel";

export default function ChatLayout() {
  const { conversations, seedConversations, clearAll } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    console.log('Seeding conversations...');
    seedConversations();
  }, [seedConversations]);

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

  const selectedConversation = conversations.find(c => c.id === selectedChatId);

  const handleSelectChat = (chatId: string) => {
    router.push(`/chat?chat=${chatId}`);
  };

  const categories = [
    { id: "all", label: "All", count: null },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "dm", label: "DM", count: dmCount },
    { id: "group", label: "Groups", count: groupCount },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
          
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filter Cards - Horizontal */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-neutral-200 text-neutral-800'
                    : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm font-medium">{category.label}</span>
                {category.count !== null && (
                  <span className={`ml-1 text-xs ${
                    activeCategory === category.id 
                      ? 'text-white text-opacity-70' 
                      : 'text-neutral-500'
                  }`}>
                    {category.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
              <p className="text-gray-500 text-lg">No chats here :)</p>
              <BearEmoji size="4xl" />
              <button 
                onClick={() => {
                  console.log('Force clearing and reseeding...');
                  clearAll();
                  setTimeout(() => {
                    seedConversations();
                  }, 100);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
              >
                Force Reseed Chats
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectChat(conversation.id)}
                  className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                    selectedChatId === conversation.id 
                      ? 'border-blue-200 shadow-md ring-2 ring-blue-100' 
                      : 'border-gray-200 shadow-sm hover:border-gray-300'
                  }`}
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
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
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
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {getLastMessageTime(conversation)}
                          </span>
                        </div>
                        <p className={`text-xs truncate leading-relaxed ${
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

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <PersonalChatPanel conversation={selectedConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
              <div className="text-6xl">💬</div>
              <h2 className="text-xl font-semibold text-gray-900">Select a conversation</h2>
              <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
