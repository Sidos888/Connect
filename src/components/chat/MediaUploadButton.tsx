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
      console.log('📤 Starting server uploads for', files.length, 'file(s)');
      const uploadPromises = Array.from(files).map(async (file, index) => {
        console.log(`📤 Uploading file ${index + 1}/${files.length}:`, {
          name: file.name,
          type: file.type,
          size: file.size,
          index
        });

        // Generate unique filename
        // If chatId is provided, use it in the path to match storage policy pattern
        const fileExt = file.name.split('.').pop();
        const randomSuffix = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();
        const baseFileName = `${timestamp}_${index}_${randomSuffix}.${fileExt}`;
        const fileName = chatId 
          ? `${chatId}/${baseFileName}` // Match policy pattern: {chatId}/{filename}
          : baseFileName; // Fallback to simple filename if no chatId
        console.log(`  📝 Generated filename: ${fileName}`, { chatId, hasChatId: !!chatId });
        
        // Upload to Supabase Storage
        console.log(`  ⬆️ Uploading to Supabase Storage (chat-media bucket)...`, {
          fileName,
          fileSize: file.size,
          fileType: file.type,
          bucket: 'chat-media',
          chatId,
          isFileValid: file instanceof File,
          fileConstructor: file.constructor.name
        });
        
        // Validate file object
        if (!(file instanceof File) && !(file instanceof Blob)) {
          throw new Error(`Invalid file object: ${typeof file}`);
        }
        
        // On iOS/Capacitor, File objects from the picker might not be directly readable
        // Convert to Blob to ensure it's readable by Supabase Storage
        let fileToUpload: Blob | File = file;
        const isCapacitor = !!(window as any).Capacitor;
        
        if (isCapacitor && file instanceof File) {
          console.log(`  🔄 Converting File to Blob for iOS/Capacitor compatibility...`);
          try {
            // Read file as ArrayBuffer then convert to Blob
            const arrayBuffer = await file.arrayBuffer();
            fileToUpload = new Blob([arrayBuffer], { type: file.type });
            console.log(`  ✅ File converted to Blob:`, {
              originalSize: file.size,
              blobSize: fileToUpload.size,
              type: fileToUpload.type
            });
          } catch (conversionError) {
            console.warn(`  ⚠️ Failed to convert File to Blob, using original:`, conversionError);
            // Fallback to original file
            fileToUpload = file;
          }
        }
        
        const uploadStartTime = performance.now();
        const { data, error } = await supabase.storage
          .from('chat-media')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error(`  ❌ Upload error for ${file.name}:`, {
            error,
            errorName: error.name,
            errorMessage: error.message,
            errorCode: (error as any).statusCode,
            fileName,
            fileSize: file.size,
            fileType: file.type
          });
          
          // Check if bucket exists or permissions issue
          if (error.message?.includes('Bucket') || error.message?.includes('bucket')) {
            console.error('  🔍 Possible bucket issue - checking bucket access...');
          }
          
          throw new Error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
        }

        const uploadTime = performance.now() - uploadStartTime;
        console.log(`  ✅ Upload completed in ${uploadTime.toFixed(2)}ms:`, {
          fileName,
          path: data?.path
        });

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(fileName);
        console.log(`  🔗 Public URL generated:`, {
          url: publicUrl?.substring(0, 80) + '...',
          fileName
        });

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

        const uploadedMediaItem: UploadedMedia = {
          file_url: publicUrl, // Server URL
          file_type,
          thumbnail_url,
          width,
          height,
          file_size: file.size
        };

        console.log(`  ✅ File ${index + 1} processing complete:`, {
          file_url: uploadedMediaItem.file_url?.substring(0, 80) + '...',
          file_type: uploadedMediaItem.file_type,
          has_thumbnail: !!uploadedMediaItem.thumbnail_url,
          dimensions: uploadedMediaItem.width && uploadedMediaItem.height 
            ? `${uploadedMediaItem.width}x${uploadedMediaItem.height}` 
            : 'unknown',
          file_size: uploadedMediaItem.file_size
        });

        return uploadedMediaItem;
      });

      // Wait for all uploads to complete
      console.log('⏳ Waiting for all uploads to complete...');
      let uploadedMedia: UploadedMedia[];
      
      try {
        uploadedMedia = await Promise.all(uploadPromises);
        
        console.log('✅ All uploads completed:', {
          count: uploadedMedia.length,
          media: uploadedMedia.map((m, i) => ({
            index: i + 1,
            file_type: m.file_type,
            file_url: m.file_url?.substring(0, 60) + '...',
            has_thumbnail: !!m.thumbnail_url,
            file_size: m.file_size,
            is_http_url: m.file_url?.startsWith('http')
          }))
        });

        // Verify all uploads have valid HTTP URLs
        const invalidUploads = uploadedMedia.filter(m => !m.file_url || (!m.file_url.startsWith('http://') && !m.file_url.startsWith('https://')));
        if (invalidUploads.length > 0) {
          console.error('❌ Some uploads have invalid URLs:', invalidUploads);
          throw new Error(`${invalidUploads.length} file(s) failed to upload properly`);
        }
        
        setUploadProgress(100);
        
        // Update with server URLs (this will trigger a re-render with the final URLs)
        console.log('📤 Calling onMediaSelected with uploaded media (server URLs)...');
        onMediaSelected(uploadedMedia);
        console.log('✅ onMediaSelected called successfully with server URLs');
      } catch (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        // Don't update with blob URLs - keep the immediate previews but show error
        setUploading(false);
        setUploadProgress(0);
        alert(uploadError instanceof Error ? uploadError.message : 'Failed to upload images. Please try again.');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return; // Don't call onMediaSelected with failed uploads
      }
      
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
