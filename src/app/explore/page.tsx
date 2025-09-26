"use client";
import { useEffect, useState } from "react";
import MobileTitle from "@/components/MobileTitle";
import { useAppStore } from "@/lib/store";
import { SearchIcon } from "@/components/icons";

export default function ExplorePage() {
  const { context } = useAppStore();
  const [hasError, setHasError] = useState(false);
  
  // Hide scrollbar on mobile
  useEffect(() => {
    try {
      document.body.classList.add('no-scrollbar');
      document.documentElement.classList.add('no-scrollbar');
      return () => {
        document.body.classList.remove('no-scrollbar');
        document.documentElement.classList.remove('no-scrollbar');
      };
    } catch (error) {
      console.error('Error in explore page useEffect:', error);
      setHasError(true);
    }
  }, []);

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
    <div className="min-h-screen bg-white overflow-x-hidden no-scrollbar">
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 no-scrollbar pt-[120px] lg:pt-6">
        {/* Desktop title with right-aligned search icon */}
        <div className="hidden lg:block mb-8">
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

        {/* (Removed full-width search bar per spec; icon buttons above) */}

        {/* Simple Location Filter */}
        <div className="mb-6 lg:mb-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                <span className="text-base font-semibold text-neutral-900">Adelaide</span>
              </div>
              <span className="text-sm text-neutral-500">Anytime</span>
            </div>
          </div>
        </div>

        {/* Categories Section - Mobile 2x6 layout */}
        <div className="mb-6">
          <h2 className="hidden md:block text-xl lg:text-3xl font-bold text-gray-900 mb-6 lg:mb-8 text-center">Explore by category</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
            {categories.map((category, index) => {
              // For business categories, center the last item (Open Invitations) if it's alone
              const isLastItem = index === categories.length - 1;
              const isBusinessMode = context.type === "business";
              const shouldCenter = isBusinessMode && isLastItem && categories.length % 2 === 1;
              
              return (
                <button
                  key={category.title}
                  className={`
                    rounded-2xl border border-neutral-200 bg-white p-4 lg:p-6 shadow-sm
                    hover:shadow-md transition-shadow duration-200
                    focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1
                    h-28 lg:h-36 xl:h-40
                    ${category.subtitle ? 'opacity-60 cursor-not-allowed' : ''}
                    ${shouldCenter ? 'col-span-2 mx-auto max-w-xs' : ''}
                  `}
                  disabled={!!category.subtitle}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-2 lg:gap-3">
                    <div className="text-2xl lg:text-4xl xl:text-5xl">
                      {category.icon}
                    </div>
                    <span className="text-xs lg:text-sm font-medium text-neutral-900 text-center leading-tight">
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
