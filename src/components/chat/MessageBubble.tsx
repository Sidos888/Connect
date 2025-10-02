"use client";

import { useState, useRef, useEffect } from "react";
import MessageReactionBar from "./MessageReactionBar";

interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    created_at: string;
    sender_id: string;
    reactions?: Array<{ emoji: string; user_id: string; user_name: string }>;
  };
  isMe: boolean;
  onReactionAdd: (messageId: string, reaction: string) => void;
  onReactionRemove: (messageId: string, reaction: string) => void;
  avatarUrl?: string | null;
  senderName?: string;
}

export default function MessageBubble({ 
  message, 
  isMe, 
  onReactionAdd, 
  onReactionRemove,
  avatarUrl,
  senderName
}: MessageBubbleProps) {
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowReactionBar(true);
      setShowContextMenu(true); // Show both menus together
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseDown = () => {
    setShowReactionBar(true);
    setShowContextMenu(true); // Show both menus together
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleReactionSelect = (reaction: string) => {
    onReactionAdd(message.id, reaction);
    setShowReactionBar(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
    setShowReactionBar(true); // Show both menus together
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setShowContextMenu(false);
  };

  const handleReply = () => {
    // TODO: Implement reply functionality
    setShowContextMenu(false);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    setShowContextMenu(false);
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2 relative`}>
      {/* Profile picture for received messages */}
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={senderName || 'Sender'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-sm font-semibold">
              {(senderName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
      
      <div className="relative group">
        {/* Message bubble */}
        <div 
          className={`
            max-w-[90%] relative
            ${isMe 
              ? "text-gray-900 bg-white border border-gray-200" 
              : "text-gray-900 bg-white border border-gray-200"
            }
            rounded-2xl px-4 py-3 shadow-sm
            ${isMe ? "rounded-br-md" : "rounded-bl-md"}
          `}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
        >
          {/* Message text */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">
            {message.text || 'Message'}
          </div>
          
          {/* Message time */}
          <div className="text-xs mt-2 text-gray-500">
            {new Date(message.created_at).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>

          {/* Reactions display - larger and more mobile-friendly */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => onReactionRemove(message.id, reaction.emoji)}
                  className={`backdrop-blur-sm rounded-full px-3 py-1.5 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity ${
                    isMe 
                      ? "bg-white/25 text-white" 
                      : "bg-gray-200/80 text-gray-800"
                  }`}
                >
                  <span className="text-base">{reaction.emoji}</span>
                  <span className="text-xs font-medium">{reaction.user_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reaction bar - positioned directly above message */}
        {showReactionBar && (
          <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 z-50">
            <MessageReactionBar
              isVisible={showReactionBar}
              onReactionSelect={handleReactionSelect}
              onClose={() => setShowReactionBar(false)}
            />
          </div>
        )}

        {/* Context menu - smaller and white */}
        {showContextMenu && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[120px]">
            <div className="py-1">
              <button
                onClick={handleReply}
                className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-100 flex items-center gap-3 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Reply
              </button>
              <button
                onClick={handleCopy}
                className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-100 flex items-center gap-3 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <button
                onClick={() => {
                  setShowReactionBar(true);
                  setShowContextMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-100 flex items-center gap-3 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                React
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop to close menus */}
      {(showReactionBar || showContextMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowReactionBar(false);
            setShowContextMenu(false);
          }}
          onTouchStart={() => {
            setShowReactionBar(false);
            setShowContextMenu(false);
          }}
        />
      )}
    </div>
  );
}
