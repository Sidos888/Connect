"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useModal } from "@/lib/modalContext";
import TopNavigation from "./TopNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { isAnyModalOpen } = useModal();
  const isChatPage = pathname.startsWith('/chat');
  const isSettingsPage = pathname === '/settings';
  const isMenuPage = pathname === '/menu';
  const isOnboardingPage = pathname === '/onboarding';
  
  // Routes that are always accessible (no login required)
  const publicRoutes = ['/', '/explore', '/debug-tables', '/migration-test'];
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const isPublicRoute = publicRoutes.includes(normalizedPath);

  // If it's a public route, show without protection
  if (isPublicRoute) {
    if (isChatPage) {
      // Full height layout for chat pages
      return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
          {/* Desktop: Top Navigation, Mobile: No top nav */}
          <div className="hidden lg:block fixed top-0 left-0 right-0 z-50">
            <TopNavigation />
          </div>
          <div className="flex-1 overflow-hidden" style={{ marginTop: '5rem', height: 'calc(100vh - 5rem)' }}>
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
        <div className="hidden lg:block fixed top-0 left-0 right-0 z-50">
          <TopNavigation />
        </div>
        
        {/* Main Content Area with proper mobile safe area */}
        <main className="w-full pb-20 lg:pb-0 lg:pt-20">
          {children}
        </main>

        {/* Mobile: Bottom Navigation Bar */}
        {!isSettingsPage && !isOnboardingPage && !isMenuPage && !isAnyModalOpen && (
          <div className="lg:hidden">
            <MobileBottomNavigation />
          </div>
        )}
      </div>
    );
  }

  // All other routes require authentication
  if (isChatPage) {
    // Full height layout for chat pages
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        {/* Desktop: Top Navigation, Mobile: No top nav */}
        <div className="hidden lg:block fixed top-0 left-0 right-0 z-50">
          <TopNavigation />
        </div>
        <div className="flex-1 overflow-hidden pt-20">
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </div>
        {/* Mobile: Bottom Navigation */}
        {!isSettingsPage && !isOnboardingPage && !isMenuPage && !isAnyModalOpen && (
          <div className="lg:hidden">
            <MobileBottomNavigation />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Desktop: Top Navigation Bar */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50">
        <TopNavigation />
      </div>
      
      {/* Main Content Area with proper mobile safe area */}
      <main className="flex-1 w-full lg:pt-20">
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </main>

      {/* Mobile: Bottom Navigation Bar */}
      {!isSettingsPage && !isOnboardingPage && !isMenuPage && !isAnyModalOpen && (
        <div className="lg:hidden">
          <MobileBottomNavigation />
        </div>
      )}
    </div>
  );
}
