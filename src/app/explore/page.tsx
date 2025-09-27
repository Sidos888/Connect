"use client";
import { useState, useEffect } from "react";
import MobileTitle from "@/components/MobileTitle";
import { useAppStore } from "@/lib/store";
import { SearchIcon } from "@/components/icons";

export default function ExplorePage() {
  const { context, isHydrated } = useAppStore();
  const [hasError, setHasError] = useState(false);
  
  // Prevent body scrolling on mobile for fixed layout
  useEffect(() => {
    // Prevent scrolling on mobile
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      // Restore scrolling when leaving page
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Loading state while store hydrates
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

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
  
  const personalCategories: { title: string; icon: string; subtitle?: string }[] = [
    { title: "For You", icon: "✨" },
    { title: "Side Quest", icon: "🎲" },
    { title: "Events & Experiences", icon: "🎉" },
    { title: "Food & Drink", icon: "🍕" },
    { title: "Shops & Markets", icon: "🛍️" },
    { title: "Fitness & Wellness", icon: "🧘" },
    { title: "Travel Getaways", icon: "🏝️" },
    { title: "Services", icon: "🧰" },
    { title: "Workshops & Classes", icon: "🎨" },
    { title: "Nature & Outdoors", icon: "🏞️" },
    { title: "Clubs & Communities", icon: "👬" },
    { title: "Open Invitations", icon: "📪" },
  ];

  const businessCategories: { title: string; icon: string; subtitle?: string }[] = [
    { title: "Personal Help", icon: "🧑" },
    { title: "Creative & Skilled Pros", icon: "🎨" },
    { title: "Local Services", icon: "🔧" },
    { title: "Venue Hire", icon: "🏠" },
    { title: "Food & Drink", icon: "🍽️" },
    { title: "Rentals", icon: "🎪" },
    { title: "Open Invitations", icon: "📨", subtitle: "Coming Soon" },
  ];

  const categories = context.type === "business" ? businessCategories : personalCategories;

  try {
    return (
    <div 
      className="h-screen bg-white overflow-hidden" 
      style={{ 
        height: '100dvh',
        touchAction: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <MobileTitle 
        title="Explore" 
        action={
          <button
            className="p-2 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 ring-brand"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5 text-black" />
          </button>
        }
      />
      
      <div 
        className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[120px] lg:pt-6 flex flex-col"
        style={{ height: '100%', minHeight: '0' }}
      >
        {/* Desktop title with right-aligned search icon */}
        <div className="hidden lg:block mb-4 lg:mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
            <button
              aria-label="Search"
              className="w-10 h-10 rounded-full border border-neutral-200 bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 ring-brand"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
        </div>

        {/* Location Filter - matches ProfileStrip styling */}
        <div className="mb-4 lg:mb-6">
          <div className="max-w-lg mx-auto lg:max-w-xl">
            <div className="rounded-2xl border border-neutral-200 shadow-sm bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📍</span>
                  <span className="text-base font-semibold text-neutral-900">Adelaide</span>
                </div>
                <span className="text-sm text-neutral-500">Anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section - Mobile optimized layout */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <h2 className="hidden sm:block text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 text-center">Explore by category</h2>
          
          <div className="flex-1 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 content-start">
            {categories.map((category, index) => {
              // For business categories, center the last item (Open Invitations) if it's alone
              const isLastItem = index === categories.length - 1;
              const isBusinessMode = context.type === "business";
              const shouldCenter = isBusinessMode && isLastItem && categories.length % 3 === 1;
              
              return (
                <button
                  key={category.title}
                  className={`
                    rounded-2xl border border-neutral-200 bg-white shadow-sm
                    hover:shadow-md transition-shadow duration-200
                    focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1
                    aspect-square w-full
                    ${category.subtitle ? 'opacity-60 cursor-not-allowed' : ''}
                    ${shouldCenter ? 'col-span-3 mx-auto max-w-xs' : ''}
                  `}
                  disabled={!!category.subtitle}
                >
                  <div className="flex flex-col items-center justify-center h-full p-3 sm:p-4 lg:p-6 gap-1 sm:gap-2 lg:gap-3">
                    <div className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl">
                      {category.icon}
                    </div>
                    <span className="text-xs sm:text-xs lg:text-sm font-medium text-neutral-900 text-center leading-tight">
                      {category.title}
                    </span>
                    {category.subtitle && (
                      <span className="text-xs text-gray-500 text-center">
                        {category.subtitle}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
    );
  } catch (error) {
    console.error('Error rendering explore page:', error);
    setHasError(true);
    return null;
  }
}
