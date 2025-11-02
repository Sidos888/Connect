"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Calendar, MessageCircle, Building, Menu, Plus, Bell } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useState, useEffect, useRef } from "react";
import { useModal } from "@/lib/modalContext";
import Avatar from "@/components/Avatar";

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
        <button className="flex items-center justify-center w-10 h-10" style={cardStyle}>
          <Plus size={20} className="text-black" />
        </button>
      );
    }
    if (pathname === "/menu" || pathname.startsWith("/menu")) {
      return (
        <button 
          onClick={() => router.push("/notifications")}
          className="flex items-center justify-center w-10 h-10" 
          style={cardStyle}
        >
          <Bell size={20} className="text-black" />
        </button>
      );
    }
    if (pathname.startsWith("/my-life")) {
      return (
        <button className="flex items-center justify-center w-10 h-10" style={cardStyle}>
          <Plus size={20} className="text-black" />
        </button>
      );
    }
    return (
      <button className="flex items-center justify-center w-10 h-10" style={cardStyle}>
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

  return (
    <>
    <header className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4">
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

        {/* Middle Card - Page Title - Always Centered */}
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

        {/* Right Card - Action Buttons - Only show when authenticated */}
        {user && (
          <div className="absolute right-4">
            {getActionButtons()}
          </div>
        )}
      </div>
    </header>
    {/* Bottom Sheet mounted at root to avoid transform stacking issues */}
    {profileSheetOpen && (
      <div className="fixed inset-0 z-[70]">
        <div className="absolute inset-0 bg-black/30" onClick={() => setProfileSheetOpen(false)}></div>
        <div className="fixed left-0 right-0 bottom-0">
          <div className="mx-auto w-full max-w-md bg-white" style={{ borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 12px rgba(0,0,0,0.12)', minHeight: '33vh' }} role="dialog" aria-modal="true">
            <div className="flex justify-center py-2">
              <div className="w-10 h-1.5 rounded-full bg-gray-300"></div>
            </div>
            <div className="px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
              <button
                onClick={() => { setProfileSheetOpen(false); router.push('/menu?view=profile'); }}
                className="w-full flex items-center px-4 py-4 bg-white rounded-2xl"
                style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
              >
                <Avatar src={account?.profile_pic || personalProfile?.avatarUrl} name={account?.name || personalProfile?.name || user?.email} size={40} />
                <div className="flex-1 text-center">
                  <div className="text-lg font-semibold text-gray-900">{account?.name || personalProfile?.name || 'Your Profile'}</div>
                </div>
                <span className="shrink-0" aria-hidden>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </span>
              </button>
              <div className="h-3"></div>
              <button
                onClick={() => { setProfileSheetOpen(false); router.push('/create-business'); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white rounded-2xl text-gray-900 font-medium"
                style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
              >
                <span className="text-xl">＋</span>
                <span>Add Business</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
