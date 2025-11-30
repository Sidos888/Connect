"use client";

import { Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import type { MediaAttachment } from '@/lib/types';
import React from 'react';

interface MessagePhotoCollageProps {
  attachments: MediaAttachment[];
  onPhotoClick?: () => void;
  onLongPress?: (element: HTMLElement) => void;
}

export default function MessagePhotoCollage({ 
  attachments, 
  onPhotoClick,
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

  // Long press detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onLongPress) return;
    
    longPressTimerRef.current = setTimeout(() => {
      if (containerRef.current && onLongPress) {
        onLongPress(containerRef.current);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onLongPress || e.button !== 0) return;
    
    longPressTimerRef.current = setTimeout(() => {
      if (containerRef.current && onLongPress) {
        onLongPress(containerRef.current);
      }
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
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
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className="photo-badge-button absolute bottom-3 right-3 cursor-pointer transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
          style={{
            willChange: 'transform, box-shadow',
            pointerEvents: 'auto',
            zIndex: 50,
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            touchAction: 'manipulation'
          }}
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
            className="w-full h-full object-cover pointer-events-none"
                onError={() => handleImageError(firstAttachment.file_url)}
                onLoad={() => console.log('MessagePhotoCollage: Image loaded successfully:', firstAttachment.file_url)}
                style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
          />
            )}
          </div>
        )}
        {attachments.length > 0 && onPhotoClick && <PhotoCountBadge count={attachments.length} onClick={onPhotoClick} />}
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
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.photo-badge-button')) {
              onPhotoClick();
            }
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
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0 pointer-events-none">
        {attachments.slice(0, 4).map((attachment, index) => (
          <div key={attachment.id || index} className="w-full h-full overflow-hidden">
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
                    onError={() => handleImageError(attachment.file_url)}
                    onLoad={() => console.log('MessagePhotoCollage: Grid image loaded:', attachment.file_url)}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
              />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {onPhotoClick && <PhotoCountBadge count={attachments.length} onClick={onPhotoClick} />}
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
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('.photo-badge-button')) {
            onPhotoClick();
          }
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
