"use client";

import { useState, useRef, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { X } from 'lucide-react';

interface CancelEventModalProps {
  listingId: string;
  onClose: () => void;
  onDelete: () => void;
}

export default function CancelEventModal({ listingId, onClose, onDelete }: CancelEventModalProps) {
  const [swipeProgress, setSwipeProgress] = useState(0); // 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Handle mouse/touch events for swipe
  const handleStart = (clientX: number) => {
    if (isDeleting) return; // Prevent dragging while deleting
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !sliderRef.current) return;

    const sliderRect = sliderRef.current.getBoundingClientRect();
    const sliderLeft = sliderRect.left;
    const sliderWidth = sliderRect.width;
    const padding = 16; // Padding on each side
    const handleTouchArea = 56; // Touch area width
    
    // Calculate position relative to slider (center handle on cursor)
    const relativeX = clientX - sliderLeft - (handleTouchArea / 2);
    const maxPosition = sliderWidth - (padding * 2) - handleTouchArea;
    
    // Calculate progress (0 to 100)
    const progress = Math.max(0, Math.min(100, (relativeX / maxPosition) * 100));
    
    setSwipeProgress(progress);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If swiped 95% or more, trigger delete
    if (swipeProgress >= 95) {
      handleDelete();
    } else {
      // Bounce back to start
      setSwipeProgress(0);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Global mouse events for dragging outside the handle
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX);
      };
      const handleGlobalMouseUp = () => {
        handleEnd();
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startX]);

  // Global touch events
  useEffect(() => {
    if (isDragging) {
      const handleGlobalTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          handleMove(e.touches[0].clientX);
        }
      };
      const handleGlobalTouchEnd = () => {
        handleEnd();
      };

      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      window.addEventListener('touchend', handleGlobalTouchEnd);

      return () => {
        window.removeEventListener('touchmove', handleGlobalTouchMove);
        window.removeEventListener('touchend', handleGlobalTouchEnd);
      };
    }
  }, [isDragging, startX, swipeProgress]);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Delete listing_participants first (foreign key constraint)
      const { error: participantsError } = await supabase
        .from('listing_participants')
        .delete()
        .eq('listing_id', listingId);

      if (participantsError) {
        console.error('Error deleting listing participants:', participantsError);
        // Continue with listing deletion even if participants deletion fails
      }

      // Delete the listing
      const { error: listingError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (listingError) {
        console.error('Error deleting listing:', listingError);
        alert('Failed to delete listing. Please try again.');
        setIsDeleting(false);
        return;
      }

      // Success - close modal and navigate
      onDelete();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
      setIsDeleting(false);
    }
  };

  // Calculate handle position
  // Handle starts at left edge (0%) and moves to right edge (100%)
  // Position is calculated as percentage, accounting for handle width
  const handlePosition = swipeProgress; // 0 to 100

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      onClick={(e) => {
        // Only close if clicking backdrop, not modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-white overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 16px)',
          maxWidth: '500px',
          marginTop: '20px',
          marginBottom: '8px',
          height: '50vh',
          borderTopLeftRadius: '60px',
          borderTopRightRadius: '60px',
          borderBottomLeftRadius: '60px',
          borderBottomRightRadius: '60px',
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-6 pt-8 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cancel Event</h2>
          <button
            onClick={onClose}
            className="absolute right-8 top-8 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            <X size={20} className="text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 flex-1 flex flex-col justify-center items-center"
          style={{
            paddingTop: 'calc(32px * 1.3)',
          }}
        >
          <p className="text-base font-normal text-gray-900 mb-4 text-center">
            Swipe this modal to delete this listing
          </p>
          
          <p className="text-sm font-normal text-red-600 mb-8 text-center">
            This action can't be reverted
          </p>

          {/* Swipeable Slider */}
          <div 
            ref={sliderRef}
            className="relative w-full"
            style={{
              height: '56px',
              maxWidth: '100%',
              padding: '16px', // Even padding on all sides
            }}
          >
            {/* Red Background Bar */}
            <div 
              className="absolute rounded-full"
              style={{
                backgroundColor: '#EF4444',
                height: '56px',
                left: '16px',
                right: '16px',
                top: '0',
                bottom: '0',
              }}
            />
            
            {/* White Handle */}
            <div
              ref={handleRef}
              className="absolute top-0 bottom-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{
                width: '56px', // Larger touch target
                height: '56px',
                left: sliderRef.current 
                  ? `${16 + (swipeProgress / 100) * (sliderRef.current.offsetWidth - 32 - 56)}px`
                  : '16px',
                transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="bg-white rounded-full flex-shrink-0"
                style={{
                  width: '24px',
                  height: '24px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
                }}
              />
            </div>
          </div>

          {isDeleting && (
            <p className="text-sm font-normal text-gray-600 mt-4 text-center">
              Deleting...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

