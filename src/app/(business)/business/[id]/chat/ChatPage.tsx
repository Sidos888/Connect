"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import BearEmoji from "@/components/BearEmoji";
import MobileTitle from "@/components/MobileTitle";

type Filter = "all" | "unread" | "dms";

export default function ChatPage() {
  const { conversations, seedConversations, clearAll } = useAppStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const router = useRouter();

  useEffect(() => {
    console.log('Seeding conversations for business...');
    seedConversations();
  }, [seedConversations]);

  useEffect(() => {
    console.log('Business conversations state changed:', conversations);
  }, [conversations]);

  console.log('Current business conversations:', conversations);

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

  const getLastMessage = (conversation: typeof conversations[0]) => {
    if (conversation.messages.length === 0) return 'No messages yet';
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.text;
  };

  const getLastMessageTime = (conversation: typeof conversations[0]) => {
    if (conversation.messages.length === 0) return '';
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return formatTime(lastMessage.createdAt);
  };

  const filtered = useMemo(() => {
    let items = conversations;
    if (filter === "unread") items = items.filter((c) => c.unreadCount > 0);
    if (filter === "dms") items = items.filter((c) => !c.isGroup);
    if (query.trim()) items = items.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));
    return items;
  }, [conversations, filter, query]);

  return (
    <div className="flex flex-col h-full bg-white">
      <MobileTitle title="Chat" />
      
      <div className="flex-1 p-4 lg:p-6 space-y-4 pt-[120px] lg:pt-4">
        {/* Desktop Title */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold mb-6">Chat</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder:text-neutral-400"
          />
        </div>

        {/* Filter Tabs - Horizontal Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(["all", "unread", "dms"] as Filter[]).map((filterType) => {
            const getCount = () => {
              switch (filterType) {
                case "all": return null;
                case "unread": return conversations.filter(c => c.unreadCount > 0).length;
                case "dms": return conversations.filter(c => !c.isGroup).length;
                default: return 0;
              }
            };
            
            return (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full transition-all duration-200 whitespace-nowrap border ${
                  filter === filterType
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                } shadow-sm`}
              >
                <span className="text-sm font-medium leading-none">
                  {filterType === "all" ? "All" : filterType === "unread" ? "Unread" : "DM"}
                </span>
                {getCount() !== null && (
                  <span className={`ml-2 text-xs leading-none ${
                    filter === filterType 
                      ? 'text-neutral-700' 
                      : 'text-neutral-500'
                  }`}>
                    {getCount()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Debug Button */}
        {conversations.length === 0 && (
          <button
            onClick={() => {
              console.log('Force reseeding conversations...');
              clearAll();
              seedConversations();
            }}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Force Reseed Chats
          </button>
        )}

        {/* Chat List */}
        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((conversation) => {
              const businessId = typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "demo";
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/business/${businessId}/chat/${conversation.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] lg:hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar
                        src={conversation.avatarUrl}
                        name={conversation.title}
                        size={48}
                        className="lg:w-12 lg:h-12"
                      />
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.title}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {getLastMessageTime(conversation)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {getLastMessage(conversation)}
                        </p>
                        {conversation.isGroup && (
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            👥 Group
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <BearEmoji size="4xl" />
              <p className="text-gray-500">Start a conversation to see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
