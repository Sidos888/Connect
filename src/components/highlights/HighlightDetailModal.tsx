"use client";

import { X, MapPin, Calendar } from 'lucide-react';
import ListingPhotoCollage from '@/components/listings/ListingPhotoCollage';
import PhotoViewer from '@/components/listings/PhotoViewer';
import { useState } from 'react';

interface Highlight {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  location: string | null;
  image_url: string | null;
  photo_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

interface HighlightDetailModalProps {
  highlight: Highlight | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function HighlightDetailModal({ highlight, isOpen, onClose }: HighlightDetailModalProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showGridView, setShowGridView] = useState(false);
  
  if (!isOpen || !highlight) return null;

  // Get photos array - prefer photo_urls, fallback to image_url
  const photos = highlight.photo_urls && Array.isArray(highlight.photo_urls) && highlight.photo_urls.length > 0
    ? highlight.photo_urls
    : highlight.image_url
      ? [highlight.image_url]
      : [];

  // If grid view is active, show the grid
  if (showGridView && photos.length > 0) {
    return (
      <div 
        className="fixed inset-0 z-[100] bg-white flex flex-col"
        onClick={(e) => {
          // Only close if clicking backdrop
          if (e.target === e.currentTarget) {
            setShowGridView(false);
          }
        }}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {highlight.title} - {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </h2>
              <button
                onClick={() => setShowGridView(false)}
                className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.96)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              >
                <X size={20} className="text-gray-900" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setShowGridView(false);
                    setSelectedPhotoIndex(index);
                  }}
                  className="relative aspect-square bg-transparent overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-[1px]"
                  style={{ 
                    borderWidth: '0.4px', 
                    borderColor: '#E5E7EB',
                    backgroundColor: 'transparent',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const day = days[date.getDay()];
      const month = months[date.getMonth()];
      const dayNum = date.getDate();
      
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
      
      return `${day}, ${month} ${dayNum} at ${hours}:${minutesStr}${ampm}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '100px',
            background: 'rgba(255, 255, 255, 0.96)',
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

        {/* Images */}
        {photos.length > 0 && (
          <div className="w-full bg-gray-100 relative">
            <ListingPhotoCollage
              photos={photos}
              onPhotoClick={(index) => setSelectedPhotoIndex(index !== undefined ? index : 0)}
              onGridClick={() => setShowGridView(true)}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">{highlight.title}</h2>

          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={16} />
            <span>{formatDate(highlight.created_at)}</span>
          </div>

          {/* Summary */}
          {highlight.summary && (
            <div className="bg-white rounded-xl p-4"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <p className="text-base text-gray-900 whitespace-pre-wrap">{highlight.summary}</p>
            </div>
          )}

          {/* Location */}
          {highlight.location && (
            <div className="bg-white rounded-xl p-4 flex items-center gap-3"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <MapPin size={20} className="text-gray-400 flex-shrink-0" />
              <span className="text-base text-gray-900">{highlight.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer */}
      {selectedPhotoIndex !== null && photos.length > 0 && (
        <PhotoViewer
          isOpen={selectedPhotoIndex !== null}
          photos={photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </div>
  );
}

