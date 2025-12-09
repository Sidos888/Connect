"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MobilePage, PageContent, PageHeader } from "@/components/layout/PageSystem";
import QRCode from "@/components/qr-code/QRCode";
import { Share } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import Avatar from "@/components/Avatar";

export default function QRCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from'); // Get the 'from' parameter
  const { account } = useAuth();

  // Log the 'from' parameter for debugging
  React.useEffect(() => {
    console.log('🔵 QRCodePage: Component mounted/updated', {
      from,
      fullUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      search: typeof window !== 'undefined' ? window.location.search : 'N/A'
    });
  }, [from]);

  const userName = account?.name || "User Name";
  const userAvatar = account?.profile_pic || undefined;

  // Handle back navigation
  const handleBack = () => {
    console.log('🔵 QRCodePage: Back button clicked', {
      from,
      decodedFrom: from ? decodeURIComponent(from) : null,
      willUseFrom: !!from,
      willUseRouterBack: !from
    });
    // Prioritize using the 'from' parameter to return to the exact previous page
    if (from) {
      const targetUrl = decodeURIComponent(from);
      console.log('🔵 QRCodePage: Navigating to original page via from parameter:', targetUrl);
      router.replace(targetUrl);
    } else {
      console.log('🔵 QRCodePage: No from parameter, using router.back()');
      router.back();
    }
  };

  // Handle profile card click - navigate to share profile page
  const handleProfileCardClick = () => {
    if (account?.id) {
      const currentUrl = typeof window !== 'undefined' 
        ? `${window.location.pathname}${window.location.search}`
        : '/qr-code';
      const fromParam = `&from=${encodeURIComponent(currentUrl)}`;
      const connectIdParam = account.connect_id ? `&connectId=${account.connect_id}` : '';
      router.push(`/profile/share?id=${account.id}${connectIdParam}${fromParam}`);
    }
  };

  // Profile card component - Circular avatar on top, name card below (matching DM chat structure)
  const profileCard = account ? (
    <div
      className="absolute left-0 right-0"
      style={{
        top: "0", // Align with top of leftSection (same as back button)
        height: "44px", // Match leftSection height
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start", // Align items to top
      }}
    >
      {/* Circular Avatar - Top Center - Positioned independently, aligned with back button top */}
      <button
        onClick={handleProfileCardClick}
        className="absolute z-10"
        style={{
          cursor: "pointer",
          top: "0", // Align top with back button top
          left: "50%", // Center horizontally
          transform: "translateX(-50%)", // Center horizontally only
        }}
      >
        {/* Circular avatar - 48px to visually match back button */}
        <div className="rounded-full overflow-hidden" style={{ width: '48px', height: '48px' }}>
          <Avatar
            src={userAvatar}
            name={userName}
            size={48}
          />
        </div>
      </button>

      {/* Name Card - Below Avatar - Positioned independently like DM chat */}
      <button 
        onClick={handleProfileCardClick}
        className="absolute z-0"
        style={{
          height: "44px", // Match back button and chat box height
          borderRadius: "100px", // Match chat input box at bottom of page
          background: "rgba(255, 255, 255, 0.96)",
          borderWidth: "0.4px",
          borderColor: "#E5E7EB",
          borderStyle: "solid",
          boxShadow: "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
          willChange: "transform, box-shadow",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between", // Space between text and chevron
          maxWidth: "calc(100% - 32px)", // Account for page padding
          paddingLeft: "16px", // Left padding for text
          paddingRight: "8px", // Tighter right padding for chevron
          top: "40px", // Same as DM chat (40px for regular chats)
          left: "50%", // Center horizontally
          transform: "translateX(-50%)", // Center horizontally only
          cursor: "pointer"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)";
        }}
      >
        {/* Name - left aligned with ellipsis truncation */}
        <div 
          className="font-semibold text-gray-900 text-base flex-1 text-left"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0 // Required for flex truncation to work
          }}
        >
          {userName}
        </div>
        {/* Right chevron icon */}
        <svg 
          className="w-5 h-5 text-gray-500 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          style={{ marginLeft: "4px" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  ) : null;

  return (
    <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        {/* Header with central profile component - matching gallery/chat page structure */}
        <PageHeader
          title=""
          backButton
          onBack={handleBack}
          leftSection={profileCard}
          customActions={
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Navigate to share profile page with current URL (including 'from' parameter) as 'from' parameter
                if (account?.id) {
                  const currentUrl = typeof window !== 'undefined' 
                    ? `${window.location.pathname}${window.location.search}`
                    : '/qr-code';
                  const fromParam = `&from=${encodeURIComponent(currentUrl)}`;
                  const connectIdParam = account.connect_id ? `&connectId=${account.connect_id}` : '';
                  router.push(`/profile/share?id=${account.id}${connectIdParam}${fromParam}`);
                }
              }}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '22px',
                background: 'rgba(255, 255, 255, 0.96)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              aria-label="Share Profile"
            >
              <Share size={20} className="text-gray-900" strokeWidth={2.5} />
            </button>
          }
        />

        <PageContent>
          <div 
            className="px-4" 
            style={{ 
              paddingTop: 'var(--saved-content-padding-top, 140px)', // Same as gallery/timeline pages
              paddingBottom: '24px', // Space at bottom for button
              height: 'calc(100vh - var(--saved-content-padding-top, 140px) - 24px)', // Full height minus header and bottom padding
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', // Prevent scrolling
            }}
          >
            <QRCode />
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}

