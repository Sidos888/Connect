"use client";

import { useEffect, useRef, useState } from "react";
import type { SimpleMessage } from "@/lib/types";

interface MessageActionModalProps {
  selectedMessage: SimpleMessage | null;
  messageElement: HTMLElement | null;
  onClose: () => void;
  onReply: (message: SimpleMessage) => void;
  onCopy: (message: SimpleMessage) => void;
  onDelete: (message: SimpleMessage) => void;
  onReact: (message: SimpleMessage, emoji: string) => void;
  isMe: boolean;
}

const EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🎉'];

export default function MessageActionModal({
  selectedMessage,
  messageElement,
  onClose,
  onReply,
  onCopy,
  onDelete,
  onReact,
  isMe
}: MessageActionModalProps) {
  const emojiRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const [emojiPosition, setEmojiPosition] = useState<{ top: number; left: number } | null>(null);
  const [actionPosition, setActionPosition] = useState<{ top: number; left: number } | null>(null);

  // Calculate positions for emoji and action menus
  useEffect(() => {
    if (!selectedMessage || !messageElement) {
      setEmojiPosition(null);
      setActionPosition(null);
      return;
    }

    const rect = messageElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Position emoji reactions above the message
    const emojiTop = rect.top + scrollTop - 80; // 80px above message
    const emojiLeft = rect.left + scrollLeft + (rect.width / 2) - 200; // Center horizontally (400px wide / 2)

    // Position action menu below the message
    const actionTop = rect.bottom + scrollTop + 10; // 10px below message
    const actionLeft = rect.left + scrollLeft + (rect.width / 2) - 100; // Center horizontally (200px wide / 2)

    setEmojiPosition({ top: emojiTop, left: emojiLeft });
    setActionPosition({ top: actionTop, left: actionLeft });
  }, [selectedMessage, messageElement]);

  // Handle clicks outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isEmojiClick = emojiRef.current?.contains(target);
      const isActionClick = actionRef.current?.contains(target);
      const isMessageClick = messageElement?.contains(target);

      if (!isEmojiClick && !isActionClick && !isMessageClick) {
        onClose();
      }
    };

    if (selectedMessage) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedMessage, onClose, messageElement]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (selectedMessage) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedMessage, onClose]);

  if (!selectedMessage || !emojiPosition || !actionPosition) return null;

  const handleReply = () => {
    onReply(selectedMessage);
    onClose();
  };

  const handleCopy = () => {
    onCopy(selectedMessage);
    onClose();
  };

  const handleDelete = () => {
    onDelete(selectedMessage);
    onClose();
  };

  const handleReact = (emoji: string) => {
    onReact(selectedMessage, emoji);
    onClose();
  };

  return (
    <>
      {/* Dimmed backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30" />
      
      {/* Emoji reactions above message */}
      <div
        ref={emojiRef}
        className="fixed z-50 bg-white rounded-2xl shadow-lg p-3"
        style={{
          top: `${emojiPosition.top}px`,
          left: `${emojiPosition.left}px`,
        }}
      >
        <div className="flex justify-center items-center gap-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Action menu below message */}
      <div
        ref={actionRef}
        className="fixed z-50 bg-white rounded-2xl shadow-lg p-2"
        style={{
          top: `${actionPosition.top}px`,
          left: `${actionPosition.left}px`,
        }}
      >
        <div className="flex flex-col gap-1">
          {/* Reply button */}
          <button
            onClick={handleReply}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors min-w-[160px]"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className="text-gray-900 font-medium">Reply</span>
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-900 font-medium">Copy</span>
          </button>

          {/* Delete button - only show for own messages */}
          {isMe && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-red-600 font-medium">Delete</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
