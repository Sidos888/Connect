"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Listing } from '@/lib/listingsService';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useAuth } from '@/lib/authContext';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import ListingPhotoCollage from '@/components/listings/ListingPhotoCollage';

interface LeaveEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
  listingId: string;
}

export default function LeaveEventModal({ isOpen, onClose, listing, listingId }: LeaveEventModalProps) {
  const router = useRouter();
  const { account } = useAuth();
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  if (!shouldRender || !listing) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const formatListingDate = (dateString: string | null): string => {
    if (!dateString) return 'Anytime';
    try {
      const date = new Date(dateString);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
      return `${month} ${day}${getDaySuffix(day)} • ${hours}:${minutesStr}${ampm}`;
    } catch {
      return 'Anytime';
    }
  };

  const getDaySuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleLeave = async () => {
    if (!listing || !account?.id || !listingId) {
      setLeaveError('Unable to leave listing. Please try again.');
      return;
    }

    setIsLeaving(true);
    setLeaveError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLeaveError('Database connection failed. Please try again.');
        setIsLeaving(false);
        return;
      }

      // Remove user from listing_participants
      const { data: deleteData, error: deleteError } = await supabase
        .from('listing_participants')
        .delete()
        .eq('listing_id', listingId)
        .eq('user_id', account.id)
        .select(); // Select to verify deletion

      if (deleteError) {
        console.error('Error leaving listing:', deleteError);
        setLeaveError('Failed to leave listing. Please try again.');
        setIsLeaving(false);
        return;
      }

      console.log('LeaveEventModal: Delete result:', { deleteData, deletedCount: deleteData?.length || 0 });

      // Verify the deletion by checking if record still exists
      const { data: verifyData, error: verifyError } = await supabase
        .from('listing_participants')
        .select('id')
        .eq('listing_id', listingId)
        .eq('user_id', account.id)
        .maybeSingle();

      if (verifyError) {
        console.error('Error verifying deletion:', verifyError);
      }

      console.log('LeaveEventModal: Verification check after delete:', { verifyData, stillExists: !!verifyData });

      if (verifyData) {
        console.error('LeaveEventModal: Record still exists after delete! This should not happen.');
        setLeaveError('Failed to leave listing. Please try again.');
        setIsLeaving(false);
        return;
      }

      // Immediately update the query cache to false (user is no longer a participant)
      // This ensures instant UI update
      queryClient.setQueryData(['listing-participant', listingId, account.id], false);
      console.log('LeaveEventModal: Set query data to false');

      // Also remove from cache completely to force fresh fetch
      queryClient.removeQueries({ queryKey: ['listing-participant', listingId, account.id], exact: true });

      // Invalidate and refetch relevant queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listing-participant', listingId, account.id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['listings', 'upcoming', account.id] }),
        queryClient.invalidateQueries({ queryKey: ['listing-attendee-count', listingId] }),
      ]);

      // Force refetch the participant status query immediately
      try {
        const refetchResult = await queryClient.refetchQueries({ 
          queryKey: ['listing-participant', listingId, account.id],
          exact: true 
        });
        console.log('LeaveEventModal: Refetch result:', refetchResult);
      } catch (error) {
        console.error('LeaveEventModal: Error refetching:', error);
      }

      // Close modal first
      handleClose();
      
      // Use a timestamp to force a remount of the listing page
      // This ensures the query refetches and the component re-renders
      setTimeout(() => {
        const timestamp = Date.now();
        router.replace(`/listing?id=${listingId}&_refresh=${timestamp}`);
        // Also force a router refresh to ensure the page updates
        router.refresh();
      }, 100);
    } catch (error) {
      console.error('Error in handleLeave:', error);
      setLeaveError('An unexpected error occurred. Please try again.');
      setIsLeaving(false);
    }
  };

  const photos = listing.photo_urls || [];
  const primaryPhoto = photos.length > 0 ? photos[0] : null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isVisible ? 1 : 0
        }}
      />

      {/* Modal Content */}
      <div
        className="relative bg-white w-full max-w-md transition-transform duration-300 ease-out overflow-hidden"
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          borderTopLeftRadius: `${cornerRadius}px`,
          borderTopRightRadius: `${cornerRadius}px`,
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
          <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Attending</h2>
          <button
            onClick={handleClose}
            className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              right: '24px',
              top: '24px',
              width: '44px',
              height: '44px',
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
            aria-label="Close"
          >
            <X size={20} className="text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Photo */}
          {primaryPhoto && (
            <div className="mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <img 
                src={primaryPhoto} 
                alt={listing.title}
                className="w-full h-auto"
                style={{ 
                  aspectRatio: '1',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
            {listing.title}
          </h3>

          {/* Date and Time */}
          <p className="text-base text-gray-600 mb-8 text-center">
            {formatListingDate(listing.start_date)}
          </p>

          {/* Error Message */}
          {leaveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{leaveError}</p>
            </div>
          )}

          {/* Leave Event Button */}
          <button
            onClick={handleLeave}
            disabled={isLeaving}
            className="w-full text-white font-semibold transition-all duration-200 hover:opacity-90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '56px',
              padding: '12px',
              borderRadius: '60px',
              backgroundColor: '#EF4444', // Red color
            }}
          >
            {isLeaving ? 'Leaving...' : 'Leave Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

