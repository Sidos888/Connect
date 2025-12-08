"use client";

import { useEffect, useRef } from 'react';

interface LoadingMessageCardProps {
  fileCount: number;
  status?: 'uploading' | 'uploaded' | 'failed';
}

export default function LoadingMessageCard({ fileCount, status = 'uploading' }: LoadingMessageCardProps) {
  const dot1Ref = useRef<HTMLDivElement>(null);
  const dot2Ref = useRef<HTMLDivElement>(null);
  const dot3Ref = useRef<HTMLDivElement>(null);

  // Removed debug logging - animation should work now with margin-top approach

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
        <style>{`
          @keyframes loading8-bounce {
            0%, 60%, 100% {
              margin-top: 0px;
            }
            30% {
              margin-top: -10px;
            }
          }
          @-webkit-keyframes loading8-bounce {
            0%, 60%, 100% {
              margin-top: 0px;
            }
            30% {
              margin-top: -10px;
            }
          }
          [data-loading-dot] {
            animation: loading8-bounce 1.4s ease-in-out infinite !important;
            -webkit-animation: loading8-bounce 1.4s ease-in-out infinite !important;
          }
        `}</style>
        <div className="flex items-center justify-center">
          <div className="flex space-x-2">
            <div 
              ref={dot1Ref}
              data-loading-dot
              className="w-3 h-3 bg-black rounded-full"
              style={{
                animationDelay: '0s',
                WebkitAnimationDelay: '0s'
              }}
            />
            <div 
              ref={dot2Ref}
              data-loading-dot
              className="w-3 h-3 bg-black rounded-full"
              style={{
                animationDelay: '0.2s',
                WebkitAnimationDelay: '0.2s'
              }}
            />
            <div 
              ref={dot3Ref}
              data-loading-dot
              className="w-3 h-3 bg-black rounded-full"
              style={{
                animationDelay: '0.4s',
                WebkitAnimationDelay: '0.4s'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Placeholder background */}
      <div className="w-full h-full bg-gray-100"></div>
    </div>
  );
}

