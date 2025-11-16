"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, Map, X, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";

export default function ForYouListingsPage() {
  const router = useRouter();
  // Mobile state/refs (ported from Side Quest)
  const [selectedSubcategory, setSelectedSubcategory] = useState('New');
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
    { title: "New", icon: "🔥" },
    { title: "Recommended", icon: "✨" },
    { title: "Following", icon: "👀" },
    { title: "Friends Pick", icon: "👫" },
    { title: "This Week", icon: "📅" },
    { title: "Nearby", icon: "🎯" },
  ];

  // Listings datasets dispersed across subcategories (compact set)
  const listingsBySubcategory: Record<string, { title: string; date: string; image: string }[]> = {
    "New": [
      { title: "Sunday Markets at the Bay", date: "Nov 10, 10:00 AM", image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&h=400&fit=crop" },
      { title: "Sunrise Hike & Coffee", date: "Nov 11, 6:30 AM", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop" },
    ],
    "Recommended": [
      { title: "Live Jazz Night", date: "Nov 12, 8:00 PM", image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop" },
    ],
    "Following": [
      { title: "Wine Tasting Tour", date: "Nov 13, 2:00 PM", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop" },
    ],
    "Friends Pick": [
      { title: "Food Truck Friday", date: "Nov 15, 6:00 PM", image: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400&h=400&fit=crop" },
      { title: "Yoga in the Park", date: "Nov 16, 7:00 AM", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop" },
    ],
    "This Week": [
      { title: "Art Gallery Opening", date: "Nov 17, 6:00 PM", image: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=400&fit=crop" },
    ],
    "Nearby": [
      { title: "Comedy Show Night", date: "Nov 19, 9:00 PM", image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&h=400&fit=crop" },
    ],
  };

  const categories = [
    { title: "New", icon: "🔥" },
    { title: "Recommended", icon: "✨" },
    { title: "Following", icon: "👀" },
    { title: "Friends Pick", icon: "👫" },
    { title: "This Week", icon: "📅" },
    { title: "Nearby", icon: "🎯" },
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

  // (debugging removed)

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
              <h1 className="text-xl font-semibold text-gray-900">For You</h1>
              <button
                onClick={() => {/* Search */}}
                className="absolute right-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
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
                <Search size={20} className="text-gray-900" />
              </button>
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
              <div style={{ paddingLeft: '56px', paddingRight: '56px', marginBottom: '12px', pointerEvents: 'auto' }}>
                <div 
                  className="rounded-2xl px-4 py-2.5 transition-all duration-200 w-full"
                  style={{
                    background: 'white',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
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
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  <div style={{ width: '4px', flexShrink: 0 }} />
                  {subcategories.map((cat) => {
                    const isSelected = selectedSubcategory === cat.title;
                    return (
                      <button
                        key={cat.title}
                        onClick={() => setSelectedSubcategory(cat.title)}
                        className="flex-shrink-0 rounded-xl px-3 py-2 transition-all duration-200 flex items-center gap-2"
                        style={{
                          minHeight: '36px',
                          background: 'white',
                          borderWidth: isSelected ? '2px' : '0.4px',
                          borderColor: isSelected ? '#000000' : '#E5E7EB',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        }}
                      >
                        <span className="text-sm leading-none">{cat.icon}</span>
                        <span className="text-xs font-semibold whitespace-nowrap">{cat.title}</span>
                      </button>
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
                <div className="grid grid-cols-2 gap-3">
                  {(listingsBySubcategory[selectedSubcategory] ?? []).map((listing, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div
                        className="rounded-xl bg-white transition-all duration-200 cursor-pointer overflow-hidden relative aspect-square"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        }}
                      >
                        <img 
                          src={listing.image}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-gray-600 leading-tight">
                          {listing.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </MobilePage>
      </div>

      {/* Desktop Layout */}
    <div className="hidden lg:flex bg-white overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Section 1: Left Sidebar - Matches My Life/Chat */}
      <div className="w-[380px] xl:w-[420px] bg-white border-r border-gray-200 flex flex-col relative">
        {/* Title Section with Back Button */}
        <div className="p-6 relative" style={{ paddingTop: '28px' }}>
          {/* Back Button - Top Left */}
          <button
            onClick={() => router.push('/explore')}
            className="absolute left-6 top-6 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:-translate-y-[1px] transition-all duration-200 focus:outline-none"
            style={{
              top: '28px',
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

          {/* Centered Title */}
          <h1 className="text-gray-900 text-center font-semibold" style={{ fontSize: '26px' }}>For You</h1>
        </div>

        {/* Subcategory List - Vertically Centered */}
        <div className="flex-1 flex items-start justify-center px-4" style={{ marginTop: '64px' }}>
          <div className="flex flex-col space-y-3 w-full">
            {subcategories.map((subcat) => {
            const isSelected = selectedSubcategory === subcat.title;
            return (
              <div key={subcat.title} className="relative">
                <button
                  onClick={() => setSelectedSubcategory(subcat.title)}
                  className="w-full rounded-xl bg-white flex items-center gap-3 px-4 py-4 transition-all duration-200 focus:outline-none group"
                  style={{
                    minHeight: '72px',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
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
                  <div className="leading-none" style={{ fontSize: '20px' }}>
                    {subcat.icon}
                  </div>
                  
                  <span className="text-gray-900 font-semibold" style={{ fontSize: '16px' }}>
                    {subcat.title}
                  </span>
                </button>
                
                {/* Selected indicator bar - vertical black line (touches sidebar edge) */}
                {isSelected && (
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
          </div>
        </div>
      </div>

      {/* Section 2: Main Content (Scrollable) */}
      <div className="flex-1 relative h-full" style={{ overflow: 'hidden' }}>
        {/* Fixed Filter Bar with O/B Effect - Full frost at top, gradual from mid-filter down */}
        <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
          {/* Opacity gradient - Full at top, fades from 60px to 220px */}
          <div className="absolute top-0 left-0 right-0" style={{
            height: '220px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.35) 100px, rgba(255,255,255,0.2) 140px, rgba(255,255,255,0.1) 180px, rgba(255,255,255,0) 220px)'
          }} />
          {/* Full blur at top (0-60px) - maintains frosting */}
          <div className="absolute top-0 left-0 right-0" style={{ height: '60px', backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)' }} />
          {/* Gradual blur layers from 60px to 220px */}
          <div className="absolute left-0 right-0" style={{ top: '60px', height: '40px', backdropFilter: 'blur(0.75px)', WebkitBackdropFilter: 'blur(0.75px)' }} />
          <div className="absolute left-0 right-0" style={{ top: '100px', height: '40px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
          <div className="absolute left-0 right-0" style={{ top: '140px', height: '40px', backdropFilter: 'blur(0.25px)', WebkitBackdropFilter: 'blur(0.25px)' }} />
          <div className="absolute left-0 right-0" style={{ top: '180px', height: '40px', backdropFilter: 'blur(0.1px)', WebkitBackdropFilter: 'blur(0.1px)' }} />
        </div>

        {/* Filter Bar - Fixed Position */}
        <div className="absolute top-0 left-0 right-0 z-30 px-8" style={{ paddingTop: '28px', paddingBottom: '12px', pointerEvents: 'none' }}>
          <div className="flex items-center justify-center gap-3" style={{ maxWidth: showMap ? '580px' : '1020px', margin: '0 auto', pointerEvents: 'auto' }}>
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
                  maxWidth: 'fit-content',
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
          </div>

        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto scrollbar-hide px-8" style={{ paddingTop: '140px', paddingBottom: '32px' }}>
            {/* Listing Cards Grid - center when fewer than 4 items */}
            {(() => {
              const items = listingsBySubcategory[selectedSubcategory] ?? [];
              const desiredCols = showMap ? 2 : 4;
              const cols = Math.min(desiredCols, Math.max(1, items.length));
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
                    paddingLeft: '0',
                    paddingRight: '0'
                  }}
                >
                  {items.map((listing, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                {/* Card Image */}
                <div
                  className="rounded-xl bg-white transition-all duration-200 hover:-translate-y-[1px] cursor-pointer overflow-hidden relative"
                  style={{
                    width: '213px',
                    height: '213px',
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
                  <img 
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Title and Date */}
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                    {listing.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-tight">
                    {listing.date}
                  </p>
                </div>
              </div>
                  ))}
                </div>
              );
            })()}
        </div>
      </div>

      {/* Section 3: Map Panel - No title, map fills with equal padding */}
      {showMap && (
        <div className="w-[380px] xl:w-[420px] bg-white border-l border-gray-200 flex flex-col relative p-6">
          {/* Map Content - Fills entire space with equal padding */}
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
      )}
    </div>
    </>
  );
}
