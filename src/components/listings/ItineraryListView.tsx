"use client";

import React from 'react';
import { X, Pencil, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ItineraryListViewProps {
  isOpen: boolean;
  itinerary: any[];
  onClose: () => void;
  onItemClick: (index: number) => void;
}

export default function ItineraryListView({ isOpen, itinerary, onClose, onItemClick }: ItineraryListViewProps) {
  const router = useRouter();

  if (!isOpen || !itinerary || itinerary.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white"
      style={{
        touchAction: 'pan-y',
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
        <div className="flex items-center justify-center relative">
          {/* Back Button - Absolute Left */}
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

          {/* Title - Centered */}
          <h1 className="text-xl font-semibold text-gray-900">Itinerary</h1>

          {/* Double Button - Absolute Right */}
          <div
            className="absolute right-0 flex items-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              width: '88px', // Double the normal button width (44px * 2)
              height: '44px',
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.96)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            {/* Edit Button - Left Side */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Handle edit functionality
                console.log('Edit itinerary');
              }}
              className="flex items-center justify-center h-full transition-all duration-200"
              style={{
                width: '44px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Pencil size={20} className="text-gray-900" strokeWidth={2.5} />
            </button>

            {/* Plus Button - Right Side */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push('/my-life/create/itinerary');
              }}
              className="flex items-center justify-center h-full transition-all duration-200"
              style={{
                width: '44px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={20} className="text-gray-900" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable List */}
      <div
        className="overflow-y-auto"
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top), 60px) + 80px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 40px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          height: '100%',
        }}
      >
        <div className="space-y-3">
          {itinerary.map((item, index) => (
            <button
              key={index}
              onClick={() => onItemClick(index)}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-3 text-left transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                minHeight: '72px',
                cursor: 'pointer',
                willChange: 'transform, box-shadow',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              {/* Image - Small square */}
              <div
                className="flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden"
                style={{ width: '44px', height: '44px' }}
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
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">{item.title}</p>
              </div>

              {/* View Text */}
              <div className="flex-shrink-0 text-xs font-medium text-gray-500">
                View
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
