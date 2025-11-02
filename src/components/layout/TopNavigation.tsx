"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Calendar, MessageCircle, Building, Menu } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useState, useEffect, useRef } from "react";
import { useModal } from "@/lib/modalContext";

import ProfileMenu from "@/components/menu/ProfileMenu";

export default function TopNavigation() {
  const pathname = usePathname();
  const { context } = useAppStore();
  const { user } = useAuth();
  const { showLogin } = useModal();
  const [authOpen, setAuthOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    { href: "/explore", label: "Explore", icon: Search },
    { 
      href: "/my-life", 
      label: context.type === "business" ? "My Business" : "My Life", 
      icon: context.type === "business" ? Building : Calendar 
    },
    { href: "/chat", label: "Chat", icon: MessageCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/explore") {
      return pathname === "/" || pathname.startsWith("/explore");
    }
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

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

  return (
    <header className="bg-white border-b border-gray-200">
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

          {/* Desktop Navigation - Absolutely Centered */}
          <nav className="hidden lg:flex items-center absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-8">
              {navigationItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      text-base font-semibold transition-colors relative
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
                {/* Profile Menu */}
                <ProfileMenu />
              </>
            ) : (
              <>
                {/* Auth Dropdown Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setAuthOpen(!authOpen)}
                    className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 transition-all duration-200 hover:bg-white active:bg-white focus:outline-none"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: authOpen ? '#D1D5DB' : '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: authOpen 
                        ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                    }}
                  >
                    <Menu size={16} className="text-gray-700" />
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
