"use client";

import React, { useState, useRef } from 'react';
import { X, MapPin, Image as ImageIcon, Hash } from 'lucide-react';

interface ItineraryViewerProps {
  isOpen: boolean;
  itinerary: any[];
  onClose: () => void;
}

export default function ItineraryViewer({ isOpen, itinerary, onClose }: ItineraryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
          paddingTop: 'max(env(safe-area-inset-top), 60px)',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex flex-col items-center">
          {/* Close Button - Top Right */}
          <button
            onClick={onClose}
            className="absolute right-4 top-[max(env(safe-area-inset-top),60px)] flex items-center justify-center transition-all duration-200"
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

          <h1 className="text-xl font-semibold text-gray-900">Itinerary</h1>
          <p className="text-sm text-gray-500 mt-1">{currentIndex + 1} of {itinerary.length}</p>
        </div>
      </div>

      {/* Scrollable Cards Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory h-full"
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top), 60px) + 100px)',
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
            className="flex-shrink-0 snap-center"
            style={{
              width: 'calc(100vw - 32px)',
              marginRight: index < itinerary.length - 1 ? '16px' : '0',
            }}
          >
            <div
              className="bg-white rounded-2xl p-6 h-full"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              {/* Image Card */}
              {item.photo && (
                <div
                  className="relative bg-gray-100 rounded-xl overflow-hidden mb-6"
                  style={{ 
                    aspectRatio: '1',
                    marginLeft: '40px',
                    marginRight: '40px',
                  }}
                >
                  <img
                    src={item.photo}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                {item.title}
              </h2>

              {/* Date and Time */}
              <p className="text-base text-gray-500 mb-6 text-center">
                {formatDateTime(item.startDate)}
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

