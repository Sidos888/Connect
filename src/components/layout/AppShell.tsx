"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useModal } from "@/lib/modalContext";
import { useAppStore } from "@/lib/store";
import TopNavigation from "./TopNavigation";
import MobileTopNavigation from "./MobileTopNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoadingScreen from "@/components/LoadingScreen";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { isAnyModalOpen } = useModal();
  const { isHydrated } = useAppStore();
  const [isMobile, setIsMobile] = React.useState(false);
  
  // Check if mobile on mount
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate all route flags BEFORE any conditional returns
  const isChatPage = pathname.startsWith('/chat');
  const isChatPhotosPage = pathname.startsWith('/chat/photos');
  const isIndividualChatPage = pathname.startsWith('/chat/individual');
  const isDmDetailsPage = pathname.startsWith('/chat/dm-details');
  const isGroupDetailsPage = pathname.startsWith('/chat/group-details');
  const isGroupMembersPage = pathname.startsWith('/chat/group-details/members');
  const isGroupSettingsPage = pathname.startsWith('/chat/group-details/settings');
  const isMyLifePage = pathname.startsWith('/my-life');
  const isSettingsPage = (
    pathname.startsWith('/settings') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/gallery') ||
    pathname.startsWith('/achievements') ||
    pathname.startsWith('/about-me') ||
    pathname.startsWith('/saved') ||
    pathname.startsWith('/share-profile')
  );
  const menuView = pathname === '/menu' ? searchParams?.get('view') : null;
  const isMenuPage = pathname === '/menu' && (menuView === null || menuView === 'menu');
  const isAddPersonView = pathname === '/menu' && menuView === 'add-person';
  const isConnectionsView = pathname === '/menu' && menuView === 'connections';
  
  // Debug logging for add person view
  React.useEffect(() => {
    if (pathname === '/menu') {
      console.log('AppShell: Menu page detected', { pathname, menuView, isAddPersonView, isMenuPage });
    }
  }, [pathname, menuView, isAddPersonView, isMenuPage]);
  const isOnboardingPage = pathname === '/onboarding';
  const isTimelinePage = pathname.startsWith('/timeline');
  const isCreateListingPage = pathname === '/my-life/create' || pathname === '/my-life/create/' || pathname.startsWith('/my-life/create/');
  const isProfilePage = pathname.startsWith('/profile');
  // Handle listing detail page - check pathname (with/without trailing slash) and search params
  // Routes: /listing?id=xxx (context-agnostic) or /my-life/listing?id=xxx (legacy)
  const normalizedListingPath = pathname.replace(/\/$/, ''); // Remove trailing slash for comparison
  const hasListingId = searchParams?.get('id') !== null;
  const isListingDetailPage = 
    (normalizedListingPath === '/listing' || normalizedListingPath === '/my-life/listing') && hasListingId;
  const isListingsPage = pathname.startsWith('/casual-listings') || pathname.startsWith('/for-you-listings') || pathname.startsWith('/side-quest-listings');
  
  // Debug: Log pathname for listing pages to verify detection
  // IMPORTANT: This useEffect must run on every render, even if we return early
  React.useEffect(() => {
    if (normalizedListingPath === '/listing' || normalizedListingPath === '/my-life/listing') {
      console.log('AppShell: Listing page check', { 
        pathname, 
        normalizedListingPath,
        hasListingId,
        listingId: searchParams?.get('id'),
        isListingDetailPage 
      });
    }
  }, [pathname, normalizedListingPath, hasListingId, isListingDetailPage, searchParams]);

  // START REVIEWER OVERRIDE
  // Reviewer login is now handled in LoginModal - no separate page needed
  // This keeps it invisible to regular users
  // END REVIEWER OVERRIDE
  
  // Show loading screen on mobile during initial load
  // This conditional return is AFTER all hooks to ensure hooks are always called in the same order
  if (isMobile && (loading || !isHydrated)) {
    return <LoadingScreen />;
  }
  
  // Routes that are always accessible (no login required)
  const publicRoutes = ['/', '/explore', '/debug-tables', '/migration-test'];
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const isPublicRoute = publicRoutes.includes(normalizedPath);

  // If it's a public route, show without protection
  if (isPublicRoute) {
    if (isChatPage) {
      // Desktop: Show top nav, Mobile: No constraints
      return (
        <div className="min-h-screen bg-white">
          {/* Desktop: Top Navigation Bar */}
          <div className="hidden sm:block fixed top-0 left-0 right-0 z-50">
            <TopNavigation />
          </div>
          
          {/* Main Content Area - Mobile has no constraints, Desktop has top nav offset */}
          <main className="w-full sm:pt-20">
            {children}
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white">
        {/* Desktop: Top Navigation Bar */}
        <div className="hidden lg:block fixed top-0 left-0 right-0 z-50">
          <TopNavigation />
        </div>
        
        {/* Mobile: Top Navigation Bar */}
        {!isSettingsPage && (
          <div className="lg:hidden">
            <MobileTopNavigation />
          </div>
        )}
        
        {/* Main Content Area with proper mobile safe area */}
        <main className="w-full pb-24 lg:pb-0 lg:pt-20 pt-32">
          {children}
        </main>

        {/* Mobile: Bottom Navigation Bar */}
        {!isSettingsPage && !isOnboardingPage && !isMenuPage && !isAddPersonView && !isConnectionsView && !isTimelinePage && !isCreateListingPage && !isListingDetailPage && !isProfilePage && !isAnyModalOpen && (
          <div className="lg:hidden">
            <MobileBottomNavigation />
          </div>
        )}
      </div>
    );
  }

  // All other routes require authentication
  // Exclude chat photos page from chat-specific styling (it uses MobilePage with fixed positioning)
  if (isChatPage && !isChatPhotosPage) {
    return (
      <div className={`h-screen flex flex-col ${(isIndividualChatPage || isDmDetailsPage || isGroupDetailsPage || isGroupMembersPage || isGroupSettingsPage) ? 'bg-transparent' : 'bg-white'}`}>
        {/* Desktop: Top Navigation Bar - Hidden on individual chat pages */}
        {!isIndividualChatPage && !isDmDetailsPage && !isGroupDetailsPage && !isGroupMembersPage && !isGroupSettingsPage && (
          <div className="hidden sm:block fixed top-0 left-0 right-0 z-50">
            <TopNavigation />
          </div>
        )}
        
        {/* Mobile: Top Navigation Bar - Not needed for Chat page (has own PageHeader) */}
        {!isSettingsPage && !isChatPage && (
          <div className="sm:hidden">
            <MobileTopNavigation />
          </div>
        )}
        
        {/* Main Content Area - Mobile has bottom nav, Desktop has top nav offset */}
        <main className={`w-full flex-1 ${(isIndividualChatPage || isDmDetailsPage || isGroupDetailsPage || isGroupMembersPage || isGroupSettingsPage) ? 'sm:pt-0 pt-0 bg-transparent' : 'sm:pt-20 pt-32'} sm:h-[calc(100vh-4.5rem)] ${(isIndividualChatPage || isDmDetailsPage || isGroupDetailsPage || isGroupMembersPage || isGroupSettingsPage) ? 'pb-0' : 'pb-24'} sm:pb-0`} style={(isIndividualChatPage || isDmDetailsPage || isGroupDetailsPage || isGroupMembersPage || isGroupSettingsPage) ? { backgroundColor: 'transparent', background: 'transparent' } : {}}>
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </main>

        {/* Mobile: Bottom Navigation Bar - Hidden on individual chat pages and details page */}
        {!isIndividualChatPage && !isDmDetailsPage && !isGroupDetailsPage && (
          <div className="sm:hidden">
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
      
      {/* Mobile: Top Navigation Bar - Not needed for pages with own PageHeader */}
      {!isSettingsPage && !isMyLifePage && !isMenuPage && !isListingsPage && !isProfilePage && (
        <div className="lg:hidden">
          <MobileTopNavigation />
        </div>
      )}
      
      {/* Main Content Area with proper mobile safe area */}
      <main className="flex-1 w-full lg:pt-20 pt-32 pb-24 lg:pb-0">
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </main>

      {/* Mobile: Bottom Navigation Bar */}
      {!isSettingsPage && !isOnboardingPage && !isMenuPage && !isAddPersonView && !isConnectionsView && !isTimelinePage && !isCreateListingPage && !isListingDetailPage && !isProfilePage && !isAnyModalOpen && (
        <div className="lg:hidden">
          <MobileBottomNavigation />
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
