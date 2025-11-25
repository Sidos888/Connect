"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";
import { formatMessageTimeShort } from "@/lib/messageTimeUtils";

interface Conversation {
  id: string;
  title: string;
  avatarUrl: string | null;
  isGroup: boolean;
  unreadCount: number;
  last_message?: string;
  last_message_at?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  conversations: Conversation[];
}

export default function SearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  conversations,
}: SearchModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => 
      conv.title?.toLowerCase().includes(query) ||
      conv.last_message?.toLowerCase().includes(query)
    );
  }, [searchQuery, conversations]);

  const handleChatClick = (chatId: string) => {
    onClose();
    onSearchChange("");
    router.push(`/chat?chat=${chatId}`);
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll when modal is open (less invasive - just overflow)
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
    }

    return () => {
      // Cleanup: restore body scroll
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-[100] bg-white"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100dvh', // Dynamic viewport height - accounts for keyboard
        minHeight: '100vh', // Fallback for browsers that don't support dvh
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-out',
        overflow: 'hidden',
        position: 'fixed',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        className="w-full h-full flex flex-col"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 70px)',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        {/* Search Bar */}
        <div className="relative flex items-center mb-4">
          <div className="relative flex-1" style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Chats"
              className="w-full focus:outline-none"
              style={{
                borderRadius: '100px',
                height: '46.5px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                paddingLeft: '48px',
                paddingRight: '48px',
                fontSize: '16px',
                WebkitAppearance: 'none',
                WebkitTapHighlightColor: 'transparent',
                color: '#111827',
                // Prevent iOS from scrolling the page when input is focused
                scrollMargin: '0',
                scrollPadding: '0',
                // Prevent blue border on focus
                outline: 'none',
                borderColor: '#E5E7EB',
              }}
              className="placeholder:text-gray-400"
              onFocus={(e) => {
                // Prevent the page from scrolling when input is focused
                e.preventDefault();
                // Ensure no blue border on focus
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.outline = 'none';
                setTimeout(() => {
                  window.scrollTo(0, 0);
                }, 0);
              }}
              onBlur={(e) => {
                // Ensure border stays grey on blur
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.outline = 'none';
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            />
            <div className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none" style={{ width: '48px' }}>
              <SearchIcon size={20} className="text-gray-900" style={{ strokeWidth: 2.5 }} />
            </div>
            <button
              onClick={() => {
                onClose();
                onSearchChange("");
              }}
              className="absolute flex items-center justify-center"
              style={{
                top: '50%',
                right: '0',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '46.5px',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <svg
                className="w-5 h-5 text-gray-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ strokeWidth: 2.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="flex-1 overflow-y-auto" style={{ marginTop: '16px' }}>
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 text-sm">No chats found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleChatClick(conversation.id)}
                    className="p-4 rounded-2xl cursor-pointer transition-all duration-200 bg-white"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      willChange: 'transform, box-shadow'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
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
                          {conversation.last_message_at && (
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatMessageTimeShort(conversation.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

