"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useAppStore } from "@/lib/store";
import { useState } from "react";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, deleteAccount } = useAuth();
  const { clearAll } = useAppStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    await deleteAccount();
    setIsDeletingAccount(false);
    clearAll();
    router.push('/');
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setShowFinalConfirm(false);
  };

  return (
    <>
      {/* Mobile full-screen view */}
      <div className="lg:hidden fixed inset-0 z-50 h-screen overflow-hidden bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white px-4 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10"
              style={{
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
              }}
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5 text-gray-900" />
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-[18px] leading-6 text-gray-900">Account Settings</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Content - scrollable area */}
        <div className="flex-1 overflow-y-auto px-4 pt-6">
          {/* Email and Phone Card */}
          <div 
            className="bg-white rounded-2xl p-4 mb-6 border border-gray-200 shadow-sm space-y-4" 
            style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
          >
            {/* Email */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Email</span>
              <span className="text-sm text-gray-900">{user?.email || 'Not set'}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-200" />

            {/* Phone Number */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Phone Number</span>
              <span className="text-sm text-gray-900">{user?.phone || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Delete Account Button - positioned at bottom */}
        <div className="px-4 pb-32">
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 text-red-600 bg-white hover:bg-red-50 rounded-2xl transition-colors border border-gray-200 shadow-sm"
            style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
          >
            <Trash2 size={20} className="text-red-500" />
            <span className="font-medium">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Web centered modal */}
      <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
        {/* Dimming overlay */}
        <div
          className="fixed inset-0 transition-opacity duration-300 ease-in-out"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
          onClick={handleBack}
        />

        {/* Modal card */}
        <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10"
            style={{
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
            }}
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5 text-gray-900" />
          </button>

          {/* Title */}
          <h2 className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-xl font-semibold text-gray-900">Account Settings</h2>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 flex flex-col" style={{ paddingTop: '80px' }}>
            {/* Email and Phone Card */}
            <div 
              className="bg-white rounded-2xl p-4 mb-6 border border-gray-200 shadow-sm space-y-4" 
              style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
            >
              {/* Email */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Email</span>
                <span className="text-sm text-gray-900">{user?.email || 'Not set'}</span>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200" />

              {/* Phone Number */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Phone Number</span>
                <span className="text-sm text-gray-900">{user?.phone || 'Not set'}</span>
              </div>
            </div>

            {/* Spacer to push Delete Account to bottom */}
            <div className="flex-1" />

            {/* Delete Account Button at bottom */}
            <div className="pb-6">
              <button
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 text-red-600 bg-white hover:bg-red-50 rounded-2xl transition-colors border border-gray-200 shadow-sm"
                style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)' }}
              >
                <Trash2 size={20} className="text-red-500" />
                <span className="font-medium">Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



