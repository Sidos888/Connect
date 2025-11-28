"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Listing } from '@/lib/listingsService';

export default function ListingPhotosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');
  const [photos, setPhotos] = useState<string[]>([]);

  // Hide bottom nav on mobile - use multiple approaches for reliability
  useEffect(() => {
    // Approach 1: Add CSS class to body
    document.body.classList.add('hide-bottom-nav');
    document.documentElement.classList.add('hide-bottom-nav');
    
    // Approach 2: Direct DOM manipulation (fallback)
    const hideBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
        (bottomNav as HTMLElement).style.visibility = 'hidden';
        (bottomNav as HTMLElement).style.opacity = '0';
        (bottomNav as HTMLElement).style.transform = 'translateY(100%)';
        (bottomNav as HTMLElement).style.position = 'fixed';
        (bottomNav as HTMLElement).style.bottom = '-100px';
        (bottomNav as HTMLElement).style.zIndex = '-1';
      }
      document.body.style.paddingBottom = '0';
    };

    const showBottomNav = () => {
      document.body.classList.remove('hide-bottom-nav');
      document.documentElement.classList.remove('hide-bottom-nav');
      
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
        (bottomNav as HTMLElement).style.visibility = '';
        (bottomNav as HTMLElement).style.opacity = '';
        (bottomNav as HTMLElement).style.transform = '';
        (bottomNav as HTMLElement).style.position = '';
        (bottomNav as HTMLElement).style.bottom = '';
        (bottomNav as HTMLElement).style.zIndex = '';
      }
      document.body.style.paddingBottom = '';
    };

    // Hide immediately and also with a small delay to catch late renders
    hideBottomNav();
    const timeoutId = setTimeout(hideBottomNav, 100);
    const intervalId = setInterval(hideBottomNav, 500); // Keep checking every 500ms

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      showBottomNav();
    };
  }, []);

  // Fetch listing photos
  const { data: listingData, isLoading } = useQuery({
    queryKey: ['listing', listingId, 'photos'],
    queryFn: async () => {
      if (!listingId) return null;
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      
      const { data, error } = await supabase
        .from('listings')
        .select('photo_urls')
        .eq('id', listingId)
        .single();

      if (error) {
        console.error('Error fetching listing photos:', error);
        return null;
      }

      return data as { photo_urls: string[] | null };
    },
    enabled: !!listingId,
  });

  useEffect(() => {
    if (listingData?.photo_urls) {
      setPhotos(Array.isArray(listingData.photo_urls) ? listingData.photo_urls : []);
    } else if (listingData && !listingData.photo_urls) {
      // No photos found, go back
      router.back();
    }
  }, [listingData, router]);

  useEffect(() => {
    if (!listingId && !isLoading) {
      // No listing ID, go back
      router.back();
    }
  }, [listingId, isLoading, router]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Listing Photos"
            backButton
            onBack={handleBack}
          />
          <PageContent>
            <div className="px-4 pb-8 text-center text-gray-500" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
              <p>Loading photos...</p>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Listing Photos"
            backButton
            onBack={handleBack}
          />
          <PageContent>
            <div className="px-4 pb-8 text-center text-gray-500" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
              <p>No photos available</p>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  return (
    <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Listing Photos"
          subtitle={<span className="text-xs font-medium text-gray-900">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>}
          backButton
          onBack={handleBack}
        />

        <PageContent>
          <div className="px-4 pb-8" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
            {/* Photo Grid - 4 columns */}
            <div className="grid grid-cols-4 gap-0.5">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-gray-100 overflow-hidden rounded-xl"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                  }}
                >
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}

