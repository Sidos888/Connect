"use client";
import MobileTitle from "@/components/MobileTitle";
import { useAppStore } from "@/lib/store";

export default function Page() {
  const { context } = useAppStore();
  
  const personalCategories: { title: string; icon: string; subtitle?: string }[] = [
    { title: "For You", icon: "✨" },
    { title: "Events & Experiences", icon: "🎉" },
    { title: "Shops & Markets", icon: "🛍️" },
    { title: "Fitness & Wellness", icon: "🧘" },
    { title: "Travel Getaways", icon: "🏝️" },
    { title: "Services", icon: "🧰" },
    { title: "Side Quest", icon: "🎲" },
    { title: "Food & Drink", icon: "🍕" },
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

  return (
    <div className="min-h-screen bg-white">
      <MobileTitle title="Explore" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hidden title for desktop, shown via TopNavigation */}
        <div className="hidden lg:block mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
        </div>

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
          <h2 className="text-xl lg:text-3xl font-bold text-gray-900 mb-6 lg:mb-8 text-center">Explore by category</h2>
          
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
}


