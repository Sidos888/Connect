"use client";

import { useRouter } from "next/navigation";
import { MobilePage, PageContent } from "@/components/layout/PageSystem";
import QRCode from "@/components/qr-code/QRCode";
import { Share, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import Avatar from "@/components/Avatar";

export default function QRCodePage() {
  const router = useRouter();
  const { account } = useAuth();

  const userName = account?.name || "User Name";
  const userAvatar = account?.profile_pic || undefined;

  return (
    <div className="lg:hidden">
      {/* Custom Header with Profile Card - Matching EventGalleryView structure */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-white"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 70px)',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Profile Card with Avatar and Name */}
          <div
            className="flex-1 bg-white rounded-xl p-3 flex items-center gap-3 min-w-0"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              maxWidth: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Avatar */}
            <div 
              className="flex-shrink-0 rounded-lg overflow-hidden"
              style={{
                width: '60px',
                height: '60px',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
              }}
            >
              <Avatar src={userAvatar} name={userName} size={60} />
            </div>

            {/* User Name */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="text-base font-semibold text-gray-900 truncate" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </div>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Placeholder for share functionality
              console.log('Share button clicked');
            }}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
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
            <Share size={20} className="text-gray-900" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <PageContent>
        <div 
          className="px-4" 
          style={{ 
            paddingTop: 'calc(max(env(safe-area-inset-top), 70px) + 16px + 76px)', // Header: safe-area + padding-bottom + content height
            paddingBottom: '24px', // Space at bottom for button
            height: 'calc(100vh - max(env(safe-area-inset-top), 70px) - 16px - 76px - 24px)', // Full height minus header and bottom padding
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Prevent scrolling
          }}
        >
          <QRCode />
        </div>
      </PageContent>

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
    </div>
  );
}

