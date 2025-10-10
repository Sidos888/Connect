"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { SimpleMessage, MessageReaction } from "@/lib/simpleChatService";

interface MessageBubbleProps {
  message: SimpleMessage;
  isMe: boolean;
  participants: Array<{
    id: string;
    name: string;
    profile_pic?: string;
  }>;
  onLongPress?: (message: SimpleMessage) => void;
  onReactionClick?: (message: SimpleMessage, emoji: string) => void;
  onProfileClick?: (userId: string) => void;
}

export default function MessageBubble({
  message,
  isMe,
  participants,
  onLongPress,
  onReactionClick,
  onProfileClick
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);

  // Handle long press for mobile
  const handleMouseDown = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      onLongPress?.(message);
    }, 500); // 500ms for long press
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseLeave = () => {
    handleMouseUp();
  };

  // Handle right click for desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onLongPress?.(message);
  };

  // Handle reaction click
  const handleReactionClick = (emoji: string) => {
    onReactionClick?.(message, emoji);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Get sender info for profile click
  const messageSender = participants.find(p => p.id === message.sender_id);
  const senderAvatarUrl = messageSender?.profile_pic;
  const senderName = messageSender?.name || 'Unknown';

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  // Check if message is deleted
  const isDeleted = message.deleted_at;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} items-center gap-2`}>
      {/* Profile picture for received messages */}
      {!isMe && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onProfileClick?.(message.sender_id);
          }}
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 hover:bg-gray-300 transition-colors cursor-pointer"
        >
          {senderAvatarUrl ? (
            <Image
              src={senderAvatarUrl}
              alt={senderName}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-sm font-semibold">
              {senderName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
      )}
      
      {/* Message bubble */}
      <div className="relative max-w-[70%]">
        {/* Reply preview */}
        {message.reply_to_message && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-gray-400">
            <div className="text-xs text-gray-600 mb-1">
              Replying to {message.reply_to_message.sender_name}
            </div>
            <div className="text-sm text-gray-800 truncate">
              {message.reply_to_message.text}
            </div>
          </div>
        )}

        {/* Main message bubble */}
        <div 
          className={`
            ${isMe 
              ? "bg-white text-gray-900 border border-gray-200" 
              : "bg-white text-gray-900 border border-gray-200"
            }
            rounded-2xl px-4 py-3 shadow-sm cursor-pointer
          `}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
        >
          {/* Message Content */}
          {isDeleted ? (
            <div className="text-sm italic text-gray-500">
              This message was deleted
            </div>
          ) : (
            <>
              {/* Media attachments */}
              {message.media_urls && message.media_urls.length > 0 && (
                <div className="mb-2 space-y-2">
                  {message.media_urls.map((url, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        width={200}
                        height={200}
                        className="rounded-lg max-w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Text content */}
              {message.text && (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.text}
                </div>
              )}
            </>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-gray-600">{reactions.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}