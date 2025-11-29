"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Listing } from '@/lib/listingsService';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useAuth } from '@/lib/authContext';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

interface JoinListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
}

export default function JoinListingModal({ isOpen, onClose, listing }: JoinListingModalProps) {
  const router = useRouter();
  const { account } = useAuth();
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45); // Default to 45px
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Mount modal and trigger slide-up animation
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      // Trigger slide-down animation before unmounting
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match transition duration
    }
  }, [isOpen]);

  // Detect device corner radius on mount
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  if (!shouldRender || !listing) return null;

  const handleClose = () => {
    // Trigger slide-down animation
    setIsVisible(false);
    // Close modal after animation completes
    setTimeout(() => {
      onClose();
    }, 300); // Match transition duration
  };

  const handleJoin = async () => {
    if (!listing || !account?.id) {
      setJoinError('Unable to join listing. Please try again.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setJoinError('Database connection failed. Please try again.');
        setIsJoining(false);
        return;
      }

      // Check if user is already a participant
      const { data: existingParticipant, error: checkError } = await supabase
        .from('listing_participants')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('user_id', account.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing participant:', checkError);
        setJoinError('Failed to check participant status. Please try again.');
        setIsJoining(false);
        return;
      }

      if (existingParticipant) {
        // User is already a participant, just navigate
        router.push('/my-life');
        handleClose();
        return;
      }

      // Add user as participant to the listing
      const { error: insertError } = await supabase
        .from('listing_participants')
        .insert({
          listing_id: listing.id,
          user_id: account.id,
          role: 'participant',
          status: 'upcoming',
          joined_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error joining listing:', insertError);
        setJoinError('Failed to join listing. Please try again.');
        setIsJoining(false);
        return;
      }

      // Mark any pending invites for this listing as accepted
      const { error: inviteUpdateError } = await supabase
        .from('listing_invites')
        .update({ status: 'accepted' })
        .eq('listing_id', listing.id)
        .eq('invitee_id', account.id)
        .eq('status', 'pending');

      if (inviteUpdateError) {
        console.error('Error updating invites:', inviteUpdateError);
        // Don't fail the join operation if invite update fails
      }

      // Invalidate React Query caches to update UI immediately
      // 1. Invalidate listing participant status (to update status card)
      queryClient.invalidateQueries({ 
        queryKey: ['listing-participant', listing.id, account.id] 
      });
      
      // 2. Invalidate upcoming listings (to show listing on My Life page)
      queryClient.invalidateQueries({ 
        queryKey: ['listings', 'upcoming', account.id] 
      });
      
      // 3. Invalidate attendee count (to update attendee count display)
      queryClient.invalidateQueries({ 
        queryKey: ['listing-attendee-count', listing.id] 
      });
      
      // 4. Invalidate listing invites (to hide invite notification)
      queryClient.invalidateQueries({ 
        queryKey: ['listing-invites', account.id] 
      });

      // Successfully joined - navigate to My Life page (defaults to upcoming view)
      router.push('/my-life');
      // Close modal with slide-down animation
      handleClose();
    } catch (error) {
      console.error('Unexpected error joining listing:', error);
      setJoinError('An unexpected error occurred. Please try again.');
      setIsJoining(false);
    }
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Date and time';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      onClick={(e) => {
        // Close modal if clicking anywhere outside the modal content
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Backdrop - slight dim, no blur */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />
      
      {/* Modal - slides up from bottom */}
      <div 
        className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        onClick={(e) => {
          // Prevent clicks inside modal from closing it
          e.stopPropagation();
        }}
        style={{
          width: 'calc(100% - 16px)',
          maxWidth: '500px',
          marginTop: '20px',
          marginBottom: '8px',
          height: '85vh',
          // Match iOS screen corner radius (detected per device)
          // This ensures even spacing from screen edges
          borderTopLeftRadius: `${cornerRadius}px`,
          borderTopRightRadius: `${cornerRadius}px`,
          borderBottomLeftRadius: `${cornerRadius}px`,
          borderBottomRightRadius: `${cornerRadius}px`,
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
          <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Registration</h2>
          <button
            onClick={handleClose}
            className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              right: '24px', // Match modal side padding
              top: '24px', // Match modal top padding
              width: '44px',
              height: '44px',
              borderRadius: '50%',
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
            <X size={18} className="text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-y-auto" style={{ padding: '0 24px', paddingBottom: '24px' }}>
          {/* Image Placeholder */}
          <div className="w-full mb-6" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            {listing.photo_urls && listing.photo_urls.length > 0 ? (
              <img
                src={listing.photo_urls[0]}
                alt={listing.title}
                className="w-full h-auto object-cover"
                style={{ maxHeight: '300px', minHeight: '200px', backgroundColor: '#F3F4F6' }}
              />
            ) : (
              <div 
                className="w-full bg-gray-200"
                style={{ 
                  height: '200px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span className="text-gray-400 text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            {listing.title || 'Listing Title'}
          </h2>

          {/* Date and Time */}
          <p className="text-sm text-gray-600 text-center mb-8">
            {formatDateTime(listing.start_date)}
          </p>
        </div>

        {/* Join Button - Fixed at bottom */}
        <div style={{ padding: '0 24px 24px 24px' }}>
          {joinError && (
            <div className="mb-3 text-sm text-red-500 text-center">
              {joinError}
            </div>
          )}
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full font-semibold text-white transition-all duration-200 hover:opacity-90 focus:outline-none flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#FF6600',
              boxShadow: '0 2px 8px rgba(255, 102, 0, 0.3)',
              minHeight: '56px',
              padding: '12px',
              borderRadius: '60px',
            }}
          >
            {isJoining ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}

