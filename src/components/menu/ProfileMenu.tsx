"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import BusinessSwitcher from "./BusinessSwitcher";
import MenuItem from "./MenuItem";
import { usePathname } from "next/navigation";
import { Menu, Camera, Trophy, Calendar, Users, Bookmark, Settings, ChevronDown, Plus, LogOut, ArrowRightLeft, DollarSign, CalendarDays } from "lucide-react";
import Avatar from "@/components/Avatar";

function QuickAccountSwitcher({ onShowAll, onAccountSwitch }: { 
  onShowAll: () => void; 
  onAccountSwitch: (switchFn: () => void) => void;
}) {
  const { personalProfile, businesses, context, switchToPersonal, switchToBusiness, isAccountSwitching } = useAppStore();
  const currentBusiness = useCurrentBusiness();

  const otherAccounts = [
    ...(context.type === "business" ? [{
      id: "personal",
      name: personalProfile?.name || "Personal Account",
      type: "Personal account",
      initial: personalProfile?.name?.[0] || "U",
      isPersonal: true,
      onClick: () => onAccountSwitch(switchToPersonal)
    }] : []),
    ...businesses
      .filter(business => context.type === "personal" || business.id !== currentBusiness?.id)
      .map(business => ({
        id: business.id,
        name: business.name,
        type: "Business account",
        initial: business.name?.[0] || "B",
        isPersonal: false,
        onClick: () => onAccountSwitch(() => switchToBusiness(business.id))
      }))
  ];

  const quickAccounts = otherAccounts.slice(0, 2);
  const hasMoreAccounts = otherAccounts.length > 2;

  if (otherAccounts.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-3 border-t border-gray-200">
      <div className="space-y-2">
        {quickAccounts.map((account) => (
          <button
            key={account.id}
            onClick={account.onClick}
            disabled={isAccountSwitching}
            className={`w-full text-left rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-3 flex items-center gap-3 relative overflow-hidden ${
              isAccountSwitching ? 'animate-pulse scale-95 opacity-75' : 'hover:scale-[1.02] active:scale-95'
            }`}
          >
            <div className={`w-10 h-10 bg-gray-600 flex items-center justify-center transition-transform duration-300 ${
              account.isPersonal ? 'rounded-full' : 'rounded-lg'
            }`}>
              <span className="text-white text-sm font-medium">
                {account.initial}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {account.name}
              </p>
              <p className="text-xs text-gray-500">
                {account.type}
              </p>
            </div>
            <ArrowRightLeft size={16} className="text-gray-400" />
          </button>
        ))}
        
        {hasMoreAccounts && (
          <button
            onClick={onShowAll}
            className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
          >
            <span>See all accounts</span>
            <ChevronDown size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfileMenu() {
  const { context, setAccountSwitching, personalProfile } = useAppStore();
  const currentBusiness = useCurrentBusiness();
  const [open, setOpen] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Get current account info for avatar
  const currentAccount = context.type === "business" && currentBusiness 
    ? { name: currentBusiness.name, avatarUrl: currentBusiness.logoUrl }
    : { name: personalProfile?.name, avatarUrl: personalProfile?.avatarUrl };

  useEffect(() => {
    setOpen(false);
    setShowSwitcher(false);
    setAccountSwitching(false);
  }, [pathname, setAccountSwitching]);

  const handleAccountSwitch = async (switchFunction: () => void) => {
    // Start global loading state
    setAccountSwitching(true);
    setOpen(false);
    
    // Wait a bit to show loading animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Execute the switch
    switchFunction();
    
    // Keep loading for a bit more to make it feel complete
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // End loading animation
    setAccountSwitching(false);
  };
  useEffect(() => {
    const onClickAway = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white shadow-sm px-2 py-1 hover:shadow-md transition-shadow focus:outline-none"
      >
        <Menu size={14} className="text-gray-700" />
        <Avatar 
          src={currentAccount?.avatarUrl ?? undefined} 
          name={currentAccount?.name ?? "User"} 
          size={32} 
        />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-[320px] rounded-xl border border-neutral-200 bg-white shadow-sm p-3">
          <BusinessSwitcher 
            showSwitcher={showSwitcher} 
            onSwitcherToggle={() => setShowSwitcher(!showSwitcher)} 
          />
          
          {!showSwitcher && (
            <>
              <div className="my-3 border-t border-neutral-200" />

              <div className="space-y-0.5">
                {context.type === "business" ? (
                  // Business account menu items
                  <>
                    <MenuItem icon={<CalendarDays size={20} />} label="Bookings" href="/business/bookings" />
                    <MenuItem icon={<DollarSign size={20} />} label="Financials" href="/business/financials" />
                    <MenuItem icon={<Users size={20} />} label="Connections" href="/business/connections" />
                    <MenuItem icon={<Settings size={20} />} label="Settings" href="/settings" />
                  </>
                ) : (
                  // Personal account menu items
                  <>
                    <MenuItem icon={<Camera size={20} />} label="My Gallery" href="/gallery" />
                    <MenuItem icon={<Trophy size={20} />} label="Achievements" href="/achievements" />
                    <MenuItem icon={<Calendar size={20} />} label="My Bookings" href="/my-life" />
                    <MenuItem icon={<Users size={20} />} label="My Connections" href="/connections" />
                    <MenuItem icon={<Bookmark size={20} />} label="Saved" href="/saved" />
                    <MenuItem icon={<Settings size={20} />} label="Settings" href="/settings" />
                  </>
                )}
              </div>

              <QuickAccountSwitcher 
                onShowAll={() => setShowSwitcher(true)}
                onAccountSwitch={handleAccountSwitch}
              />
              
              {/* Always show Add Account and Log Out even if no other accounts */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="space-y-2">
                  <MenuItem 
                    icon={<Plus size={20} />} 
                    label="Add account" 
                    href="/create-business" 
                  />
                  <MenuItem 
                    icon={<LogOut size={20} />} 
                    label="Log out" 
                    href="/api/auth/logout" 
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
