"use client";

import React from 'react';

interface MessageReactionCardProps {
  messageId: string;
  onReactionSelect?: (emoji: string) => void;
}

export default function MessageReactionCard({ messageId, onReactionSelect }: MessageReactionCardProps) {
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  
  return (
    <div
      className="bg-white px-4 py-3 flex items-center gap-2"
      style={{
        borderRadius: '100px',
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
      {reactions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReactionSelect?.(emoji)}
          className="text-2xl hover:scale-110 transition-transform"
          style={{ padding: '4px' }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

