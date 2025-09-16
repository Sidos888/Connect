"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import TopNavigation from "./TopNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isChatPage = pathname.startsWith('/chat');
  const isSettingsPage = pathname === '/settings';
  const isMenuPage = pathname === '/menu';
  
  // Routes that are always accessible (no login required)
  const publicRoutes = ['/', '/explore'];
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const isPublicRoute = publicRoutes.includes(normalizedPath);

  // Debug logging for Vercel troubleshooting
  console.log('AppShell Debug:', {
    pathname,
    isPublicRoute,
    publicRoutes,
    user: user ? 'SIGNED IN' : 'NOT SIGNED IN',
    loading
  });

  // If it's a public route, show without protection
  if (isPublicRoute) {
    console.log('Rendering public route without protection');
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
          {!isSettingsPage && (
            <div className="lg:hidden">
              <MobileBottomNavigation />
            </div>
          )}
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
        {!isSettingsPage && (
          <div className="lg:hidden">
            <MobileBottomNavigation />
          </div>
        )}
      </div>
    );
  }

  // All other routes require authentication
  console.log('Rendering protected route with authentication required');
  if (isChatPage) {
    // Full height layout for chat pages
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Desktop: Top Navigation, Mobile: No top nav */}
        <div className="hidden lg:block">
          <TopNavigation />
        </div>
        <div className="flex-1 overflow-hidden">
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </div>
        {/* Mobile: Bottom Navigation */}
        {!isSettingsPage && (
          <div className="lg:hidden">
            <MobileBottomNavigation />
          </div>
        )}
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
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </main>

      {/* Mobile: Bottom Navigation Bar */}
      {!isSettingsPage && (
        <div className="lg:hidden">
          <MobileBottomNavigation />
        </div>
      )}
    </div>
  );
}
