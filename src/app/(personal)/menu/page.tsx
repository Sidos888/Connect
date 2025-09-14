"use client";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Link from "next/link";
import MobileTitle from "@/components/MobileTitle";
import ProfileStrip from "@/components/my-life/ProfileStrip";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ChevronDownIcon, BellIcon, ChevronLeftIcon } from "@/components/icons";
import { LogOut, Trash2, ChevronRightIcon } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import AccountSwitcherModal from "@/components/AccountSwitcherModal";

export default function Page() {
  const router = useRouter();
  const { personalProfile, context } = useAppStore();
  const { signOut, deleteAccount } = useAuth();
  const currentBusiness = useCurrentBusiness();
  const [currentView, setCurrentView] = React.useState<'menu' | 'settings'>('menu');
  const [showAccountSwitcher, setShowAccountSwitcher] = React.useState(false);

  // Get current account info
  const currentAccount = context.type === "business" && currentBusiness 
    ? { name: currentBusiness.name, avatarUrl: currentBusiness.logoUrl, bio: currentBusiness.bio }
    : { name: personalProfile?.name, avatarUrl: personalProfile?.avatarUrl, bio: personalProfile?.bio };

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
      <div>
        <MobileTitle 
          title={currentView === 'menu' ? "Menu" : "Settings"} 
          action={
            currentView === 'menu' ? (
              <button
                className="p-2 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 ring-brand"
                aria-label="Notifications"
                onClick={() => router.push("/notifications")}
              >
                <BellIcon className="h-5 w-5 text-black" />
              </button>
            ) : null
          }
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {currentView === 'settings' ? (
            <SettingsView />
          ) : (
            <>
              {/* Profile Card with Semi-Connected Bio */}
              <div className="mb-6 lg:mb-8">
                <div className="max-w-lg mx-auto lg:max-w-xl">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Main Profile Card */}
                    <div className="px-5 py-4 grid grid-cols-[40px_1fr_40px] items-center">
                      <div className="flex items-center">
                        <Avatar 
                          src={currentAccount?.avatarUrl ?? undefined} 
                          name={currentAccount?.name ?? "Your Name"} 
                          size={36} 
                        />
                      </div>
                      <div className="text-base font-semibold text-neutral-900 text-center">
                        {currentAccount?.name ?? "Your Name"}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowAccountSwitcher(true)}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Bio Section - Semi-connected */}
                    {currentAccount?.bio && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Bio</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{currentAccount.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden lg:block mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
              </div>

              <div className="space-y-6">

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

      {/* Account Switcher Modal */}
      <AccountSwitcherModal 
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />
    </ProtectedRoute>
  );
}


