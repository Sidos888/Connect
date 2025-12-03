"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { MediaAttachment } from '@/lib/types';
import ChatPhotoViewer from './ChatPhotoViewer';

interface ChatPhotosGridModalProps {
  isOpen: boolean;
  attachments: MediaAttachment[];
  onClose: () => void;
}

export default function ChatPhotosGridModal({ isOpen, attachments, onClose }: ChatPhotosGridModalProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handlePhotoClick = (index: number) => {
    console.log('📸 Grid photo clicked - index:', index, 'total attachments:', attachments.length);
    setSelectedPhotoIndex(index);
    console.log('📸 selectedPhotoIndex set to:', index);
  };

  const handleClosePhotoViewer = () => {
    console.log('📸 Closing photo viewer, returning to grid');
    setSelectedPhotoIndex(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Grid Modal */}
      <div
        className="fixed inset-0 z-[9999] bg-white"
        style={{
          touchAction: 'pan-y',
        }}
      >
        {/* Header */}
        <div
          className="fixed top-0 left-0 right-0 z-10 bg-white"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 70px)',
            paddingBottom: '16px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔙 Grid modal back button onClick');
                onClose();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔙 Grid modal back button onTouchStart');
                onClose();
              }}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                WebkitTapHighlightColor: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Title */}
            <div className="flex-1 text-center">
              <h1 
                className="font-semibold text-gray-900"
                style={{
                  fontSize: '22px',
                  lineHeight: '28px',
                }}
              >
                Chat Photos
              </h1>
            </div>

            {/* Spacer for alignment */}
            <div style={{ width: '44px' }} />
          </div>

          {/* Photo Count - Below header */}
          <div className="flex justify-center mt-4 items-center gap-1.5">
            <span className="text-sm font-medium text-gray-500">{attachments.length} {attachments.length === 1 ? 'photo' : 'photos'}</span>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{
            height: '100vh',
            paddingTop: 'calc(max(env(safe-area-inset-top), 70px) + 16px + 44px + 16px + 28px + 24px)', // Header padding + button height + spacing + count height + extra spacing
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="px-4 pb-8">
            {/* Photo Grid - 4 columns */}
            <div className="grid grid-cols-4 gap-4">
              {attachments.map((attachment, index) => (
                <button
                  key={attachment.id || index}
                  onClick={() => handlePhotoClick(index)}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative active:opacity-80 transition-opacity"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {attachment.file_type === 'video' && attachment.thumbnail_url ? (
                    <>
                      <img
                        src={attachment.thumbnail_url}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
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
                    <img 
                      src={attachment.file_url} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Page Photo Viewer - shows when a photo is clicked from the grid */}
      {selectedPhotoIndex !== null && (
        <>
          {console.log('📸 Rendering ChatPhotoViewer - index:', selectedPhotoIndex, 'attachments:', attachments.length)}
          <ChatPhotoViewer
            isOpen={selectedPhotoIndex !== null}
            attachments={attachments}
            initialIndex={selectedPhotoIndex}
            onClose={handleClosePhotoViewer}
          />
        </>
      )}
    </>
  );
}

