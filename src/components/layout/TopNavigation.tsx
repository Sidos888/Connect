"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Calendar, MessageCircle, Building } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAppStore } from "@/lib/store";

const ProfileMenu = dynamic(() => import("@/components/menu/ProfileMenu"), { ssr: false });
const NotificationMenu = dynamic(() => import("@/components/menu/NotificationMenu"), { ssr: false });

export default function TopNavigation() {
  const pathname = usePathname();
  const { context } = useAppStore();

  const navigationItems = [
    { href: "/", label: "Explore", icon: Search },
    { 
      href: "/my-life", 
      label: context.type === "business" ? "My Business" : "My Life", 
      icon: context.type === "business" ? Building : Calendar 
    },
    { href: "/chat", label: "Chat", icon: MessageCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/explore");
    }
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

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

          {/* Right Side - Notifications & Profile Menu */}
          <div className="flex items-center gap-2">
            {/* Notifications Dropdown - Hidden on mobile */}
            <div className="hidden lg:block">
              <NotificationMenu />
            </div>

            {/* Profile Menu */}
            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
