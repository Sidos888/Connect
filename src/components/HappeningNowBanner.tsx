"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Camera, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { listingsService } from '@/lib/listingsService';

export default function HappeningNowBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const { account } = useAuth();
  const supabase = getSupabaseClient();
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [galleryStates, setGalleryStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const loadActiveEvents = async () => {
      if (!account?.id || !supabase) return;

      try {
        const now = new Date().toISOString();

        // Get user's participating listings that are currently happening
        const { data: participants } = await supabase
          .from('listing_participants')
          .select('listing_id')
          .eq('user_id', account.id);

        if (!participants || participants.length === 0) {
          setActiveEvents([]);
          return;
        }

        const listingIds = participants.map(p => p.listing_id);

        // Get all listings that are currently active (started but not ended)
        const { data: listings } = await supabase
          .from('listings')
          .select('id, title, photo_urls, start_date, end_date, event_chat_id')
          .in('id', listingIds)
          .lte('start_date', now)
          .gte('end_date', now)
          .order('start_date', { ascending: false });

        if (listings && listings.length > 0) {
          setActiveEvents(listings);
          
          // Check gallery status for all events
          const galleryChecks: { [key: string]: boolean } = {};
          for (const listing of listings) {
            const { gallery } = await listingsService.getEventGallery(listing.id);
            galleryChecks[listing.id] = !!gallery;
          }
          setGalleryStates(galleryChecks);
        } else {
          setActiveEvents([]);
          setGalleryStates({});
        }
      } catch (error) {
        console.error('Error loading active events:', error);
      }
    };

    loadActiveEvents();

    // Check every minute for event status changes
    const interval = setInterval(loadActiveEvents, 60000);

    return () => clearInterval(interval);
  }, [account?.id, supabase]);

  if (activeEvents.length === 0) return null;

  const isSingleEvent = activeEvents.length === 1;

  return (
    <div
      className="fixed z-[80]"
      style={{
        left: '0',
        right: '0',
        bottom: `calc(max(env(safe-area-inset-bottom, 20px), 20px) + 62px + 12px)`, // 12px gap above bottom nav
        height: '62px',
      }}
    >
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide"
        style={{
          scrollSnapType: isSingleEvent ? 'none' : 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollPaddingLeft: '22px',
          paddingLeft: isSingleEvent ? '22px' : '0',
          paddingRight: isSingleEvent ? '22px' : '0',
        }}
      >
        {activeEvents.map((event, index) => {
          const mainPhoto = event.photo_urls && event.photo_urls.length > 0
            ? event.photo_urls[0]
            : null;
          const hasGallery = galleryStates[event.id] || false;

          return (
            <button
              key={event.id}
              onClick={() => router.push(`/listing?id=${event.id}&from=${encodeURIComponent(pathname)}`)}
              className="flex-shrink-0 flex items-center gap-3 text-left cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: isSingleEvent 
                  ? '100%' // Full width for single event
                  : 'calc(100vw - 44px - 50px)', // Width with peek for multiple events
                height: '62px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                padding: '0 16px',
                scrollSnapAlign: isSingleEvent ? 'none' : 'start',
                marginLeft: !isSingleEvent && index === 0 ? '22px' : '0',
                marginRight: !isSingleEvent && index === activeEvents.length - 1 ? '22px' : '0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              {/* Listing Photo */}
              {mainPhoto && (
                <div 
                  className="flex-shrink-0 rounded-lg overflow-hidden"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                  }}
                >
                  <img
                    src={mainPhoto}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title and Status */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate mb-0.5">
                  {event.title}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-green-600">Happening now</span>
                  <div 
                    className="w-1.5 h-1.5 rounded-full bg-green-600"
                    style={{
                      boxShadow: '0 0 4px rgba(34, 197, 94, 0.5)'
                    }}
                  />
                </div>
              </div>

              {/* Event Chat Button - Only show if event chat exists */}
              {event.event_chat_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/chat/individual?chat=${event.event_chat_id}&from=${encodeURIComponent(pathname)}`);
                  }}
                  className="flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <MessageCircle size={16} className="text-gray-900" strokeWidth={2.5} />
                </button>
              )}

              {/* Gallery Button - Only show if gallery exists */}
              {hasGallery && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/listing?id=${event.id}&view=gallery&from=${encodeURIComponent(pathname)}`);
                  }}
                  className="flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <Camera size={16} className="text-gray-900" strokeWidth={2.5} />
                </button>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
