"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { SearchIcon } from "@/components/icons";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import Avatar from "@/components/Avatar";
import ProfileModal from "@/components/profile/ProfileModal";
import FiltersModal from "@/components/explore/FiltersModal";
import { Search, MapPin, Clock } from "lucide-react";
import { listingsService } from "@/lib/listingsService";
import { useQuery } from "@tanstack/react-query";
import ListingsSearchModal from "@/components/listings/ListingsSearchModal";

export default function ExplorePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { context, personalProfile } = useAppStore();
  const { account } = useAuth();
  const currentBusiness = useCurrentBusiness();
  const [hasError, setHasError] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Listen for filter card click from TabBar
  useEffect(() => {
    const handleOpenFiltersModal = () => {
      setShowFiltersModal(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('openFiltersModal', handleOpenFiltersModal);
      return () => {
        window.removeEventListener('openFiltersModal', handleOpenFiltersModal);
      };
    }
  }, []);

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

  // Fetch all public listings for search (for-you and casual combined)
  const { data: listingsData } = useQuery({
    queryKey: ['all-public-listings'],
    queryFn: async () => {
      const result = await listingsService.getPublicListings(100); // Get more listings for comprehensive search
      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const allListings = listingsData?.listings || [];

  // Get current account info
  const currentAccount = context.type === "business" && currentBusiness 
    ? { name: currentBusiness.name, avatarUrl: currentBusiness.profile_pic }
    : account 
      ? { name: account.name, avatarUrl: account.profile_pic }
      : { name: personalProfile?.name, avatarUrl: personalProfile?.avatarUrl };

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600">Please try refreshing the page</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  

  try {
    return (
    <>
      {/* Mobile Layout with Design System */}
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Explore"
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
                    src={currentAccount?.avatarUrl ?? undefined} 
                    name={currentAccount?.name ?? ""} 
                    size={36} 
                  />
                </div>
              </button>
            }
            actions={[
              {
                icon: <Search size={20} className="text-gray-900" strokeWidth={2.5} />,
                onClick: () => {
                  setIsSearchOpen(true);
                },
                label: "Search"
              }
            ]}
          />

          <div className="flex-1 overflow-y-auto scrollbar-hide" style={{
            paddingTop: 'var(--saved-content-padding-top, 140px)',
            paddingBottom: '56px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {/* Top Spacing */}
            <div style={{ height: '12px' }} />

            {/* Feature Cards - For You & Side Quest */}
            <div className="grid grid-cols-2" style={{ 
              paddingLeft: '16px', 
              paddingRight: '16px',
              gap: '22px',
              marginBottom: '44px'
            }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('For You button clicked, navigating to /for-you-listings');
                  try {
                    router.push('/for-you-listings');
                  } catch (error) {
                    console.error('Error navigating to For You page:', error);
                    // Fallback to window.location if router fails
                    window.location.href = '/for-you-listings';
                  }
                }}
                className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                style={{
                  height: '120px',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <div className="flex flex-col items-start h-full p-4 gap-2">
                  <div className="text-4xl leading-none">✨</div>
                  <span className="text-base font-semibold text-neutral-900 text-left leading-tight">For You</span>
                </div>
              </button>

              <button
                className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                style={{ 
                  height: '120px',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
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
                <div className="flex flex-col items-start h-full p-4 gap-2">
                  <div className="text-4xl leading-none">🎲</div>
                  <span className="text-base font-semibold text-neutral-900 text-left leading-tight">Side Quest</span>
                </div>
              </button>
            </div>

            {/* 4 Category Cards - Casual is top left */}
            <div className="grid grid-cols-2" style={{ 
              paddingLeft: '16px', 
              paddingRight: '16px',
              gap: '22px',
              rowGap: '22px'
            }}>
              {[
                { title: "Casual", icon: "☕", href: "/casual-listings" },
                { title: "Food & Drink", icon: "🍕", href: null },
                { title: "Events & Experiences", icon: "🎉", href: null },
                { title: "Workshops & Classes", icon: "🎨", href: null },
              ].map((category) => (
                  <button
                    key={category.title}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (category.href) {
                        console.log('Category clicked, navigating to:', category.href);
                        try {
                        router.push(category.href);
                        } catch (error) {
                          console.error('Error navigating to category page:', error);
                          // Fallback to window.location if router fails
                          window.location.href = category.href;
                        }
                      } else {
                        console.log('Category clicked but no href:', category.title);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (category.href) {
                        console.log('Category touched, navigating to:', category.href);
                        router.push(category.href);
                      }
                    }}
                    className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] active:scale-[0.98] relative"
                    style={{
                      height: '120px',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                      touchAction: 'manipulation',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                  >
                    <div className="flex flex-col items-start h-full p-4 gap-2">
                      <div className="text-4xl leading-none">{category.icon}</div>
                      <span className="text-base font-semibold text-neutral-900 text-left leading-tight">
                        {category.title}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>

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
      
      {/* Location Filter Card removed - now integrated into bottom nav */}

      {/* Desktop Layout - New Design */}
      <div className="hidden lg:block bg-white overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="h-full overflow-y-auto">
          <div className="px-8" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
            {/* Title Section */}
            <div className="relative mb-20">
              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 text-center">Explore</h1>
            </div>

            {/* Filter Card */}
            <div className="mb-6 flex justify-center">
              <button
                onClick={() => setShowFiltersModal(true)}
                className="rounded-2xl bg-white px-8 py-4 transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
                style={{
                  minWidth: '400px',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xl">📍</span>
                    <span className="text-base font-semibold text-neutral-900">Adelaide</span>
                  </div>
                  <span className="text-base text-neutral-500">Anytime</span>
                </div>
              </button>
            </div>

            {/* Feature Cards - For You & Side Quest */}
            <div className="mb-20 flex justify-center">
              <div className="grid grid-cols-2 gap-6">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('For You button clicked (desktop), navigating to /for-you-listings');
                    try {
                      router.push('/for-you-listings');
                    } catch (error) {
                      console.error('Error navigating to For You page:', error);
                      // Fallback to window.location if router fails
                      window.location.href = '/for-you-listings';
                    }
                  }}
                  className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                  style={{
                    width: '157px',
                    height: '157px',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
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
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="text-6xl leading-none">✨</div>
                    <span className="text-lg font-semibold text-neutral-900">For You</span>
                  </div>
                </button>

                <button
                  aria-disabled={true}
                  className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                  style={{
                    width: '157px',
                    height: '157px',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
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
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="text-6xl leading-none">🎲</div>
                    <span className="text-lg font-semibold text-neutral-900">Side Quest</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 4 Squared Cards */}
            <div className="flex justify-center">
              <div className="grid grid-cols-4 gap-6" style={{ maxWidth: '700px' }}>
                {[
                  { title: "Food & Drink", icon: "🍕", href: null },
                  { title: "Events & Experiences", icon: "🎉", href: null },
                  { title: "Workshops & Classes", icon: "🎨", href: null },
                  { title: "Casual", icon: "☕", href: "/casual-listings" },
                ].map((category) => (
                  <button
                    key={category.title}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (category.href) {
                        console.log('Casual category clicked (desktop), navigating to:', category.href);
                        router.push(category.href);
                      }
                    }}
                    disabled={!category.href}
                    className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] active:scale-[0.98] relative aspect-square"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                      cursor: category.href ? 'pointer' : 'default',
                      opacity: category.href ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if (category.href) {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
                      <div className="text-6xl leading-none">{category.icon}</div>
                      <span className="text-lg font-semibold text-neutral-900 text-center leading-tight">
                        {category.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        name={currentAccount?.name ?? "User"}
        avatarUrl={currentAccount?.avatarUrl}
        onViewProfile={() => router.push(`/profile?id=${account?.id || personalProfile?.id}&from=${encodeURIComponent(pathname)}`)}
        onShareProfile={() => {
          // Navigate to QR code page with current URL as 'from' parameter
          const currentUrl = typeof window !== 'undefined' 
            ? `${window.location.pathname}${window.location.search}`
            : '/explore';
          const fromParam = `?from=${encodeURIComponent(currentUrl)}`;
          router.push(`/qr-code${fromParam}`);
        }}
        onAddBusiness={() => router.push('/create-business')}
      />

      {/* Filters Modal */}
      <FiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
      />

      {/* Search Modal */}
      <ListingsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        listings={allListings}
        sourcePath="/explore"
      />
    </>
    );
  } catch (error) {
    console.error('Error rendering explore page:', error);
    setHasError(true);
    return null;
  }
}
