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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/connect-logo.svg"
                alt="Connect"
                width={130}
                height={30}
                className="h-6 lg:h-8 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center space-x-8">
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
          <div className="flex items-center gap-2">
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
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white shadow-sm px-3 py-2 hover:shadow-md transition-shadow focus:outline-none"
                  >
                    <Menu size={16} className="text-gray-700" />
                    {/* Hollow dotted profile picture when not signed in */}
                    <div className="w-6 h-6 border-2 border-dashed border-gray-400 rounded-full bg-transparent">
                    </div>
                  </button>

                  {authOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-[400px] rounded-xl border border-neutral-200 bg-white shadow-sm p-5">
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setAuthOpen(false);
                            // Add about page navigation here
                          }}
                          className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <span className="font-medium">About Connect</span>
                        </button>
                        <div className="border-t border-gray-200 my-6"></div>
                        <button
                          onClick={() => {
                            setAuthOpen(false);
                            showLogin();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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
