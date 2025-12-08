"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { MobilePage } from "@/components/layout/PageSystem";
import Memories from "@/components/memories/Memories";
import { listingsService, EventGalleryWithItems } from "@/lib/listingsService";
import { useAuth } from "@/lib/authContext";

export default function MemoriesPage() {
  const router = useRouter();
  const { account } = useAuth();
  const [firstGallery, setFirstGallery] = useState<EventGalleryWithItems | null>(null);
  const [firstListing, setFirstListing] = useState<any>(null);

  // Load first gallery for header
  useEffect(() => {
    const loadFirstGallery = async () => {
      if (!account?.id) return;

      try {
        const { galleries: galleryData } = await listingsService.getUserEventGalleries(account.id);
        const galleriesWithPhotos = galleryData.filter(g => g.photo_count > 0);
        if (galleriesWithPhotos.length > 0) {
          const gallery = galleriesWithPhotos[0];
          setFirstGallery(gallery);
          const listing = (gallery as any).listings;
          setFirstListing(listing);
        }
      } catch (error) {
        console.error('Error loading first gallery:', error);
      }
    };

    loadFirstGallery();
  }, [account?.id]);

  const handleHeaderClick = () => {
    if (firstGallery?.listing_id) {
      router.push(`/listing?id=${firstGallery.listing_id}&from=${encodeURIComponent('/memories')}`);
    }
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '';
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
  };

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        {/* Custom Header - Matching Event Chat Style */}
        <div
          className="absolute top-0 left-0 right-0 z-20 px-4"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 70px)',
            paddingBottom: '16px',
            pointerEvents: 'none'
          }}
        >
          {/* Back Button - Left */}
          <button
            onClick={() => router.replace('/menu')}
            className="absolute left-4 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              top: '0',
              width: '44px',
              height: '44px',
              borderRadius: '22px',
              background: 'rgba(255, 255, 255, 0.96)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              pointerEvents: 'auto',
              zIndex: 30
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            aria-label="Back"
          >
            <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Plus Button - Right */}
          <button
            onClick={() => console.log('Add clicked')}
            className="absolute right-4 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              top: '0',
              width: '44px',
              height: '44px',
              borderRadius: '22px',
              background: 'rgba(255, 255, 255, 0.96)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              pointerEvents: 'auto',
              zIndex: 30
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            aria-label="Add"
          >
            <Plus size={20} className="text-gray-900" strokeWidth={2.5} />
          </button>

          {/* Middle Section - Event Card and Title (like event chat) */}
          {firstGallery && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: '0',
                height: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                pointerEvents: 'auto'
              }}
            >
              {/* Square Card - Top Center */}
              <button
                onClick={handleHeaderClick}
                className="absolute z-10"
                style={{
                  cursor: 'pointer',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
              >
                <div
                  className="bg-gray-200 flex items-center justify-center overflow-hidden rounded-lg"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderWidth: '0.5px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(0, 0, 0, 0.08)'
                  }}
                >
                  {firstGallery.items && firstGallery.items.length > 0 ? (
                    <Image
                      src={firstGallery.items[0].photo_url}
                      alt={firstGallery.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-base font-semibold">
                      {firstGallery.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </button>

              {/* Title Card - Below Image */}
              <button
                onClick={handleHeaderClick}
                className="absolute z-0"
                style={{
                  height: '44px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.96)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  maxWidth: 'calc(100% - 32px)',
                  paddingLeft: '16px',
                  paddingRight: '8px',
                  top: '42px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <div
                  className="font-semibold text-gray-900 text-base flex-1 text-left"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0
                  }}
                >
                  {firstGallery.title}
                </div>
                <svg
                  className="w-5 h-5 text-gray-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ marginLeft: '4px' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <Memories />
        
        {/* Bottom Blur */}
        <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: '80px',
            background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
          }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '20px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
          <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '20px', backdropFilter: 'blur(0.3px)', WebkitBackdropFilter: 'blur(0.3px)' }} />
          <div className="absolute left-0 right-0" style={{ bottom: '40px', height: '20px', backdropFilter: 'blur(0.15px)', WebkitBackdropFilter: 'blur(0.15px)' }} />
          <div className="absolute left-0 right-0" style={{ bottom: '60px', height: '20px', backdropFilter: 'blur(0.05px)', WebkitBackdropFilter: 'blur(0.05px)' }} />
        </div>
      </MobilePage>
    </div>
  );
}


