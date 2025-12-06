"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/authContext";
import { connectionsService, User as ConnectionUser } from "@/lib/connectionsService";
import { PageHeader, MobilePage } from "@/components/layout/PageSystem";
import Image from "next/image";

interface ConnectionsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ConnectionsSearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
}: ConnectionsSearchModalProps) {
  const { account } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isFullyPositioned, setIsFullyPositioned] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<ConnectionUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !account?.id) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { users, error } = await connectionsService.searchUsers(searchQuery, account.id);
        if (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        } else {
          setSearchResults(users || []);
        }
      } catch (error) {
        console.error('Error in searchUsers:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, account?.id]);

  const handleUserClick = (userId: string) => {
    onClose();
    onSearchChange("");
    router.push(`/profile?id=${userId}&from=add-person`);
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsFullyPositioned(false);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Focus input only after animation completes (300ms transition)
      const timer = setTimeout(() => {
        setIsFullyPositioned(true);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      setIsVisible(false);
      setIsFullyPositioned(false);
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-[100] bg-white"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100dvh',
        minHeight: '100vh',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-out',
        overflow: 'hidden',
        position: 'fixed',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title=""
          />
          
          {/* Search Bar with X Button - Full width with same padding as chats page, aligned with header buttons */}
          <div 
            className="absolute left-0 right-0 flex items-center gap-3 px-4"
            style={{
              top: 'max(env(safe-area-inset-top, 0px), 70px)',
              height: '44px',
              zIndex: 30,
              alignItems: 'center'
            }}
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search"
                className="w-full focus:outline-none"
                style={{
                  borderRadius: '100px',
                  height: '44px',
                  background: 'rgba(255, 255, 255, 0.96)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow',
                  paddingLeft: '48px',
                  paddingRight: '24px',
                  fontSize: '16px',
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  color: '#111827'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              />
              <div className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none" style={{ width: '48px' }}>
                <SearchIcon size={20} className="text-gray-900" style={{ strokeWidth: 2.5 }} />
              </div>
            </div>
            {/* Circular X Button */}
            <button
              onClick={() => {
                onClose();
                onSearchChange("");
              }}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.96)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <svg
                className="w-5 h-5 text-gray-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ strokeWidth: 2.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div
            className="flex-1 px-4 lg:px-8 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto scrollbar-hide"
            style={{
              paddingTop: 'var(--saved-content-padding-top, 140px)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >

            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="space-y-2">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-gray-500 text-sm">Searching...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-gray-500 text-sm">No users found</p>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user.id)}
                      className="p-4 rounded-2xl cursor-pointer transition-all duration-200 bg-white"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        willChange: 'transform, box-shadow'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={user.profile_pic}
                          name={user.name || 'User'}
                          size={48}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {user.name || 'Unknown User'}
                          </h3>
                          {user.bio && (
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </MobilePage>
      </div>
    </div>
  );
}
