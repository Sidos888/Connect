"use client";

import { useState, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export interface UploadedMedia {
  // File object - stored for upload on send
  file?: File;
  // Preview URL - blob URL for instant display (temporary)
  previewUrl?: string;
  // Server URL - HTTP URL after upload completes (backward compatible)
  file_url?: string;
  file_type: 'image' | 'video';
  thumbnail_url?: string;
  width?: number;
  height?: number;
  file_size: number;
}

interface MediaUploadButtonProps {
  onMediaSelected: (media: UploadedMedia[]) => void;
  disabled?: boolean;
  chatId?: string; // Optional chat ID for organizing uploads by chat
}

// Generate video thumbnail using HTML5 video + canvas API
const generateVideoThumbnail = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    video.onloadeddata = () => {
      video.currentTime = 1; // Get frame at 1 second
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.7);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
  });
};

// Get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};

export default function MediaUploadButton({ 
  onMediaSelected, 
  disabled = false,
  chatId
}: MediaUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseClient();

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const startTime = performance.now();
    console.log('🚀 File selection started');
    
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log(`📁 ${files.length} file(s) selected`);

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create immediate previews with local URLs for INSTANT display (<50ms)
      const immediatePreviews: UploadedMedia[] = [];
      
      console.log('⚡ Creating blob URLs...');
      const blobStartTime = performance.now();
      
      // Process files synchronously but very quickly - only essential operations
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Quick validation (no async operations)
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          throw new Error(`File ${file.name} is not a valid image or video`);
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB`);
        }

        const file_type: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';
        const previewUrl = URL.createObjectURL(file); // This is instant - for preview only
        
        // Create immediate preview - store File object for later upload
        const immediatePreview: UploadedMedia = {
          file: file, // Store File object for upload on send
          previewUrl: previewUrl, // Blob URL for instant preview
          file_type,
          file_size: file.size,
          width: undefined, // Will be filled later
          height: undefined, // Will be filled later
          thumbnail_url: undefined // Will be filled later for videos
        };

        immediatePreviews.push(immediatePreview);
      }
      
      const blobEndTime = performance.now();
      console.log(`⚡ Blob URLs created in ${(blobEndTime - blobStartTime).toFixed(2)}ms`);
      
      // Show previews IMMEDIATELY (this should be <50ms)
      console.log('📤 Sending previews to parent component...');
      onMediaSelected(immediatePreviews);
      
      const previewEndTime = performance.now();
      console.log(`✅ PREVIEW DISPLAYED in ${(previewEndTime - startTime).toFixed(2)}ms`);
      
      setUploadProgress(25);

      // Now generate thumbnails and dimensions asynchronously (don't block UI)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const file_type: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';
        const previewUrl = immediatePreviews[i].previewUrl; // Get the preview URL for this file
        
        // Generate thumbnail for videos asynchronously
        if (file_type === 'video') {
          generateVideoThumbnail(file)
            .then(thumbnailUrl => {
              // Update the preview with thumbnail when ready
              const updatedPreviews = immediatePreviews.map(preview => 
                preview.previewUrl === previewUrl ? { ...preview, thumbnail_url: thumbnailUrl } : preview
              );
              onMediaSelected([...updatedPreviews]); // Create new array to trigger re-render
            })
            .catch(error => {
              console.warn('Failed to generate video thumbnail:', error);
            });
        }
        
        // Generate dimensions asynchronously for images
        if (file_type === 'image') {
          getImageDimensions(file)
            .then(dimensions => {
              const updatedPreviews = immediatePreviews.map(preview => 
                preview.previewUrl === previewUrl ? { ...preview, width: dimensions.width, height: dimensions.height } : preview
              );
              onMediaSelected([...updatedPreviews]); // Create new array to trigger re-render
            })
            .catch(error => {
              console.warn('Failed to get image dimensions:', error);
            });
        }
      }

      // NOTE: Upload is now deferred until send - we only create previews here
      // Upload will happen in handleSendMessage when user clicks send
      console.log('✅ File previews created - upload will happen on send');
      
      setUploading(false);
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Media upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload media');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      
      <button
        onClick={handleClick}
        onTouchStart={handleClick}
        disabled={disabled || uploading}
          className={`
          rounded-full flex items-center justify-center transition-colors border-[0.4px] border-[#E5E7EB]
          ${disabled || uploading
            ? "bg-white text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-900 hover:bg-gray-50 cursor-pointer"
          }
        `}
        style={{
          width: '32px',
          height: '32px',
          boxShadow: `
            0 0 1px rgba(100, 100, 100, 0.25),
            inset 0 0 2px rgba(27, 27, 27, 0.25)
          `
        }}
        onMouseEnter={(e) => {
          if (!disabled && !uploading) {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
        }}
        title="Add photos or videos"
      >
        <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ strokeWidth: 2.5 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </>
  );
}
