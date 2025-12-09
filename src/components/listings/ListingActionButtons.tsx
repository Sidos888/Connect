"use client";

import { useState, useEffect } from 'react';
import { UserPlus, MessageCircle, Settings, MoreHorizontal, Users, Camera } from 'lucide-react';
import { Listing, listingsService } from '@/lib/listingsService';
import { useRouter } from 'next/navigation';
import MoreOptionsModal from './MoreOptionsModal';

interface ListingActionButtonsProps {
  userRole: 'host' | 'participant' | 'viewer';
  listingId: string;
  listing?: Listing | null;
  isCurrentUserParticipant?: boolean; // Whether current user is already a participant
  eventChatEnabled?: boolean; // Whether event chat is enabled
  onManage?: () => void;
  onJoin?: () => void;
  onLeave?: () => void; // Handler for when user clicks "Attending" (to leave)
  onMoreClick?: () => boolean | void; // Handler for when user clicks "More" (for login check). Returns false to prevent showing modal.
}

export default function ListingActionButtons({ 
  userRole, 
  listingId,
  listing,
  isCurrentUserParticipant = false,
  eventChatEnabled = false,
  onManage,
  onJoin,
  onLeave,
  onMoreClick
}: ListingActionButtonsProps) {
  const router = useRouter();
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [hasGallery, setHasGallery] = useState(false);

  // Check if gallery exists
  useEffect(() => {
    const checkGallery = async () => {
      if (!listingId) return;
      const { gallery } = await listingsService.getEventGallery(listingId);
      setHasGallery(!!gallery);
    };
    checkGallery();
  }, [listingId]);

  const handleGalleryClick = () => {
    router.push(`/listing?id=${listingId}&view=gallery`);
  };

  const handleEventChatClick = () => {
    if (listing?.event_chat_id) {
      // Pass 'from' parameter to return to listing page when back button is clicked
      const listingUrl = `/listing?id=${listingId}`;
      router.push(`/chat/individual?chat=${listing.event_chat_id}&from=${encodeURIComponent(listingUrl)}`);
    }
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
    // Show gallery button only if user is a participant (not viewer) and gallery exists
    const showGallery = userRole === 'participant' && hasGallery;
    // Show event chat button if event chat is enabled (for both participants and viewers)
    const showEventChat = eventChatEnabled && listing?.event_chat_id;
    
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

        {/* Event Chat Button - Show if event chat is enabled */}
        {showEventChat && (
          <button
            onClick={handleEventChatClick}
            className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
            style={getButtonStyles(true)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="flex items-center justify-center bg-white"
              style={getIconContainerStyles()}
            >
              <MessageCircle size={24} className="text-gray-900" />
            </div>
            <span className="text-xs font-medium text-gray-900">Chat</span>
          </button>
        )}

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
          onClick={() => {
            if (onMoreClick) {
              // If onMoreClick is provided, call it and check if we should proceed
              const shouldProceed = onMoreClick();
              // If onMoreClick returns false, don't show the modal (e.g., user not signed in)
              if (shouldProceed === false) {
                return;
              }
              // If onMoreClick returns true or undefined, show the modal (user is signed in)
            }
            setShowMoreModal(true);
          }}
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

  // Host buttons
  // Show gallery button only if gallery exists
  const showGallery = hasGallery;
  // Show event chat button if event chat is enabled
  const showEventChat = eventChatEnabled && listing?.event_chat_id;
  
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

      {/* Event Chat Button - Show if event chat is enabled */}
      {showEventChat && (
        <button
          onClick={handleEventChatClick}
          className="flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
          style={getButtonStyles(true)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="flex items-center justify-center bg-white"
            style={getIconContainerStyles()}
          >
            <MessageCircle size={24} className="text-gray-900" />
          </div>
          <span className="text-xs font-medium text-gray-900">Chat</span>
        </button>
      )}

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
        onClick={() => {
          if (onMoreClick) {
            // If onMoreClick is provided, call it and check if we should proceed
            const shouldProceed = onMoreClick();
            // If onMoreClick returns false, don't show the modal (e.g., user not signed in)
            if (shouldProceed === false) {
              return;
            }
            // If onMoreClick returns true or undefined, show the modal (user is signed in)
          }
          setShowMoreModal(true);
        }}
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

