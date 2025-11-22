"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Search } from "lucide-react";
import { useAppStore } from "@/lib/store";

export type TabItem = {
  href: string;
  label: string;
  icon?: React.ReactNode | React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string; className?: string }>;
};

type Props = {
  items: TabItem[];
};

export default function TabBar({ items }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { resetMenuState } = useAppStore();
  
  // Initialize search mode based on current pathname to prevent glitchy transitions
  const getInitialSearchMode = () => {
    const isExplorePage = pathname === "/explore" || pathname.startsWith("/explore");
    const isListingCategoryPage = pathname === "/for-you-listings" || 
                                   pathname === "/casual-listings" || 
                                   pathname === "/side-quest-listings" ||
                                   pathname.startsWith("/for-you-listings") ||
                                   pathname.startsWith("/casual-listings") ||
                                   pathname.startsWith("/side-quest-listings");
    return isExplorePage || isListingCategoryPage;
  };
  
  const [isSearchMode, setIsSearchMode] = React.useState(getInitialSearchMode);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
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
  
  // Separate search item from other items
  const searchItem = items[0];
  const otherItems = items.slice(1);
  
  // Initialize lastVisitedItem with first item as default to ensure search mode always has a recent icon
  const getInitialLastVisitedItem = () => {
    if (otherItems.length === 0) return null;
    const activeItem = otherItems.find(item => isActive(item.href));
    return activeItem || otherItems[0] || null;
  };
  
  const [lastVisitedItem, setLastVisitedItem] = React.useState<TabItem | null>(getInitialLastVisitedItem);
  
  // Update last visited when navigating (only when NOT in search mode)
  React.useEffect(() => {
    if (!isSearchMode) {
      const activeItem = otherItems.find(item => isActive(item.href));
      if (activeItem) {
        setLastVisitedItem(activeItem);
      }
    }
  }, [pathname, isSearchMode, otherItems]);
  
  // Auto-enter search mode when on explore page or listing category pages
  React.useEffect(() => {
    const isExplorePage = pathname === "/explore" || pathname.startsWith("/explore");
    const isListingCategoryPage = pathname === "/for-you-listings" || 
                                   pathname === "/casual-listings" || 
                                   pathname === "/side-quest-listings" ||
                                   pathname.startsWith("/for-you-listings") ||
                                   pathname.startsWith("/casual-listings") ||
                                   pathname.startsWith("/side-quest-listings");
    
    const shouldBeInSearchMode = isExplorePage || isListingCategoryPage;
    
    // Only update state if it needs to change (prevents unnecessary re-renders and glitchy transitions)
    if (shouldBeInSearchMode !== isSearchMode) {
      setIsSearchMode(shouldBeInSearchMode);
      if (!shouldBeInSearchMode) {
        setSearchQuery("");
      }
    }
  }, [pathname, isSearchMode]); // Include isSearchMode to ensure correct state updates
  
  // Handle explore/search button click
  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSearchMode) {
      // Navigate to explore and enter search mode
      router.push("/explore");
      setIsSearchMode(true);
    }
  };
  
  // Handle recent icon button click
  const handleRecentIconClick = () => {
    setIsSearchMode(false);
    setSearchQuery("");
    if (lastVisitedItem) {
      router.push(lastVisitedItem.href);
    }
  };
  
  // Removed duplicate useEffect - the main one above handles all search mode state changes

  const renderIcon = (icon: React.ReactNode | React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string; className?: string }> | undefined, active: boolean) => {
    if (!icon) return null;
    const isReactElement = React.isValidElement(icon);
    if (isReactElement) {
      return icon;
    }
    if (icon) {
      // Make Search icon bolder (strokeWidth 2.5 instead of 2)
      const isSearchIcon = icon === Search;
      return React.createElement(icon as React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string; className?: string }>, {
        size: 24,
        strokeWidth: isSearchIcon ? 2.5 : 2,
        fill: active ? "currentColor" : "none",
        stroke: "currentColor"
      });
    }
    return null;
  };

  const cardStyle = {
          borderRadius: '100px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
  };

  const combinedCardStyle = {
    borderRadius: '18px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderWidth: '0.4px',
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
  };

  // Check if on explore page or listing category pages
  const isExplorePage = pathname === "/explore" || pathname.startsWith("/explore");
  const isListingCategoryPage = pathname === "/for-you-listings" || 
                                 pathname === "/casual-listings" || 
                                 pathname === "/side-quest-listings" ||
                                 pathname.startsWith("/for-you-listings") ||
                                 pathname.startsWith("/casual-listings") ||
                                 pathname.startsWith("/side-quest-listings");
  const shouldUseSmallHeight = isExplorePage || isListingCategoryPage;
  
  // Calculate height: 1/4 smaller on explore/listing pages (62px * 3/4 = 46.5px)
  const navHeight = shouldUseSmallHeight ? '46.5px' : '62px';
  const searchButtonSize = shouldUseSmallHeight ? '46.5px' : '62px';
  
  return (
    <>
      {/* Floating Bottom Navigation - New Design */}
      <nav 
        className="fixed z-[70] flex items-center gap-3 tabbar-nav"
        style={{ 
          left: '22px',
          right: '22px',
          bottom: 'calc(max(env(safe-area-inset-bottom, 20px), 20px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          position: 'fixed',
          transform: 'translateZ(0)' // Force hardware acceleration and new stacking context
        }}
        data-testid="mobile-bottom-nav"
      >
        {/* Search Button / Search Bar */}
        {searchItem && (
          <div
            className="flex items-center transition-all duration-300 ease-in-out"
            style={{
              width: isSearchMode ? `calc(100% - ${parseInt(searchButtonSize) + 12}px)` : searchButtonSize,
              height: searchButtonSize,
              borderRadius: '100px',
              ...cardStyle,
              overflow: 'hidden'
            }}
          >
            {isSearchMode ? (
              <div 
                className="flex items-center w-full h-full px-4 gap-3"
                onClick={() => searchInputRef.current?.focus()}
              >
                <div 
                  className="flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                  style={{ 
                    width: shouldUseSmallHeight ? '20px' : '24px', 
                    height: shouldUseSmallHeight ? '20px' : '24px',
                    color: '#000000'
                  }}
                >
                  {React.createElement(searchItem.icon as React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string; className?: string }>, {
                    size: shouldUseSmallHeight ? 20 : 24,
                    strokeWidth: 2.5,
                    fill: "none",
                    stroke: "currentColor"
                  })}
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search listings"
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                  style={{ fontSize: shouldUseSmallHeight ? '14px' : '16px' }}
                />
              </div>
            ) : (
              <Link 
                href={searchItem.href}
                onClick={handleSearchClick}
                className="flex items-center justify-center w-full h-full transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                  padding: shouldUseSmallHeight ? '8px' : '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                {renderIcon(searchItem.icon, isActive(searchItem.href))}
              </Link>
            )}
          </div>
        )}

        {/* Combined Card - My Life, Chat, Menu / Recent Icon Button */}
        {isSearchMode ? (
          /* Recent Icon Button - Collapsed State */
          lastVisitedItem && (
            <button
              onClick={handleRecentIconClick}
              className="flex items-center justify-center transition-all duration-300 ease-in-out hover:-translate-y-[1px] text-black"
              style={{
                width: searchButtonSize,
                height: searchButtonSize,
                borderRadius: '100px',
                padding: shouldUseSmallHeight ? '8px' : '12px',
                ...cardStyle
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <span 
                className="flex items-center justify-center flex-shrink-0" 
                style={{ 
                  width: (lastVisitedItem.href === "/chat" || lastVisitedItem.href === "/chat/") 
                    ? (shouldUseSmallHeight ? '28px' : '32px')
                    : (shouldUseSmallHeight ? '22px' : '28px'),
                  height: shouldUseSmallHeight ? '22px' : '28px'
                }}
              >
                {React.createElement(lastVisitedItem.icon as React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string; className?: string }>, {
                  size: (lastVisitedItem.href === "/chat" || lastVisitedItem.href === "/chat/")
                    ? (shouldUseSmallHeight ? 26 : 30)
                    : (shouldUseSmallHeight ? 22 : 28),
                  strokeWidth: 0,
                  fill: "currentColor",
                  stroke: "none"
                })}
              </span>
            </button>
          )
        ) : (
          /* Normal 3-Button Card */
          <div 
            className="flex items-center flex-1 justify-around transition-all duration-300 ease-in-out"
            style={{
              height: navHeight,
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              padding: shouldUseSmallHeight ? '0 8px' : '0 12px'
            }}
          >
            {otherItems.map((item, index) => {
            const active = isActive(item.href);
            // Chat icon is wider (21:17 aspect ratio), so adjust container width and size
            const isChatIcon = item.href === "/chat" || item.href === "/chat/";
            const iconContainerWidth = isChatIcon 
              ? (shouldUseSmallHeight ? '36px' : '40px')
              : (shouldUseSmallHeight ? '24px' : '28px');
            const iconContainerHeight = shouldUseSmallHeight ? '24px' : '28px';
            const iconSize = isChatIcon 
              ? (shouldUseSmallHeight ? 26 : 30)
              : (shouldUseSmallHeight ? 22 : 26);
            
            return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`flex flex-col items-center justify-center transition-all duration-200 ${
                    active 
                      ? "nav-item-active text-orange-500" 
                      : "nav-item-inactive text-black hover:text-orange-500"
                  }`}
                  onClick={item.href === "/menu" ? () => handleMenuClick(item.href) : undefined}
                style={{
                  minWidth: shouldUseSmallHeight ? '48px' : '56px',
                  padding: shouldUseSmallHeight ? '2px 6px' : '4px 8px',
                  gap: shouldUseSmallHeight ? '2px' : '3px'
                }}
              >
                <span 
                  className="flex items-center justify-center flex-shrink-0" 
                  style={{ 
                    width: iconContainerWidth,
                    height: iconContainerHeight,
                    padding: '2px' 
                  }}
                >
                  {React.createElement(item.icon as React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string; className?: string }>, {
                    size: iconSize,
                    strokeWidth: 0,
                    fill: "currentColor",
                    stroke: "none"
                  })}
                </span>
                <span 
                  className="whitespace-nowrap font-semibold leading-tight"
                  style={{ fontSize: shouldUseSmallHeight ? '9px' : '10px' }}
                >
                      {item.label}
                    </span>
                </Link>
            );
          })}
          </div>
        )}
      </nav>
      
      {/* Bottom spacing for floating nav - matches Apple's tab bar height (49px + safe area) */}
      <div style={{ 
        height: 'calc(49px + max(env(safe-area-inset-bottom), 20px) + 20px)' 
      }}></div>
    </>
  );
}


