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

  const handleMenuClick = (e: React.MouseEvent, href: string) => {
    if (href === "/menu") {
      e.preventDefault();
      resetMenuState();
      router.push("/menu");
    }
    // For other tabs, let the Link component handle navigation normally
  };
  
  return (
    <nav className="tabbar-nav fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-gray-200" data-testid="mobile-bottom-nav">
      <ul className="grid grid-cols-4 px-2 py-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="text-center">
              <Link 
                href={item.href} 
                className={`block py-2 px-1 text-xs ${active ? "text-brand" : "text-black"}`}
                onClick={item.href === "/menu" ? (e) => handleMenuClick(e, item.href) : undefined}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span aria-hidden className="h-6 w-6">
                    {item.icon}
                  </span>
                  <span className={`text-xs ${active ? "font-bold" : "font-medium"}`}>{item.label}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="pb-safe-bottom"></div>
    </nav>
  );
}


