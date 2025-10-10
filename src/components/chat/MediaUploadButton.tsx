"use client";

import { useState, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";

interface MediaUploadButtonProps {
  onMediaSelected: (urls: string[]) => void;
  disabled?: boolean;
}

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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          throw new Error(`File ${file.name} is not a valid image or video`);
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB`);
        }

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

        return publicUrl;
      });

      // Wait for all uploads to complete
      const urls = await Promise.all(uploadPromises);
      
      setUploadProgress(100);
      onMediaSelected(urls);
      
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
