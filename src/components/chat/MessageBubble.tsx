"use client";

import React from 'react';
import Avatar from '@/components/Avatar';
import type { SimpleMessage } from '@/lib/types';
import MessagePhotoCollage from './MessagePhotoCollage';

interface MessageBubbleProps {
  message: SimpleMessage;
  currentUserId: string;
  onReactionToggle?: (emoji: string, msgId: string) => void;
  onAttachmentClick?: (message: SimpleMessage) => void;
  onReply?: (message: SimpleMessage) => void;
  onDelete?: (messageId: string) => void;
  showOptions?: boolean;
  showDeliveryStatus?: boolean;
}

export default function MessageBubble({
  message,
  currentUserId,
  onReactionToggle,
  onAttachmentClick,
  onReply,
  onDelete,
  showOptions = false,
  showDeliveryStatus = false,
}: MessageBubbleProps) {
  const isMe = message.sender_id === currentUserId;

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-center gap-2`}>
      {/* Avatar for received messages */}
      {!isMe && (
        <Avatar
          src={message.sender_profile_pic}
          name={message.sender_name || 'Unknown'}
          size={32}
        />
      )}

      {/* Message bubble - Connect card styling, white for all messages */}
      <div
        className="max-w-[70%] rounded-2xl px-4 py-3 bg-white text-gray-900"
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          willChange: 'transform, box-shadow'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2">
            <MessagePhotoCollage
              attachments={message.attachments}
              onImageClick={() => onAttachmentClick?.(message)}
            />
          </div>
        )}

        {/* Message text */}
        {message.text && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {typeof message.text === 'string' ? message.text : String(message.text)}
          </div>
        )}

        {/* Delivery status (if enabled and message is from current user) */}
        {showDeliveryStatus && isMe && (
          <div className="text-xs mt-1 opacity-70">
            {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
          </div>
        )}
      </div>
    </div>
  );
}
