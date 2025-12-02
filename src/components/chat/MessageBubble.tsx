import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SimpleMessage } from '@/lib/types';
import { X, MoreVertical, Calendar, Image as ImageIcon } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import Avatar from '@/components/Avatar';
import MessagePhotoCollage from '@/components/chat/MessagePhotoCollage';
import ListingMessageCard from '@/components/chat/ListingMessageCard';

interface MessageBubbleProps {
  message: SimpleMessage;
  currentUserId: string;
  onReactionToggle?: (emoji: string, messageId: string) => void;
  onReactionClick?: (messageId: string) => void; // NEW: Open reactions modal
  onAttachmentClick?: (message: SimpleMessage) => void;
  onReply?: (message: SimpleMessage) => void;
  onDelete?: (messageId: string) => void;
  showOptions?: boolean;
  showDeliveryStatus?: boolean; // NEW: Optional delivery status ticks (default: false)
  onLongPress?: (message: SimpleMessage, element: HTMLElement) => void; // NEW: Long press handler
  showReplyCancelButton?: boolean; // NEW: Show X button for reply preview
  onReplyCancel?: () => void; // NEW: Callback when X button is clicked
  onReplyCardClick?: (replyToMessageId: string) => void; // NEW: Callback when reply card is clicked
}

const MessageBubble = React.memo(({ 
  message, 
  currentUserId, 
  onReactionToggle, 
  onReactionClick, // NEW: Open reactions modal
  onAttachmentClick,
  onReply,
  onDelete,
  showOptions = true,
  showDeliveryStatus = false, // Default: disabled (backwards compatible)
  onLongPress, // NEW: Long press handler
  showReplyCancelButton = false, // NEW: Show X button for reply preview
  onReplyCancel, // NEW: Callback when X button is clicked
  onReplyCardClick // NEW: Callback when reply card is clicked
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
    
    longPressTimerRef.current = setTimeout(async () => {
      // Use the container element (menuRef) which includes avatar + bubble, not just the bubble
      if (menuRef.current && onLongPress) {
        // Trigger haptic feedback when long press is activated
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (error) {
          // Haptics not available (web environment), silently fail
        }
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
      longPressTimerRef.current = setTimeout(async () => {
        // Use the container element (menuRef) which includes avatar + bubble, not just the bubble
        if (menuRef.current && onLongPress) {
          // Trigger haptic feedback when long press is activated
          try {
            await Haptics.impact({ style: ImpactStyle.Medium });
          } catch (error) {
            // Haptics not available (web environment), silently fail
          }
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
        className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
        style={{ 
          maxWidth: '75%',
          userSelect: 'none', 
          WebkitUserSelect: 'none', 
          MozUserSelect: 'none', 
          msUserSelect: 'none', 
          WebkitTouchCallout: 'none' 
        }}
      >
        {/* Listing message card */}
        {!isDeleted && message.message_type === 'listing' && message.listing_id && (
          <div className="mb-2 max-w-xs">
            <ListingMessageCard 
              listingId={message.listing_id} 
              chatId={message.chat_id}
              onLongPress={(element) => {
                // Use the entire message container (menuRef) for positioning, not just the listing card
                if (onLongPress && menuRef.current) {
                  onLongPress(message, menuRef.current);
                }
              }}
            />
          </div>
        )}

        {/* Media attachments - outside message bubble */}
        {!isDeleted && message.message_type !== 'listing' && message.attachments && message.attachments.length > 0 && (
          <div className="mb-2">
            <MessagePhotoCollage
              attachments={message.attachments}
              onPhotoClick={() => onAttachmentClick?.(message)}
              onLongPress={(element) => {
                // Use the entire message container (menuRef) for positioning, not just the image card
                if (onLongPress && menuRef.current) {
                  onLongPress(message, menuRef.current);
                }
              }}
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
            className={`bg-white text-gray-900 rounded-2xl px-4 py-3 cursor-pointer ${message.reply_to_message ? 'w-full max-w-xs' : ''}`}
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              WebkitTouchCallout: 'none',
              // Ensure consistent width for replied messages - match reply card width (70vw)
              ...(message.reply_to_message && {
                boxSizing: 'border-box',
                width: '70vw', // Match reply card width
                maxWidth: '70vw',
                minWidth: '70vw',
                overflow: 'hidden' // Prevent content from expanding beyond width
              })
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
            {/* Reply card - inside message bubble - Fixed size component */}
            {message.reply_to_message && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReplyCardClick && message.reply_to_message_id) {
                    onReplyCardClick(message.reply_to_message_id);
                  }
                }}
                className="mb-2 rounded-2xl text-xs cursor-pointer transition-opacity hover:opacity-80"
                style={{ 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none', 
                  MozUserSelect: 'none', 
                  msUserSelect: 'none', 
                  WebkitTouchCallout: 'none',
                  backgroundColor: '#F9FAFB',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxSizing: 'border-box',
                  // Fill available width inside message bubble (respects bubble's padding)
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '0',
                  // Fixed height: name (1 line) + spacing + 2 lines of content
                  // Name: 12px + margin-bottom: 4px + 2 lines content: 24px (12px each) + padding: 24px (12px top + 12px bottom) = 64px
                  height: '64px',
                  minHeight: '64px',
                  maxHeight: '64px',
                  // Consistent padding on all sides
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  // Overflow handling
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'row', // Changed to row to allow left/right layout
                  alignItems: 'flex-start',
                  gap: '8px' // Space between text content and image
                }}
              >
                {/* Left side: Text content */}
                <div style={{ 
                  flex: 1,
                  minWidth: 0, // Allow shrinking
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between', // Push content to top and bottom
                  height: '100%' // Fill available height
                }}>
                  {/* Name - top line */}
                  <div 
                    className="text-xs font-semibold text-gray-900" 
                    style={{ 
                      fontWeight: 600,
                      lineHeight: '12px',
                      height: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {message.reply_to_message.sender_name || 'User'}
                  </div>
                  
                  {/* Bottom section: Icon + Event/Photo text OR message text */}
                  {(() => {
                    const hasPhoto = message.reply_to_message.attachments && message.reply_to_message.attachments.length > 0;
                    const isListing = message.reply_to_message.message_type === 'listing';
                    
                    if (hasPhoto || isListing) {
                      // Show icon + Event/Photo text on line 2 (bottom)
                      const Icon = isListing ? Calendar : ImageIcon;
                      const label = isListing ? 'Event' : 'Photo';
                      
                      return (
                        <div 
                          className="text-sm text-gray-500" 
                          style={{ 
                            color: '#6B7280',
                            lineHeight: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600, // More bold
                            marginTop: 'auto' // Push to bottom
                          }}
                        >
                          <Icon size={14} style={{ flexShrink: 0 }} />
                          <span>{label}</span>
                        </div>
                      );
                    } else {
                      // Show message text - 2 lines with ellipsis if too long
                      return (
                        <div 
                          className="text-xs text-gray-500" 
                          style={{ 
                            color: '#6B7280',
                            lineHeight: '12px',
                            height: '24px', // 2 lines: 12px each
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2, // Show 2 lines
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            marginTop: 'auto' // Push to bottom
                          }}
                        >
                          {message.reply_to_message.text || 'Message'}
                        </div>
                      );
                    }
                  })()}
                </div>
                
                {/* Right side: Photo/Listing thumbnail */}
                {(() => {
                  // Check if reply is to a photo
                  const hasPhoto = message.reply_to_message.attachments && message.reply_to_message.attachments.length > 0;
                  // Check if reply is to a listing (need to check if listing_id exists and fetch photo_urls)
                  const isListing = message.reply_to_message.message_type === 'listing';
                  
                  if (hasPhoto) {
                    return (
                      <div style={{
                        flexShrink: 0,
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={message.reply_to_message.attachments[0].thumbnail_url || message.reply_to_message.attachments[0].file_url}
                          alt="Reply photo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            // Hide image on error, show placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  }
                  
                  // For listings, check if listing photo_urls are available
                  if (isListing) {
                    const listingPhotoUrls = (message.reply_to_message as any).listing_photo_urls;
                    if (listingPhotoUrls && listingPhotoUrls.length > 0) {
                      return (
                        <div style={{
                          flexShrink: 0,
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img
                            src={listingPhotoUrls[0]}
                            alt="Listing photo"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              // Hide image on error, show placeholder
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    }
                  }
                  
                  return null;
                })()}
              </div>
            )}

            {/* Text content - appears below reply card */}
            <div 
              className="text-sm leading-relaxed whitespace-pre-wrap break-words"
              style={{ 
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                wordWrap: 'break-word',
                // Ensure text respects parent width constraints
                ...(message.reply_to_message && {
                  maxWidth: '100%',
                  minWidth: '0'
                })
              }}
            >
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

        {/* Reactions - Small pill cards positioned below message */}
        {message.reactions && message.reactions.length > 0 && (() => {
          // Group reactions by emoji and count
          const reactionGroups = new Map<string, { emoji: string; count: number; userReacted: boolean }>();
          
          message.reactions.forEach((reaction: any) => {
            const existing = reactionGroups.get(reaction.emoji);
            if (existing) {
              existing.count++;
              if (reaction.user_id === currentUserId) {
                existing.userReacted = true;
              }
            } else {
              reactionGroups.set(reaction.emoji, {
                emoji: reaction.emoji,
                count: 1,
                userReacted: reaction.user_id === currentUserId
              });
            }
          });

          const reactionsArray = Array.from(reactionGroups.values());
          const totalReactions = message.reactions.length;
          const uniqueEmojiCount = reactionsArray.length;

          // Determine if this message has images or listing cards (for proper spacing)
          const hasImages = message.attachments && message.attachments.length > 0;
          const hasListing = message.message_type === 'listing' && message.listing_id;
          // For image/listing messages, use larger negative margin to overlap slightly into the card
          // For text messages, -4px creates slight overlap
          const reactionMarginTop = (hasImages || hasListing) ? '-12px' : '-4px';

          // If 2+ reactions AND multiple different emoji types: show combined pill with up to 3 emojis + total count
          // If all same emoji (even if 2+): show single emoji + count
          const shouldShowCombined = totalReactions >= 2 && uniqueEmojiCount > 1;
              
              return (
            <div 
              className="flex flex-wrap gap-1.5"
              style={{
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                marginTop: reactionMarginTop, // Overlap slightly into message/image/listing card
                position: 'relative',
                zIndex: 10, // Ensure reactions appear in front of images/listing cards
                // Add slight gap from the edge of the message card
                marginLeft: isOwnMessage ? '0' : '8px',
                marginRight: isOwnMessage ? '8px' : '0'
              }}
            >
              {shouldShowCombined ? (
                // Combined pill: show up to 3 different emojis + total count
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onReactionClick) {
                      onReactionClick(message.id);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    borderRadius: '100px',
                    fontSize: '14px',
                    lineHeight: '1.2'
                  }}
                >
                  {/* Show up to 3 different emojis */}
                  {reactionsArray.slice(0, 3).map((reactionGroup, index) => (
                    <span key={`${reactionGroup.emoji}-${index}`}>{reactionGroup.emoji}</span>
                  ))}
                  {/* Total count */}
                  <span style={{ color: '#6B7280', fontSize: '12px', marginLeft: '2px' }}>{totalReactions}</span>
                </button>
              ) : (
                // Single or same emoji: show emoji + count (if > 1)
                reactionsArray.map((reactionGroup, index) => (
                  <button
                    key={`${reactionGroup.emoji}-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onReactionClick) {
                        onReactionClick(message.id);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: '#ffffff',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      borderRadius: '100px',
                      fontSize: '14px',
                      lineHeight: '1.2'
                    }}
                  >
                    <span>{reactionGroup.emoji}</span>
                    {reactionGroup.count > 1 && (
                      <span style={{ color: '#6B7280', fontSize: '12px' }}>{reactionGroup.count}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
export default MessageBubble;
