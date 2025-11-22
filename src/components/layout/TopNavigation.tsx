"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Building, Bell } from "lucide-react";
import { MenuIconCustom } from "@/components/icons/MenuIconCustom";
import { MyLifeIconCustom } from "@/components/icons/MyLifeIconCustom";
import { ChatIconCustom } from "@/components/icons/ChatIconCustom";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useState, useEffect, useRef } from "react";
import { useModal } from "@/lib/modalContext";
import Avatar from "@/components/Avatar";

import ProfileMenu from "@/components/menu/ProfileMenu";

export default function TopNavigation() {
  const pathname = usePathname();
  const { context } = useAppStore();
  const { user } = useAuth();
  const { showLogin } = useModal();
  const [authOpen, setAuthOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    { href: "/explore", label: "Explore", icon: Search },
    { 
      href: "/my-life", 
      label: context.type === "business" ? "My Business" : "My Life", 
      icon: context.type === "business" ? Building : MyLifeIconCustom 
    },
    { href: "/chat", label: "Chats", icon: ChatIconCustom },
    { href: "/menu-blank", label: "Menu", icon: MenuIconCustom },
  ];

  const isActive = (href: string) => {
    if (href === "/explore") {
      return pathname === "/" || pathname.startsWith("/explore");
    }
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAuthOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 relative">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 lg:h-20 relative">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => {
                console.log('Connect logo clicked - navigating to explore');
                window.location.href = '/explore';
              }}
              className="flex items-center cursor-pointer"
            >
              <Image
                src="/connect-logo.svg"
                alt="Connect"
                width={130}
                height={30}
                className="h-6 lg:h-8 w-auto"
                priority
              />
            </button>
          </div>

          {/* Desktop Navigation - Absolutely Centered - Connect Card Style */}
          <nav className="hidden lg:flex items-center absolute left-1/2 transform -translate-x-1/2 h-full">
            <div className="flex items-center gap-3 h-full relative">
              {navigationItems.map((item, index) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <div key={item.href} className="relative h-full flex items-center">
                    <Link
                      href={item.href}
                      className="flex items-center justify-center rounded-2xl bg-white transition-all duration-200 hover:-translate-y-[1px]"
                      title={item.label}
                      style={{
                        width: '48px',
                        height: '48px',
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
                      {/* Icon */}
                      <Icon 
                        size={22} 
                        strokeWidth={2.5}
                        fill={active ? "currentColor" : "none"}
                        className="text-gray-900"
                      />
                    </Link>
                    
                    {/* Facebook-style underline - touches bottom of header */}
                    {active && (
                      <div 
                        className="absolute left-0 right-0 h-[3px] bg-gray-900 transition-all duration-300"
                        style={{
                          bottom: '0', // Positioned at bottom of header container
                          borderTopLeftRadius: '2px',
                          borderTopRightRadius: '2px',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Mobile Navigation - Center */}
          <nav className="flex lg:hidden items-center justify-center flex-1">
            <div className="flex items-center gap-6">
              {navigationItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      text-sm font-semibold transition-colors relative
                      ${active 
                        ? "text-gray-900" 
                        : "text-gray-500 hover:text-gray-700"
                      }
                    `}
                  >
                    <span>{item.label}</span>
                    {active && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-900 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right Side - Auth or Profile Menu */}
          <div className="flex items-center gap-2 absolute right-0">
            {user ? (
              <>
                {/* Notification Bell Button */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="flex items-center justify-center rounded-full bg-white transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderWidth: '0.4px',
                      borderColor: notificationOpen ? '#D1D5DB' : '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: notificationOpen 
                        ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow'
                    }}
                    onMouseEnter={(e) => {
                      if (!notificationOpen) {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!notificationOpen) {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                  >
                    <Bell size={20} className="text-gray-900" />
                  </button>

                  {/* Notification Dropdown */}
                  {notificationOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-[280px] h-[512px] rounded-xl bg-white p-5"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      }}>
                      <div className="space-y-4">
                        {/* Title */}
                        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                        {/* Rest of card is blank */}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Menu */}
                <ProfileMenu />
              </>
            ) : (
              <>
                {/* Auth Dropdown Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setAuthOpen(!authOpen)}
                    className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: authOpen ? '#D1D5DB' : '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: authOpen 
                        ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      if (!authOpen) {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                  >
                    <MenuIconCustom size={16} className="text-gray-700" />
                    {/* Hollow dotted profile picture when not signed in */}
                    <div className="w-6 h-6 border-2 border-dashed border-gray-400 rounded-full bg-transparent">
                    </div>
                  </button>

                  {authOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-[400px] rounded-2xl bg-white p-5"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                      }}>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setAuthOpen(false);
                            // Add about page navigation here
                          }}
                          className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                        >
                          <span className="font-medium">About Connect</span>
                        </button>
                        <div className="border-t border-gray-200 my-6"></div>
                        <button
                          onClick={() => {
                            setAuthOpen(false);
                            showLogin();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                        >
                          <span className="font-medium">Log in or sign up</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
