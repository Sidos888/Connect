"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { useAuth } from '@/lib/authContext';
import { Listing } from '@/lib/listingsService';
import { useQuery } from '@tanstack/react-query';
import ListingPhotoCollage from '@/components/listings/ListingPhotoCollage';
import ListingHeader from '@/components/listings/ListingHeader';
import ListingActionButtons from '@/components/listings/ListingActionButtons';
import ListingInfoCards from '@/components/listings/ListingInfoCards';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getSupabaseClient } from '@/lib/supabaseClient';

type ListingView = 'detail' | 'manage' | 'photos';

export default function ListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');
  const view = (searchParams.get('view') || 'detail') as ListingView;
  const { account } = useAuth();

  // Navigate to a view (like menu page pattern)
  const goToView = (newView: ListingView, id?: string) => {
    const targetId = id || listingId;
    if (!targetId) return;
    
    if (newView === 'detail') {
      router.push(`/my-life/listing?id=${targetId}`);
    } else {
      router.push(`/my-life/listing?id=${targetId}&view=${newView}`);
    }
  };

  // Fetch listing details
  const { data: listingData, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      if (!listingId) return null;
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
    if (listing.host_id === account.id) return 'host';
    return 'viewer';
  };

  const userRole = getUserRole();

  // Hide bottom nav on mobile
  useEffect(() => {
    document.body.classList.add('hide-bottom-nav');
    document.documentElement.classList.add('hide-bottom-nav');
    
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

    hideBottomNav();
    const timeoutId = setTimeout(hideBottomNav, 100);
    const intervalId = setInterval(hideBottomNav, 500);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      showBottomNav();
    };
  }, []);

  // Render based on view (like menu page)
  const renderContent = () => {
    if (!listingId) {
      return (
        <div className="px-4 py-8 text-center text-gray-500">
          <p>No listing ID provided</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="px-4 py-8 text-center text-gray-500">
          <p>Loading listing...</p>
        </div>
      );
    }

    if (!listing) {
      return (
        <div className="px-4 py-8 text-center text-gray-500">
          <p>Listing not found</p>
        </div>
      );
    }

    switch (view) {
      case 'manage':
        return (
          <div className="px-4 pb-16" style={{ paddingTop: 'var(--saved-content-padding-top, 140px)' }}>
            <div className="text-center py-12">
              <p className="text-base font-normal text-gray-500">Manage listing</p>
            </div>
          </div>
        );

      case 'photos':
        const photos = listing.photo_urls || [];
        if (photos.length === 0) {
          return (
            <div className="px-4 pb-8 text-center text-gray-500" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
              <p>No photos available</p>
            </div>
          );
        }
        return (
          <div className="px-4 pb-8" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
            <div className="grid grid-cols-4 gap-0.5">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-gray-100 overflow-hidden rounded-xl"
                  style={{ borderWidth: '0.4px', borderColor: '#E5E7EB' }}
                >
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'detail':
      default:
        return (
          <div className="px-4 pb-16" style={{ paddingTop: 'var(--saved-content-padding-top, 140px)' }}>
            <div className="space-y-6">
              {/* Photo Collage */}
              <ListingPhotoCollage 
                photos={listing.photo_urls || []}
                editable={false}
                onPhotoClick={() => goToView('photos')}
              />

              {/* Header */}
              <ListingHeader 
                title={listing.title}
                date={listing.start_date}
                summary={listing.summary}
              />

              {/* Action Buttons - Only for hosts */}
              <ListingActionButtons
                userRole={userRole}
                listingId={listing.id}
                onManage={() => goToView('manage')}
              />

              {/* Information Cards */}
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
        );
    }
  };

  const getPageTitle = () => {
    switch (view) {
      case 'manage': return 'Manage Listing';
      case 'photos': return 'Listing Photos';
      case 'detail':
      default: return '';
    }
  };

  const getSubtitle = () => {
    if (view === 'photos' && listing?.photo_urls) {
      const count = listing.photo_urls.length;
      return <span className="text-xs font-medium text-gray-900">{count} {count === 1 ? 'photo' : 'photos'}</span>;
    }
    return undefined;
  };

  return (
    <ProtectedRoute 
      title={getPageTitle() || "Listing Details"} 
      description="Log in / sign up to view listing details" 
      buttonText="Log in"
    >
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title={getPageTitle()}
            subtitle={getSubtitle()}
            backButton
            onBack={() => {
              if (view === 'detail') {
                router.push('/my-life');
              } else {
                goToView('detail');
              }
            }}
          />

          <PageContent>
            {renderContent()}
          </PageContent>
        </MobilePage>
      </div>
    </ProtectedRoute>
  );
}
