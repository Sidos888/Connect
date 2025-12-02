"use client";

import React from 'react';
import { Reply, Copy, Trash2 } from 'lucide-react';

interface MessageActionCardProps {
  messageId: string;
  isOwnMessage: boolean;
  showDeleteConfirmation?: boolean;
  onReply?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onDeleteConfirm?: () => void;
  onCancel?: () => void;
}

export default function MessageActionCard({ 
  messageId, 
  isOwnMessage,
  showDeleteConfirmation = false,
  onReply,
  onCopy,
  onDelete,
  onDeleteConfirm,
  onCancel
}: MessageActionCardProps) {
  // If in delete confirmation mode, show simplified UI
  if (showDeleteConfirmation) {
    return (
      <div
        className="bg-white rounded-2xl flex flex-col"
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          opacity: 1,
          zIndex: 200,
          filter: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none' as any,
          transform: 'translateZ(0)',
          willChange: 'transform',
          backgroundColor: '#ffffff',
          isolation: 'isolate',
          minWidth: '140px'
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel?.();
          }}
          className="flex items-center justify-between gap-3 px-4 py-3 text-gray-900 hover:bg-gray-50 transition-colors first:rounded-t-2xl"
          style={{
            borderBottomWidth: '0.4px',
            borderBottomColor: '#E5E7EB',
            borderBottomStyle: 'solid'
          }}
        >
          <span className="text-sm font-medium">Cancel</span>
          <div style={{ width: '18px', height: '18px' }} /> {/* Spacer for alignment */}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteConfirm?.();
          }}
          className="flex items-center justify-between gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors last:rounded-b-2xl"
        >
          <span className="text-sm font-medium">Delete</span>
          <Trash2 size={18} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  // Normal action menu
  return (
    <div
      className="bg-white rounded-2xl flex flex-col"
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
        isolation: 'isolate', // Create new stacking context to prevent blur effects
        minWidth: '140px' // Ensure minimum width for proper appearance
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReply?.();
        }}
        className="flex items-center justify-between gap-3 px-4 py-3 text-gray-900 hover:bg-gray-50 transition-colors first:rounded-t-2xl"
        style={{
          borderBottomWidth: '0.4px',
          borderBottomColor: '#E5E7EB',
          borderBottomStyle: 'solid'
        }}
      >
        <span className="text-sm font-medium">Reply</span>
        <Reply size={18} strokeWidth={2.5} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy?.();
        }}
        className="flex items-center justify-between gap-3 px-4 py-3 text-gray-900 hover:bg-gray-50 transition-colors"
        style={{
          borderBottomWidth: isOwnMessage ? '0.4px' : '0',
          borderBottomColor: '#E5E7EB',
          borderBottomStyle: isOwnMessage ? 'solid' : 'none'
        }}
      >
        <span className="text-sm font-medium">Copy</span>
        <Copy size={18} strokeWidth={2.5} />
      </button>
      
      {isOwnMessage && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="flex items-center justify-between gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors last:rounded-b-2xl"
        >
          <span className="text-sm font-medium">Delete</span>
          <Trash2 size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

