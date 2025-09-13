"use client";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Link from "next/link";
import MobileTitle from "@/components/MobileTitle";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ChevronDownIcon, BellIcon, ChevronLeftIcon } from "@/components/icons";
import { LogOut, Trash2 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";

export default function Page() {
  const router = useRouter();
  const { personalProfile, businesses, context, switchToBusiness, switchToPersonal, setAccountSwitching } = useAppStore();
  const { signOut, deleteAccount } = useAuth();
  const currentBusiness = useCurrentBusiness();
  const [showSwitcher, setShowSwitcher] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<'menu' | 'settings'>('menu');

  // Get current account info
  const currentAccount = context.type === "business" && currentBusiness 
    ? { name: currentBusiness.name, avatarUrl: currentBusiness.logoUrl, bio: currentBusiness.bio }
    : { name: personalProfile?.name, avatarUrl: personalProfile?.avatarUrl, bio: personalProfile?.bio };

  const handleAccountSwitch = async (switchFunction: () => void) => {
    // Start global loading state
    setAccountSwitching(true);
    
    // Wait a bit to show loading animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Execute the switch
    switchFunction();
    
    // Keep loading for a bit more to make it feel complete
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // End loading animation
    setAccountSwitching(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const { error } = await deleteAccount();
      if (error) {
        alert('Error deleting account: ' + error.message);
      } else {
        router.push('/');
      }
    }
  };

  // Settings Component
  const SettingsView = () => (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentView('menu')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Back to menu"
        >
          <ChevronLeftIcon size={20} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </div>

      {/* Settings Content */}
      <div className="space-y-4">
        {/* Account Section */}
        <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900">Account</h2>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out (clear local)</span>
            </button>
            
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900">Profile</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Avatar src={currentAccount?.avatarUrl ?? undefined} name={currentAccount?.name} size={48} />
              <div>
                <h3 className="font-medium text-gray-900">{currentAccount?.name ?? "Your Name"}</h3>
                <p className="text-sm text-gray-500">{currentAccount?.bio || "No bio yet."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute
      title={currentView === 'menu' ? "Menu" : "Settings"}
      description="Log in / sign up to access your account settings and preferences"
      buttonText="Log in"
    >
      <div className="bg-white">
      {/* Only show on mobile - hide on desktop */}
      <div className="lg:hidden">
        <MobileTitle 
          title={currentView === 'menu' ? "Menu" : "Settings"} 
          showDivider={false}
          action={
            currentView === 'menu' ? (
              <button
                className="p-2 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 ring-brand"
                aria-label="Notifications"
                onClick={() => router.push("/notifications")}
              >
                <BellIcon className="h-5 w-5 text-gray-700" />
              </button>
            ) : null
          }
        />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
          {currentView === 'settings' ? (
            <SettingsView />
          ) : (
            <>
              <div className="mb-4 lg:mb-8">
                <h1 className="hidden lg:block text-3xl font-bold text-gray-900">Menu</h1>
              </div>

              <div className="space-y-6">

          {/* Profile Card */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="p-6 flex items-center gap-4 relative">
          <Avatar src={currentAccount?.avatarUrl ?? undefined} name={currentAccount?.name} size={48} />
          <div className="flex-1" />
          <button
            className={`p-2 rounded-md hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 ring-brand transition-transform ${
              showSwitcher ? "rotate-180" : ""
            }`}
            aria-label="Switch profile"
            onClick={() => setShowSwitcher((v) => !v)}
          >
            <ChevronDownIcon className="h-5 w-5" />
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-lg font-bold text-gray-900 truncate max-w-[60%] text-center">
              {currentAccount?.name ?? "Your Name"}
            </div>
          </div>
        </div>

        {/* Account Switcher */}
        {showSwitcher && (
          <div className="px-4 pb-4">
            <div className="space-y-2">
              {/* Personal Account (if currently in business mode) */}
              {context.type === "business" && (
                <button
                  className="w-full text-left rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-3 flex items-center gap-3"
                  onClick={() => handleAccountSwitch(switchToPersonal)}
                >
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {personalProfile?.name?.[0] || "U"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {personalProfile?.name || "Personal Account"}
                    </p>
                    <p className="text-xs text-gray-500">Personal account</p>
                  </div>
                </button>
              )}
              
              {/* Business Accounts */}
              {businesses
                .filter(business => context.type === "personal" || business.id !== context.businessId)
                .map((business) => (
                <button
                  key={business.id}
                  className="w-full text-left rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-3 flex items-center gap-3"
                  onClick={() => handleAccountSwitch(() => switchToBusiness(business.id))}
                >
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {business.name?.[0] || "B"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {business.name}
                    </p>
                    <p className="text-xs text-gray-500">Business account</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-3">
              <Link href="/create-business">
                <Button variant="secondary" className="w-full">Add Business Account</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Divider and Bio */}
        {!showSwitcher && (
          <>
            <div className="bg-gray-100 h-px" />
            <div className="px-4 pb-4 pt-3">
              <div className="text-sm text-neutral-600 text-center">{currentAccount?.bio || "No bio yet."}</div>
            </div>
          </>
        )}
      </div>

          {/* Menu Grid - Mobile 2x3 layout */}
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-6">
              {(context.type === "business" ? 
                // Business account menu items
                [
                  { title: "Bookings", icon: "📅", href: "/business/bookings" },
                  { title: "Financials", icon: "💰", href: "/business/financials" },
                  { title: "Connections", icon: "👥", href: "/business/connections" },
                  { title: "Settings", icon: "⚙️", onClick: () => setCurrentView('settings') },
                ] :
                // Personal account menu items
                [
                  { title: "My Gallery", icon: "📷", href: "/gallery" },
                  { title: "Achievements", icon: "🏆", href: "/achievements" },
                  { title: "My Bookings", icon: "📅", href: "/my-life" },
                  { title: "Connections", icon: "👥", href: "/connections" },
                  { title: "Saved", icon: "🔖", href: "/saved" },
                  { title: "Settings", icon: "⚙️", onClick: () => setCurrentView('settings') },
                ]
              ).map((item) => (
                <button
                  key={item.title}
                  className="
                    rounded-2xl border border-neutral-200 bg-white p-4 lg:p-6 shadow-sm
                    hover:shadow-md hover:bg-neutral-50 transition-shadow duration-200
                    focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1
                    h-28 lg:h-36 xl:h-40
                  "
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.href) {
                      router.push(item.href);
                    }
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-2 lg:gap-3">
                    <div className="text-2xl lg:text-4xl xl:text-5xl">
                      {item.icon}
                    </div>
                    <span className="text-xs lg:text-sm font-medium text-neutral-900 text-center leading-tight">
                      {item.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
          </>
        )}
        </div>
      </div>
      
      {/* Desktop message */}
      <div className="hidden lg:flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Menu</h1>
          <p className="text-gray-600">Use the profile menu in the top right to access settings and account options.</p>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}


