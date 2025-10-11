"use client";

import { useState, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export interface UploadedMedia {
  file_url: string;
  file_type: 'image' | 'video';
  thumbnail_url?: string;
  width?: number;
  height?: number;
  file_size: number;
}

interface MediaUploadButtonProps {
  onMediaSelected: (media: UploadedMedia[]) => void;
  disabled?: boolean;
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
  disabled = false 
}: MediaUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseClient();

  const handleClick = () => {
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
        const localUrl = URL.createObjectURL(file); // This is instant
        
        // Create immediate preview - no async operations here!
        const immediatePreview: UploadedMedia = {
          file_url: localUrl,
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
        const localUrl = immediatePreviews[i].file_url;
        
        // Generate thumbnail for videos asynchronously
        if (file_type === 'video') {
          generateVideoThumbnail(file)
            .then(thumbnailUrl => {
              // Update the preview with thumbnail when ready
              const updatedPreviews = immediatePreviews.map(preview => 
                preview.file_url === localUrl ? { ...preview, thumbnail_url: thumbnailUrl } : preview
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
                preview.file_url === localUrl ? { ...preview, width: dimensions.width, height: dimensions.height } : preview
              );
              onMediaSelected([...updatedPreviews]); // Create new array to trigger re-render
            })
            .catch(error => {
              console.warn('Failed to get image dimensions:', error);
            });
        }
      }

      // Now upload to server in background
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('chat-media')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(fileName);

        // Determine file type and get metadata
        const file_type: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';
        let thumbnail_url: string | undefined;
        let width: number | undefined;
        let height: number | undefined;

        try {
          if (file_type === 'video') {
            // Generate video thumbnail
            thumbnail_url = await generateVideoThumbnail(file);
            // For videos, we'll get dimensions from the video element
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            await new Promise((resolve) => {
              video.onloadedmetadata = resolve;
            });
            width = video.videoWidth;
            height = video.videoHeight;
          } else {
            // Get image dimensions
            const dimensions = await getImageDimensions(file);
            width = dimensions.width;
            height = dimensions.height;
          }
        } catch (metadataError) {
          console.warn('Failed to extract metadata for', file.name, metadataError);
          // Continue without metadata rather than failing the upload
        }

        return {
          file_url: publicUrl, // Server URL
          file_type,
          thumbnail_url,
          width,
          height,
          file_size: file.size
        } as UploadedMedia;
      });

      // Wait for all uploads to complete
      const uploadedMedia = await Promise.all(uploadPromises);
      
      setUploadProgress(100);
      
      // Update with server URLs (this will trigger a re-render with the final URLs)
      onMediaSelected(uploadedMedia);
      
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
        disabled={disabled || uploading}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center transition-colors
          ${disabled || uploading
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer"
          }
        `}
        title={uploading ? "Uploading..." : "Add photos or videos"}
      >
        {uploading ? (
          <div className="relative">
            {/* Upload progress indicator */}
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">
              {Math.round(uploadProgress)}%
            </div>
          </div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )}
      </button>
    </>
  );
}
