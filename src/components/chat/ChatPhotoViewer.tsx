"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { MediaAttachment } from '@/lib/types';

interface ChatPhotoViewerProps {
  isOpen: boolean;
  attachments: MediaAttachment[];
  initialIndex: number;
  onClose: () => void;
}

export default function ChatPhotoViewer({ isOpen, attachments, initialIndex, onClose }: ChatPhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [allowTransition, setAllowTransition] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const previousInitialIndexRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const lastTouchXRef = useRef<number | null>(null);
  const lastTouchTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const isNewImage = previousInitialIndexRef.current !== initialIndex;
      setCurrentIndex(initialIndex);
      setSwipeOffset(0);
      setIsSwiping(false);
      setAllowTransition(false);
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      previousInitialIndexRef.current = initialIndex;
      
      const timeout = setTimeout(() => {
        setAllowTransition(true);
      }, 50);
      
      return () => clearTimeout(timeout);
    } else {
      setIsVisible(false);
      setAllowTransition(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, attachments.length]);

  // Pause all videos when index changes
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
      }
    });
  }, [currentIndex]);

  const goToPrevious = () => {
    if (isSwiping) return;
    setAllowTransition(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
    setSwipeOffset(0);
  };

  const goToNext = () => {
    if (isSwiping) return;
    setAllowTransition(true);
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
    setSwipeOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    const now = Date.now();
    setTouchStart(touch.clientX);
    setIsSwiping(true);
    touchStartTimeRef.current = now;
    touchStartXRef.current = touch.clientX;
    lastTouchXRef.current = touch.clientX;
    lastTouchTimeRef.current = now;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touch = e.targetTouches[0];
    const now = Date.now();
    const currentX = touch.clientX;
    const offset = currentX - touchStart;
    setSwipeOffset(offset);
    
    if (lastTouchXRef.current !== null && lastTouchTimeRef.current !== null) {
      const deltaX = currentX - lastTouchXRef.current;
      const deltaTime = now - lastTouchTimeRef.current;
      lastTouchXRef.current = currentX;
      lastTouchTimeRef.current = now;
    }
  };

  const handleTouchEnd = () => {
    if (touchStart === null) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }
    
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const swipeDistance = Math.abs(swipeOffset);
    const distanceThreshold = screenWidth * 0.5;
    
    let velocity = 0;
    if (lastTouchXRef.current !== null && lastTouchTimeRef.current !== null && touchStartTimeRef.current !== null) {
      const totalDeltaX = lastTouchXRef.current - (touchStartXRef.current || 0);
      const totalDeltaTime = lastTouchTimeRef.current - touchStartTimeRef.current;
      if (totalDeltaTime > 0) {
        velocity = Math.abs(totalDeltaX / totalDeltaTime);
      }
    }
    
    const velocityThreshold = 0.5;
    const hasMomentum = velocity > velocityThreshold;
    const isLeftSwipe = swipeOffset < 0;
    const isRightSwipe = swipeOffset > 0;
    
    setTouchStart(null);
    touchStartTimeRef.current = null;
    touchStartXRef.current = null;
    lastTouchXRef.current = null;
    lastTouchTimeRef.current = null;
    
    if (swipeDistance > distanceThreshold || hasMomentum) {
      if (isLeftSwipe && currentIndex < attachments.length - 1) {
        setIsSwiping(false);
        const currentOffset = swipeOffset;
        const newIndex = currentIndex + 1;
        const gap = 16;
        const newOffset = (screenWidth + gap) + currentOffset;
        setCurrentIndex(newIndex);
        setSwipeOffset(newOffset);
        requestAnimationFrame(() => {
          setSwipeOffset(0);
        });
      } else if (isRightSwipe && currentIndex > 0) {
        setIsSwiping(false);
        const currentOffset = swipeOffset;
        const newIndex = currentIndex - 1;
        const gap = 16;
        const newOffset = -(screenWidth + gap) + currentOffset;
        setCurrentIndex(newIndex);
        setSwipeOffset(newOffset);
        requestAnimationFrame(() => {
          setSwipeOffset(0);
        });
      } else {
        setIsSwiping(false);
        setSwipeOffset(0);
      }
    } else {
      setIsSwiping(false);
      setSwipeOffset(0);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || attachments.length === 0) {
    return null;
  }

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const gap = 16;
  const baseTransform = -currentIndex * (screenWidth + gap);
  const totalTransform = baseTransform + swipeOffset;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        backgroundColor: '#000000',
        pointerEvents: isVisible ? 'auto' : 'none',
        zIndex: 110 // Higher than ChatAttachmentGalleryView (z-[100])
      }}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Back Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClose();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
        style={{
          top: typeof window !== 'undefined' && window.innerWidth < 1024 
            ? 'max(env(safe-area-inset-top), 70px)' 
            : '32px',
          left: typeof window !== 'undefined' && window.innerWidth < 1024 ? '16px' : '32px',
          width: typeof window !== 'undefined' && window.innerWidth < 1024 ? '44px' : '40px',
          height: typeof window !== 'undefined' && window.innerWidth < 1024 ? '44px' : '40px',
          borderRadius: '22px',
          background: 'rgba(255, 255, 255, 0.96)',
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0px 2px 4px rgba(0,0,0,0.04)',
          willChange: 'transform, box-shadow',
          zIndex: 110, // Higher than container z-[100]
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0px 2px 4px rgba(0,0,0,0.04)';
        }}
        aria-label="Back"
      >
        <ArrowLeft size={20} className="text-gray-900" />
      </button>

      {/* Photo Counter */}
      {attachments.length > 1 && (
        <div 
          className="absolute z-10 px-4 py-2 rounded-full bg-black bg-opacity-50"
          style={{
            top: typeof window !== 'undefined' && window.innerWidth < 1024 
              ? 'max(env(safe-area-inset-top), 70px)' 
              : '32px',
            right: typeof window !== 'undefined' && window.innerWidth < 1024 ? '16px' : '32px'
          }}
        >
          <span className="text-sm font-medium text-white">
            {currentIndex + 1} / {attachments.length}
          </span>
        </div>
      )}

      {/* Main Media Container with Sliding Carousel */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', position: 'relative' }}
      >
        <div 
          className="flex items-center justify-start relative"
          style={{
            width: `${attachments.length * screenWidth + (attachments.length - 1) * 16}px`,
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            transform: `translateX(${totalTransform}px)`,
            transition: (isSwiping || !allowTransition) ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: isSwiping ? 'transform' : 'auto',
            position: 'absolute',
            left: 0,
            top: 0,
            gap: '16px'
          }}
        >
          {attachments.map((attachment, index) => (
            <div
              key={attachment.id || index}
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: `${screenWidth}px`,
                height: '100%',
                padding: '0'
              }}
            >
              {attachment.file_type === 'video' ? (
                <video
                  ref={(el) => {
                    if (videoRefs.current) {
                      videoRefs.current[index] = el;
                    }
                  }}
                  src={attachment.file_url}
                  controls
                  autoPlay={index === currentIndex}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '100vh' }}
                  playsInline
                />
              ) : (
                <img
                  src={attachment.file_url}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '100vh' }}
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}