"use client";

import { useState } from 'react';
import { UserPlus, MessageCircle, Settings, MoreHorizontal, Users, Camera } from 'lucide-react';
import { Listing } from '@/lib/listingsService';
import { useRouter } from 'next/navigation';
import MoreOptionsModal from './MoreOptionsModal';

interface ListingActionButtonsProps {
  userRole: 'host' | 'participant' | 'viewer';
  listingId: string;
  listing?: Listing | null;
  isCurrentUserParticipant?: boolean; // Whether current user is already a participant
  onManage?: () => void;
  onJoin?: () => void;
  onLeave?: () => void; // Handler for when user clicks "Attending" (to leave)
}

export default function ListingActionButtons({ 
  userRole, 
  listingId,
  listing,
  isCurrentUserParticipant = false,
  onManage,
  onJoin,
  onLeave
}: ListingActionButtonsProps) {
  const router = useRouter();
  const [showMoreModal, setShowMoreModal] = useState(false);

  const handleGalleryClick = () => {
    router.push(`/listing?id=${listingId}&view=gallery`);
  };
  // Show participant buttons for both participants and viewers (so viewers can join)
  // Only hide buttons for non-logged-in users (which would be handled by the parent component)

  // Common button styling function
  const getButtonStyles = (isClickable: boolean) => ({
    cursor: isClickable ? 'pointer' : 'default',
    willChange: 'transform, box-shadow' as const
  });

  const getIconContainerStyles = () => ({
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    borderWidth: '0.4px',
    borderColor: '#E5E7EB',
    borderStyle: 'solid' as const,
    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
    willChange: 'transform, box-shadow' as const
  });

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const iconContainer = e.currentTarget.querySelector('div');
    if (iconContainer) {
      iconContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const iconContainer = e.currentTarget.querySelector('div');
    if (iconContainer) {
      iconContainer.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
    }
  };

  // Participant buttons - shown for both participants and viewers
  if (userRole === 'participant' || userRole === 'viewer') {
    // Show gallery button only if user is a participant (not viewer) and listing has gallery enabled
    const showGallery = userRole === 'participant' && listing?.has_gallery;
    
    // Debug logging
    console.log('🎨 ListingActionButtons - Gallery check:', {
      userRole,
      hasGallery: listing?.has_gallery,
      showGallery,
      listingId,
      isCurrentUserParticipant
    });
    
    return (
      <div className="flex items-center justify-center gap-4 my-6">
        {/* Join/Attending Button - Clickable */}
        <button
          onClick={isCurrentUserParticipant ? onLeave : onJoin}
          className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
          style={getButtonStyles(true)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="flex items-center justify-center bg-white"
            style={getIconContainerStyles()}
          >
            <Users size={24} className="text-gray-900" />
          </div>
          <span className="text-xs font-medium text-gray-900">{isCurrentUserParticipant ? 'Attending' : 'Join'}</span>
        </button>

        {/* Gallery Button - Only show for participants/hosts when gallery is enabled */}
        {showGallery && (
          <button
            onClick={handleGalleryClick}
            className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
            style={getButtonStyles(true)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="flex items-center justify-center bg-white"
              style={getIconContainerStyles()}
            >
              <Camera size={24} className="text-gray-900" />
            </div>
            <span className="text-xs font-medium text-gray-900">Gallery</span>
          </button>
        )}

        {/* More Button - Opens modal */}
        <button
          onClick={() => setShowMoreModal(true)}
          className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
          style={getButtonStyles(true)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="flex items-center justify-center bg-white"
            style={getIconContainerStyles()}
          >
            <MoreHorizontal size={24} className="text-gray-900" />
          </div>
          <span className="text-xs font-medium text-gray-900">More</span>
        </button>

        {/* More Options Modal */}
        <MoreOptionsModal
          isOpen={showMoreModal}
          onClose={() => setShowMoreModal(false)}
          hostId={listing?.host_id || null}
          userRole={userRole}
        />
      </div>
    );
  }

  // Host buttons (3 buttons - removed Chat)
  // Show gallery button only if listing has gallery enabled
  const showGallery = listing?.has_gallery;
  
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      {/* Invite Button - Opens invite page */}
      <button
        onClick={() => router.push(`/listing/invite?id=${listingId}`)}
        className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
        style={getButtonStyles(true)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="flex items-center justify-center bg-white"
          style={getIconContainerStyles()}
        >
          <UserPlus size={24} className="text-gray-900" />
        </div>
        <span className="text-xs font-medium text-gray-900">Invite</span>
      </button>

      {/* Gallery Button - Only show for hosts when gallery is enabled */}
      {showGallery && (
        <button
          onClick={handleGalleryClick}
          className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
          style={getButtonStyles(true)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="flex items-center justify-center bg-white"
            style={getIconContainerStyles()}
          >
            <Camera size={24} className="text-gray-900" />
          </div>
          <span className="text-xs font-medium text-gray-900">Gallery</span>
        </button>
      )}

      {/* Manage Button - Clickable */}
      <button
        onClick={onManage}
        className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
        style={getButtonStyles(true)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="flex items-center justify-center bg-white"
          style={getIconContainerStyles()}
        >
          <Settings size={24} className="text-gray-900" />
        </div>
        <span className="text-xs font-medium text-gray-900">Manage</span>
      </button>

      {/* More Button - Opens modal */}
      <button
        onClick={() => setShowMoreModal(true)}
        className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
        style={getButtonStyles(true)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="flex items-center justify-center bg-white"
          style={getIconContainerStyles()}
        >
          <MoreHorizontal size={24} className="text-gray-900" />
        </div>
        <span className="text-xs font-medium text-gray-900">More</span>
      </button>

      {/* More Options Modal */}
      <MoreOptionsModal
        isOpen={showMoreModal}
        onClose={() => setShowMoreModal(false)}
        hostId={listing?.host_id || null}
        userRole={userRole}
      />
    </div>
  );
}

