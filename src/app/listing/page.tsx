"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { useAuth } from '@/lib/authContext';
import { Listing } from '@/lib/listingsService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ListingPhotoCollage from '@/components/listings/ListingPhotoCollage';
import ListingHeader from '@/components/listings/ListingHeader';
import ListingActionButtons from '@/components/listings/ListingActionButtons';
import ListingInfoCards from '@/components/listings/ListingInfoCards';
import ItineraryViewer from '@/components/listings/ItineraryViewer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { usePathname } from 'next/navigation';
import { Share2, FileText, Users, UserPlus, MessageCircle, X, Check, Image as ImageIcon, Share, ChevronRight, ArrowLeft } from 'lucide-react';
import EditListingDetailsView, { EditListingDetailsViewRef } from '@/components/listings/EditListingDetailsView';
import CancelEventModal from '@/components/listings/CancelEventModal';
import JoinListingModal from '@/components/listings/JoinListingModal';
import LeaveEventModal from '@/components/listings/LeaveEventModal';
import AttendeesModal from '@/components/listings/AttendeesModal';
import PhotoViewer from '@/components/listings/PhotoViewer';
import ManageListingPhotosView from '@/components/listings/ManageListingPhotosView';
import EventGalleryView from '@/components/listings/EventGalleryView';
import { listingsService } from '@/lib/listingsService';

type ListingView = 'detail' | 'manage' | 'photos' | 'edit-details' | 'manage-photos' | 'gallery';

export default function ListingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');
  const view = (searchParams.get('view') || 'detail') as ListingView;
  // Decode the 'from' parameter in case it was URL-encoded
  const fromRaw = searchParams.get('from') || '/explore';
  const from = fromRaw ? decodeURIComponent(fromRaw) : '/explore'; // Default to explore if no from param
  const manageFrom = searchParams.get('manageFrom'); // Track if we came from manage page
  const refreshParam = searchParams.get('_refresh'); // Track refresh param to force query refetch
  const { account } = useAuth();
  const queryClient = useQueryClient();

  // Track changes for edit-details view - declare refs early
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const editDetailsRef = useRef<EditListingDetailsViewRef | null>(null);
  const [isPhotosMounted, setIsPhotosMounted] = useState(false);
  const [editPage, setEditPage] = useState<'page1' | 'page2'>('page1');
  
  // Mount check for photos view to avoid hydration errors
  useEffect(() => {
    if (view === 'photos') {
      setIsPhotosMounted(true);
    } else {
      setIsPhotosMounted(false);
    }
  }, [view]);
  
  // Cancel event modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Join listing modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Leave event modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  // Attendees modal state
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  
  // Itinerary viewer state
  const [showItineraryViewer, setShowItineraryViewer] = useState(false);
  
  // Photo viewer state (for viewing listing photos)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

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

      // Debug logging for gallery
      console.log('🎨 Listing page - Fetched listing:', {
        id: data?.id,
        title: data?.title,
        has_gallery: data?.has_gallery,
        allFields: Object.keys(data || {})
      });

      return data as Listing;
    },
    enabled: !!listingId,
  });

  const listing = listingData;

  // Fetch event chat status
  const { data: eventChatStatus } = useQuery({
    queryKey: ['event-chat-status', listing?.event_chat_id],
    queryFn: async () => {
      if (!listing?.event_chat_id) return { enabled: false };
      const supabase = getSupabaseClient();
      if (!supabase) return { enabled: false };
      
      const { data, error } = await supabase
        .from('chats')
        .select('id, is_archived')
        .eq('id', listing.event_chat_id)
        .single();

      if (error || !data) return { enabled: false };
      return { enabled: !data.is_archived };
    },
    enabled: !!listing?.event_chat_id,
  });

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

  // Check if current user is a participant (registered in listing_participants)
  const { data: isCurrentUserParticipant, refetch: refetchParticipantStatus } = useQuery({
    queryKey: ['listing-participant', listingId, account?.id, refreshParam], // Include refresh param to force refetch
    queryFn: async () => {
      if (!listingId || !account?.id) {
        console.log('Listing page: Query disabled - missing listingId or account.id');
        return false;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.log('Listing page: Query disabled - no supabase client');
        return false;
      }
      
      console.log('Listing page: Fetching participant status from database...', { listingId, userId: account.id });
      
      const { data, error } = await supabase
        .from('listing_participants')
        .select('id')
        .eq('listing_id', listingId)
        .eq('user_id', account.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking participant status:', error);
        return false;
      }

      const isParticipant = !!data;
      console.log('Listing page: Participant status check result:', { 
        listingId, 
        userId: account.id, 
        isParticipant, 
        data, 
        refreshParam,
        timestamp: new Date().toISOString()
      });
      return isParticipant;
    },
    enabled: !!listingId && !!account?.id,
    staleTime: 0, // Always consider stale to ensure fresh data
    refetchOnMount: 'always', // Always refetch when component mounts
    gcTime: 0, // Don't cache - always fetch fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Get attendee count (including host) for the listing
  const { data: attendeeCount } = useQuery({
    queryKey: ['listing-attendee-count', listingId],
    queryFn: async () => {
      if (!listingId || !listing) return null;
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      
      // Get all participants from listing_participants (not just count, so we can check if host is included)
      const { data: participants, error } = await supabase
        .from('listing_participants')
        .select('user_id')
        .eq('listing_id', listingId);

      if (error) {
        console.error('Error fetching attendee count:', error);
        return null;
      }

      // Count participants
      let count = participants?.length || 0;
      
      // Check if host is in participants list
      const hostInParticipants = participants?.some(p => p.user_id === listing.host_id);
      
      // If host is not in participants, add 1 to count (host should always be counted)
      if (listing.host_id && !hostInParticipants) {
        count += 1;
      }
      
      // If no participants and no host_id, return 0
      if (count === 0 && !listing.host_id) {
        return 0;
      }
      
      // Ensure at least 1 if there's a host
      if (count === 0 && listing.host_id) {
        return 1;
      }
      
      return count;
    },
    enabled: !!listingId && !!listing,
  });

  // Determine user role - reactive to isCurrentUserParticipant changes
  const userRole = useMemo((): 'host' | 'participant' | 'viewer' => {
    if (!listing) return 'viewer';
    if (!account) return 'viewer'; // Not logged in = viewer
    if (listing.host_id === account.id) return 'host';
    // Only return 'participant' if user is actually registered in listing_participants
    if (isCurrentUserParticipant) return 'participant';
    return 'viewer'; // Logged in but not registered = viewer
  }, [listing, account, isCurrentUserParticipant]);

  // Smart back button - returns to source context
  const handleBack = () => {
    // Check if we came from gallery view (stored in sessionStorage)
    const galleryReturnUrl = sessionStorage.getItem('gallery_return_url');
    if (galleryReturnUrl && view === 'detail') {
      // Clear the flag and return to gallery
      sessionStorage.removeItem('gallery_return_url');
      // Extract the path from the full URL
      try {
        const url = new URL(galleryReturnUrl);
        router.push(url.pathname + url.search);
        return;
      } catch {
        // If URL parsing fails, fallback to normal navigation
      }
    }

    if (view === 'manage-photos') {
      // If in manage-photos, go back based on manageFrom
      if (manageFrom === 'edit-details') {
        goToView('edit-details');
      } else if (manageFrom === 'manage') {
        goToView('manage');
      } else {
        // Fallback: go to manage
        goToView('manage');
      }
    } else if (view === 'edit-details' && manageFrom === 'manage') {
      // If editing from manage page, go back to manage view
      goToView('manage');
    } else if (view !== 'detail') {
      // If in a sub-view, go back to detail view
      goToView('detail');
    } else if (from && from !== pathname) {
      // Return to source context
      // 'from' is already decoded, so we can use it directly
      console.log('Listing page: Navigating back to:', from);
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
          <div className="px-4 pb-16 flex flex-col" style={{ paddingTop: 'var(--saved-content-padding-top, 140px)', minHeight: 'calc(100vh - var(--saved-content-padding-top, 140px))' }}>
            <div className="space-y-3 flex-1">
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
                      Name, description, time, location, itinerary and gallery
                    </div>
                  </div>
              </button>

              {/* Attendees Card */}
              <button
                onClick={() => {
                  if (!listingId) return;
                  const currentPath = `/listing?id=${listingId}&view=manage`;
                  router.push(`/listing/attendees?id=${listingId}&from=${encodeURIComponent(currentPath)}`);
                }}
                className="w-full bg-white rounded-xl p-4 flex items-center gap-3 text-left transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
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
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
                    View, add and manage
                    </div>
                  </div>
              </button>

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

              {/* Event Chat Card - Same height as other cards */}
              <button
                onClick={() => {
                  if (listingId) {
                    router.push(`/my-life/listing/event-chat?id=${listingId}`);
                  }
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
                      <MessageCircle size={20} className="text-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-900 mb-1">
                    Event Chat
                      </div>
                  <div className="text-sm font-normal text-gray-500">
                    {eventChatStatus?.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                </div>
              </button>
                </div>

            {/* Cancel Event Button - Positioned at bottom with red text */}
            <div className="mt-auto pt-16 pb-8">
                <button
                    onClick={() => setShowCancelModal(true)}
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
                  <X size={20} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-red-600">
                        Cancel Event
                      </div>
                    </div>
                </button>
            </div>
          </div>
        );

      case 'edit-details':
        // When saving, navigate back to the initial listing page (detail view)
        // The 'from' parameter tells us where to go back to
        return <EditListingDetailsView 
          ref={editDetailsRef} 
          listing={listing} 
          listingId={listingId || ''} 
          onBack={handleBack} 
          onSave={() => {
            // Navigate back to the initial listing page (detail view) with updated data
            const params = new URLSearchParams();
            params.set('id', listingId || '');
            if (from) {
              params.set('from', from);
            }
            router.push(`/listing?${params.toString()}`);
          }} 
          onHasChanges={setHasChanges} 
          onSavingChange={setSaving}
          currentPage={editPage}
          onPageChange={(page) => setEditPage(page)}
        />;

      case 'photos':
        const photos = listing.photo_urls || [];
        if (photos.length === 0) {
          return (
            <div className="px-4 pb-8 text-center text-gray-500" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
              <p>No photos available</p>
            </div>
          );
        }
        // For viewing listing photos, show grid that opens PhotoViewer (no X buttons, no drag-and-drop)
        // Render MobilePage only after mount to avoid hydration issues
        if (!isPhotosMounted) {
          return (
            <div className="px-4 pb-8 text-center text-gray-500" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
              <p>Loading photos...</p>
            </div>
          );
        }
        
        return (
          <div style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
            <MobilePage>
              <PageHeader
                title="Listing Photos"
                subtitle={<span className="text-xs font-medium text-gray-900">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>}
                backButton
                onBack={handleBack}
              />
              <PageContent>
                <div className="px-4 pb-8" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
                  <div className="grid grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhotoIndex(index)}
                        className="relative aspect-square bg-transparent overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-[1px]"
                        style={{ 
                          borderWidth: '0.4px', 
                          borderColor: '#E5E7EB',
                          backgroundColor: 'transparent',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                          willChange: 'transform, box-shadow',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                        }}
                      >
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover pointer-events-none"
                          draggable={false}
                          style={{
                            backgroundColor: 'transparent',
                            display: 'block',
                            width: '100%',
                            height: '100%'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </PageContent>
            </MobilePage>
            {selectedPhotoIndex !== null && (
              <PhotoViewer
                isOpen={selectedPhotoIndex !== null}
                photos={photos}
                initialIndex={selectedPhotoIndex}
                onClose={() => setSelectedPhotoIndex(null)}
              />
            )}
          </div>
        );

      case 'manage-photos':
        // Redirect to the manage photos page component
        // We'll create a separate component for this to keep the code clean
        console.log('📸 Listing page: Rendering manage-photos view', { listingId, hasListing: !!listing, manageFrom });
        return <ManageListingPhotosView listingId={listingId || ''} listing={listing} onBack={handleBack} />;

      case 'gallery':
        // Render gallery view
        return <EventGalleryViewWrapper listingId={listingId || ''} listing={listing} onBack={handleBack} />;

      case 'detail':
      default:
        return (
          <div className="px-4 pb-16" style={{ paddingTop: 'var(--saved-content-padding-top, 140px)' }}>
            <div className="space-y-6">
              {/* Photo Collage */}
              <ListingPhotoCollage 
                photos={listing.photo_urls || []}
                editable={false}
                onPhotoClick={(index = 0) => {
                  // Direct image click - open photo viewer at that index
                  setSelectedPhotoIndex(index);
                }}
                onGridClick={() => {
                  // Photo count badge click - navigate to grid view
                  const params = new URLSearchParams();
                  params.set('id', listingId || '');
                  params.set('view', 'photos');
                  if (from) params.set('from', from);
                  router.push(`/listing?${params.toString()}`);
                }}
              />

              {/* Header */}
              <ListingHeader 
                title={listing.title}
                date={listing.start_date}
                endDate={listing.end_date}
                summary={listing.summary}
              />

              {/* Spacing between header and action buttons */}
              <div style={{ height: '8px' }} />

              {/* Action Buttons */}
              <ListingActionButtons
                userRole={userRole}
                listingId={listing.id}
                listing={listing}
                isCurrentUserParticipant={isCurrentUserParticipant ?? false}
                eventChatEnabled={eventChatStatus?.enabled ?? false}
                onManage={() => goToView('manage')}
                onJoin={() => setShowJoinModal(true)}
                onLeave={() => setShowLeaveModal(true)}
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
                itinerary={listing.itinerary}
                userRole={userRole}
                isCurrentUserParticipant={isCurrentUserParticipant ?? false}
                attendeeCount={attendeeCount ?? null}
                onHostClick={() => {
                  if (hostAccount?.id) {
                    // Use query parameter route for static export compatibility (no RSC navigation)
                    router.push(`/profile?id=${hostAccount.id}`);
                  }
                }}
                onViewingClick={() => {
                  setShowAttendeesModal(true);
                }}
                onItineraryClick={() => {
                  setShowItineraryViewer(true);
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
      case 'edit-details': return editPage === 'page1' ? 'Edit Listing' : 'Itinerary & Gallery';
      case 'gallery': return listing?.title || 'Gallery';
      case 'detail':
      default: return '';
    }
  };

  const getSubtitle = () => {
    if (view === 'photos' && listing?.photo_urls) {
      const count = listing.photo_urls.length;
      return <span className="text-xs font-medium text-gray-900">{count} {count === 1 ? 'photo' : 'photos'}</span>;
    }
    // Gallery subtitle is handled by EventGalleryView component
    return undefined;
  };

  // Show share button for everyone (hosts should be able to share their listings)
  const showShareButton = view === 'detail' && account?.id;

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
            actions={(() => {
              const actions = [];
              
              // Share button - show for everyone (including hosts)
              if (showShareButton) {
                actions.push({
                  icon: <Share size={20} className="text-gray-900" strokeWidth={2.5} />,
                  label: 'Share',
                  onClick: () => {
                    if (listingId) {
                      router.push(`/listing/share?id=${listingId}`);
                    }
                  }
                });
              }
              
              return actions;
            })()}
            customActions={view === 'edit-details' ? (
              editPage === 'page1' ? (
                // Page 1: Right arrow to navigate to page 2
                <button
                  onClick={() => setEditPage('page2')}
                  className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '100px',
                    background: '#FF6600',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} className="text-white" />
                </button>
              ) : (
                // Page 2: Tick button to save all changes
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
              )
            ) : undefined}
            customBackButton={view === 'edit-details' && editPage === 'page2' ? (
              <button
                onClick={() => setEditPage('page1')}
                className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
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
                aria-label="Back"
              >
                <ArrowLeft size={18} className="text-gray-900" />
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

      {/* Join Listing Modal */}
      {showJoinModal && listing && (
        <JoinListingModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          listing={listing}
        />
      )}

      {/* Leave Event Modal */}
      {showLeaveModal && listing && listingId && (
        <LeaveEventModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          listing={listing}
          listingId={listingId}
        />
      )}

      {/* Attendees Modal */}
      {listingId && account?.id && listing && (
        <AttendeesModal
          isOpen={showAttendeesModal}
          onClose={() => setShowAttendeesModal(false)}
          listingId={listingId}
          listingHostId={listing.host_id}
          currentUserId={account.id}
          isCurrentUserParticipant={isCurrentUserParticipant ?? false}
        />
      )}

      {/* Itinerary Viewer */}
      {listing && listing.itinerary && (
        <ItineraryViewer
          isOpen={showItineraryViewer}
          itinerary={listing.itinerary}
          onClose={() => setShowItineraryViewer(false)}
        />
      )}

      {/* PhotoViewer for listing detail view */}
      {view === 'detail' && listing && listing.photo_urls && listing.photo_urls.length > 0 && (
        <PhotoViewer
          isOpen={selectedPhotoIndex !== null}
          photos={listing.photo_urls}
          initialIndex={selectedPhotoIndex ?? 0}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </ProtectedRoute>
  );
}

// Wrapper component to fetch gallery data and render EventGalleryView
function EventGalleryViewWrapper({ 
  listingId, 
  listing, 
  onBack 
}: { 
  listingId: string; 
  listing: Listing | null; 
  onBack: () => void;
}) {
  const [gallery, setGallery] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGallery = async () => {
      if (!listingId) return;
      setLoading(true);
      try {
        const { gallery: galleryData, error } = await listingsService.getEventGallery(listingId);
        if (error) {
          console.error('Error loading gallery:', error);
        } else if (galleryData) {
          setGallery(galleryData);
        }
      } catch (error) {
        console.error('Error loading gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [listingId]);

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-gray-500">
        Loading gallery...
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="px-4 py-8 text-center text-gray-500">
        Unable to load gallery
      </div>
    );
  }

  return (
    <EventGalleryView
      listingId={listingId}
      galleryId={gallery.id}
      title={gallery.title}
      onBack={onBack}
    />
  );
}

