"use client";

import React, { useEffect } from 'react';
import { useAppStore, useCurrentBusiness } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import { X, Plus } from 'lucide-react';
import ProfileStrip from '@/components/my-life/ProfileStrip';

interface AccountSwitcherSwipeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSwitcherSwipeModal({ isOpen, onClose }: AccountSwitcherSwipeModalProps) {
  const { personalProfile, businesses, context, switchToPersonal, switchToBusiness } = useAppStore();
  const currentBusiness = useCurrentBusiness();
  const router = useRouter();

  // Manage body class to hide bottom navigation
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentAccount = context.type === "personal" 
    ? {
        id: "personal",
        name: personalProfile?.name || "Personal Account",
        type: "Personal account",
        avatarUrl: personalProfile?.avatarUrl,
        bio: personalProfile?.bio,
        isPersonal: true
      }
    : {
        id: currentBusiness?.id || "",
        name: currentBusiness?.name || "Business Account",
        type: "Business account", 
        avatarUrl: currentBusiness?.logoUrl,
        bio: currentBusiness?.description,
        isPersonal: false
      };

  const otherAccounts = [
    ...(context.type === "business" ? [{
      id: "personal",
      name: personalProfile?.name || "Personal Account",
      type: "Personal account",
      avatarUrl: personalProfile?.avatarUrl,
      bio: personalProfile?.bio,
      isPersonal: true,
      onClick: () => {
        switchToPersonal();
        onClose();
      }
    }] : []),
    ...businesses
      .filter(business => context.type === "personal" || business.id !== currentBusiness?.id)
      .map(business => ({
        id: business.id,
        name: business.name,
        type: "Business account",
        avatarUrl: business.logoUrl,
        bio: business.description,
        isPersonal: false,
        onClick: () => {
          switchToBusiness(business.id);
          onClose();
        }
      }))
  ];

  const handleAddBusiness = () => {
    onClose();
    router.push('/create-business');
  };

  return (
    <div className="fixed inset-0 flex items-end md:items-center justify-center md:pb-0 overflow-hidden" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl w-full max-w-md mx-auto h-[85vh] overflow-hidden md:rounded-3xl md:max-w-lg">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Switch Account</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6 space-y-6 overflow-y-auto">
          {/* Current Account */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Account</h3>
            <div className="max-w-lg mx-auto lg:max-w-xl">
              <ProfileStrip 
                name={currentAccount.name} 
                avatarUrl={currentAccount.avatarUrl}
                action={
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                }
              />
            </div>
          </div>
          
          {/* Other Accounts */}
          {otherAccounts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Other Accounts</h3>
              <div className="space-y-3">
                {otherAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={account.onClick}
                    className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    <Avatar 
                      src={account.avatarUrl} 
                      name={account.name}
                      size="md"
                    />
                    <div className="ml-3 flex-1 text-left">
                      <div className="font-medium text-gray-900">{account.name}</div>
                      <div className="text-sm text-gray-500">{account.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Add Business Button */}
          <button
            onClick={handleAddBusiness}
            className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-gray-600 font-medium">Add Business</span>
          </button>
        </div>
        
        {/* Safe area for iOS */}
        <div className="pb-safe-bottom" />
      </div>
    </div>
  );
}
