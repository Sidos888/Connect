"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, Map, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";

export default function SideQuestListingsPage() {
  const router = useRouter();
  const [selectedSubcategory, setSelectedSubcategory] = useState('Trending Near You');
  const [showMap, setShowMap] = useState(false);
  const [sheetState, setSheetState] = useState<'list' | 'peek'>('list');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [listingsTouchStart, setListingsTouchStart] = useState<number | null>(null);

  const subcategories = [
    { title: "Trending Near You", icon: "🔥" },
    { title: "This Weekend", icon: "📅" },
    { title: "Because You Liked", icon: "🎯" },
    { title: "Hidden Gems", icon: "💎" },
    { title: "New This Week", icon: "✨" },
    { title: "Side Quests", icon: "🎲" },
  ];

  const fakeListings = [
    { title: "Sunday Markets at the Bay", date: "Nov 10, 10:00 AM", image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&h=400&fit=crop" },
    { title: "Sunrise Hike & Coffee", date: "Nov 11, 6:30 AM", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop" },
    { title: "Live Jazz Night", date: "Nov 12, 8:00 PM", image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop" },
    { title: "Wine Tasting Tour", date: "Nov 13, 2:00 PM", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop" },
    { title: "Beach Volleyball Pickup", date: "Nov 14, 4:00 PM", image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=400&fit=crop" },
    { title: "Food Truck Friday", date: "Nov 15, 6:00 PM", image: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400&h=400&fit=crop" },
    { title: "Yoga in the Park", date: "Nov 16, 7:00 AM", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop" },
    { title: "Art Gallery Opening", date: "Nov 17, 6:00 PM", image: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=400&fit=crop" },
    { title: "Cooking Class: Italian", date: "Nov 18, 5:00 PM", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop" },
    { title: "Comedy Show Night", date: "Nov 19, 9:00 PM", image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&h=400&fit=crop" },
    { title: "Morning Cycling Group", date: "Nov 20, 7:00 AM", image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400&h=400&fit=crop" },
    { title: "Vintage Market Pop-Up", date: "Nov 21, 11:00 AM", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop" },
    { title: "Sunset Boat Cruise", date: "Nov 22, 5:30 PM", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop" },
    { title: "Photography Walk", date: "Nov 23, 3:00 PM", image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=400&fit=crop" },
    { title: "Book Club Meetup", date: "Nov 24, 2:00 PM", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop" },
    { title: "Pottery Workshop", date: "Nov 25, 10:00 AM", image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop" },
  ];

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

  // Sheet height calculations - Two states only
  const getSheetHeight = () => {
    if (typeof window === 'undefined') return '70vh';
    const vh = window.innerHeight;
    
    switch (sheetState) {
      case 'list': // Scrollable listings view
        return `${vh - 237}px`; // Starts below filter/categories section
      case 'peek': // Minimized with 80% map visible
        return '140px'; // Just count + 1 row peek
      default:
        return `${vh - 237}px`;
    }
  };

  // Touch handlers for drag
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isDragging) return;
    
    const currentTouch = e.touches[0].clientY;
    const diff = touchStart - currentTouch;
    
    // Detect swipe direction and change state
    if (Math.abs(diff) > 50) { // 50px threshold
      if (diff > 0) { // Swipe up
        if (sheetState === 'peek') setSheetState('list');
      }
      // Swipe down handled by handleSheetTouchMove for better control
      setIsDragging(false);
      setTouchStart(null);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    
    // Prevent scrolling down past 0 (lock at default position)
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
    const diff = currentY - listingsTouchStart; // Positive = down
    
    // Swipe down at default position → go to map
    if (diff > 30) {
      setSheetState('peek');
      setListingsTouchStart(null);
    }
  };

  return (
    <>
      {/* Mobile Layout with Bottom Sheet */}
      <div className="lg:hidden side-quest-listings-page" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        {/* Override all o/b effects from PageHeader - allow transparent top component */}
        <style jsx global>{`
          .side-quest-listings-page [style*="backdrop-filter"],
          .side-quest-listings-page [style*="backdropFilter"],
          .side-quest-listings-page [style*="WebkitBackdropFilter"] {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
        `}</style>
        
        <MobilePage>
          <PageHeader
            title="Side Quest"
            backButton={true}
            onBack={() => router.push('/explore')}
            actions={[
              {
                icon: <Search size={20} className="text-gray-900" />,
                onClick: () => {/* Search functionality */},
                label: "Search"
              }
            ]}
          />

          {/* Map Background - Visible only in peek state */}
          <div 
            className="absolute left-0 right-0 bottom-0 bg-gray-100"
            style={{
              top: '237px', // Below filter/categories section with equal spacing
              zIndex: 5,
              opacity: sheetState === 'peek' ? 1 : 0,
              transition: 'opacity 300ms ease-out'
            }}
          >
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=138.5686%2C-34.9485%2C138.6286%2C-34.9085&layer=mapnik"
              className="w-full h-full border-0"
              title="Adelaide Map"
            />
          </div>


          {/* Fixed Filter & Category Header - Transparent background */}
          <div className="absolute left-0 right-0 z-20" style={{ 
            top: '122px', // 110px (action buttons) + 12px gap (matches spacing below)
            height: '91px', // Filter (43px) + 12px gap + Categories (36px) - stops before margin
            pointerEvents: 'auto',
            background: 'transparent',
            overflow: 'visible' // Allow shadows to show
          }}>
              {/* Filter Card - Same height as Explore */}
              <div className="mb-3" style={{ paddingLeft: '56px', paddingRight: '56px' }}>
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

              {/* Category Filter Cards with black border selection */}
              <div className="mb-3 px-4">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {categories.map((cat) => {
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
                </div>
              </div>
          </div>

          {/* Scrollable Container - Entire card scrolls up */}
          <div 
            className="absolute left-0 right-0 bottom-0 overflow-y-auto scrollbar-hide"
            style={{
              top: '225px', // Start below filter/categories (122px + 91px + 12px gap)
              zIndex: 10
            }}
          >
            {/* Bottom Sheet Card - Entire card moves with scroll */}
            <div 
              className="bg-white"
              style={{
                minHeight: '100%',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                borderBottom: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              {/* Drag Handle - At top of card */}
              <div className="flex justify-center pt-3">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>
              
              {/* Listing Count - Centered between top and first card */}
              <div className="flex justify-center py-6">
                <p className="text-sm font-semibold text-gray-900">{fakeListings.length} Listings</p>
              </div>
              
              {/* Listings Grid - px-4 padding on sides */}
              <div className="px-4 pb-8">
                <div className="grid grid-cols-2 gap-3">
                  {fakeListings.map((listing, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      {/* Card Image */}
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
        <div className="p-6 border-b border-gray-200 relative">
          {/* Back Button - Top Left */}
          <button
            onClick={() => router.push('/explore')}
            className="absolute left-6 top-6 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:-translate-y-[1px] transition-all duration-200 focus:outline-none"
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

          {/* Centered Title */}
          <h1 className="text-xl font-semibold text-gray-900 text-center">Side Quest</h1>
        </div>

        {/* Subcategory List - Vertically Centered */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col space-y-2 w-full">
            {subcategories.map((subcat) => {
            const isSelected = selectedSubcategory === subcat.title;
            return (
              <div key={subcat.title} className="relative">
                <button
                  onClick={() => setSelectedSubcategory(subcat.title)}
                  className="w-full rounded-lg bg-white flex items-center gap-4 px-4 py-4 transition-all duration-200 focus:outline-none group hover:scale-[1.02] hover:-translate-y-[1px]"
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
                  <div className="text-xl leading-none">
                    {subcat.icon}
                  </div>
                  
                  <span className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>
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
            {/* Listing Cards Grid - 4 cols or 2 cols when map shown */}
            <div 
              className={`grid gap-4 ${showMap ? 'grid-cols-2' : 'grid-cols-4'}`} 
              style={{ 
                maxWidth: showMap ? '460px' : '900px',
                margin: '0 auto',
                paddingLeft: '0',
                paddingRight: '0'
              }}
            >
            {fakeListings.map((listing, i) => (
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

