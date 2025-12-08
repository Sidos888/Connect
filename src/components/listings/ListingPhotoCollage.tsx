"use client";

import { Image as ImageIcon } from 'lucide-react';

interface ListingPhotoCollageProps {
  photos: string[];
  onPhotoClick?: (index?: number) => void; // Click handler - if index provided, opens viewer at that photo
  onGridClick?: () => void; // Click handler for photo count badge to open grid view
  editable?: boolean; // If true, shows clickable buttons (for preview page)
}

export default function ListingPhotoCollage({ 
  photos, 
  onPhotoClick,
  onGridClick,
  editable = false 
}: ListingPhotoCollageProps) {
  if (photos.length === 0) {
    if (editable && onPhotoClick) {
      return (
        <button
          onClick={() => onPhotoClick && onPhotoClick(0)}
          className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
          style={{
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
          <ImageIcon size={48} className="text-gray-400" />
        </button>
      );
    }
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <ImageIcon size={48} className="text-gray-400" />
      </div>
    );
  }

  const PhotoCountBadge = ({ count, onClick }: { count: number; onClick?: () => void }) => {
    const badgeContent = (
      <div className="flex items-center justify-center gap-1.5 bg-white"
      style={{
        width: '53px',
        height: '40px',
        borderRadius: '20px',
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        pointerEvents: 'none' // Prevent badge content from blocking clicks
      }}
    >
      <span className="text-sm font-medium text-gray-900">{count}</span>
      <ImageIcon size={18} className="text-gray-900" />
    </div>
  );

    if (onClick) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('PhotoCountBadge clicked, calling onClick');
            onClick();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('PhotoCountBadge touched, calling onClick');
            onClick();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className="photo-badge-button absolute bottom-3 right-3 cursor-pointer transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
          style={{
            willChange: 'transform, box-shadow',
            pointerEvents: 'auto',
            zIndex: 50, // Very high z-index to ensure it's above everything
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            touchAction: 'manipulation'
          }}
          onMouseEnter={(e) => {
            const badge = e.currentTarget.querySelector('div');
            if (badge) {
              badge.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            const badge = e.currentTarget.querySelector('div');
            if (badge) {
              badge.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }
          }}
        >
          {badgeContent}
        </button>
      );
    }

    return (
      <div className="absolute bottom-3 right-3">
        {badgeContent}
      </div>
    );
  };

  if (photos.length <= 3) {
    const content = (
      <>
        <img 
          src={photos[0]} 
          alt="Listing" 
          className="w-full h-full object-cover"
          onClick={() => onPhotoClick && onPhotoClick(0)}
          style={{ cursor: onPhotoClick ? 'pointer' : 'default' }}
        />
        {photos.length > 1 && (onGridClick || onPhotoClick) && <PhotoCountBadge count={photos.length} onClick={onGridClick || (() => onPhotoClick && onPhotoClick(0))} />}
      </>
    );

    if (editable && onPhotoClick) {
      return (
        <button
          onClick={() => onPhotoClick && onPhotoClick(0)}
          className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:-translate-y-[1px]"
          style={{
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
          {content}
        </button>
      );
    }

    // If onPhotoClick is provided but not editable, make it clickable to view photos
    if (onPhotoClick && !editable) {
      return (
        <div
          className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
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
          onClick={(e) => {
            // Only trigger if clicking on the background, not the badge
            const target = e.target as HTMLElement;
            if (!target.closest('.photo-badge-button')) {
              console.log('Background clicked, calling onPhotoClick');
              onPhotoClick();
            }
          }}
        >
          {content}
        </div>
      );
    }

    return (
      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative">
        {content}
      </div>
    );
  }

  // 4+ photos: show grid with first 4
  const gridContent = (
    <>
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0">
        {photos.slice(0, 4).map((photo, index) => (
          <div 
            key={index} 
            className="w-full h-full overflow-hidden"
            data-photo-index={index}
            onClick={(e) => {
              e.stopPropagation();
              if (onPhotoClick) onPhotoClick(index);
            }}
            style={{ cursor: onPhotoClick ? 'pointer' : 'default' }}
          >
            <img 
              src={photo} 
              alt={`Listing photo ${index + 1}`} 
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      {(onGridClick || onPhotoClick) && <PhotoCountBadge count={photos.length} onClick={onGridClick || onPhotoClick} />}
    </>
  );

  if (editable && onPhotoClick) {
    return (
      <div
        className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:-translate-y-[1px]"
        style={{
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
        {gridContent}
      </div>
    );
  }

    // If onPhotoClick is provided but not editable, make it clickable to view photos
    if (onPhotoClick && !editable) {
      return (
        <div
          className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
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
          onClick={(e) => {
            // Only trigger if clicking on the background (not a grid item or badge)
            const target = e.target as HTMLElement;
            if (!target.closest('.photo-badge-button') && !target.closest('[data-photo-index]')) {
              // Default to first photo if clicking background
              if (onPhotoClick) onPhotoClick(0);
            }
          }}
        >
          {gridContent}
        </div>
      );
    }

  return (
    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 relative">
      {gridContent}
    </div>
  );
}

