import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SimpleMessage } from '@/lib/types';
import { X, MoreVertical } from 'lucide-react';
import Avatar from '@/components/Avatar';
import MessagePhotoCollage from '@/components/chat/MessagePhotoCollage';
import ListingMessageCard from '@/components/chat/ListingMessageCard';

interface MessageBubbleProps {
  message: SimpleMessage;
  currentUserId: string;
  onReactionToggle?: (emoji: string, messageId: string) => void;
  onAttachmentClick?: (message: SimpleMessage) => void;
  onReply?: (message: SimpleMessage) => void;
  onDelete?: (messageId: string) => void;
  showOptions?: boolean;
  showDeliveryStatus?: boolean; // NEW: Optional delivery status ticks (default: false)
}

const MessageBubble = React.memo(({ 
  message, 
  currentUserId, 
  onReactionToggle, 
  onAttachmentClick,
  onReply,
  onDelete,
  showOptions = true,
  showDeliveryStatus = false // Default: disabled (backwards compatible)
}: MessageBubbleProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  
  const isOwnMessage = message.sender_id === currentUserId;
  const isDeleted = message.deleted_at !== null;

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowContextMenu(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) { // Right click
      e.preventDefault();
      setShowContextMenu(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setShowContextMenu(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleReply = () => {
    onReply?.(message);
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    onDelete?.(message.id);
    setIsMenuOpen(false);
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={menuRef}
      className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!isOwnMessage && (
        <div className="flex-shrink-0 flex items-end">
          <button
            onClick={() => {
              // Navigate to profile page - use query parameter route for static export compatibility
              router.push(`/profile?id=${message.sender_id}`);
            }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full hover:opacity-80 transition-opacity"
          >
            <Avatar 
              className="w-8 h-8" 
              name={message.sender_name || 'User'}
              src={message.sender_profile_pic}
            />
          </button>
        </div>
      )}

      <div
        className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}
      >
        {message.reply_to_message && (
          <div
            className={`mb-1 px-3 py-2 rounded-lg text-xs bg-gray-100 text-gray-600 ${isOwnMessage ? 'text-right' : 'text-left'}`}
          >
            <div className="text-xs text-gray-600 mb-1">
              Replying to {message.reply_to_message.sender_name}
            </div>
            <div className="text-sm text-gray-800 truncate">
              {message.reply_to_message.text}
            </div>
          </div>
        )}

        {/* Listing message card */}
        {!isDeleted && message.message_type === 'listing' && message.listing_id && (
          <div className="mb-2 max-w-full">
            <ListingMessageCard 
              listingId={message.listing_id} 
              chatId={message.chat_id}
            />
          </div>
        )}

        {/* Media attachments - outside message bubble */}
        {!isDeleted && message.message_type !== 'listing' && message.attachments && message.attachments.length > 0 && (
          <div className="mb-2">
            <MessagePhotoCollage
              attachments={message.attachments}
              onPhotoClick={() => onAttachmentClick?.(message)}
            />
          </div>
        )}

        {/* Legacy media_urls support (backward compatibility) */}
        {!isDeleted && (!message.attachments || message.attachments.length === 0) && message.media_urls && message.media_urls.length > 0 && (
          <div className="mb-2 space-y-2">
            {message.media_urls.map((url: string, index: number) => (
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

        {/* Main message bubble - only for text content (not for listing messages) */}
        {!isDeleted && message.message_type !== 'listing' && message.text && (
          <div 
            className="bg-white text-gray-900 rounded-2xl px-4 py-3 cursor-pointer"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
          >
            {/* Text content */}
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.text}
            </div>
          </div>
        )}

        {/* Deleted message */}
        {isDeleted && (
          <div 
            className="bg-white text-gray-900 rounded-2xl px-4 py-3 cursor-pointer"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
          >
            <div className="text-sm italic text-gray-500">
              This message was deleted
            </div>
          </div>
        )}

        {/* NEW: Optional delivery status ticks (only for own messages) */}
        {showDeliveryStatus && isOwnMessage && !isDeleted && message.status && (
          <div className="text-xs text-gray-400 mt-1 flex justify-end items-center gap-1">
            {message.status === 'sent' && (
              <span className="text-gray-400">✓</span>
            )}
            {message.status === 'delivered' && (
              <span className="text-gray-400">✓✓</span>
            )}
            {message.status === 'read' && (
              <span className="text-blue-500">✓✓</span>
            )}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions?.map((reaction: any, index: number) => {
              const reactions = message.reactions?.filter((r: any) => r.emoji === reaction.emoji) || [];
              const isUserReacted = reactions.some((r: any) => r.user_id === currentUserId);
              
              return (
                <button
                  key={index}
                  onClick={() => onReactionToggle?.(reaction.emoji, message.id)}
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
                    isUserReacted 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-gray-600">{reactions.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
export default MessageBubble;
