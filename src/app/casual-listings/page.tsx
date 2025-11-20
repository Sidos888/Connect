"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, Map, X, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import { listingsService, Listing } from "@/lib/listingsService";
import { useQuery } from "@tanstack/react-query";
import ListingCard from "@/components/listings/ListingCard";

export default function CasualListingsPage() {
  const router = useRouter();
  // Mobile state/refs (ported from Side Quest)
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [showMap, setShowMap] = useState(false);
  const [sheetState, setSheetState] = useState<'list' | 'peek'>('list');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [listingsTouchStart, setListingsTouchStart] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [listStartOffset, setListStartOffset] = useState<number>(253);
  // Desktop-specific refs (retain)
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerBottom, setHeaderBottom] = useState<number | null>(null);
  const HEADER_SPACER_PX = 3;

  const subcategories = [
    { title: "All", icon: "☕" },
  ];

  // Fetch real listings from database
  const { data: listingsData, isLoading: listingsLoading, error: listingsError } = useQuery({
    queryKey: ['public-listings'],
    queryFn: async () => {
      console.log('CasualListingsPage: Fetching public listings...');
      const result = await listingsService.getPublicListings(50);
      console.log('CasualListingsPage: Fetched listings:', {
        count: result.listings?.length || 0,
        error: result.error?.message,
        listings: result.listings?.map(l => ({ id: l.id, title: l.title, is_public: l.is_public }))
      });
      if (result.error) {
        console.error('CasualListingsPage: Error fetching listings:', result.error);
      }
      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const allListings = listingsData?.listings || [];
  
  // Log when listings change
  useEffect(() => {
    console.log('CasualListingsPage: Listings updated:', {
      count: allListings.length,
      isLoading: listingsLoading,
      error: listingsError,
      listings: allListings.map(l => ({ id: l.id, title: l.title }))
    });
  }, [allListings.length, listingsLoading, listingsError]);

  // Show all listings under "All" category
  const listingsBySubcategory: Record<string, Listing[]> = {
    "All": allListings,
  };

  const categories = [
    { title: "All", icon: "☕" },
  ];

  // Hide bottom nav on mobile
  useEffect(() => {
    const hideNav = () => {
      const bottomNav = document.querySelector('nav[class*="bottom-0"]') || 
                       document.querySelector('[class*="fixed"][class*="bottom"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
      }
    };
    hideNav();
    const timer = setTimeout(hideNav, 100);
    return () => {
      clearTimeout(timer);
      const nav = document.querySelector('nav[class*="bottom-0"]') || 
                  document.querySelector('[class*="fixed"][class*="bottom"]');
      if (nav) {
        (nav as HTMLElement).style.display = '';
      }
    };
  }, []);

  // Reset scroll position when transitioning from peek to list
  useEffect(() => {
    if (sheetState === 'list' && containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [sheetState]);

  // Dynamically measure the bottom of the subcategory section and set list start offset
  useEffect(() => {
    const measure = () => {
      if (typeof window === 'undefined') return;
      const gapBelowCategories = 40;
      const rect = categoriesRef.current?.getBoundingClientRect();
      if (rect && Number.isFinite(rect.bottom)) {
        const next = Math.round(rect.bottom + gapBelowCategories);
        if (next !== listStartOffset) setListStartOffset(next);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure as EventListener);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure as EventListener);
    };
  }, [listStartOffset]);

  // Touch handlers for drag
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isDragging) return;
    const currentTouch = e.touches[0].clientY;
    const diff = touchStart - currentTouch;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        if (sheetState === 'peek') setSheetState('list');
      }
      setIsDragging(false);
      setTouchStart(null);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    if (newScrollTop < 0) {
      e.currentTarget.scrollTop = 0;
      return;
    }
    setScrollTop(newScrollTop);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStart(null);
    setListingsTouchStart(null);
  };

  // Detect downward swipe on sheet when at scrollTop=0 → activate map
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    if (scrollTop === 0) {
      setListingsTouchStart(e.touches[0].clientY);
    }
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (!listingsTouchStart || scrollTop !== 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - listingsTouchStart;
    if (diff > 30) {
      setSheetState('peek');
      setListingsTouchStart(null);
    }
  };

  return (
    <>
      {/* Mobile Layout with Bottom Sheet (Side Quest mobile UI reused) */}
      <div className="lg:hidden casual-listings-page" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <style jsx global>{`
          .casual-listings-page > div {
            background-color: transparent !important;
          }
        `}</style>
        <MobilePage>
          {/* Transparent header with title and actions */}
          <div className="absolute top-0 left-0 right-0 z-20 px-4" style={{ 
            paddingTop: 'max(env(safe-area-inset-top), 70px)',
            paddingBottom: '16px',
            background: 'transparent',
            pointerEvents: 'none'
          }}>
            <div className="relative w-full flex items-center justify-center" style={{ height: '40px', pointerEvents: 'auto' }}>
              <button
                onClick={() => router.push('/explore')}
                className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'white',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                }}
              >
                <ArrowLeft size={18} className="text-gray-900" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Casual</h1>
            </div>
          </div>

          {/* O/B overlay */}
          <div className="absolute top-0 left-0 right-0 z-15 pointer-events-none" style={{ height: '214px' as any }}>
            <div className="absolute top-0 left-0 right-0" style={{
              height: '214px',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.35) 120px, rgba(255,255,255,0.15) 180px, rgba(255,255,255,0) 214px)'
            }} />
            <div className="absolute top-0 left-0 right-0" style={{ height: '60px', backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)' }} />
            <div className="absolute left-0 right-0" style={{ top: '60px', height: '40px', backdropFilter: 'blur(0.75px)', WebkitBackdropFilter: 'blur(0.75px)' }} />
            <div className="absolute left-0 right-0" style={{ top: '100px', height: '40px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
            <div className="absolute left-0 right-0" style={{ top: '140px', height: '40px', backdropFilter: 'blur(0.35px)', WebkitBackdropFilter: 'blur(0.35px)' }} />
          </div>

          {/* Map Background in peek state */}
          <div 
            className="absolute left-0 right-0 bottom-0 bg-gray-100"
            style={{
              top: '0',
              zIndex: 5,
              opacity: sheetState === 'peek' ? 1 : 0,
              transition: 'opacity 400ms cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}
          >
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=138.5686%2C-34.9485%2C138.6286%2C-34.9085&layer=mapnik"
              className="w-full h-full border-0"
              title="Adelaide Map"
            />
          </div>

          {/* Transparent Filter & Category Header */}
          <div className="absolute left-0 right-0 z-20" style={{ 
            top: '122px',
            pointerEvents: 'none',
            background: 'transparent',
            overflow: 'visible'
          }}>
              {/* Filter Card */}
              <div style={{ paddingLeft: '56px', paddingRight: '56px', marginBottom: '24px', pointerEvents: 'auto' }}>
                <div 
                  className="rounded-2xl bg-white px-4 py-2.5 transition-all duration-200 hover:-translate-y-[1px] cursor-pointer w-full"
                  style={{
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
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📍</span>
                      <span className="text-base font-semibold text-neutral-900">Adelaide</span>
                    </div>
                    <span className="text-sm text-neutral-500">Anytime</span>
                  </div>
                </div>
              </div>

              {/* Category Filter Cards - edge-to-edge */}
              <div ref={categoriesRef} style={{ paddingLeft: '0', paddingRight: '0', marginBottom: '12px', pointerEvents: 'auto' }}>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                  <div style={{ width: '4px', flexShrink: 0 }} />
                  {subcategories.map((cat) => {
                    const isSelected = selectedSubcategory === cat.title;
                    return (
                      <div
                        key={cat.title}
                        className="flex-shrink-0"
                        style={{
                          paddingLeft: isSelected ? '2px' : '0',
                          paddingRight: isSelected ? '2px' : '0',
                          paddingTop: isSelected ? '2px' : '0',
                          paddingBottom: isSelected ? '2px' : '0',
                        }}
                      >
                        <button
                          onClick={() => setSelectedSubcategory(cat.title)}
                          className="rounded-full transition-all duration-200 flex items-center relative"
                          style={{
                            minHeight: isSelected ? '40px' : '36px',
                            paddingLeft: isSelected ? '14px' : '12px',
                            paddingRight: isSelected ? '14px' : '12px',
                            paddingTop: isSelected ? '10px' : '8px',
                            paddingBottom: isSelected ? '10px' : '8px',
                            background: 'white',
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            gap: isSelected ? '8px' : '6px',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                          }
                        }}
                      >
                        <span 
                          className="leading-none"
                          style={{
                            fontSize: isSelected ? '16px' : '14px',
                          }}
                        >
                          {cat.icon}
                        </span>
                        <span 
                          className="font-semibold whitespace-nowrap"
                          style={{
                            fontSize: isSelected ? '13px' : '12px',
                            color: isSelected ? '#111827' : '#6B7280',
                          }}
                        >
                          {cat.title}
                        </span>
                      </button>
                      </div>
                    );
                  })}
                  <div style={{ width: '4px', flexShrink: 0 }} />
                </div>
              </div>
          </div>

          {/* Bottom Sheet */}
          <div 
            ref={containerRef}
            className="fixed left-0 right-0 flex flex-col scrollbar-hide"
            style={{
              bottom: 0,
              top: sheetState === 'peek' ? 'auto' : '0',
              height: sheetState === 'peek' ? '140px' : 'auto',
              zIndex: 10,
              background: sheetState === 'peek' ? 'white' : 'transparent',
              borderTopLeftRadius: sheetState === 'peek' ? '16px' : '0',
              borderTopRightRadius: sheetState === 'peek' ? '16px' : '0',
              borderWidth: sheetState === 'peek' ? '0.4px' : '0',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              borderBottom: 'none',
              boxShadow: sheetState === 'peek' 
                ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                : 'none',
              overflowY: sheetState === 'peek' ? 'hidden' : 'scroll',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              paddingTop: sheetState === 'list' ? `${listStartOffset}px` : '0',
              transition: 'height 400ms cubic-bezier(0.4, 0.0, 0.2, 1), background-color 400ms cubic-bezier(0.4, 0.0, 0.2, 1), border-radius 400ms cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 400ms cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}
            onTouchStart={(e) => {
              handleTouchStart(e);
              handleSheetTouchStart(e);
            }}
            onTouchMove={(e) => {
              handleTouchMove(e);
              handleSheetTouchMove(e);
            }}
            onTouchEnd={handleTouchEnd}
            onScroll={handleScroll}
          >
            {/* Drag Handle */}
            <div className="flex justify-center flex-shrink-0"
              style={{
                paddingTop: sheetState === 'peek' ? '12px' : '0',
                height: sheetState === 'peek' ? 'auto' : '0',
                opacity: sheetState === 'peek' ? 1 : 0,
                transform: sheetState === 'peek' ? 'translateY(0)' : 'translateY(-30px)',
                transition: 'transform 400ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0.0, 0.2, 1), height 400ms cubic-bezier(0.4, 0.0, 0.2, 1), padding 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                willChange: 'transform, opacity, height',
                pointerEvents: sheetState === 'peek' ? 'auto' : 'none',
                overflow: 'hidden'
              }}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Listing Count */}
            <div className="flex justify-center flex-shrink-0"
              style={{
                paddingTop: sheetState === 'peek' ? '24px' : '0',
                paddingBottom: sheetState === 'peek' ? '24px' : '0',
                height: sheetState === 'peek' ? 'auto' : '0',
                opacity: sheetState === 'peek' ? 1 : 0,
                transform: sheetState === 'peek' ? 'translateY(0)' : 'translateY(-30px)',
                transition: 'transform 400ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0.0, 0.2, 1), height 400ms cubic-bezier(0.4, 0.0, 0.2, 1), padding 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                willChange: 'transform, opacity, height',
                pointerEvents: sheetState === 'peek' ? 'auto' : 'none',
                overflow: 'hidden'
              }}
            >
              <p className="text-sm font-semibold text-gray-900">{(listingsBySubcategory[selectedSubcategory] ?? []).length} Listings</p>
            </div>
            
            {/* Listings Grid */}
            <div className="px-4 pb-8 flex-shrink-0" style={{
              paddingTop: '0',
              background: 'transparent',
              transition: 'background 400ms cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}>
                {listingsLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-sm">Loading listings...</p>
                  </div>
                ) : (listingsBySubcategory[selectedSubcategory] ?? []).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(listingsBySubcategory[selectedSubcategory] ?? []).map((listing) => (
                      <ListingCard 
                        key={listing.id}
                        listing={listing}
                        size="medium"
                        showDate={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-sm">No listings available</p>
                  </div>
                )}
            </div>
          </div>
        </MobilePage>
      </div>

      {/* Desktop Layout */}
    <div className="hidden lg:flex bg-white overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Main Content - Slides left when map is open */}
      <div 
        className="overflow-y-auto transition-all duration-300 ease-in-out"
        style={{
          flex: showMap ? '0 0 calc(100% - 420px)' : '1 1 100%',
          minWidth: 0,
        }}
      >
        <div className="px-8" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
          {/* Title and Back Button Section */}
          <div className="relative mb-20">
            {/* Back Button - Top Left */}
            <button
              onClick={() => router.push('/explore')}
              className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:-translate-y-[1px] transition-all duration-200 focus:outline-none"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <ArrowLeft size={18} className="text-gray-900" />
            </button>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 text-center">Casual</h1>
          </div>

          {/* Filter Card with Search and Map Buttons */}
          <div className="mb-6 flex justify-center items-center gap-3">
            {/* Search Button - Left */}
            <button
              onClick={() => {/* Search functionality coming soon */}}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:-translate-y-[1px] transition-all duration-200 focus:outline-none flex-shrink-0"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <Search size={18} className="text-gray-900" />
            </button>

            {/* Filter Card - Center */}
            <div 
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
            </div>

            {/* Map Button - Right */}
            <button
              onClick={() => setShowMap(!showMap)}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:-translate-y-[1px] transition-all duration-200 focus:outline-none flex-shrink-0"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              {showMap ? <X size={18} className="text-gray-900" /> : <Map size={18} className="text-gray-900" />}
            </button>
          </div>

          {/* Subcategory Chips - Horizontal scrollable like mobile, centered */}
          <div className="mb-20 flex justify-center">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide" style={{ maxWidth: 'fit-content', paddingTop: '2px', paddingBottom: '2px' }}>
              {subcategories.map((cat) => {
                const isSelected = selectedSubcategory === cat.title;
                return (
                  <div
                    key={cat.title}
                    className="flex-shrink-0"
                    style={{
                      paddingLeft: isSelected ? '2px' : '0',
                      paddingRight: isSelected ? '2px' : '0',
                      paddingTop: isSelected ? '2px' : '0',
                      paddingBottom: isSelected ? '2px' : '0',
                    }}
                  >
                    <button
                      onClick={() => setSelectedSubcategory(cat.title)}
                      className="rounded-full transition-all duration-200 flex items-center relative"
                      style={{
                        minHeight: isSelected ? '46px' : '42px',
                        paddingLeft: isSelected ? '18px' : '16px',
                        paddingRight: isSelected ? '18px' : '16px',
                        paddingTop: isSelected ? '12px' : '10px',
                        paddingBottom: isSelected ? '12px' : '10px',
                        background: 'white',
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        gap: isSelected ? '10px' : '8px',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                  >
                    <span 
                      className="leading-none"
                      style={{
                        fontSize: isSelected ? '18px' : '16px',
                      }}
                    >
                      {cat.icon}
                    </span>
                    <span 
                      className="font-semibold whitespace-nowrap"
                      style={{
                        fontSize: isSelected ? '14px' : '13px',
                        color: isSelected ? '#111827' : '#6B7280',
                      }}
                      >
                        {cat.title}
                      </span>
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>

          {/* Listing Cards Grid */}
          {(() => {
            const items = listingsBySubcategory[selectedSubcategory] ?? [];
            const cols = Math.min(4, Math.max(1, items.length));
            const CARD = 213; // px
            const GAP = 16;   // Tailwind gap-4
            const computedMaxWidth = cols * CARD + (cols - 1) * GAP;
            return (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${cols}, ${CARD}px)`,
                  maxWidth: `${computedMaxWidth}px`,
                  margin: '0 auto',
                }}
              >
                {listingsLoading ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <p className="text-sm">Loading listings...</p>
                  </div>
                ) : items.length > 0 ? (
                  items.map((listing) => (
                    <ListingCard 
                      key={listing.id}
                      listing={listing}
                      size="medium"
                      showDate={true}
                      className="w-[213px]"
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <p className="text-sm">No listings available</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Map Panel - Slides in from right */}
      <div
        className="bg-white border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0"
        style={{
          width: showMap ? '420px' : '0',
          opacity: showMap ? 1 : 0,
          pointerEvents: showMap ? 'auto' : 'none',
          maxWidth: showMap ? '420px' : '0',
        }}
      >
        <div className="h-full p-6">
          {/* Map Content */}
          <div 
            className="w-full h-full rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden relative"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=138.5686%2C-34.9485%2C138.6286%2C-34.9085&layer=mapnik"
              className="w-full h-full border-0"
              title="Adelaide Map"
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

