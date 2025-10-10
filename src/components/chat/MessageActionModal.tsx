"use client";

import { useEffect, useRef } from "react";
import type { SimpleMessage } from "@/lib/simpleChatService";

interface MessageActionModalProps {
  selectedMessage: SimpleMessage | null;
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
  onClose,
  onReply,
  onCopy,
  onDelete,
  onReact,
  isMe
}: MessageActionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (selectedMessage) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [selectedMessage, onClose]);

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

  if (!selectedMessage) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with dim effect */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Modal content */}
      <div ref={modalRef} className="relative w-full max-w-md mx-4">
        {/* Emoji bar above message */}
        <div className="bg-white rounded-2xl shadow-lg mb-4 p-4">
          <div className="flex justify-center items-center gap-3">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Selected message preview */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="text-sm text-gray-600 mb-2">
            {selectedMessage.sender_name}
          </div>
          <div className="text-sm text-gray-900">
            {selectedMessage.text || 'Media message'}
          </div>
        </div>

        {/* Action menu below message */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="space-y-3">
            {/* Reply button */}
            <button
              onClick={handleReply}
              className="w-full flex items-center justify-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-gray-900 font-medium">Reply</span>
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
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
                className="w-full flex items-center justify-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-red-600 font-medium">Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
