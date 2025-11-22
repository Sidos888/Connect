"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Calendar, MessageCircle, Building, Plus, Bell } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useState, useEffect, useRef } from "react";
import { useModal } from "@/lib/modalContext";
import Avatar from "@/components/Avatar";
import ProfileSwitcherSheet from "@/components/profile/ProfileSwitcherSheet";

export default function MobileTopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { context, personalProfile } = useAppStore();
  const { user, account } = useAuth();
  const { showLogin } = useModal();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAuthOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === "/" || pathname.startsWith("/explore")) return "Explore";
    if (pathname.startsWith("/my-life")) return context.type === "business" ? "My Business" : "My Life";
    if (pathname.startsWith("/chat")) return "Chat";
    if (pathname === "/menu" || pathname.startsWith("/menu")) return "Menu";
    if (pathname.startsWith("/settings")) return "Settings";
    if (pathname.startsWith("/notifications")) return "Notifications";
    return "Connect";
  };

  // Get action buttons based on current route
  const getActionButtons = () => {
    if (pathname.startsWith("/chat")) {
      return (
        <button className="flex items-center justify-center" style={{ ...cardStyle, width: '44px', height: '44px' }}>
          <Plus size={20} className="text-black" />
        </button>
      );
    }
    if (pathname === "/menu" || pathname.startsWith("/menu")) {
      return (
        <button 
          onClick={() => router.push("/notifications")}
          className="flex items-center justify-center" 
          style={{ ...cardStyle, width: '44px', height: '44px' }}
        >
          <Bell size={20} className="text-black" />
        </button>
      );
    }
    if (pathname.startsWith("/my-life")) {
      return (
        <button className="flex items-center justify-center" style={{ ...cardStyle, width: '44px', height: '44px' }}>
          <Plus size={20} className="text-black" />
        </button>
      );
    }
    return (
      <button className="flex items-center justify-center" style={{ ...cardStyle, width: '44px', height: '44px' }}>
        <Search size={20} className="text-black" />
      </button>
    );
  };

  const cardStyle = {
    borderRadius: '100px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderWidth: '0.4px',
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
  };

  // Don't render MobileTopNavigation on pages with their own PageHeader
  const shouldHideHeader = pathname.startsWith('/menu') || 
                          pathname.startsWith('/my-life') || 
                          pathname.startsWith('/chat') ||
                          pathname.startsWith('/side-quest-listings') ||
                          pathname.startsWith('/for-you-listings') ||
                          pathname.startsWith('/casual-listings') ||
                          pathname.startsWith('/profile');
  
  if (shouldHideHeader) {
    return null;
  }

  return (
    <>
    <header 
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
    >
      <div className="relative flex items-center">
        {/* Left Card - Profile - Only show when authenticated */}
        {user && (
          <div className="absolute left-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileSheetOpen(true)}
                className="flex items-center justify-center w-10 h-10"
                style={cardStyle}
              >
                <Avatar 
                  src={account?.profile_pic || personalProfile?.avatarUrl} 
                  name={account?.name || personalProfile?.name || user?.email} 
                  size={36} 
                />
              </button>

            </div>
          </div>
        )}

        {/* Middle Card - Page Title - Only show when authenticated */}
        {user && (
          <div className="w-full flex justify-center">
            <div className="px-6 py-3 w-24 flex items-center justify-center" style={{
              borderRadius: '18px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}>
              <span className="text-lg font-semibold text-black whitespace-nowrap text-center">
                {getPageTitle()}
              </span>
            </div>
          </div>
        )}

        {/* Right Card - Action Buttons - Only show when authenticated */}
        {user && (
          <div className="absolute right-4">
            {getActionButtons()}
          </div>
        )}
      </div>
    </header>
    {/* Profile Switcher Sheet */}
    <ProfileSwitcherSheet 
      isOpen={profileSheetOpen}
      onClose={() => setProfileSheetOpen(false)}
    />
    </>
  );
}
