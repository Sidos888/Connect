"use client";

import { ChevronLeft, LogOut, Trash2, MoreVertical, Eye, Pencil, User } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useState, useRef, useEffect } from "react";

export default function SettingsContent({
  onBack,
  onSignOut,
  onDeleteAccount,
  showDeleteConfirm,
  showFinalConfirm,
  onConfirmDelete,
  onCancelDelete,
  onProceedToFinalConfirm,
  onBackToMenu,
  isDeletingAccount,
  personalProfile,
  showBackButton = true,
  onViewProfile,
  onEditProfile,
  onAccountSettings,
}: {
  onBack: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  showDeleteConfirm: boolean;
  showFinalConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onProceedToFinalConfirm: () => void;
  onBackToMenu: () => void;
  isDeletingAccount: boolean;
  personalProfile: any;
  showBackButton?: boolean;
  onViewProfile?: () => void;
  onEditProfile?: () => void;
  onAccountSettings?: () => void;
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close dropdown on outside click
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

  return (
    <div className="flex flex-col h-full">
      {showDeleteConfirm ? (
        <div className="w-full h-full flex flex-col">
          {isDeletingAccount ? (
            <div className="flex-1 flex flex-col justify-center items-center space-y-6">
              {/* Loading animation */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
              </div>
              
              {/* Loading message */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">Deleting Account</h3>
                <p className="text-gray-600 mt-2">Please wait while we remove your data...</p>
              </div>
            </div>
          ) : showFinalConfirm ? (
            <div className="flex flex-col h-full px-4 py-6">
              {/* Subtext at the top */}
              <div className="text-center mb-6">
                <p className="text-base text-gray-600 leading-relaxed">
                  This action cannot be undone and all your data will be permanently removed.
                </p>
              </div>
              
              {/* Profile card in the middle */}
              <div className="flex-1 flex items-center justify-center mb-6">
                <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-3 w-full max-w-sm">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={personalProfile?.avatarUrl ?? undefined}
                      name={personalProfile?.name ?? "User"}
                      size={48}
                    />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {personalProfile?.name ?? "Your Name"}
                      </h3>
                      <p className="text-xs text-gray-500">Personal Account</p>
                    </div>
                    <div className="text-red-500 text-xs font-medium">
                      Delete
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action buttons at the bottom */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={onConfirmDelete}
                  className="w-full px-6 py-4 text-base font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                >
                  Delete Account
                </button>
                <button
                  onClick={onBackToMenu}
                  className="w-full py-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full px-4 py-6">
              {/* Title at the top */}
              <div className="text-center mb-3">
                <h1 className="text-2xl font-semibold text-gray-900">Delete Account</h1>
              </div>
              
              {/* Subtext in the middle - takes up remaining space */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-600 leading-relaxed text-center max-w-sm">
                  Are you sure you want to delete your account?
                </p>
              </div>
              
              {/* Action buttons at the bottom */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onCancelDelete}
                  className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={onProceedToFinalConfirm}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Header with back button - matches UnifiedProfileCard positioning */}
          {showBackButton && (
            <>
              <button
                onClick={onBack}
                className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.9)',
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
                aria-label="Back"
              >
                <ChevronLeft size={20} className="text-gray-900" />
              </button>
              <h2 className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-xl font-semibold text-gray-900">Settings</h2>
            </>
          )}
          
          {/* Settings content */}
          <div className="flex-1 px-6 relative" style={{ paddingTop: showBackButton ? '80px' : '24px' }}>
            {/* Profile Card + Edit Profile - Combined */}
            <div 
              className="bg-white rounded-2xl mb-6 border border-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-[1px] relative" 
              style={{ 
                borderWidth: '0.4px', 
                borderColor: '#E5E7EB', 
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
              {/* Profile Section */}
              <div 
                onClick={onViewProfile}
                className="p-4 grid grid-cols-[40px_1fr_40px] items-center cursor-pointer transition-all"
              >
                <div className="flex items-center">
                  <Avatar
                    src={personalProfile?.avatarUrl ?? undefined}
                    name={personalProfile?.name ?? "User"}
                    size={40}
                  />
                </div>
                <div className="text-base font-semibold text-gray-900 text-center">
                  {personalProfile?.name ?? "Your Name"}
                </div>
                <div 
                  className="flex justify-end relative"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileMenuOpen((v) => !v);
                    }}
                    ref={profileMenuButtonRef}
                    className="flex items-center justify-center w-10 h-10"
                    aria-label="Open profile menu"
                    aria-expanded={isProfileMenuOpen}
                  >
                    <MoreVertical className="h-5 w-5 text-gray-900" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200" />

              {/* Edit Profile Section */}
              <div 
                onClick={onEditProfile}
                className="p-4 flex items-center gap-3 cursor-pointer transition-all"
              >
                <Pencil size={20} className="text-gray-900" />
                <div className="flex-1 text-base font-medium text-gray-900">
                  Edit Profile
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Profile dropdown menu - rendered outside card */}
            {isProfileMenuOpen && onViewProfile && onEditProfile && (
              <div
                ref={profileMenuRef}
                role="menu"
                aria-label="Profile actions"
                className="absolute right-6 z-[100] w-56 rounded-2xl border border-neutral-200 bg-white shadow-xl p-1"
                style={{
                  top: '140px'
                }}
              >
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileMenuOpen(false);
                    onViewProfile();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                >
                  <Eye className="h-5 w-5 text-gray-700" />
                  View Profile
                </button>
                <div className="mx-2 my-1 h-px bg-neutral-200" />
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileMenuOpen(false);
                    onEditProfile();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                >
                  <Pencil className="h-5 w-5 text-gray-700" />
                  Edit Profile
                </button>
              </div>
            )}

            {/* Account Settings Card */}
            {onAccountSettings && (
              <div 
                onClick={onAccountSettings}
                className="bg-white rounded-2xl p-4 mb-6 border border-gray-200 shadow-sm flex items-center gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]" 
                style={{ 
                  borderWidth: '0.4px', 
                  borderColor: '#E5E7EB', 
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
                <User size={20} className="text-gray-900" />
                <div className="flex-1 text-base font-medium text-gray-900">
                  Account Settings
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Spacer to push Log out to bottom */}
          <div className="flex-1" />
          
          {/* Log out button at bottom */}
          <div className="px-6 pb-6">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-4 text-gray-900 bg-white rounded-2xl transition-all duration-200 border border-gray-200 shadow-sm hover:-translate-y-[1px]"
              style={{ 
                borderWidth: '0.4px', 
                borderColor: '#E5E7EB', 
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
              <LogOut size={20} className="text-gray-900" />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

