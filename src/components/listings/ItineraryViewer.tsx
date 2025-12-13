"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Pencil, MapPin } from 'lucide-react';

interface ItineraryViewerProps {
  isOpen: boolean;
  itinerary: any[];
  initialIndex?: number;
  onClose: () => void;
  onEdit?: (index: number) => void;
}

export default function ItineraryViewer({ isOpen, itinerary, initialIndex = 0, onClose, onEdit }: ItineraryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update currentIndex and scroll position when initialIndex or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Scroll to the initial index after a brief delay to ensure DOM is ready
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const cardWidth = scrollContainerRef.current.offsetWidth;
          scrollContainerRef.current.scrollLeft = initialIndex * cardWidth;
        }
      }, 50);
    }
  }, [isOpen, initialIndex]);

  if (!isOpen || !itinerary || itinerary.length === 0) return null;

  const currentItem = itinerary[currentIndex];

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
    
    return `${day} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth;
    const newIndex = Math.round(scrollLeft / cardWidth);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < itinerary.length) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white"
      style={{
        touchAction: 'pan-x',
      }}
    >
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-10 bg-white"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 70px)',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex items-center justify-center relative">
          {/* Close Button - Absolute Left */}
          <button
            onClick={onClose}
            className="absolute left-0 flex items-center justify-center transition-all duration-200"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <X size={24} className="text-gray-900" strokeWidth={2.5} />
          </button>

          {/* Title and Subtitle - Centered */}
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-semibold text-gray-900">Itinerary</h1>
            <p className="text-sm text-gray-500 mt-0.5">{currentIndex + 1} of {itinerary.length}</p>
          </div>

          {/* Edit Button - Absolute Right */}
          <button
            onClick={() => onEdit?.(currentIndex)}
            className="absolute right-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            <Pencil size={20} className="text-gray-900" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Cards Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory h-full"
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top), 70px) + 90px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 40px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {itinerary.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 snap-center overflow-y-auto"
            style={{
              width: 'calc(100vw - 32px)',
              marginRight: index < itinerary.length - 1 ? '16px' : '0',
            }}
          >
            <div
              className="bg-white rounded-2xl p-6"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                minHeight: 'calc(100vh - max(env(safe-area-inset-top), 70px) - 200px)',
              }}
            >
              {/* Image Card */}
              <div
                className="relative bg-gray-100 rounded-xl overflow-hidden mb-6"
                style={{ 
                  aspectRatio: '1',
                  marginLeft: '20px',
                  marginRight: '20px',
                }}
              >
                {item.photo ? (
                  <img
                    src={item.photo}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                {item.title}
              </h2>

              {/* Date and Time */}
              <p className="text-base text-gray-500 mb-6 text-center">
                {item.startDate ? formatDateTime(item.startDate) : 'Date And Time'}
              </p>

              {/* Description */}
              {item.summary && item.summary.trim() && (
                <div
                  className="bg-gray-50 rounded-xl p-4 mb-4"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                  }}
                >
                  <p className="text-sm font-medium text-gray-900 mb-2">Description</p>
                  <p className="text-sm text-gray-700">{item.summary}</p>
                </div>
              )}

              {/* Location */}
              {item.location && item.location.trim() && (
                <div
                  className="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                  }}
                >
                  <MapPin size={20} className="text-gray-900" />
                  <p className="text-sm font-medium text-gray-900">{item.location}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
