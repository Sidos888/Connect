"use client";

import React from 'react';
import { Reply, Copy, Trash2 } from 'lucide-react';

interface MessageActionCardProps {
  messageId: string;
  isOwnMessage: boolean;
  onReply?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
}

export default function MessageActionCard({ 
  messageId, 
  isOwnMessage,
  onReply,
  onCopy,
  onDelete 
}: MessageActionCardProps) {
  return (
    <div
      className="bg-white rounded-2xl px-4 py-3 flex items-center gap-4"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        opacity: 1, // Explicitly ensure not dimmed
        zIndex: 200, // High z-index to be above blur overlay
        filter: 'none', // Ensure no filters
        backdropFilter: 'none', // Ensure no backdrop filters
        WebkitBackdropFilter: 'none' as any, // Safari support
        transform: 'translateZ(0)', // Force hardware acceleration
        willChange: 'transform', // Optimize rendering
        backgroundColor: '#ffffff', // Explicit white background
        isolation: 'isolate' // Create new stacking context to prevent blur effects
      }}
    >
      <button
        onClick={onReply}
        className="flex items-center gap-2 text-gray-900 hover:opacity-70 transition-opacity"
      >
        <Reply size={18} strokeWidth={2.5} />
        <span className="text-sm font-medium">Reply</span>
      </button>
      
      <button
        onClick={onCopy}
        className="flex items-center gap-2 text-gray-900 hover:opacity-70 transition-opacity"
      >
        <Copy size={18} strokeWidth={2.5} />
        <span className="text-sm font-medium">Copy</span>
      </button>
      
      {isOwnMessage && (
        <button
          onClick={onDelete}
          className="flex items-center gap-2 text-red-600 hover:opacity-70 transition-opacity"
        >
          <Trash2 size={18} strokeWidth={2.5} />
          <span className="text-sm font-medium">Delete</span>
        </button>
      )}
    </div>
  );
}

