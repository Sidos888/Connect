"use client";

import React from 'react';
import { useAppStore, useCurrentBusiness } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import { X, Plus } from 'lucide-react';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSwitcherModal({ isOpen, onClose }: AccountSwitcherModalProps) {
  const { personalProfile, businesses, context, switchToPersonal, switchToBusiness } = useAppStore();
  const currentBusiness = useCurrentBusiness();
  const router = useRouter();

  if (!isOpen) return null;

  const currentAccount = context.type === "personal" 
    ? {
        id: "personal",
        name: personalProfile?.name || "Personal Account",
        type: "Personal account",
        avatarUrl: personalProfile?.avatarUrl,
        isPersonal: true
      }
    : {
        id: currentBusiness?.id || "",
        name: currentBusiness?.name || "Business Account",
        type: "Business account", 
        avatarUrl: currentBusiness?.logoUrl,
        isPersonal: false
      };

  const otherAccounts = [
    ...(context.type === "business" ? [{
      id: "personal",
      name: personalProfile?.name || "Personal Account",
      type: "Personal account",
      avatarUrl: personalProfile?.avatarUrl,
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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Switch Account</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Current Account */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Account</h3>
            <div className="flex items-center p-3 bg-gray-50 rounded-xl">
              <Avatar 
                src={currentAccount.avatarUrl} 
                name={currentAccount.name}
                size="md"
              />
              <div className="ml-3 flex-1">
                <div className="font-medium text-gray-900">{currentAccount.name}</div>
                <div className="text-sm text-gray-500">{currentAccount.type}</div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
          </div>
          
          {/* Other Accounts */}
          {otherAccounts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Other Accounts</h3>
              <div className="space-y-2">
                {otherAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={account.onClick}
                    className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
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
            className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors"
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
