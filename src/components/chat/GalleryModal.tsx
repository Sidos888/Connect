"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { SimpleMessage } from "@/lib/types";

interface GalleryModalProps {
  isOpen: boolean;
  message: SimpleMessage | null;
  onClose: () => void;
  onImageClick: (index: number) => void;
}

export default function GalleryModal({ isOpen, message, onClose, onImageClick }: GalleryModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !message || !message.attachments || message.attachments.length === 0) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden"
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Photos & Videos ({message.attachments.length})
          </h3>
          <button
            onClick={onClose}
            className="p-0 bg-transparent"
          >
            <span className="action-btn-circle">
              <X className="w-5 h-5 text-gray-900" />
            </span>
          </button>
        </div>

        {/* Grid */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
            {message.attachments.map((attachment, index) => (
              <div
                key={attachment.id || index}
                className="aspect-square relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onImageClick(index)}
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                }}
              >
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
                          <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={attachment.file_url}
                    alt="Attachment"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* File type indicator */}
                {attachment.file_type === 'video' && (
                  <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                    VIDEO
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Tap any photo or video to view full screen
          </p>
        </div>
      </div>
    </div>
  );
}
