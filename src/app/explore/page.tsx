"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useModal } from "@/lib/modalContext";
import { SearchIcon } from "@/components/icons";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import Avatar from "@/components/Avatar";
import ProfileModal from "@/components/profile/ProfileModal";
import FiltersModal from "@/components/explore/FiltersModal";
import { Search, MapPin, Clock, UserCircle } from "lucide-react";
import { listingsService } from "@/lib/listingsService";
import { useQuery } from "@tanstack/react-query";
import ListingsSearchModal from "@/components/listings/ListingsSearchModal";

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';

// MODULE-LEVEL LOG: This should execute when the module is loaded
console.log('🔍 Explore Page: MODULE LOADED - File is being imported');

// CRITICAL: Force component execution after full page reload
// This script runs immediately when module loads, before React hydration
if (typeof window !== 'undefined') {
  // Check if we're on explore page after a full page reload
  const isExplorePage = window.location.pathname === '/explore' || window.location.pathname.startsWith('/explore');
  const hasCacheBusting = window.location.search.includes('t=');
  
  if (isExplorePage) {
    console.log('🔍 Explore Page: Module loaded on explore route, setting execution flag');
    // Set a flag that component can check
    (window as any).__explorePageShouldExecute = true;
    (window as any).__explorePageExecutionTime = Date.now();
  }
}

function ExplorePage() {
  // CRITICAL: Log immediately when component function is called
  console.log('🔍 Explore Page: FUNCTION CALLED - Component is executing');
  
  // Force component to execute by ensuring it's not cached
  // This helps with Next.js App Router after full page reloads
  const [forceRemount, setForceRemount] = React.useState(() => {
    // Initialize with execution flag check
    if (typeof window !== 'undefined' && (window as any).__explorePageShouldExecute) {
      console.log('🔍 Explore Page: Execution flag detected, forcing initial render');
      (window as any).__explorePageShouldExecute = false;
      return Date.now();
    }
    return 0;
  });
  
  React.useEffect(() => {
    // Force remount on navigation from signing-out page
    const isFromSigningOut = sessionStorage.getItem('fromSigningOut') === 'true';
    if (isFromSigningOut) {
      console.log('🔍 Explore Page: Detected navigation from signing-out page, forcing remount');
      sessionStorage.removeItem('fromSigningOut');
      setForceRemount(prev => prev + 1);
    }
    
    // Additional check: if component mounted but didn't render content
    const checkContent = setTimeout(() => {
      const mainElement = document.querySelector('[data-app-shell]') || document.body;
      const exploreContent = mainElement.querySelector('.lg\\:hidden, [class*="Explore"]');
      if (!exploreContent && window.location.pathname === '/explore') {
        console.warn('🔍 Explore Page: No content detected after mount, forcing remount');
        setForceRemount(prev => prev + 1);
      }
    }, 100);
    
    return () => clearTimeout(checkContent);
  }, []);
  
  if (typeof window !== 'undefined') {
    // Remove cache-busting query param if present (clean URL)
    const url = new URL(window.location.href);
    if (url.searchParams.has('t')) {
      url.searchParams.delete('t');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }
  
  const router = useRouter();
  const pathname = usePathname();
  console.log('🔍 Explore Page: After useRouter/usePathname', { pathname });
  
  const { context, personalProfile } = useAppStore();
  console.log('🔍 Explore Page: After useAppStore', { 
    hasContext: !!context, 
    hasPersonalProfile: !!personalProfile 
  });
  
  const { account, user } = useAuth();
  
  // Safety net: If coming from sign-out, force signed-out state until AuthContext confirms
  // This handles race conditions where AuthContext hasn't updated yet
  const isFromSigningOut = typeof window !== 'undefined' && sessionStorage.getItem('fromSigningOut') === 'true';
  const effectiveUser = isFromSigningOut ? null : user;
  const effectiveAccount = isFromSigningOut ? null : account;
  
  console.log('🔍 Explore Page: After useAuth', { 
    hasUser: !!user, 
    hasAccount: !!account,
    isFromSigningOut,
    effectiveUser: !!effectiveUser,
    effectiveAccount: !!effectiveAccount
  });
  
  const { showLogin } = useModal();
  console.log('🔍 Explore Page: After useModal');
  
  
  const [hasError, setHasError] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Log after hooks
  console.log('🔍 Explore Page: After all hooks', {
    pathname,
    hasUser: !!user,
    hasAccount: !!account,
    hasPersonalProfile: !!personalProfile,
    isFromSigningOut,
    effectiveUser: !!effectiveUser,
    effectiveAccount: !!effectiveAccount
  });

  // Comprehensive logging for explore page rendering
  useEffect(() => {
    console.log('🔍 Explore Page: Component mounted/updated', {
      pathname,
      hasUser: !!user,
      hasAccount: !!account,
      hasPersonalProfile: !!personalProfile,
      isFromSigningOut,
      effectiveUser: !!effectiveUser,
      effectiveAccount: !!effectiveAccount,
      windowHeight: typeof window !== 'undefined' ? window.innerHeight : 'N/A',
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
      scrollY: typeof window !== 'undefined' ? window.scrollY : 'N/A',
      scrollX: typeof window !== 'undefined' ? window.scrollX : 'N/A',
      documentHeight: typeof document !== 'undefined' ? document.documentElement.scrollHeight : 'N/A',
      bodyHeight: typeof document !== 'undefined' ? document.body.scrollHeight : 'N/A',
      bodyOverflow: typeof document !== 'undefined' ? document.body.style.overflow : 'N/A',
      htmlOverflow: typeof document !== 'undefined' ? document.documentElement.style.overflow : 'N/A'
    });

    // Check if content is actually rendered after a delay
    const checkRenderedContent = setTimeout(() => {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const mobileContainer = document.querySelector('.lg\\:hidden');
        const desktopContainer = document.querySelector('.hidden.lg\\:block');
        const pageHeader = document.querySelector('[class*="PageHeader"]');
        const featureCards = document.querySelectorAll('[class*="grid"]');
        const contentArea = document.querySelector('[style*="paddingTop"]');
        
        console.log('🔍 Explore Page: Post-render DOM check', {
          hasMobileContainer: !!mobileContainer,
          hasDesktopContainer: !!desktopContainer,
          hasPageHeader: !!pageHeader,
          featureCardsCount: featureCards.length,
          hasContentArea: !!contentArea,
          mobileContainerVisible: mobileContainer ? window.getComputedStyle(mobileContainer).display !== 'none' : false,
          mobileContainerHeight: mobileContainer ? (mobileContainer as HTMLElement).offsetHeight : 0,
          desktopContainerVisible: desktopContainer ? window.getComputedStyle(desktopContainer).display !== 'none' : false,
          bodyChildren: document.body.children.length,
          appShell: document.querySelector('[data-app-shell]') ? 'found' : 'not found'
        });
      }
    }, 100);
    
    return () => clearTimeout(checkRenderedContent);

    // Check DOM elements after render
    const checkDOM = () => {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const mobilePage = document.querySelector('.lg\\:hidden');
        const contentArea = document.querySelector('[style*="paddingTop"]');
        const pageHeader = document.querySelector('[class*="PageHeader"]');
        const featureCards = document.querySelectorAll('[class*="grid"]');
        
        console.log('🔍 Explore Page: DOM Check', {
          hasMobilePage: !!mobilePage,
          hasContentArea: !!contentArea,
          hasPageHeader: !!pageHeader,
          featureCardsCount: featureCards.length,
          mobilePageVisible: mobilePage ? window.getComputedStyle(mobilePage).display !== 'none' : 'N/A',
          contentAreaVisible: contentArea ? window.getComputedStyle(contentArea).display !== 'none' : 'N/A',
          contentAreaHeight: contentArea ? window.getComputedStyle(contentArea).height : 'N/A',
          contentAreaPaddingTop: contentArea ? window.getComputedStyle(contentArea).paddingTop : 'N/A',
          bodyScrollHeight: document.body.scrollHeight,
          windowInnerHeight: window.innerHeight,
          scrollPosition: window.scrollY
        });
      }
    };

    // Check immediately and after a delay
    checkDOM();
    const timeout = setTimeout(checkDOM, 100);
    const timeout2 = setTimeout(checkDOM, 500);
    const timeout3 = setTimeout(checkDOM, 1000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [pathname, user, account, personalProfile]);

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

  // Scroll to top on mount (especially important after window.location.replace)
  useEffect(() => {
    console.log('🔍 Explore Page: Scroll to top effect running', {
      initialScrollY: window.scrollY,
      initialScrollX: window.scrollX,
      documentScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop
    });

    // Scroll to top immediately when component mounts
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    console.log('🔍 Explore Page: After immediate scroll', {
      scrollY: window.scrollY,
      scrollX: window.scrollX,
      documentScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop
    });
    
    // Also ensure scroll position is reset after a brief delay (for full page reloads)
    const timeout = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      console.log('🔍 Explore Page: After delayed scroll (100ms)', {
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        documentScrollTop: document.documentElement.scrollTop,
        bodyScrollTop: document.body.scrollTop
      });
    }, 100);

    const timeout2 = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      console.log('🔍 Explore Page: After delayed scroll (500ms)', {
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        documentScrollTop: document.documentElement.scrollTop,
        bodyScrollTop: document.body.scrollTop,
        windowHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight
      });
    }, 500);
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
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
  console.log('🔍 Explore Page: About to call useQuery');
  
  // useQuery must be called unconditionally (React Rules of Hooks)
  const { data: listingsData, error: queryError, isLoading: queryLoading } = useQuery({
    queryKey: ['all-public-listings'],
    queryFn: async () => {
      console.log('🔍 Explore Page: Query function executing');
      try {
        const result = await listingsService.getPublicListings(100); // Get more listings for comprehensive search
        console.log('🔍 Explore Page: Query function completed', { 
          listingsCount: result?.listings?.length || 0 
        });
        return result;
      } catch (error) {
        console.error('🔍 Explore Page: Query function error', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 1, // Only retry once
  });
  
  console.log('🔍 Explore Page: After useQuery', {
    hasData: !!listingsData,
    hasError: !!queryError,
    isLoading: queryLoading,
    listingsCount: listingsData?.listings?.length || 0
  });
  
  // Handle query errors using the error property (not try-catch)
  if (queryError) {
    console.error('🔍 Explore Page: Query error detected', queryError);
  }
  
  const allListings = listingsData?.listings || [];

  // Get current account info (use effective values to handle sign-out race condition)
  const currentAccount = effectiveAccount
    ? { name: effectiveAccount.name, avatarUrl: effectiveAccount.profile_pic }
    : { name: personalProfile?.name, avatarUrl: personalProfile?.avatarUrl };


  // Log render state
  console.log('🔍 Explore Page: Rendering', {
    hasError,
    hasUser: !!user,
    hasAccount: !!account,
    hasPersonalProfile: !!personalProfile,
    isFromSigningOut,
    effectiveUser: !!effectiveUser,
    effectiveAccount: !!effectiveAccount,
    showProfileModal,
    showFiltersModal,
    isSearchOpen,
    allListingsCount: allListings.length,
    currentAccount: currentAccount?.name || 'N/A',
    queryLoading,
    hasQueryError: !!queryError,
    hasListingsData: !!listingsData,
    pathname
  });

  console.log('🔍 Explore Page: About to render JSX', {
    willRenderMobile: true,
    willRenderDesktop: true,
    hasError,
    pathname,
    isClient: typeof window !== 'undefined'
  });

  // Early return for error state
  if (hasError) {
    console.log('🔍 Explore Page: Has error, returning error UI');
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
    console.log('🔍 Explore Page: Inside try block, starting render');
    const jsxContent = (
    <>
      {/* Mobile Layout with Design System */}
      <div className="lg:hidden" style={{ minHeight: '100vh' }}>
        <MobilePage style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
          {console.log('🔍 Explore Page: Rendering MobilePage and PageHeader')}
          <PageHeader
            title="Explore"
            customBackButton={
              <button
                onClick={() => {
                  console.log('🔐 Explore: Button clicked', { user: !!effectiveUser, userId: effectiveUser?.id });
                  if (effectiveUser) {
                    setShowProfileModal(true);
                  } else {
                    console.log('🔐 Explore: UserCircle clicked, opening login modal');
                    showLogin();
                  }
                }}
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
                  padding: user ? '2px' : '0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                aria-label={user ? "Switch account" : "Log in or Sign up"}
              >
                {effectiveUser && currentAccount ? (
                  <div className="w-[36px] h-[36px] rounded-full overflow-hidden">
                    <Avatar 
                      src={currentAccount?.avatarUrl ?? undefined} 
                      name={currentAccount?.name ?? ""} 
                      size={36} 
                    />
                  </div>
                ) : (
                  <UserCircle size={22} className="text-gray-900" strokeWidth={2} />
                )}
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

          <div 
            className="flex-1 overflow-y-auto scrollbar-hide" 
            style={{
              paddingTop: 'var(--saved-content-padding-top, 140px)',
              paddingBottom: '56px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              minHeight: '100vh',
              position: 'relative'
            }}
            ref={(el) => {
              if (el && typeof window !== 'undefined') {
                console.log('🔍 Explore Page: Content area ref', {
                  offsetHeight: el.offsetHeight,
                  offsetTop: el.offsetTop,
                  scrollHeight: el.scrollHeight,
                  clientHeight: el.clientHeight,
                  computedDisplay: window.getComputedStyle(el).display,
                  computedVisibility: window.getComputedStyle(el).visibility,
                  computedHeight: window.getComputedStyle(el).height,
                  computedPaddingTop: window.getComputedStyle(el).paddingTop,
                  computedPaddingBottom: window.getComputedStyle(el).paddingBottom,
                  computedOverflow: window.getComputedStyle(el).overflow,
                  computedPosition: window.getComputedStyle(el).position,
                  computedMinHeight: window.getComputedStyle(el).minHeight,
                  parentOffsetHeight: el.parentElement?.offsetHeight,
                  parentScrollHeight: el.parentElement?.scrollHeight
                });
              }
            }}
          >
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
                <div className="flex flex-col items-start h-full p-4 gap-1.5 relative">
                  <div className="text-4xl leading-none">🎲</div>
                  <span className="text-base font-semibold text-gray-500 text-left leading-tight">Side Quest</span>
                  <div className="absolute top-3 right-3 text-right">
                    <div className="text-[11px] font-semibold leading-[1.2] tracking-wide text-gray-500">Coming</div>
                    <div className="text-[11px] font-semibold leading-[1.2] tracking-wide text-gray-500">Soon</div>
                  </div>
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
                    <div className="flex flex-col items-start h-full p-4 gap-2 relative">
                      <div className="text-4xl leading-none">{category.icon}</div>
                      <span className={`text-base font-semibold text-left leading-tight ${category.href ? 'text-neutral-900' : 'text-gray-500'}`}>
                        {category.title}
                      </span>
                      {!category.href && (
                        <div className="absolute top-3 right-3 text-right">
                          <div className="text-[11px] font-semibold leading-[1.2] tracking-wide text-gray-500">Coming</div>
                          <div className="text-[11px] font-semibold leading-[1.2] tracking-wide text-gray-500">Soon</div>
                        </div>
                      )}
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
                  <div className="flex flex-col items-center justify-center h-full gap-2 relative">
                    <div className="text-6xl leading-none">🎲</div>
                    <span className="text-lg font-semibold text-gray-500">Side Quest</span>
                    <div className="absolute top-3 right-3 text-right">
                      <div className="text-[11px] font-semibold leading-[1.2] tracking-wide text-gray-500">Coming</div>
                      <div className="text-[11px] font-semibold leading-[1.2] tracking-wide text-gray-500">Soon</div>
                    </div>
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
                    <div className="flex flex-col items-center justify-center h-full gap-3 p-4 relative">
                      <div className="text-6xl leading-none">{category.icon}</div>
                      <span className={`text-lg font-semibold text-center leading-tight ${category.href ? 'text-neutral-900' : 'text-gray-500'}`}>
                        {category.title}
                      </span>
                      {!category.href && (
                        <div className="absolute top-3 right-3 text-right">
                          <div className="text-[11px] font-semibold leading-[1.2] tracking-wide text-gray-500">Coming</div>
                          <div className="text-[11px] font-semibold leading-[1.2] tracking-wide text-gray-500">Soon</div>
                        </div>
                      )}
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
        onViewProfile={() => router.push(`/profile?id=${effectiveAccount?.id || personalProfile?.id}&from=${encodeURIComponent(pathname)}`)}
        onShareProfile={() => {
          // Navigate to QR code page with current URL as 'from' parameter
          const currentUrl = typeof window !== 'undefined' 
            ? `${window.location.pathname}${window.location.search}`
            : '/explore';
          const fromParam = `?from=${encodeURIComponent(currentUrl)}`;
          router.push(`/qr-code${fromParam}`);
        }}
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
    
    console.log('🔍 Explore Page: JSX created successfully, returning content');
    console.log('🔍 Explore Page: JSX validation', {
      jsxType: typeof jsxContent,
      isObject: typeof jsxContent === 'object',
      isNotNull: jsxContent !== null,
      isNotUndefined: jsxContent !== undefined,
      hasProps: jsxContent && typeof jsxContent === 'object' && 'props' in jsxContent ? 'yes' : 'no'
    });
    
    // Ensure we always return valid content
    if (!jsxContent) {
      console.error('❌ Explore Page: JSX content is null/undefined! Returning fallback');
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Loading explore page...</p>
          </div>
        </div>
      );
    }
    
    return jsxContent;
  } catch (error) {
    console.error('❌ Explore Page: Error rendering explore page:', error);
    console.error('❌ Explore Page: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      errorType: typeof error,
      errorString: String(error)
    });
    setHasError(true);
    // Return error UI instead of null so user can see something
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
}

// MODULE-LEVEL LOG: This should execute after the function is defined
console.log('🔍 Explore Page: MODULE COMPLETE - Function defined, about to export default');

export default ExplorePage;
