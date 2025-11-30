"use client";

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Listing } from '@/lib/listingsService';

interface ListingCardProps {
  listing: Listing;
  size?: 'small' | 'medium' | 'large';
  showDate?: boolean;
  className?: string;
  from?: string; // Optional custom 'from' parameter for navigation
}

export default function ListingCard({ 
  listing, 
  size = 'medium',
  showDate = true,
  className = '',
  from
}: ListingCardProps) {
  const router = useRouter();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMovedRef = useRef<boolean>(false);
  const [isTouching, setIsTouching] = useState(false);
  
  // Format date for display
  const formatListingDate = (dateString: string | null): string => {
    if (!dateString) return 'Anytime';
    try {
      const date = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
      return `${month} ${day}, ${hours}:${minutesStr}${ampm}`;
    } catch {
      return 'Anytime';
    }
  };

  if (!listing?.id) {
    console.error('ListingCard: No listing ID available', { listing, hasListing: !!listing, hasId: !!listing?.id });
    return null;
  }

  // Use context-agnostic route with source context tracking
  // This allows listings to work from any context (my-life, explore, for-you, chat, etc.)
  const getListingUrl = () => {
    // Use custom 'from' prop if provided, otherwise use current pathname
    const sourcePath = from || (typeof window !== 'undefined' ? window.location.pathname : '/explore');
    const params = new URLSearchParams();
    params.set('id', listing.id);
    params.set('from', sourcePath);
    const url = `/listing?${params.toString()}`;
    console.log('ListingCard: getListingUrl - from prop:', from, 'sourcePath:', sourcePath, 'final URL:', url);
    return url;
  };
  
  const href = getListingUrl();
  
  // Handle touch start - track initial position
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchMovedRef.current = false;
    setIsTouching(true);
  };

  // Handle touch move - detect if user is scrolling
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const threshold = 10; // pixels
    
    // If movement exceeds threshold, user is scrolling
    if (deltaX > threshold || deltaY > threshold) {
      touchMovedRef.current = true;
    }
  };

  // Handle touch end - only navigate if it was a tap, not a scroll
  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsTouching(false);
    
    // Only navigate if touch didn't move significantly (it was a tap, not a scroll)
    if (!touchMovedRef.current && touchStartRef.current) {
      e.preventDefault();
      e.stopPropagation();
      console.log('ListingCard: Navigating to:', href, 'Listing:', { id: listing.id, title: listing.title });
      router.push(href);
    }
    
    // Reset for next touch
    touchStartRef.current = null;
    touchMovedRef.current = false;
  };
  
  // Handle click (for mouse/desktop) - use context-agnostic route
  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if not from a touch event
    if (!isTouching) {
      e.preventDefault();
      e.stopPropagation();
      console.log('ListingCard: Navigating to:', href, 'Listing:', { id: listing.id, title: listing.title });
      router.push(href);
    }
  };

  // Size-based styles
  const sizeClasses = {
    small: {
      image: 'w-16 h-16',
      title: 'text-sm',
      date: 'text-xs'
    },
    medium: {
      image: 'aspect-square',
      title: 'text-sm',
      date: 'text-xs'
    },
    large: {
      image: 'aspect-square',
      title: 'text-base',
      date: 'text-sm'
    }
  };

  const styles = sizeClasses[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`flex flex-col gap-1.5 text-left transition-all duration-200 hover:-translate-y-[1px] focus:outline-none cursor-pointer active:scale-[0.98] ${className}`}
      style={{ touchAction: 'pan-y', position: 'relative', zIndex: 1 }}
    >
      {/* Card Image */}
      <div
        className={`rounded-xl bg-white overflow-hidden relative ${styles.image}`}
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
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
        {listing.photo_urls && listing.photo_urls.length > 0 ? (
          listing.photo_urls.length <= 3 ? (
            <img 
              src={listing.photo_urls[0]} 
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0">
              {listing.photo_urls.slice(0, 4).map((photo, index) => (
                <div key={index} className="w-full h-full overflow-hidden">
                  <img 
                    src={photo} 
                    alt={`${listing.title} photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-2xl">📷</span>
          </div>
        )}
      </div>
      
      {/* Title and Date */}
      {size !== 'small' && (
        <div className="flex flex-col gap-0.5">
          <h3 className={`${styles.title} font-semibold text-gray-900 leading-tight truncate`}>
            {listing.title}
          </h3>
          {showDate && (
            <p className={`${styles.date} text-gray-600 leading-tight`}>
              {formatListingDate(listing.start_date)}
            </p>
          )}
        </div>
      )}
    </button>
  );
}
