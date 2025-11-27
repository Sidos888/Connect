"use client";

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Map, Grid3x3, Search, X, MapPin, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import { listingsService, Listing } from "@/lib/listingsService";
import { useQuery } from "@tanstack/react-query";
import ListingCard from "@/components/listings/ListingCard";
import ListingsSearchModal from "@/components/listings/ListingsSearchModal";
import { SearchIcon } from "@/components/icons";

export default function ForYouListingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  // Mobile state/refs (ported from Side Quest)
  const [selectedSubcategory, setSelectedSubcategory] = useState('New');
  const [showMap, setShowMap] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [listStartOffset, setListStartOffset] = useState<number>(269); // Updated to account for 16px increased spacing
  // Desktop-specific refs (retain)
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerBottom, setHeaderBottom] = useState<number | null>(null);
  const HEADER_SPACER_PX = 3;

  const subcategories = [
    { title: "New", icon: "🔥" },
    { title: "Recommended", icon: "✨" },
    { title: "Following", icon: "👀" },
    { title: "Friends Pick", icon: "👫" },
    { title: "This Week", icon: "📅" },
    { title: "Nearby", icon: "🎯" },
  ];

  // Fetch real listings from database
  const { data: listingsData, isLoading: listingsLoading, error: listingsError } = useQuery({
    queryKey: ['public-listings'],
    queryFn: async () => {
      console.log('ForYouListingsPage: Fetching public listings...');
      const result = await listingsService.getPublicListings(50);
      console.log('ForYouListingsPage: Fetched listings:', {
        count: result.listings?.length || 0,
        error: result.error?.message,
        listings: result.listings?.map(l => ({ id: l.id, title: l.title, is_public: l.is_public }))
      });
      if (result.error) {
        console.error('ForYouListingsPage: Error fetching listings:', result.error);
      }
      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const allListings = listingsData?.listings || [];

  // For now, show all listings under "New" category
  // TODO: Implement filtering by subcategory (Recommended, Following, etc.)
  const listingsBySubcategory: Record<string, Listing[]> = {
    "New": allListings,
    "Recommended": [],
    "Following": [],
    "Friends Pick": [],
    "This Week": [],
    "Nearby": [],
  };
  
  // Log when listings change
  useEffect(() => {
    console.log('ForYouListingsPage: Listings updated:', {
      count: allListings.length,
      isLoading: listingsLoading,
      error: listingsError,
      selectedSubcategory,
      listingsBySubcategory: listingsBySubcategory[selectedSubcategory]?.length || 0,
      listings: allListings.map(l => ({ id: l.id, title: l.title }))
    });
  }, [allListings.length, listingsLoading, listingsError, selectedSubcategory, listingsBySubcategory]);

  const categories = [
    { title: "New", icon: "🔥" },
    { title: "Recommended", icon: "✨" },
    { title: "Following", icon: "👀" },
    { title: "Friends Pick", icon: "👫" },
    { title: "This Week", icon: "📅" },
    { title: "Nearby", icon: "🎯" },
  ];

  // Bottom nav is now visible on listing pages

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    if (newScrollTop < 0) {
      e.currentTarget.scrollTop = 0;
      return;
    }
  };

  return (
    <>
      {/* Mobile Layout with Bottom Sheet (Side Quest mobile UI reused) */}
      <div className="lg:hidden for-you-listings-page" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <style jsx global>{`
          .for-you-listings-page > div {
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
            <div className="relative w-full flex items-center justify-center" style={{ height: '44px', pointerEvents: 'auto' }}>
              <button
                onClick={() => router.push('/explore')}
                className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'white',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                }}
              >
                <ArrowLeft size={18} className="text-gray-900" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">For You</h1>
              {/* Combined Search/Map Button */}
              <div
                className="absolute right-0 flex items-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  width: '88px', // Double the normal button width (44px * 2)
                  height: '44px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.96)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                {/* Search Icon - Left Side */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center justify-center flex-1 h-full"
                >
                  <SearchIcon size={20} className="text-gray-900" style={{ strokeWidth: 2.5 }} />
                </button>
                {/* Map Icon - Right Side */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMap(!showMap);
                  }}
                  className="flex items-center justify-center flex-1 h-full"
              >
                {showMap ? <Grid3x3 size={18} className="text-gray-900" /> : <Map size={18} className="text-gray-900" />}
              </button>
              </div>
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

          {/* Map Background - full page when showMap is true */}
          <div 
            className="absolute left-0 right-0 bottom-0 bg-gray-100"
            style={{
              top: '0', // Start from top so map is visible underneath header and category pills
              zIndex: 5,
              opacity: showMap ? 1 : 0,
              transition: 'opacity 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
              pointerEvents: showMap ? 'auto' : 'none'
            }}
          >
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=138.5686%2C-34.9485%2C138.6286%2C-34.9085&layer=mapnik"
              className="w-full h-full border-0"
              title="Adelaide Map"
            />
          </div>

          {/* Transparent Category Header */}
          <div className="absolute left-0 right-0 z-20" style={{ 
            top: '138px', // Increased from 122px to add 16px spacing (matching side padding)
            pointerEvents: 'none',
            background: 'transparent',
            overflow: 'visible'
          }}>
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

          {/* Listings Content - normal scrollable view */}
          <div 
            ref={containerRef}
            className="absolute left-0 right-0 flex flex-col overflow-y-auto scrollbar-hide"
            style={{
              top: `${listStartOffset}px`,
              bottom: '0',
              zIndex: showMap ? 4 : 10, // Behind map when map is shown
              paddingBottom: 'calc(var(--bottom-nav-height, 62px) + 12px + 20px)', // Account for bottom nav
              WebkitOverflowScrolling: 'touch',
              backgroundColor: 'white',
              opacity: showMap ? 0 : 1, // Hide listings when map is shown
              pointerEvents: showMap ? 'none' : 'auto', // Disable interaction when map is shown
              transition: 'opacity 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
            onScroll={handleScroll}
          >
            {/* Listings Grid */}
            <div className="px-4 pb-8 flex-shrink-0" style={{
              paddingLeft: '22px',
              paddingRight: '22px',
              paddingTop: '16px',
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
                        onClick={() => router.push(`/listing?id=${listing.id}&from=${pathname}`)}
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
            <h1 className="text-3xl font-bold text-gray-900 text-center">For You</h1>
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
    
      {/* Search Modal */}
      <ListingsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        listings={allListings}
      />
    </>
  );
}
