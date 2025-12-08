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
      {/* Loading indicator overlay - only show when uploading */}
      {status === 'uploading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-10">
          <style>{`
            @keyframes loading8-wave {
              0%, 60%, 100% {
                transform: translateY(0);
              }
              30% {
                transform: translateY(-4px); // 60% smaller: 10px * 0.4 = 4px
              }
            }
            @-webkit-keyframes loading8-wave {
              0%, 60%, 100% {
                -webkit-transform: translateY(0);
              }
              30% {
                -webkit-transform: translateY(-4px);
              }
            }
          `}</style>
          <div className="flex items-center justify-center">
            <div className="flex space-x-1.5">
              <div 
                ref={dot1Ref}
                data-loading-dot
                className="bg-black rounded-full"
                style={{
                  width: '4.8px', // 60% smaller: 12px * 0.4 = 4.8px
                  height: '4.8px',
                  animation: 'loading8-wave 1.4s ease-in-out infinite',
                  WebkitAnimation: 'loading8-wave 1.4s ease-in-out infinite',
                  animationDelay: '0s',
                  WebkitAnimationDelay: '0s'
                }}
              />
              <div 
                ref={dot2Ref}
                data-loading-dot
                className="bg-black rounded-full"
                style={{
                  width: '4.8px',
                  height: '4.8px',
                  animation: 'loading8-wave 1.4s ease-in-out infinite',
                  WebkitAnimation: 'loading8-wave 1.4s ease-in-out infinite',
                  animationDelay: '0.2s',
                  WebkitAnimationDelay: '0.2s'
                }}
              />
              <div 
                ref={dot3Ref}
                data-loading-dot
                className="bg-black rounded-full"
                style={{
                  width: '4.8px',
                  height: '4.8px',
                  animation: 'loading8-wave 1.4s ease-in-out infinite',
                  WebkitAnimation: 'loading8-wave 1.4s ease-in-out infinite',
                  animationDelay: '0.4s',
                  WebkitAnimationDelay: '0.4s'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Placeholder background */}
      <div className="w-full h-full bg-gray-100"></div>
    </div>
  );
}

