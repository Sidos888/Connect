"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { SearchIcon } from "@/components/icons";

export default function ExplorePage() {
  const { context } = useAppStore();
  const [hasError, setHasError] = useState(false);

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
      className="h-screen bg-white" 
      style={{ 
        height: '100dvh'
      }}
    >
      <div 
        className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 flex flex-col"
        style={{ height: '100%', minHeight: '0' }}
      >
        {/* Desktop title with right-aligned search icon */}
        <div className="hidden lg:block mb-4 lg:mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
            <button
              aria-label="Search"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-white hover:-translate-y-[1px] transition-all duration-200 focus:outline-none focus-visible:ring-2 ring-brand"
              style={{
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
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
        </div>

        {/* Location Filter - matches ProfileStrip styling */}
        <div className="mb-4 lg:mb-6">
          <div className="max-w-lg mx-auto lg:max-w-xl">
            <div 
              className="rounded-2xl bg-white px-5 py-4 transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
              style={{
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
        </div>

        {/* Categories Section - 2x6 Grid Layout matching Menu */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mt-4 lg:mt-6 pb-6">
            {categories.map((category) => {
              return (
                <button
                  key={category.title}
                  className={`
                    rounded-2xl bg-white
                    hover:bg-white hover:-translate-y-[1px] transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1
                    w-full h-28 lg:aspect-square lg:h-auto
                    ${category.subtitle ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    if (!category.subtitle) {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  disabled={!!category.subtitle}
                >
                  <div className="flex flex-col items-center justify-center h-full p-4 gap-6">
                    <div className="text-4xl sm:text-4xl lg:text-5xl">
                      {category.icon}
                    </div>
                    <span className="text-sm sm:text-sm lg:text-sm font-medium text-neutral-900 text-center leading-tight">
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
