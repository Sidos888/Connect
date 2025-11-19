"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft, Edit, Share2 } from 'lucide-react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { useAuth } from '@/lib/authContext';
import { Listing } from '@/lib/listingsService';
import { useQuery } from '@tanstack/react-query';
import ListingPhotoCollage from '@/components/listings/ListingPhotoCollage';
import ListingHeader from '@/components/listings/ListingHeader';
import ListingInfoCards from '@/components/listings/ListingInfoCards';

interface ListingDetailPageClientProps {
  listingId: string;
}

export default function ListingDetailPageClient({ listingId }: ListingDetailPageClientProps) {
  const router = useRouter();
  const { account } = useAuth();

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

  // Fetch listing details
  const { data: listingData, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      if (!listingId) return null;
      // For now, we'll need to fetch the listing directly
      // TODO: Add getListingById method to listingsService
      const supabase = (await import('@/lib/supabaseClient')).getSupabaseClient();
      if (!supabase) return null;
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
        return null;
      }

      return data as Listing;
    },
    enabled: !!listingId,
  });

  const listing = listingData;

  // Fetch host account details
  const { data: hostAccount } = useQuery({
    queryKey: ['host-account', listing?.host_id],
    queryFn: async () => {
      if (!listing?.host_id) return null;
      const supabase = (await import('@/lib/supabaseClient')).getSupabaseClient();
      if (!supabase) return null;
      
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, profile_pic')
        .eq('id', listing.host_id)
        .single();

      if (error) {
        console.error('Error fetching host account:', error);
        return null;
      }

      return data;
    },
    enabled: !!listing?.host_id,
  });

  // Determine user role
  const getUserRole = (): 'host' | 'participant' | 'viewer' => {
    if (!account || !listing) return 'viewer';
    
    // Check if user is the host
    if (listing.host_id === account.id) {
      return 'host';
    }
    
    // TODO: Check if user is a participant (registered for the listing)
    // For now, if not host, assume viewer
    // You can add a check here later: if (isParticipant) return 'participant';
    
    return 'viewer';
  };

  const userRole = getUserRole();

  if (isLoading) {
    return (
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader title="" backButton onBack={() => router.push('/my-life')} />
          <PageContent>
            <div className="px-4 py-8 text-center text-gray-500">
              <p>Loading listing...</p>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader title="" backButton onBack={() => router.push('/my-life')} />
          <PageContent>
            <div className="px-4 py-8 text-center text-gray-500">
              <p>Listing not found</p>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  return (
    <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title=""
          customBackButton={
            <button
              onClick={() => router.push('/my-life')}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
          }
          actions={[
            {
              icon: <Edit size={20} className="text-gray-900" />,
              label: 'Edit',
              onClick: () => {
                // Display only for now - not clickable yet
              }
            },
            {
              icon: <Share2 size={20} className="text-gray-900" />,
              label: 'Share',
              onClick: () => {
                // Display only for now - not clickable yet
              }
            }
          ]}
        />

        <PageContent>
          <div 
            className="px-4 pb-16" 
            style={{ 
              paddingTop: 'var(--saved-content-padding-top, 140px)',
            }}
          >
            <div className="space-y-6">
              {/* Photo Collage */}
              <ListingPhotoCollage 
                photos={listing.photo_urls || []}
                editable={false}
                onPhotoClick={() => {
                  router.push(`/my-life/listing/photos?id=${listing.id}`);
                }}
              />

              {/* Header */}
              <ListingHeader 
                title={listing.title}
                date={listing.start_date}
                summary={listing.summary}
              />

              {/* Information Cards - Increased spacing from bio section */}
              <div className="mt-12">
                <ListingInfoCards
                  capacity={listing.capacity}
                  capacityUnlimited={!listing.capacity}
                  location={listing.location}
                  host={hostAccount ? {
                    id: hostAccount.id,
                    name: hostAccount.name,
                    profile_pic: hostAccount.profile_pic || null
                  } : null}
                />
              </div>
            </div>
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}
