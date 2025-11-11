"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import { Search } from "lucide-react";

export default function ForYouPage() {
  const router = useRouter();

  // Hide bottom nav on mount
  useEffect(() => {
    const hideBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
        (bottomNav as HTMLElement).style.visibility = 'hidden';
        (bottomNav as HTMLElement).style.opacity = '0';
        (bottomNav as HTMLElement).style.transform = 'translateY(100%)';
      }
      document.body.style.paddingBottom = '0';
    };

    const showBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
        (bottomNav as HTMLElement).style.visibility = '';
        (bottomNav as HTMLElement).style.opacity = '';
        (bottomNav as HTMLElement).style.transform = '';
      }
      document.body.style.paddingBottom = '';
    };

    hideBottomNav();

    return () => {
      showBottomNav();
    };
  }, []);

  // Simplified titles - short and punchy for compact cards
  const categories = [
    { title: "For You", icon: "✨" },
    { title: "Side Quest", icon: "🎲" },
    { title: "Events", icon: "🎉" },
    { title: "Experiences", icon: "🎭" },
    { title: "Food", icon: "🍕" },
    { title: "Drinks", icon: "🍹" },
    { title: "Shopping", icon: "🛍️" },
    { title: "Markets", icon: "🧺" },
    { title: "Fitness", icon: "🧘" },
    { title: "Wellness", icon: "🧖" },
    { title: "Travel", icon: "🏝️" },
    { title: "Getaways", icon: "✈️" },
    { title: "Services", icon: "🧰" },
    { title: "Repairs", icon: "🔧" },
    { title: "Workshops", icon: "🎨" },
    { title: "Classes", icon: "📚" },
    { title: "Nature", icon: "🏞️" },
    { title: "Outdoors", icon: "🏕️" },
    { title: "Clubs", icon: "👬" },
    { title: "Communities", icon: "🤝" },
    { title: "Invitations", icon: "📪" },
    { title: "Meetups", icon: "☕" },
  ];

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader 
          title="Explore"
          onBack={() => router.back()}
          actions={[
            {
              icon: <Search size={20} className="text-gray-900" />,
              onClick: () => console.log('Search clicked'),
              label: "Search"
            }
          ]}
        />

        <div 
          className="flex-1 px-4 overflow-y-auto scrollbar-hide" 
          style={{
            paddingTop: 'var(--saved-content-padding-top, 140px)',
            paddingBottom: '32px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Categories Grid - Left-Aligned Facebook Style */}
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => {
              return (
                <button
                  key={category.title}
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
                  {/* Left-aligned layout like Facebook */}
                  <div className="flex flex-col items-start h-full p-4 gap-2">
                    {/* Icon - left aligned, larger for impact */}
                    <div className="text-4xl leading-none">
                      {category.icon}
                    </div>
                    {/* Text - left aligned, directly below icon */}
                    <span className="text-base font-semibold text-neutral-900 text-left leading-tight">
                      {category.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Blur */}
        <div className="fixed left-0 right-0 z-20 pointer-events-none" style={{ bottom: 'max(env(safe-area-inset-bottom), 60px)' }}>
          <div className="absolute left-0 right-0" style={{ 
            bottom: '0', 
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
  );
}
