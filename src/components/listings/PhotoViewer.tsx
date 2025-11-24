"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PhotoViewerProps {
  isOpen: boolean;
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoViewer({ isOpen, photos, initialIndex, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [allowTransition, setAllowTransition] = useState(false); // Track if transitions should be enabled
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousInitialIndexRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const lastTouchXRef = useRef<number | null>(null);
  const lastTouchTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Check if this is a new open (different initialIndex) or just reopening
      const isNewImage = previousInitialIndexRef.current !== initialIndex;
      
      // Reset everything for new image
      setCurrentIndex(initialIndex);
      setSwipeOffset(0);
      setIsSwiping(false);
      setAllowTransition(false); // Disable transitions on initial load
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      
      // Store the current initialIndex
      previousInitialIndexRef.current = initialIndex;
      
      // Re-enable transitions after a brief delay (only for swipe gestures, not initial load)
      // This ensures the initial load has no transition
      const timeout = setTimeout(() => {
        setAllowTransition(true);
      }, 50); // Small delay to ensure initial render completes without transition
      
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
  }, [isOpen, currentIndex, photos.length]);

  const goToPrevious = () => {
    if (isSwiping) return;
    setAllowTransition(true); // Enable transition for keyboard navigation
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setSwipeOffset(0);
  };

  const goToNext = () => {
    if (isSwiping) return;
    setAllowTransition(true); // Enable transition for keyboard navigation
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
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
    
    // Track velocity for momentum calculation
    if (lastTouchXRef.current !== null && lastTouchTimeRef.current !== null) {
      const deltaX = currentX - lastTouchXRef.current;
      const deltaTime = now - lastTouchTimeRef.current;
      // Store for velocity calculation in handleTouchEnd
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
    const distanceThreshold = screenWidth * 0.5; // 50% of screen width to commit to navigation
    
    // Calculate velocity for momentum-based navigation
    let velocity = 0;
    if (lastTouchXRef.current !== null && lastTouchTimeRef.current !== null && touchStartTimeRef.current !== null) {
      const totalDeltaX = lastTouchXRef.current - (touchStartXRef.current || 0);
      const totalDeltaTime = lastTouchTimeRef.current - touchStartTimeRef.current;
      if (totalDeltaTime > 0) {
        velocity = Math.abs(totalDeltaX / totalDeltaTime); // pixels per millisecond
      }
    }
    
    // Velocity threshold: if swiping faster than 0.5 pixels/ms, commit to navigation
    const velocityThreshold = 0.5;
    const hasMomentum = velocity > velocityThreshold;
    
    // Determine swipe direction
    const isLeftSwipe = swipeOffset < 0;
    const isRightSwipe = swipeOffset > 0;
    
    // Reset touch state
    setTouchStart(null);
    touchStartTimeRef.current = null;
    touchStartXRef.current = null;
    lastTouchXRef.current = null;
    lastTouchTimeRef.current = null;
    
    // Navigate if either distance threshold OR momentum threshold is met
    if (swipeDistance > distanceThreshold || hasMomentum) {
      if (isLeftSwipe && currentIndex < photos.length - 1) {
        // Commit to next photo - maintain visual continuity
        setIsSwiping(false);
        const currentOffset = swipeOffset; // negative value
        const newIndex = currentIndex + 1;
        const gap = 16; // Gap between photos
        
        // Calculate new offset to maintain visual position (accounting for gap)
        // Old position: -currentIndex * (screenWidth + gap) + currentOffset
        // New position: -newIndex * (screenWidth + gap) + newOffset
        // We want them equal, so: newOffset = -currentIndex * (screenWidth + gap) + currentOffset + newIndex * (screenWidth + gap)
        // Simplifying: newOffset = (screenWidth + gap) + currentOffset
        const newOffset = (screenWidth + gap) + currentOffset;
        
        // Update both simultaneously to prevent jump
        setCurrentIndex(newIndex);
        setSwipeOffset(newOffset);
        
        // Animate to final position (offset = 0)
        requestAnimationFrame(() => {
          setSwipeOffset(0);
        });
      } else if (isRightSwipe && currentIndex > 0) {
        // Commit to previous photo - maintain visual continuity
        setIsSwiping(false);
        const currentOffset = swipeOffset; // positive value
        const newIndex = currentIndex - 1;
        const gap = 16; // Gap between photos
        
        // Calculate new offset to maintain visual position (accounting for gap)
        // Old position: -currentIndex * (screenWidth + gap) + currentOffset
        // New position: -newIndex * (screenWidth + gap) + newOffset
        // We want them equal, so: newOffset = -currentIndex * (screenWidth + gap) + currentOffset + newIndex * (screenWidth + gap)
        // Simplifying: newOffset = -(screenWidth + gap) + currentOffset
        const newOffset = -(screenWidth + gap) + currentOffset;
        
        // Update both simultaneously to prevent jump
        setCurrentIndex(newIndex);
        setSwipeOffset(newOffset);
        
        // Animate to final position (offset = 0)
        requestAnimationFrame(() => {
          setSwipeOffset(0);
        });
      } else {
        // Can't navigate further, snap back
        setIsSwiping(false);
        setSwipeOffset(0);
      }
    } else {
      // Snap back to current photo if swipe is less than 50%
      setIsSwiping(false);
      setSwipeOffset(0);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || photos.length === 0) {
    return null;
  }

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const gap = 16; // Gap between photos in pixels (black padding like Apple Photos)
  // Calculate base transform based on current index (accounting for gap)
  const baseTransform = -currentIndex * (screenWidth + gap);
  // Add swipe offset for smooth transitions
  const totalTransform = baseTransform + swipeOffset;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        backgroundColor: '#000000',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Back Button - Positioned like PageHeader back button */}
      <button
        onClick={onClose}
        className="absolute z-10 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
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
          willChange: 'transform, box-shadow'
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
      {photos.length > 1 && (
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
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
      )}

      {/* Main Photo Container with Sliding Carousel */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', position: 'relative' }}
      >
        <div 
          className="flex items-center justify-start relative"
          style={{
            width: `${photos.length * screenWidth + (photos.length - 1) * 16}px`,
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
          {photos.map((photo, index) => (
            <div
              key={index}
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: `${screenWidth}px`,
                height: '100%',
                padding: '0'
              }}
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="max-w-full max-h-full object-contain"
                style={{
                  borderRadius: '0px',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
