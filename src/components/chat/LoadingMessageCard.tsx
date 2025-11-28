"use client";

import { Image as ImageIcon } from 'lucide-react';

interface LoadingMessageCardProps {
  fileCount: number;
  status?: 'uploading' | 'uploaded' | 'failed';
}

export default function LoadingMessageCard({ fileCount, status = 'uploading' }: LoadingMessageCardProps) {
  return (
    <div className="w-full max-w-xs rounded-2xl overflow-hidden bg-white relative"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        aspectRatio: '1'
      }}
    >
      {/* Loading indicator overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-10">
        <div className="flex flex-col items-center justify-center gap-2">
          {/* Circular loading icon with number */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-gray-300"></div>
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            <div className="relative flex items-center justify-center gap-1">
              <span className="text-xs font-medium text-gray-700">{fileCount}</span>
              <ImageIcon size={14} className="text-gray-700" />
            </div>
          </div>
          {/* Loading text */}
          <span className="text-xs text-gray-500 font-medium">Loading...</span>
        </div>
      </div>
      
      {/* Placeholder background */}
      <div className="w-full h-full bg-gray-100"></div>
    </div>
  );
}

