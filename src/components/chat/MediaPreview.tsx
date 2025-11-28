"use client";

import React from "react";
import { UploadedMedia } from "./MediaUploadButton";
import { X } from "lucide-react";

interface MediaPreviewProps {
  pendingMedia: UploadedMedia[];
  onRemove: (index: number) => void;
}

export default function MediaPreview({ pendingMedia, onRemove }: MediaPreviewProps) {
  if (pendingMedia.length === 0) return null;

  console.log('🖼️ MediaPreview rendering with', pendingMedia.length, 'items');
  const renderStart = performance.now();
  
  // Log after render
  React.useEffect(() => {
    console.log(`✨ MediaPreview rendered in ${(performance.now() - renderStart).toFixed(2)}ms`);
  });

  return (
    <div className="mb-4">
      <div className="flex gap-3 flex-wrap">
        {pendingMedia.map((media, index) => (
          <div
            key={index}
            className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white flex-shrink-0 border border-gray-200"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              minWidth: '64px',
              minHeight: '64px',
              maxWidth: '64px',
              maxHeight: '64px'
            }}
          >
            {/* Media preview - fills entire square */}
            <div className="w-full h-full relative">
              {media.file_type === 'video' ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                  {media.thumbnail_url ? (
                    <>
                      <img
                        src={media.thumbnail_url}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <img
                    src={media.previewUrl || media.file_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{
                      imageRendering: 'auto',
                      backfaceVisibility: 'hidden',
                      transform: 'translateZ(0)', // Hardware acceleration
                      willChange: 'transform' // Optimize for animations
                    }}
                    title={`Image: ${media.file_url}`}
                    loading="eager" // Load immediately for instant display
                    decoding="async" // Async decoding for better performance
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      
                      // Show error placeholder
                      const placeholder = target.parentElement?.querySelector('.error-placeholder');
                      if (placeholder) {
                        (placeholder as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  {/* Error placeholder */}
                  <div className="error-placeholder absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center text-gray-500" style={{ display: 'none' }}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 w-5 h-5 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}