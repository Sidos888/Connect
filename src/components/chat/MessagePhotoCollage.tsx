"use client";

import { Image as ImageIcon } from 'lucide-react';
import type { MediaAttachment } from '@/lib/types';

interface MessagePhotoCollageProps {
  attachments: MediaAttachment[];
  onPhotoClick?: () => void;
}

export default function MessagePhotoCollage({ 
  attachments, 
  onPhotoClick
}: MessagePhotoCollageProps) {
  if (attachments.length === 0) {
    return null;
  }

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
          <img 
            src={firstAttachment.file_url} 
            alt="Attachment" 
            className="w-full h-full object-cover pointer-events-none"
          />
        )}
        {attachments.length > 0 && onPhotoClick && <PhotoCountBadge count={attachments.length} onClick={onPhotoClick} />}
      </>
    );

    if (onPhotoClick) {
      return (
        <div
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
        >
          {content}
        </div>
      );
    }

    return (
      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative max-w-xs">
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
              <img 
                src={attachment.file_url} 
                alt={`Attachment ${index + 1}`} 
                className="w-full h-full object-cover"
              />
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
      >
        {gridContent}
      </div>
    );
  }

  return (
    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative max-w-xs">
      {gridContent}
    </div>
  );
}
