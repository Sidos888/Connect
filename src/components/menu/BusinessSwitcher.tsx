"use client";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import Link from "next/link";
import Avatar from "@/components/Avatar";

interface BusinessSwitcherProps {
  onSwitcherToggle?: () => void;
  showSwitcher?: boolean;
}

export default function BusinessSwitcher({ onSwitcherToggle, showSwitcher = false }: BusinessSwitcherProps) {
  const { personalProfile, businesses, context, switchToPersonal, switchToBusiness } = useAppStore();
  const currentBusiness = useCurrentBusiness();

  const currentAccount = context.type === "personal" 
    ? {
        id: "personal",
        name: personalProfile?.name || "Personal Account",
        type: "Personal account",
        initial: personalProfile?.name?.[0] || "U",
        avatarUrl: personalProfile?.avatarUrl,
        isPersonal: true
      }
    : {
        id: currentBusiness?.id || "",
        name: currentBusiness?.name || "Business Account",
        type: "Business account", 
        initial: currentBusiness?.name?.[0] || "B",
        avatarUrl: currentBusiness?.logoUrl,
        isPersonal: false
      };

  const otherAccounts = [
    ...(context.type === "business" ? [{
      id: "personal",
      name: personalProfile?.name || "Personal Account",
      type: "Personal account",
      initial: personalProfile?.name?.[0] || "U",
      avatarUrl: personalProfile?.avatarUrl,
      isPersonal: true,
      onClick: switchToPersonal
    }] : []),
    ...businesses
      .filter(business => context.type === "personal" || business.id !== currentBusiness?.id)
      .map(business => ({
        id: business.id,
        name: business.name,
        type: "Business account",
        initial: business.name?.[0] || "B",
        avatarUrl: business.logoUrl,
        isPersonal: false,
        onClick: () => switchToBusiness(business.id)
      }))
  ];

  if (showSwitcher) {
    return (
      <div className="space-y-3" role="group" aria-label="Account switcher">
        {/* Back to current account */}
        <button
          onClick={onSwitcherToggle}
          className="w-full text-left rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="p-4 flex items-center gap-4">
            <Avatar 
              src={currentAccount.avatarUrl ?? undefined} 
              name={currentAccount.name} 
              size={48} 
            />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {currentAccount.name}
            </h3>
            <p className="text-sm text-gray-500">
              Current
            </p>
          </div>
          </div>
        </button>

        {/* Other accounts */}
        {otherAccounts.map((account) => (
          <button
            key={account.id}
            className="w-full text-left rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
            onClick={() => {
              account.onClick();
              onSwitcherToggle?.();
            }}
          >
            <div className="p-3 flex items-center gap-3">
              <Avatar 
                src={account.avatarUrl ?? undefined} 
                name={account.name} 
                size={40} 
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {account.name}
                </p>
              </div>
            </div>
          </button>
        ))}

        {/* Add business */}
        <Link 
          href="/create-business" 
          className="block w-full rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <span className="text-gray-500 text-xl font-light">+</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">Add a business</p>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div role="group" aria-label="Current account">
      {/* Current Account Display */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-4 flex items-center gap-4">
          <Avatar 
            src={currentAccount.avatarUrl ?? undefined} 
            name={currentAccount.name} 
            size={56} 
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {currentAccount.name}
            </h3>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              View
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}