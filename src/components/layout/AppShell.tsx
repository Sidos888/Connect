"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import TopNavigation from "./TopNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isChatPage = pathname.startsWith('/chat');

  if (isChatPage) {
    // Full height layout for chat pages
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Desktop: Top Navigation, Mobile: No top nav */}
        <div className="hidden lg:block">
          <TopNavigation />
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        {/* Mobile: Bottom Navigation */}
        <div className="lg:hidden">
          <MobileBottomNavigation />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop: Top Navigation Bar */}
      <div className="hidden lg:block">
        <TopNavigation />
      </div>
      
      {/* Main Content Area with proper mobile safe area */}
      <main className="w-full pb-20 lg:pb-0">
        {children}
      </main>

      {/* Mobile: Bottom Navigation Bar */}
      <div className="lg:hidden">
        <MobileBottomNavigation />
      </div>
    </div>
  );
}
