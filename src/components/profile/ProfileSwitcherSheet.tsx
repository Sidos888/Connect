"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import { MoreVertical, Plus } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useAppStore } from "@/lib/store";
import { useModal } from "@/lib/modalContext";

interface ProfileSwitcherSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSwitcherSheet({ isOpen, onClose }: ProfileSwitcherSheetProps) {
  const router = useRouter();
  const { user, account } = useAuth();
  const { personalProfile } = useAppStore();
  const { showLogin } = useModal();
  
  // Swipe-to-dismiss state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderSheet, setShouldRenderSheet] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Show/hide sheet with animation buffer
  useEffect(() => {
    if (isOpen) {
      setShouldRenderSheet(true);
      setIsClosing(false);
      return;
    }

    if (shouldRenderSheet) {
      setIsClosing(true);
      const timeout = window.setTimeout(() => {
        setShouldRenderSheet(false);
        setIsClosing(false);
        setDragY(0);
      }, 300);

      return () => window.clearTimeout(timeout);
    }
  }, [isOpen, shouldRenderSheet]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const clickedInsideMenu = !!(profileMenuRef.current && target && profileMenuRef.current.contains(target));
      const clickedButton = !!(profileMenuButtonRef.current && target && profileMenuButtonRef.current.contains(target));
      
      if (!clickedInsideMenu && !clickedButton) {
        setIsProfileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isProfileMenuOpen]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Close if dragged down more than 100px
    if (dragY > 100) {
      onClose();
    } else {
      // Snap back
      setDragY(0);
    }
  };

  // Reset drag state when sheet closes
  useEffect(() => {
    if (!isOpen && !shouldRenderSheet) {
      setDragY(0);
      setIsDragging(false);
    }
  }, [isOpen, shouldRenderSheet]);

  const closeSheet = () => {
    if (!isOpen) return;
    onClose();
  };

  // Prevent background scrolling when sheet is open
  useEffect(() => {
    if (!shouldRenderSheet) return;

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;

    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      html.style.overflow = previousHtmlOverflow;
    };
  }, [shouldRenderSheet]);

  if (!shouldRenderSheet) return null;

  return (
    <div className="fixed inset-0 z-[70] animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/30" 
        style={{ 
          opacity: isClosing ? 0 : 1,
          transition: isClosing ? 'opacity 0.3s ease' : 'none'
        }}
        onClick={closeSheet}
      ></div>
      <div className="fixed left-0 right-0 bottom-0">
        <div 
          ref={sheetRef}
          className={`mx-auto w-full max-w-md bg-white ${dragY === 0 && !isDragging && !isClosing ? 'animate-slide-up' : ''}`}
          style={{ 
            borderTopLeftRadius: 18, 
            borderTopRightRadius: 18, 
            borderWidth: '0.4px', 
            borderColor: '#E5E7EB', 
            borderStyle: 'solid', 
            boxShadow: '0 0 12px rgba(0,0,0,0.12)', 
            minHeight: '75vh',
            transform: isClosing ? 'translateY(100%)' : `translateY(${dragY}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform'
          }} 
          role="dialog" 
          aria-modal="true"
        >
          <div 
            className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1.5 rounded-full bg-gray-300"></div>
          </div>
          <div 
            className="px-4 pt-6 pb-[max(env(safe-area-inset-bottom),20px)] space-y-8 overflow-y-auto no-scrollbar"
            style={{ 
              maxHeight: 'calc(75vh - 56px)',
              WebkitOverflowScrolling: 'touch',
              overflowY: isProfileMenuOpen ? 'visible' : 'auto'
            }}
          >
            {/* Current Account Section - Signed In */}
            {user ? (
              <>
                {/* Current Account */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">Current Account</h3>
                  <div className="relative">
                    <div
                      className="w-full flex items-center px-4 py-4 bg-white rounded-2xl"
                      style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
                    >
                      <Avatar src={account?.profile_pic || personalProfile?.avatarUrl} name={account?.name || personalProfile?.name || user?.email} size={40} />
                      <div className="flex-1 text-center">
                        <div className="text-lg font-semibold text-gray-900">{account?.name || personalProfile?.name || 'Your Profile'}</div>
                        <div className="text-xs text-gray-500">Personal Account</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProfileMenuOpen(!isProfileMenuOpen);
                        }}
                        ref={profileMenuButtonRef}
                        className="flex items-center justify-center w-10 h-10 shrink-0"
                        aria-label="Open profile menu"
                        aria-expanded={isProfileMenuOpen}
                      >
                        <MoreVertical className="h-5 w-5 text-gray-900" />
                      </button>
                    </div>

                  {/* ProfileDropdown - positioned overlapping card - only show when logged in */}
                  {isProfileMenuOpen && (
                    <div ref={profileMenuRef} className="absolute top-[calc(100%-12px)] right-0 z-[200]">
                      <ProfileDropdown
                        onClose={() => setIsProfileMenuOpen(false)}
                        onViewProfile={() => {
                          setIsProfileMenuOpen(false);
                          closeSheet();
                          router.push('/menu?view=profile');
                        }}
                        onEditProfile={() => {
                          setIsProfileMenuOpen(false);
                          closeSheet();
                          router.push('/menu?view=edit-profile&from=menu');
                        }}
                        onShareProfile={() => {
                          setIsProfileMenuOpen(false);
                          closeSheet();
                          router.push('/qr-code');
                        }}
                      />
                    </div>
                  )}
                  </div>
                </div>

                {/* Add Business Section */}
                <div>
                <div
                  onClick={() => { closeSheet(); router.push('/create-business'); }}
                  className="w-full flex items-center px-4 py-4 bg-white rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{ 
                    borderWidth: '0.4px', 
                    borderColor: '#E5E7EB', 
                    borderStyle: 'solid', 
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0 transition-all duration-200"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '100px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                    }}
                  >
                    <Plus size={20} className="text-gray-900" />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-semibold text-gray-900">Add Business</div>
                  </div>
                  <div className="w-10 shrink-0"></div>
                </div>
              </div>
              </>
            ) : (
              /* Not Signed In - Show About Connect and Login Cards */
              <div className="space-y-8 pt-16">
                {/* About Connect Card */}
                <div
                  className="w-full flex items-center justify-center px-4 py-5 bg-white rounded-2xl"
                  style={{ 
                    borderWidth: '0.4px', 
                    borderColor: '#E5E7EB', 
                    borderStyle: 'solid', 
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                  }}
                >
                  <div className="text-lg font-medium text-gray-900">About Connect</div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-300"></div>

                {/* Log in or sign up Card */}
                <div
                  onClick={() => {
                    closeSheet();
                    setTimeout(() => showLogin(), 100);
                  }}
                  className="w-full flex items-center justify-center px-4 py-5 bg-white rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{ 
                    borderWidth: '0.4px', 
                    borderColor: '#E5E7EB', 
                    borderStyle: 'solid', 
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <div className="text-lg font-medium text-gray-900">Log in or sign up</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

