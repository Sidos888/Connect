"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import Image from 'next/image';

interface ListingMessageCardProps {
  listingId: string;
  chatId: string;
}

interface ListingData {
  id: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  photo_urls: string[];
  host_id: string;
}

interface ParticipantStatus {
  isAttending: boolean;
  isLoading: boolean;
}

export default function ListingMessageCard({ listingId, chatId }: ListingMessageCardProps) {
  const router = useRouter();
  const { account } = useAuth();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [participantStatus, setParticipantStatus] = useState<ParticipantStatus>({
    isAttending: false,
    isLoading: false
  });
  const [loading, setLoading] = useState(true);

  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, start_date, end_date, photo_urls, host_id')
          .eq('id', listingId)
          .single();

        if (error) {
          console.error('Error fetching listing:', error);
          return;
        }

        setListing(data);
      } catch (error) {
        console.error('Error in fetchListing:', error);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  // Check if user is attending
  useEffect(() => {
    const checkParticipantStatus = async () => {
      if (!account?.id || !listingId) return;

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('listing_participants')
          .select('id')
          .eq('listing_id', listingId)
          .eq('user_id', account.id)
          .eq('status', 'upcoming')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking participant status:', error);
          return;
        }

        setParticipantStatus({
          isAttending: !!data,
          isLoading: false
        });
      } catch (error) {
        console.error('Error in checkParticipantStatus:', error);
      }
    };

    checkParticipantStatus();
  }, [account?.id, listingId]);

  const handleJoin = async () => {
    if (!account?.id || !listingId || participantStatus.isLoading) return;

    setParticipantStatus(prev => ({ ...prev, isLoading: true }));

    try {
      const supabase = getSupabaseClient();
      
      // Insert or update participant status
      const { error } = await supabase
        .from('listing_participants')
        .upsert({
          listing_id: listingId,
          user_id: account.id,
            status: 'upcoming'
        }, {
          onConflict: 'listing_id,user_id'
        });

      if (error) {
        console.error('Error joining listing:', error);
        setParticipantStatus(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if listing has event_chat_id and add user to that chat
      if (listing) {
        const { data: listingData } = await supabase
          .from('listings')
          .select('event_chat_id')
          .eq('id', listingId)
          .single();

        if (listingData?.event_chat_id) {
          // Add user to event chat
          await supabase
            .from('chat_participants')
            .upsert({
              chat_id: listingData.event_chat_id,
              user_id: account.id
            }, {
              onConflict: 'chat_id,user_id'
            });
        }
      }

      setParticipantStatus({
        isAttending: true,
        isLoading: false
      });

      // Refresh My Life page data (upcoming events)
      // This will be handled by the My Life page's own refresh logic
    } catch (error) {
      console.error('Error in handleJoin:', error);
      setParticipantStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleViewListing = () => {
    const currentPath = `/chat/individual?chat=${chatId}`;
    router.push(`/listing?id=${listingId}&from=${encodeURIComponent(currentPath)}`);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  };

  if (loading || !listing) {
    return (
      <div className="bg-white rounded-2xl p-4" style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}>
        <div className="text-sm text-gray-500">Loading event...</div>
      </div>
    );
  }

  const thumbnailUrl = listing.photo_urls && listing.photo_urls.length > 0 
    ? listing.photo_urls[0] 
    : null;

  const dateTimeText = listing.end_date 
    ? `${formatDateTime(listing.start_date)} - ${formatDateTime(listing.end_date)}`
    : formatDateTime(listing.start_date);

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
      {/* Photo */}
      <div className="relative w-full" style={{ aspectRatio: '16/9', backgroundColor: '#F3F4F6' }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No photo
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <div className="text-base font-semibold text-gray-900 mb-1">
          {listing.title}
        </div>

        {/* Date and Time */}
        <div className="text-sm text-gray-500 mb-4">
          {dateTimeText}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* View Listing Button */}
          <button
            onClick={handleViewListing}
            className="flex-1 bg-white text-gray-900 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            View Listing
          </button>

          {/* Join/Attending Button */}
          <button
            onClick={handleJoin}
            disabled={participantStatus.isLoading || participantStatus.isAttending}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              participantStatus.isAttending
                ? 'bg-white text-gray-600 cursor-default'
                : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]'
            } ${participantStatus.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={
              participantStatus.isAttending
                ? {
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                  }
                : {
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                  }
            }
          >
            {participantStatus.isLoading 
              ? 'Joining...' 
              : participantStatus.isAttending 
                ? 'Attending' 
                : 'Join'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

