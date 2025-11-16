"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { SearchIcon } from "@/components/icons";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import Avatar from "@/components/Avatar";
import ProfileSwitcherSheet from "@/components/profile/ProfileSwitcherSheet";
import { Search } from "lucide-react";

export default function ExplorePage() {
  const router = useRouter();
  const { context, personalProfile } = useAppStore();
  const { account } = useAuth();
  const currentBusiness = useCurrentBusiness();
  const [hasError, setHasError] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Life');

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

  // Get current account info
  const currentAccount = context.type === "business" && currentBusiness 
    ? { name: currentBusiness.name, avatarUrl: currentBusiness.logoUrl }
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
    <>
      {/* Mobile Layout with Design System */}
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Explore"
            backButton={true}
            customBackButton={
              <button
                onClick={() => setShowAccountSwitcher(true)}
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
                icon: <Search size={20} className="text-gray-900" />,
                onClick: () => console.log('Search clicked'),
                label: "Search"
              }
            ]}
          />

          <div className="flex-1 overflow-y-auto scrollbar-hide" style={{
            paddingTop: 'var(--saved-content-padding-top, 140px)',
            paddingBottom: '100px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {/* Location Filter Card */}
            <div className="mb-6 flex justify-center" style={{ paddingLeft: '56px', paddingRight: '56px' }}>
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

            {/* Feature Cards - For You & Side Quest */}
            <div className="grid grid-cols-2 gap-4 mb-6 px-4 lg:px-8">
              <button
                onClick={() => router.push('/for-you-listings')}
                className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                style={{
                  minHeight: '100px',
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
                <div className="flex flex-col items-start h-full p-4 gap-2">
                  <div className="text-4xl leading-none">✨</div>
                  <span className="text-base font-semibold text-neutral-900 text-left leading-tight">For You</span>
                </div>
              </button>

              <button
              aria-disabled={true}
                className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                style={{
                  minHeight: '100px',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                pointerEvents: 'none', // temporarily non-clickable on mobile
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

            {/* Category Filters - Single tab card with underline for selected section */}
            <div className="mb-4 px-4 lg:px-8">
              <div 
                className="rounded-xl bg-white px-4 py-2 flex justify-between items-center relative"
      style={{ 
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  gap: '16px'
                }}
              >
                {['Life', 'Work', 'Services', 'Places', 'Travel', 'Rental'].map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="relative text-center transition-all duration-200 focus:outline-none"
                    >
                      <span className="text-gray-900 font-semibold text-sm leading-none">
                        {cat}
                      </span>
                      {isSelected && (
                        <div
                          className="absolute h-[3px] bg-gray-900"
                          style={{
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60%',
                            borderTopLeftRadius: '2px',
                            borderTopRightRadius: '2px'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Content */}
            {selectedCategory === 'Life' && (
              <div className="px-4 lg:px-8">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: "Events", icon: "🎉" },
                    { title: "Workshops", icon: "🎨" },
                    { title: "Communities", icon: "🤝" },
                    { title: "Wellness", icon: "🧘" },
                    { title: "Food or Drink", icon: "🍽️" },
                    { title: "Outdoors", icon: "🏞️" },
                    { title: "Social", icon: "🕺" },
                    { title: "Purpose", icon: "🌍" },
                  ].map((category) => (
                    <button
                      key={category.title}
                      className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                      style={{
                        minHeight: '80px',
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
                      <div className="flex flex-col items-start h-full p-3 gap-1.5">
                        <div className="text-3xl leading-none">{category.icon}</div>
                        <span className="text-sm font-semibold text-neutral-900 text-left leading-tight">
                          {category.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory === 'Work' && (
              <div className="px-4 lg:px-8">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: "Networking", icon: "🤝" },
                    { title: "Coworking", icon: "🧑‍💻" },
                    { title: "Workshops", icon: "🧠" },
                    { title: "Project & Gigs", icon: "🛠️" },
                    { title: "Teams & Startups", icon: "🚀" },
                    { title: "Careers", icon: "💼" },
                  ].map((category) => (
                    <button
                      key={category.title}
                      className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                      style={{
                        minHeight: '80px',
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
                      <div className="flex flex-col items-start h-full p-3 gap-1.5">
                        <div className="text-3xl leading-none">{category.icon}</div>
                        <span className="text-sm font-semibold text-neutral-900 text-left leading-tight">
                          {category.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory === 'Services' && (
              <div className="px-4 lg:px-8">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: "Home & Maintenance", icon: "🔧" },
                    { title: "Health & Beauty", icon: "😇" },
                    { title: "Tutoring & Coaching", icon: "📚" },
                    { title: "Creative Services", icon: "🎨" },
                    { title: "Event Services", icon: "🎪" },
                    { title: "Tech & Digital", icon: "💻" },
                    { title: "Transport & Logistics", icon: "🚚" },
                    { title: "Pets & Care", icon: "🐾" },
                  ].map((category) => (
                    <button
                      key={category.title}
                      className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                      style={{
                        minHeight: '80px',
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
                      <div className="flex flex-col items-start h-full p-3 gap-1.5">
                        <div className="text-3xl leading-none">{category.icon}</div>
                        <span className="text-sm font-semibold text-neutral-900 text-left leading-tight">
                          {category.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory === 'Places' && (
              <div className="px-4 lg:px-8">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: "Food & Drink", icon: "☕" },
                    { title: "Fitness & Wellness", icon: "🏋️" },
                    { title: "Shops & Markets", icon: "🛍️" },
                    { title: "Studios & Creative Spaces", icon: "🎭" },
                    { title: "Venues & Function Spaces", icon: "🏛️" },
                    { title: "Clubs & Communities", icon: "🎯" },
                    { title: "Nature & Outdoors", icon: "🌿" },
                    { title: "Accommodation & Retreats", icon: "🏡" },
                  ].map((category) => (
                    <button
                      key={category.title}
                      className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                      style={{
                        minHeight: '80px',
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
                      <div className="flex flex-col items-start h-full p-3 gap-1.5">
                        <div className="text-3xl leading-none">{category.icon}</div>
                        <span className="text-sm font-semibold text-neutral-900 text-left leading-tight">
                          {category.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory === 'Travel' && (
              <div className="px-4 lg:px-8">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: "Weekend Getaways", icon: "🏝️" },
                    { title: "Road Trips & Adventures", icon: "🚗" },
                    { title: "Retreats & Wellness", icon: "🧘" },
                    { title: "Group Trips & Tours", icon: "🚌" },
                    { title: "Nature & Hiking", icon: "🏞️" },
                    { title: "Cultural & Events Travel", icon: "🎭" },
                    { title: "Staycations", icon: "🏡" },
                  ].map((category) => (
                    <button
                      key={category.title}
                      className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                      style={{
                        minHeight: '80px',
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
                      <div className="flex flex-col items-start h-full p-3 gap-1.5">
                        <div className="text-3xl leading-none">{category.icon}</div>
                        <span className="text-sm font-semibold text-neutral-900 text-left leading-tight">
                          {category.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory === 'Rental' && (
              <div className="px-4 lg:px-8">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: "Vehicles", icon: "🚗" },
                    { title: "Gear", icon: "🎒" },
                    { title: "Spaces", icon: "🏠" },
                    { title: "Event Hire", icon: "🎪" },
                    { title: "Home Items", icon: "🛋️" },
                    { title: "Fashion", icon: "👗" },
                  ].map((category) => (
                    <button
                      key={category.title}
                      className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative"
                      style={{
                        minHeight: '80px',
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
                      <div className="flex flex-col items-start h-full p-3 gap-1.5">
                        <div className="text-3xl leading-none">{category.icon}</div>
                        <span className="text-sm font-semibold text-neutral-900 text-left leading-tight">
                          {category.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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

      {/* Desktop Layout - New Design */}
      <div className="hidden lg:block h-screen bg-white overflow-hidden" style={{ maxHeight: '100vh' }}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Title and Search Row */}
          <div className="flex items-center justify-between p-6">
            <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
            
            {/* Search Button */}
            <button
              aria-label="Search"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-white hover:-translate-y-[1px] transition-all duration-200 focus:outline-none focus-visible:ring-2 ring-brand"
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
              <Search size={18} className="text-gray-900" />
            </button>
        </div>

          {/* Content Container - Centered with max-width */}
          <div className="mx-auto px-6" style={{ maxWidth: '1500px', width: '100%' }}>
          
          {/* Location/Time Filter - Centered and Larger */}
          <div className="mb-16 flex justify-center">
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
          </div>

          {/* All Cards Container */}
          <div>
            {/* Feature Cards - For You & Side Quest */}
            <div className="grid grid-cols-2 gap-6" style={{ maxWidth: '344px', margin: '0 auto 64px' }}>
              <button
                onClick={() => router.push('/for-you-listings')}
                className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative aspect-square"
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
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="text-6xl leading-none">✨</div>
                  <span className="text-lg font-semibold text-neutral-900">For You</span>
                </div>
              </button>

              <button
                aria-disabled={true}
                className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative aspect-square"
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
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="text-6xl leading-none">🎲</div>
                  <span className="text-lg font-semibold text-neutral-900">Side Quest</span>
                </div>
              </button>

        </div>

            {/* Category Navigation Tabs */}
            <div style={{ maxWidth: '700px', margin: '0 auto 24px' }}>
              <div 
                className="rounded-xl bg-white px-4 py-2 flex justify-between items-center relative"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  gap: '16px'
                }}
              >
                {['Life', 'Work', 'Services', 'Places', 'Travel', 'Rental'].map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="relative text-center transition-all duration-200 focus:outline-none hover:scale-105"
                      style={{
                        color: isSelected ? '#1B1B1B' : '#6B7280'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = '#1B1B1B';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = '#6B7280';
                        }
                      }}
                    >
                      <span className={`leading-none ${isSelected ? 'font-bold text-base' : 'font-semibold text-base'}`}>
                        {cat}
                      </span>
                      {isSelected && (
                        <div
                          className="absolute h-[3px] bg-gray-900"
                          style={{
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60%',
                            borderTopLeftRadius: '2px',
                            borderTopRightRadius: '2px'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Content Grid - Single row of cards */}
            {selectedCategory === 'Life' && (
              <div className="flex gap-6 justify-center">
                {[
                  { title: "Events", icon: "🎉" },
                  { title: "Workshops", icon: "🎨" },
                  { title: "Communities", icon: "🤝" },
                  { title: "Wellness", icon: "🧘" },
                  { title: "Food or Drink", icon: "🍽️" },
                  { title: "Outdoors", icon: "🏞️" },
                  { title: "Social", icon: "🕺" },
                  { title: "Purpose", icon: "🌍" },
                ].map((category) => (
                  <button
                    key={category.title}
                    className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative flex-shrink-0"
                    style={{
                      width: '160px',
                      height: '160px',
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
                      <div className="text-6xl leading-none">{category.icon}</div>
                      <span className="text-lg font-semibold text-neutral-900 text-center leading-tight px-2">
                        {category.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCategory === 'Work' && (
              <div className="flex gap-6 justify-center">
                {[
                  { title: "Networking", icon: "🤝" },
                  { title: "Coworking", icon: "🧑‍💻" },
                  { title: "Workshops", icon: "🧠" },
                  { title: "Project & Gigs", icon: "🛠️" },
                  { title: "Teams & Startups", icon: "🚀" },
                  { title: "Careers", icon: "💼" },
                ].map((category) => (
                  <button
                    key={category.title}
                    className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative flex-shrink-0"
                    style={{
                      width: '160px',
                      height: '160px',
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
                      <div className="text-6xl leading-none">{category.icon}</div>
                      <span className="text-lg font-semibold text-neutral-900 text-center leading-tight px-2">
                        {category.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCategory === 'Services' && (
              <div className="flex gap-6 justify-center">
                {[
                  { title: "Home & Maintenance", icon: "🔧" },
                  { title: "Health & Beauty", icon: "😇" },
                  { title: "Tutoring & Coaching", icon: "📚" },
                  { title: "Creative Services", icon: "🎨" },
                  { title: "Event Services", icon: "🎪" },
                  { title: "Tech & Digital", icon: "💻" },
                  { title: "Transport & Logistics", icon: "🚚" },
                  { title: "Pets & Care", icon: "🐾" },
                ].map((category) => (
                  <button
                    key={category.title}
                    className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative flex-shrink-0"
                    style={{
                      width: '160px',
                      height: '160px',
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
                      <div className="text-6xl leading-none">{category.icon}</div>
                      <span className="text-lg font-semibold text-neutral-900 text-center leading-tight px-2">
                        {category.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCategory === 'Places' && (
              <div className="flex gap-6 justify-center">
                {[
                  { title: "Food & Drink", icon: "☕" },
                  { title: "Fitness & Wellness", icon: "🏋️" },
                  { title: "Shops & Markets", icon: "🛍️" },
                  { title: "Studios & Creative Spaces", icon: "🎭" },
                  { title: "Venues & Function Spaces", icon: "🏛️" },
                  { title: "Clubs & Communities", icon: "🎯" },
                  { title: "Nature & Outdoors", icon: "🌿" },
                  { title: "Accommodation & Retreats", icon: "🏡" },
                ].map((category) => (
                  <button
                    key={category.title}
                    className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative flex-shrink-0"
                    style={{
                      width: '160px',
                      height: '160px',
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
                      <div className="text-6xl leading-none">{category.icon}</div>
                      <span className="text-lg font-semibold text-neutral-900 text-center leading-tight px-2">
                      {category.title}
                    </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCategory === 'Travel' && (
              <div className="flex gap-6 justify-center">
                {[
                  { title: "Weekend Getaways", icon: "🏝️" },
                  { title: "Road Trips & Adventures", icon: "🚗" },
                  { title: "Retreats & Wellness", icon: "🧘" },
                  { title: "Group Trips & Tours", icon: "🚌" },
                  { title: "Nature & Hiking", icon: "🏞️" },
                  { title: "Cultural & Events Travel", icon: "🎭" },
                  { title: "Staycations", icon: "🏡" },
                ].map((category) => (
                  <button
                    key={category.title}
                    className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative flex-shrink-0"
                    style={{
                      width: '160px',
                      height: '160px',
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
                      <div className="text-6xl leading-none">{category.icon}</div>
                      <span className="text-lg font-semibold text-neutral-900 text-center leading-tight px-2">
                        {category.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCategory === 'Rental' && (
              <div className="flex gap-6 justify-center">
                {[
                  { title: "Vehicles", icon: "🚗" },
                  { title: "Gear", icon: "🎒" },
                  { title: "Spaces", icon: "🏠" },
                  { title: "Event Hire", icon: "🎪" },
                  { title: "Home Items", icon: "🛋️" },
                  { title: "Fashion", icon: "👗" },
                ].map((category) => (
                  <button
                    key={category.title}
                    className="rounded-2xl bg-white transition-all duration-200 focus:outline-none hover:-translate-y-[1px] relative flex-shrink-0"
                    style={{
                      width: '160px',
                      height: '160px',
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
                      <div className="text-6xl leading-none">{category.icon}</div>
                      <span className="text-lg font-semibold text-neutral-900 text-center leading-tight px-2">
                        {category.title}
                      </span>
                  </div>
                </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom spacer */}
          <div style={{ height: '96px' }} />
          </div>
        </div>
      </div>

      {/* Profile Switcher Sheet */}
      <ProfileSwitcherSheet 
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />
    </>
    );
  } catch (error) {
    console.error('Error rendering explore page:', error);
    setHasError(true);
    return null;
  }
}
