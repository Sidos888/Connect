"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useAppStore } from "@/lib/store";

export type TabItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

type Props = {
  items: TabItem[];
};

export default function TabBar({ items }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { resetMenuState } = useAppStore();
  
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleMenuClick = (href: string) => {
    if (href === "/menu") {
      // Reset any local menu state but allow the Link to navigate normally
      resetMenuState();
    }
  };
  
  return (
    <>
      {/* Floating Bottom Navigation with Liquid Glass Effect */}
      <nav 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-8 py-1.5 tabbar-nav"
        style={{
          borderRadius: '100px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
        }}
        data-testid="mobile-bottom-nav"
      >
        <ul className="flex items-center justify-center gap-6">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link 
                  href={item.href} 
                  className={`block transition-all duration-200 ${
                    active 
                      ? "nav-item-active text-orange-500" 
                      : "nav-item-inactive text-black hover:text-orange-500"
                  }`}
                  onClick={item.href === "/menu" ? () => handleMenuClick(item.href) : undefined}
                >
                  <div className="flex flex-col items-center gap-1 py-2">
                    <span className="h-8 w-8 flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span className={`text-xs whitespace-nowrap font-bold`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Bottom spacing for floating nav */}
      <div className="h-20"></div>
    </>
  );
}


