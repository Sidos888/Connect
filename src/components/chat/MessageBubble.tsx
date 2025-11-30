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
  onLongPress?: (message: SimpleMessage, element: HTMLElement) => void; // NEW: Long press handler
}

const MessageBubble = React.memo(({ 
  message, 
  currentUserId, 
  onReactionToggle, 
  onAttachmentClick,
  onReply,
  onDelete,
  showOptions = true,
  showDeliveryStatus = false, // Default: disabled (backwards compatible)
  onLongPress // NEW: Long press handler
}: MessageBubbleProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSingleLine, setIsSingleLine] = useState(false);
  const [topOffset, setTopOffset] = useState(0); // Spacing from top for multi-line messages
  const menuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageBubbleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  
  const isOwnMessage = message.sender_id === currentUserId;
  const isDeleted = message.deleted_at !== null;

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowContextMenu(false);
    // Cancel long press on mouse leave
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
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

  // Long press detection - Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onLongPress) return;
    
    longPressTimerRef.current = setTimeout(() => {
      // Use the container element (menuRef) which includes avatar + bubble, not just the bubble
      if (menuRef.current && onLongPress) {
        onLongPress(message, menuRef.current);
      }
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Mouse long press (for desktop/testing) and right-click context menu
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) { // Right click
      e.preventDefault();
      setShowContextMenu(true);
      return;
    }
    
    // Left mouse button - long press detection
    if (onLongPress && e.button === 0) {
      longPressTimerRef.current = setTimeout(() => {
        // Use the container element (menuRef) which includes avatar + bubble, not just the bubble
        if (menuRef.current && onLongPress) {
          onLongPress(message, menuRef.current);
        }
      }, 500);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setShowContextMenu(false);
      // Cancel long press
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Detect if message is single-line or multi-line and calculate top offset
  React.useEffect(() => {
    const checkLineCount = () => {
      if (!contentRef.current || !avatarRef.current || !menuRef.current) return;
      
      // Get the total height of the content container (includes text bubble, photos, listing card, etc.)
      const totalHeight = contentRef.current.offsetHeight;
      
      // Single line height threshold: approximately 50px for text with padding
      // For photos/listing cards, use higher thresholds
      let singleLineThreshold = 50;
      
      // Check message type to adjust threshold
      if (message.attachments && message.attachments.length > 0) {
        // Photo cards should always be treated as multi-line (top-aligned)
        // Set threshold very low so they're always multi-line
        singleLineThreshold = 0;
      } else if (message.message_type === 'listing') {
        // Listing cards should always be treated as multi-line (top-aligned)
        singleLineThreshold = 0;
      } else if (message.text) {
        // Text message - single line is around 24px line-height + 12px padding = ~36px, but account for reply preview
        singleLineThreshold = (message as any).reply_to_message ? 80 : 50;
      }
      
      const isSingle = totalHeight <= singleLineThreshold;
      setIsSingleLine(isSingle);
      
      // Calculate top offset for multi-line messages
      if (!isSingle) {
        // Measure the spacing when centered (for single-line)
        // Avatar height is 32px (w-8 h-8)
        // When centered, calculate the offset from top
        const avatarHeight = 32; // Avatar is w-8 h-8 = 32px
        const messageHeight = totalHeight;
        
        // When centered: (messageHeight - avatarHeight) / 2 = spacing from top
        // This gives us the spacing that exists when items are centered
        const centeredSpacing = (messageHeight - avatarHeight) / 2;
        
        // But we want the spacing for a typical single-line message
        // A single-line message bubble is approximately: 24px (line-height) + 12px (top padding) + 12px (bottom padding) = 48px
        const typicalSingleLineHeight = 48;
        const typicalCenteredSpacing = (typicalSingleLineHeight - avatarHeight) / 2; // = 8px
        
        // Use the typical spacing (8px) for consistency
        setTopOffset(typicalCenteredSpacing);
      } else {
        setTopOffset(0);
      }
    };

    // Check after render with multiple timeouts to catch different render phases
    const timeoutId1 = setTimeout(checkLineCount, 0);
    const timeoutId2 = setTimeout(checkLineCount, 50);
    const timeoutId3 = setTimeout(checkLineCount, 200);
    
    // Also check on window resize
    window.addEventListener('resize', checkLineCount);
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      window.removeEventListener('resize', checkLineCount);
    };
  }, [message.text, message.attachments, message.message_type, message.reply_to_message]);

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
      className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      style={{
        alignItems: isSingleLine ? 'center' : 'flex-start' // For multi-line, align to top (first line)
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!isOwnMessage && (
        <div 
          ref={avatarRef}
          className="flex-shrink-0" 
          style={{
            display: 'flex',
            alignItems: isSingleLine ? 'center' : 'flex-start', // For multi-line, align to top (first line)
            paddingTop: !isSingleLine ? `${topOffset}px` : '0px' // Apply top offset for multi-line to match single-line spacing
          }}
        >
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
        ref={contentRef}
        className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}
        style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        {message.reply_to_message && (
          <div
            className={`mb-1 px-3 py-2 rounded-lg text-xs bg-gray-100 text-gray-600 ${isOwnMessage ? 'text-right' : 'text-left'}`}
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none' }}
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
            ref={messageBubbleRef}
            className="bg-white text-gray-900 rounded-2xl px-4 py-3 cursor-pointer"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => {
              handleMouseLeave();
              handleMouseUp();
            }}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
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
            ref={messageBubbleRef}
            className="bg-white text-gray-900 rounded-2xl px-4 py-3 cursor-pointer"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => {
              handleMouseLeave();
              handleMouseUp();
            }}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
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
