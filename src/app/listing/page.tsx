"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
import { usePathname } from 'next/navigation';
import { Share2, FileText, Users, UserPlus, MessageCircle, X, Check } from 'lucide-react';
import EditListingDetailsView, { EditListingDetailsViewRef } from '@/components/listings/EditListingDetailsView';
import CancelEventModal from '@/components/listings/CancelEventModal';

type ListingView = 'detail' | 'manage' | 'photos' | 'edit-details';

export default function ListingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');
  const view = (searchParams.get('view') || 'detail') as ListingView;
  const from = searchParams.get('from') || '/explore'; // Default to explore if no from param
  const manageFrom = searchParams.get('manageFrom'); // Track if we came from manage page
  const { account } = useAuth();

  // Track changes for edit-details view - declare refs early
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const editDetailsRef = useRef<EditListingDetailsViewRef | null>(null);
  
  // Cancel event modal state
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Navigate to a view (like menu page pattern)
  const goToView = (newView: ListingView, id?: string) => {
    const targetId = id || listingId;
    if (!targetId) return;
    
    const currentFrom = searchParams.get('from') || from;
    const currentManageFrom = searchParams.get('manageFrom') || manageFrom;
    const params = new URLSearchParams();
    params.set('id', targetId);
    if (newView !== 'detail') {
      params.set('view', newView);
    }
    if (currentFrom) {
      params.set('from', currentFrom);
    }
    if (currentManageFrom) {
      params.set('manageFrom', currentManageFrom);
    }
    
    router.push(`/listing?${params.toString()}`);
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

  // Smart back button - returns to source context
  const handleBack = () => {
    if (view === 'edit-details' && manageFrom === 'manage') {
      // If editing from manage page, go back to manage view
      goToView('manage');
    } else if (view !== 'detail') {
      // If in a sub-view, go back to detail view
      goToView('detail');
    } else if (from && from !== pathname) {
      // Return to source context
      router.push(from);
    } else {
      // Fallback to browser back
      router.back();
    }
  };

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
            <div className="space-y-3">
              {/* Management Section Cards */}
              
              {/* Listing Details Card */}
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('id', listingId || '');
                  params.set('view', 'edit-details');
                  if (from) params.set('from', from);
                  params.set('manageFrom', 'manage');
                  router.push(`/listing?${params.toString()}`);
                }}
                className="bg-white rounded-xl p-4 flex items-center gap-3 w-full text-left transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  minHeight: '72px',
                  cursor: 'pointer',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <div className="flex-shrink-0">
                  <FileText size={20} className="text-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-900 mb-1">
                    Listing Details
                  </div>
                  <div className="text-sm font-normal text-gray-500">
                    Name, description, time and location
                  </div>
                </div>
              </button>

              {/* Attendees Card */}
              <div 
                className="bg-white rounded-xl p-4 flex items-center gap-3"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  minHeight: '72px',
                }}
              >
                <div className="flex-shrink-0">
                  <Users size={20} className="text-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-900 mb-1">
                    Attendees
                  </div>
                  <div className="text-sm font-normal text-gray-500">
                    View and manage
                  </div>
                </div>
              </div>

              {/* Hosts Card */}
              <div 
                className="bg-white rounded-xl p-4 flex items-center gap-3"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  minHeight: '72px',
                }}
              >
                <div className="flex-shrink-0">
                  <UserPlus size={20} className="text-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-900 mb-1">
                    Hosts
                  </div>
                  <div className="text-sm font-normal text-gray-500">
                    Add Co Hosts
                  </div>
                </div>
              </div>

              {/* Action Buttons Section - Spaced out from cards above */}
              <div className="mt-6 space-y-3">
                {/* Start Event Chat Button */}
                <div 
                  className="bg-white rounded-xl p-3 flex items-center gap-3"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    minHeight: '56px',
                  }}
                >
                  <div className="flex-shrink-0">
                    <MessageCircle size={20} className="text-gray-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900">
                      Start Event Chat
                    </div>
                  </div>
                </div>

                {/* Cancel Event Button */}
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="bg-white rounded-xl p-3 flex items-center gap-3 w-full text-left transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    minHeight: '56px',
                    cursor: 'pointer',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <div className="flex-shrink-0">
                    <X size={20} className="text-gray-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900">
                      Cancel Event
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'edit-details':
        return <EditListingDetailsView ref={editDetailsRef} listing={listing} listingId={listingId || ''} onBack={handleBack} onSave={() => goToView('manage')} onHasChanges={setHasChanges} onSavingChange={setSaving} />;

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

              {/* Spacing between header and action buttons */}
              <div style={{ height: '8px' }} />

              {/* Action Buttons - Only for hosts */}
              <ListingActionButtons
                userRole={userRole}
                listingId={listing.id}
                onManage={() => goToView('manage')}
              />

              {/* Extra spacing between action buttons and info cards */}
              <div style={{ height: '6px' }} />

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
                userRole={userRole}
                onHostClick={() => {
                  if (hostAccount?.id) {
                    // Use query parameter route for static export compatibility (no RSC navigation)
                    router.push(`/profile?id=${hostAccount.id}`);
                  }
                }}
              />
            </div>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (view) {
      case 'manage': return 'Manage';
      case 'photos': return 'Listing Photos';
      case 'edit-details': return 'Edit Listing';
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

  // Show share button in header for detail view when user is host
  const showShareButton = view === 'detail' && userRole === 'host';

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
            onBack={handleBack}
            actions={showShareButton ? [
              {
                icon: <Share2 size={20} className="text-gray-900" />,
                label: 'Share',
                onClick: () => {
                  // Not functional yet - display only
                }
              }
            ] : []}
            customActions={view === 'edit-details' ? (
              <button
                onClick={async () => {
                  if (editDetailsRef.current && hasChanges && !saving) {
                    await editDetailsRef.current.save();
                  }
                }}
                disabled={!hasChanges || saving}
                className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '100px',
                  background: hasChanges ? '#FF6600' : '#9CA3AF',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  if (hasChanges && !saving) {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                aria-label="Save"
              >
                <Check size={18} className="text-white" />
              </button>
            ) : undefined}
          />

          <PageContent>
            {renderContent()}
          </PageContent>
        </MobilePage>
      </div>

      {/* Cancel Event Modal */}
      {showCancelModal && listingId && (
        <CancelEventModal
          listingId={listingId}
          onClose={() => setShowCancelModal(false)}
          onDelete={() => {
            // Navigate back after deletion
            if (from) {
              router.push(from);
            } else {
              router.push('/my-life');
            }
          }}
        />
      )}
    </ProtectedRoute>
  );
}

