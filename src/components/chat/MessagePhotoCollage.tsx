"use client";

import { Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import type { MediaAttachment } from '@/lib/types';
import React from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface MessagePhotoCollageProps {
  attachments: MediaAttachment[];
  onPhotoClick?: (index: number) => void; // Click handler for clicking an image directly - opens viewer at that index
  onGridClick?: () => void; // Click handler for photo count badge to open grid view
  onLongPress?: (element: HTMLElement) => void;
}

export default function MessagePhotoCollage({ 
  attachments, 
  onPhotoClick,
  onGridClick,
  onLongPress
}: MessagePhotoCollageProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  if (attachments.length === 0) {
    return null;
  }

  const handleImageError = (url: string) => {
    console.error('MessagePhotoCollage: Failed to load image:', url);
    setImageErrors(prev => new Set(prev).add(url));
  };

  // Long press detection - track if it was a long press to prevent click
  const isLongPressRef = useRef(false);
  const touchStartTimeRef = useRef<number>(0);
  const touchStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default to stop image selection/drag on iOS
    e.preventDefault();
    
    isLongPressRef.current = false;
    hasMovedRef.current = false;
    touchStartTimeRef.current = Date.now();
    
    // Store touch position to detect if user moved (scrolling)
    const touch = e.touches[0];
    touchStartPositionRef.current = { x: touch.clientX, y: touch.clientY };
    
    if (!onLongPress) return;
    
    longPressTimerRef.current = setTimeout(async () => {
      // Only trigger long press if user hasn't moved
      if (!hasMovedRef.current) {
        isLongPressRef.current = true;
        // Trigger haptic feedback
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (error) {
          // Haptics not available, silently fail
        }
        if (containerRef.current && onLongPress) {
          onLongPress(containerRef.current);
        }
      }
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Calculate movement distance
    let touchEndPosition = { x: 0, y: 0 };
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      touchEndPosition = { x: touch.clientX, y: touch.clientY };
    }

    const movementDistance = touchStartPositionRef.current
      ? Math.sqrt(
          Math.pow(touchEndPosition.x - touchStartPositionRef.current.x, 2) +
          Math.pow(touchEndPosition.y - touchStartPositionRef.current.y, 2)
        )
      : 0;

    // Only trigger click if:
    // 1. It was a quick tap (< 500ms)
    // 2. Not a long press
    // 3. Movement was minimal (< 10px) - this prevents triggering on scroll
    // 4. onPhotoClick handler exists
    const isValidTap = touchDuration < 500 && !isLongPressRef.current && movementDistance < 10 && !hasMovedRef.current;

    if (isValidTap && onPhotoClick) {
      // Check if the tap was on the badge button
      const target = e.target as HTMLElement;
      if (!target.closest('.photo-badge-button')) {
        // Determine which photo was clicked based on the container
        const containerElement = containerRef.current;
        if (containerElement) {
          // For single photo or 2x2 grid, check if we clicked a specific grid item
          const gridItem = target.closest('[data-photo-index]') as HTMLElement;
          if (gridItem) {
            const index = parseInt(gridItem.getAttribute('data-photo-index') || '0', 10);
            onPhotoClick(index);
          } else {
            // Default to first photo
            onPhotoClick(0);
          }
        }
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // If it was a long press, prevent the click
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Calculate movement distance
    if (touchStartPositionRef.current && e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const movementDistance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPositionRef.current.x, 2) +
        Math.pow(touch.clientY - touchStartPositionRef.current.y, 2)
      );

      // If user moved more than 10px, mark as moved (scrolling)
      if (movementDistance > 10) {
        hasMovedRef.current = true;
      }
    }

    // Cancel long press if user moves finger
    if (longPressTimerRef.current && hasMovedRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (hasMovedRef.current) {
      isLongPressRef.current = false;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    
    isLongPressRef.current = false;
    touchStartTimeRef.current = Date.now();
    
    if (!onLongPress) return;
    
    longPressTimerRef.current = setTimeout(async () => {
      isLongPressRef.current = true;
      // Trigger haptic feedback
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        // Haptics not available, silently fail
      }
      if (containerRef.current && onLongPress) {
        onLongPress(containerRef.current);
      }
    }, 500);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const clickDuration = Date.now() - touchStartTimeRef.current;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // For desktop: trigger click on quick mouse up (< 500ms, not a long press)
    if (clickDuration < 500 && !isLongPressRef.current && onPhotoClick) {
      const target = e.target as HTMLElement;
      if (!target.closest('.photo-badge-button')) {
        const gridItem = target.closest('[data-photo-index]') as HTMLElement;
        if (gridItem) {
          const index = parseInt(gridItem.getAttribute('data-photo-index') || '0', 10);
          onPhotoClick(index);
        } else {
          onPhotoClick(0);
        }
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

  const PhotoCountBadge = ({ count, onClick }: { count: number; onClick?: () => void }) => {
    // Badge-specific touch tracking
    const badgeTouchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

    const badgeContent = (
      <div className="flex items-center justify-center gap-1.5 bg-white"
      style={{
        width: '53px',
        height: '40px',
        borderRadius: '20px',
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        pointerEvents: 'none'
      }}
    >
      <span className="text-sm font-medium text-gray-900">{count}</span>
      <ImageIcon size={18} className="text-gray-900" />
    </div>
  );

    if (onClick) {
      return (
        <button
          type="button"
          onTouchStart={(e) => {
            e.stopPropagation();
            const touch = e.touches[0];
            badgeTouchStartRef.current = {
              x: touch.clientX,
              y: touch.clientY,
              time: Date.now()
            };
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
            // If user moves, clear the touch start to prevent click
            if (badgeTouchStartRef.current && e.touches && e.touches.length > 0) {
              const touch = e.touches[0];
              const movementDistance = Math.sqrt(
                Math.pow(touch.clientX - badgeTouchStartRef.current.x, 2) +
                Math.pow(touch.clientY - badgeTouchStartRef.current.y, 2)
              );
              
              // If moved more than 10px, cancel the tap
              if (movementDistance > 10) {
                badgeTouchStartRef.current = null;
              }
            }
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Only trigger click if it was a valid tap (not a scroll)
            if (badgeTouchStartRef.current) {
              const touchDuration = Date.now() - badgeTouchStartRef.current.time;
              
              // Calculate final movement
              let movementDistance = 0;
              if (e.changedTouches && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                movementDistance = Math.sqrt(
                  Math.pow(touch.clientX - badgeTouchStartRef.current.x, 2) +
                  Math.pow(touch.clientY - badgeTouchStartRef.current.y, 2)
                );
              }
              
              // Only click if it was quick and minimal movement
              if (touchDuration < 500 && movementDistance < 10) {
                onClick();
              }
            }
            
            badgeTouchStartRef.current = null;
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // For desktop clicks
            onClick();
          }}
          className="photo-badge-button absolute bottom-3 right-3 cursor-pointer transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
          style={{
            willChange: 'transform, box-shadow',
            pointerEvents: 'auto',
            zIndex: 50,
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
            boxShadow: 'none'
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            const badge = e.currentTarget.querySelector('div');
            if (badge) {
              badge.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            const badge = e.currentTarget.querySelector('div');
            if (badge) {
              badge.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }
          }}
        >
          {badgeContent}
        </button>
      );
    }

    return (
      <div className="absolute bottom-3 right-3">
        {badgeContent}
      </div>
    );
  };

  // 1-3 attachments: show single image
  if (attachments.length <= 3) {
    const firstAttachment = attachments[0];
    const content = (
      <>
        {firstAttachment.file_type === 'video' ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
            {firstAttachment.thumbnail_url ? (
              <>
                <img
                  src={firstAttachment.thumbnail_url}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover pointer-events-none"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
                />
                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-400 pointer-events-none">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full relative bg-gray-100" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none' }}>
            {imageErrors.has(firstAttachment.file_url) ? (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        ) : (
          <img 
            src={firstAttachment.file_url} 
            alt="Attachment" 
            className="w-full h-full object-cover"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                onError={() => handleImageError(firstAttachment.file_url)}
                onLoad={() => console.log('MessagePhotoCollage: Image loaded successfully:', firstAttachment.file_url)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPhotoClick) onPhotoClick(0);
                }}
                style={{ 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none', 
                  MozUserSelect: 'none', 
                  msUserSelect: 'none', 
                  WebkitTouchCallout: 'none',
                  cursor: onPhotoClick ? 'pointer' : 'default',
                  pointerEvents: 'auto',
                  WebkitUserDrag: 'none',
                  KhtmlUserDrag: 'none',
                  MozUserDrag: 'none',
                  OUserDrag: 'none',
                  userDrag: 'none'
                } as React.CSSProperties}
          />
            )}
          </div>
        )}
        {attachments.length > 1 && (onGridClick || onPhotoClick) && <PhotoCountBadge count={attachments.length} onClick={onGridClick || (() => onPhotoClick && onPhotoClick(0))} />}
      </>
    );

    if (onPhotoClick) {
      return (
        <div
          ref={containerRef}
          data-photo-index={0}
          className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:-translate-y-[1px] focus:outline-none max-w-xs"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow',
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            touchAction: 'pan-y' // Allow vertical scrolling but prevent other gestures
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {content}
        </div>
      );
    }

    return (
      <div 
        ref={containerRef}
        className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative max-w-xs"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {content}
      </div>
    );
  }

  // 4+ attachments: show 2x2 grid
  const gridContent = (
    <>
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0">
        {attachments.slice(0, 4).map((attachment, index) => (
          <div 
            key={attachment.id || index} 
            className="w-full h-full overflow-hidden"
            data-photo-index={index}
            onClick={(e) => {
              e.stopPropagation();
              if (onPhotoClick) onPhotoClick(index);
            }}
            style={{ cursor: onPhotoClick ? 'pointer' : 'default' }}
          >
            {attachment.file_type === 'video' ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                {attachment.thumbnail_url ? (
                  <>
                    <img
                      src={attachment.thumbnail_url}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
                    />
                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full relative bg-gray-100" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none' }}>
                {imageErrors.has(attachment.file_url) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            ) : (
              <img 
                src={attachment.file_url} 
                alt={`Attachment ${index + 1}`} 
                className="w-full h-full object-cover"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    onError={() => handleImageError(attachment.file_url)}
                    onLoad={() => console.log('MessagePhotoCollage: Grid image loaded:', attachment.file_url)}
                    style={{ 
                      userSelect: 'none', 
                      WebkitUserSelect: 'none', 
                      MozUserSelect: 'none', 
                      msUserSelect: 'none', 
                      WebkitTouchCallout: 'none',
                      WebkitUserDrag: 'none',
                      KhtmlUserDrag: 'none',
                      MozUserDrag: 'none',
                      OUserDrag: 'none',
                      userDrag: 'none'
                    } as React.CSSProperties}
              />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {(onGridClick || onPhotoClick) && <PhotoCountBadge count={attachments.length} onClick={onGridClick || (() => onPhotoClick && onPhotoClick(0))} />}
    </>
  );

  if (onPhotoClick) {
    return (
      <div
        ref={containerRef}
        className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:-translate-y-[1px] focus:outline-none max-w-xs"
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          willChange: 'transform, box-shadow',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          touchAction: 'pan-y' // Allow vertical scrolling but prevent other gestures
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {gridContent}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative max-w-xs"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {gridContent}
    </div>
  );
}
