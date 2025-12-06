"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import Links from "@/components/links/Links";
import { Plus } from "lucide-react";

export default function LinksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const handleBack = () => {
    // If viewing another user's links, go back to their profile
    // Otherwise, go back to own profile
    if (userId) {
      router.back(); // Go back to the profile modal/page
    } else {
      router.replace('/menu?view=profile');
    }
  };

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Links"
          backButton
          onBack={handleBack}
          customActions={
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Plus button clicked, navigating to add link page');
                router.push('/links/add');
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Plus button touched, navigating to add link page');
                router.push('/links/add');
              }}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.96)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                cursor: 'pointer',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 10,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                border: 'none',
                padding: 0,
                margin: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <Plus size={20} className="text-gray-900" strokeWidth={2.5} style={{ pointerEvents: 'none' }} />
            </button>
          }
        />
        
        <Links userId={userId || undefined} />

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
  );
}

