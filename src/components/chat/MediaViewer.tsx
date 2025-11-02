"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaAttachment } from "@/lib/types";

interface MediaViewerProps {
  isOpen: boolean;
  allMedia: MediaAttachment[];
  initialIndex: number;
  onClose: () => void;
}

export default function MediaViewer({ isOpen, allMedia, initialIndex, onClose }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
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
  }, [isOpen, currentIndex, allMedia.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || allMedia.length === 0) {
    return null;
  }

  const currentMedia = allMedia[currentIndex];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
      onClick={handleBackdropClick}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <div className="text-white">
          <h2 className="text-lg font-semibold">Photos & Videos</h2>
          <p className="text-sm text-gray-300">
            {currentIndex + 1} / {allMedia.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Navigation arrows */}
      {allMedia.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors hidden lg:block"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors hidden lg:block"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        </>
      )}

      {/* Media content */}
      <div
        className="flex items-center justify-center max-w-full max-h-full p-8 pt-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentMedia.file_type === 'video' ? (
          <video
            ref={videoRef}
            src={currentMedia.file_url}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-lg"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
          />
        ) : (
          <img
            src={currentMedia.file_url}
            alt="Media"
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
            draggable={false}
          />
        )}
      </div>

      {/* Mobile swipe indicators */}
      {allMedia.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 lg:hidden">
          <div className="flex space-x-2">
            {allMedia.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-30'
                }`}
              />
            ))}
          </div>
          <p className="text-white text-sm text-center mt-2">
            Swipe to navigate
          </p>
        </div>
      )}

      {/* Keyboard shortcuts hint (desktop only) */}
      <div className="absolute bottom-8 right-8 hidden lg:block">
        <div className="text-white text-sm text-right">
          <p className="text-gray-300">Use ← → arrow keys to navigate</p>
          <p className="text-gray-300">Press ESC to close</p>
        </div>
      </div>
    </div>
  );
}
