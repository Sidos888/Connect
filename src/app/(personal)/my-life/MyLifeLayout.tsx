"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect } from "react";
import Avatar from "@/components/Avatar";
import { useAppStore } from "@/lib/store";
import { useModal } from "@/lib/modalContext";
import ProfileStrip from "@/components/my-life/ProfileStrip";
import QuickActions from "@/components/my-life/QuickActions";
import Section from "@/components/my-life/Section";
import Carousel from "@/components/my-life/Carousel";
import MiniEventCard from "@/components/my-life/MiniEventCard";
import StatTile from "@/components/my-life/StatTile";
import { User, Plus, Hourglass, Target, RefreshCw, FileText, History as HistoryIcon, MoreVertical, Calendar } from "lucide-react";
import ProfileCard from "@/components/profile/ProfileCard";
import EditProfileModal from "@/components/chat/EditProfileModal";
import { ChevronLeftIcon } from "@/components/icons";
import EditProfileLanding from "@/components/settings/EditProfileLanding";
import ShareProfileModal from "@/components/ShareProfileModal";
import SettingsContent from "@/components/settings/SettingsContent";
import CenteredAccountSettings from "@/components/settings/CenteredAccountSettings";
import CenteredShareProfile from "@/components/profile/CenteredShareProfile";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import ConnectionsModal from "@/components/chat/ConnectionsModal";
import CenteredConnections from "@/components/connections/CenteredConnections";
import CenteredAddPerson from "@/components/connections/CenteredAddPerson";
import { useAuth } from "@/lib/authContext";
import ProfilePage from "@/components/profile/ProfilePage";
import CenteredTimeline from "@/components/timeline/CenteredTimeline";
import ProfileModal from "@/components/profile/ProfileModal";
import { listingsService, Listing } from "@/lib/listingsService";
import { useQuery } from "@tanstack/react-query";
import ListingCard from "@/components/listings/ListingCard";

type TabDef = { id: string; label: string; Icon?: React.ComponentType<{ size?: number; className?: string }> };

const TABS: Array<TabDef> = [
  { id: "activities", label: "My Activities", Icon: Calendar }
];

export default function MyLifeLayout(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") || "activities";
  
  // Simple navigation helper that works in Capacitor
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      // Use router.push for client-side navigation instead of full page reload
      router.push(path);
    }
  };
  const { personalProfile } = useAppStore();
  const modal = useModal(); // Use unified modal system
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const { account, signOut, deleteAccount, user } = useAuth();

  // Fetch listings data
  const { data: upcomingData } = useQuery({
    queryKey: ['listings', 'upcoming', account?.id],
    queryFn: async () => {
      if (!account?.id) return { listings: [], error: null };
      return await listingsService.getUpcomingListings(account.id);
    },
    enabled: !!account?.id,
    staleTime: 30 * 1000,
  });

  const { data: hostingData } = useQuery({
    queryKey: ['listings', 'hosting', account?.id],
    queryFn: async () => {
      if (!account?.id) return { listings: [], error: null };
      return await listingsService.getHostingListings(account.id);
    },
    enabled: !!account?.id,
    staleTime: 30 * 1000,
  });

  const { data: currentData } = useQuery({
    queryKey: ['listings', 'current', account?.id],
    queryFn: async () => {
      if (!account?.id) return { listings: [], error: null };
      return await listingsService.getCurrentListings(account.id);
    },
    enabled: !!account?.id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refresh every minute to catch status changes
  });

  const { data: historyData } = useQuery({
    queryKey: ['listings', 'history', account?.id],
    queryFn: async () => {
      if (!account?.id) return { listings: [], error: null };
      return await listingsService.getHistoryListings(account.id);
    },
    enabled: !!account?.id,
    staleTime: 30 * 1000,
  });

  const upcomingListings = upcomingData?.listings || [];
  const hostingListings = hostingData?.listings || [];
  const currentHappeningListings = currentData?.listings || [];
  const historyListings = historyData?.listings || [];

  // Determine which pills to show based on content
  // Priority: Current (if any), then Upcoming, then Hosting, then Past
  const availablePills: Array<{ id: string; label: string }> = [];
  
  if (currentHappeningListings.length > 0) {
    availablePills.push({ id: 'current', label: 'Current' });
  }
  // Always include 'upcoming' pill (even if empty) - it's the default
  availablePills.push({ id: 'upcoming', label: 'Upcoming' });
  if (hostingListings.length > 0) availablePills.push({ id: 'hosting', label: 'Hosting' });
  if (historyListings.length > 0) availablePills.push({ id: 'history', label: 'Past' });

  const [mobileTab, setMobileTab] = React.useState<'current' | 'upcoming' | 'hosting' | 'history'>('upcoming');
  const [hasAutoSwitched, setHasAutoSwitched] = React.useState(false);

  // Auto-switch to 'current' tab when current events first become available
  useEffect(() => {
    // Only auto-switch once when current events first appear and user hasn't manually changed tabs
    if (currentHappeningListings.length > 0 && mobileTab === 'upcoming' && !hasAutoSwitched) {
      setMobileTab('current');
      setHasAutoSwitched(true);
    }
    // If current tab doesn't exist in available pills anymore, switch to default
    else {
      const currentTabExists = availablePills.find(p => p.id === mobileTab);
      if (!currentTabExists) {
        // Prioritize 'current' if available, otherwise 'upcoming'
        if (currentHappeningListings.length > 0) {
          setMobileTab('current');
        } else {
          setMobileTab('upcoming');
        }
      }
    }
  }, [currentHappeningListings.length, availablePills.length, mobileTab, hasAutoSwitched]);

  // Get current listings based on active tab
  const getDisplayListings = (): Listing[] => {
    switch (mobileTab) {
      case 'current':
        return currentHappeningListings;
      case 'upcoming':
        return upcomingListings;
      case 'hosting':
        return hostingListings;
      case 'history':
        return historyListings;
      default:
        return [];
    }
  };

  const displayListings = getDisplayListings();

  // Lock body scroll on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) { // lg breakpoint
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const setTab = (id: string) => {
    const sp = new URLSearchParams(searchParams as any);
    sp.set("tab", id);
    navigate(`/my-life?${sp.toString()}`);
  };

  return (
    <>
      {/* Desktop (web) layout with Menu design principles */}
      <div className="hidden lg:flex h-screen bg-gray-50" style={{ maxHeight: '100vh', overflow: 'hidden' }}>
        {/* Sidebar - width matches chat */}
        <div className="w-[380px] xl:w-[420px] bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900">My Life</h1>
          </div>

          {/* Sidebar options styled like Menu page cards */}
          <nav className="flex-1 overflow-hidden p-4 space-y-3" style={{ marginTop: '64px' }}>
            {TABS.map(({ id, label, Icon }) => {
              const isActive = active === id;
              return (
                <div key={id} className="relative">
                  <button
                    onClick={() => setTab(id)}
                    aria-label={label}
                    className="w-full rounded-xl bg-white flex items-center gap-3 px-4 py-4 transition-all duration-200 focus:outline-none group text-left"
                    style={{
                      minHeight: '72px',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: isActive
                        ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = isActive
                        ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-center" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                      {Icon ? <Icon size={20} className="text-gray-900 leading-none" /> : null}
                    </div>
                    <span className="text-gray-900 font-semibold" style={{ fontSize: '16px' }}>{label}</span>
                  </button>
                  {isActive && (
                    <div
                      className="absolute bg-gray-900"
                      style={{
                        right: '-16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '60%',
                        borderTopLeftRadius: '2px',
                        borderBottomLeftRadius: '2px'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="w-full min-h-full">
            <div style={{ height: '32px' }} />
            <div className="px-8 relative">
              {/* Add button - positioned at same height as edit button on menu profile page */}
              <div className="absolute" style={{ top: '0', right: '32px', zIndex: 10 }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Add action here
                  }}
                  aria-label="Add activity"
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    position: 'relative',
                    zIndex: 100,
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus size={18} className="text-gray-900" />
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">My Activities</h1>
              <div className="mt-8 w-full border-t" style={{ borderColor: '#E5E7EB' }} />
              <div className="py-24 text-gray-500">Coming soon.</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile layout */}
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader 
            title="My Life"
            customBackButton={
              <button
                onClick={() => setShowProfileModal(true)}
                className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
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
                  padding: '2px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                aria-label="Switch account"
              >
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden">
                  <Avatar 
                    src={account?.profile_pic || personalProfile?.avatarUrl} 
                    name={account?.name || personalProfile?.name || ""} 
                    size={36} 
                  />
                </div>
              </button>
            }
            actions={[
              {
                icon: <Plus size={20} className="text-gray-900" strokeWidth={2.5} />,
                onClick: () => {
                  navigate('/my-life/create');
                },
                label: "Add"
              }
            ]}
          />

          <div
            className="flex-1 px-4 lg:px-8 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto scrollbar-hide"
            style={{
              paddingTop: 'var(--saved-content-padding-top, 140px)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Top Spacing */}
            <div style={{ height: '12px' }} />
            
            {/* Pills - only show when there's relevant content */}
            {availablePills.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 -mx-1" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                    {availablePills.map((p) => {
                      const isActive = mobileTab === p.id;
                      return (
                        <div
                          key={p.id}
                          className="flex-shrink-0"
                          style={{
                            paddingLeft: isActive ? '2px' : '0',
                            paddingRight: isActive ? '2px' : '0',
                            paddingTop: isActive ? '2px' : '0',
                            paddingBottom: isActive ? '2px' : '0',
                          }}
                        >
                          <button
                            onClick={() => setMobileTab(p.id as 'upcoming' | 'hosting' | 'history')}
                            className="inline-flex items-center justify-center rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                            style={{
                              minHeight: isActive ? '44px' : '40px',
                              paddingLeft: isActive ? '18px' : '16px',
                              paddingRight: isActive ? '18px' : '16px',
                              paddingTop: isActive ? '12px' : '10px',
                              paddingBottom: isActive ? '12px' : '10px',
                              borderWidth: '0.4px',
                              borderColor: '#E5E7EB',
                            borderStyle: 'solid',
                              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                              color: isActive ? '#111827' : '#6B7280',
                              willChange: 'transform, box-shadow',
                              transform: isActive ? 'scale(1.05)' : 'scale(1)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                              }
                          }}
                        >
                            <span 
                              className="font-medium leading-none"
                              style={{
                                fontSize: isActive ? '14px' : '13px',
                              }}
                            >
                              {p.label}
                            </span>
                        </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {displayListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {displayListings.map((listing) => (
                  <ListingCard 
                    key={listing.id}
                    listing={listing}
                    size="medium"
                    showDate={true}
                  />
                ))}
              </div>
            ) : availablePills.length > 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">No listings in this section</p>
              </div>
            ) : null}

          </div>
        </MobilePage>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        name={account?.name || personalProfile?.name || "User"}
        avatarUrl={account?.profile_pic || personalProfile?.avatarUrl}
        onViewProfile={() => router.push(`/profile?id=${account?.id || personalProfile?.id}&from=${encodeURIComponent(pathname)}`)}
        onShareProfile={() => {
          // Navigate to QR code page with current URL as 'from' parameter
          const currentUrl = typeof window !== 'undefined' 
            ? `${window.location.pathname}${window.location.search}`
            : '/my-life';
          const fromParam = `?from=${encodeURIComponent(currentUrl)}`;
          const targetUrl = `/qr-code${fromParam}`;
          console.log('🔵 MyLifeLayout: navigateToQRCode called', {
            currentUrl,
            fromParam,
            targetUrl,
            fullCurrentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
          });
          router.push(targetUrl);
        }}
      />
    </>
  );
}
