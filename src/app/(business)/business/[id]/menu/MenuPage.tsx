"use client";

import Button from "@/components/Button";
import Avatar from "@/components/Avatar";
import { useAppStore, useCurrentBusiness } from "@/lib/store";
import { useRouter } from "next/navigation";
import { BellIcon, ChevronDownIcon, CalendarIcon, UsersIcon, BookmarkIcon, CogIcon } from "@/components/icons";
import * as React from "react";

export default function MenuPage() {
  const router = useRouter();
  const business = useCurrentBusiness();
  const { personalProfile, businesses, switchToPersonal, clearAll, switchToBusiness } = useAppStore();
  const [showSwitcher, setShowSwitcher] = React.useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Menu</h1>
        <button
          className="p-2 rounded-md hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Notifications"
          onClick={() => router.push(`/business/${business?.id}/notifications`)}
        >
          <BellIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Profile Card (Business) */}
      <div className="rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="p-4 flex items-center gap-3 relative">
          <div className="w-12 h-12 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center">
            {business?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoUrl} alt={business?.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-sm">🏢</span>
            )}
          </div>
          <div className="flex-1" />
          <button
            className={`p-2 rounded-md hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 ring-brand transition-transform ${
              showSwitcher ? "rotate-180" : ""
            }`}
            aria-label="Switch account"
            onClick={() => setShowSwitcher((v) => !v)}
          >
            <ChevronDownIcon className="h-5 w-5" />
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-base font-semibold text-neutral-900 truncate max-w-[60%] text-center">
              {business?.name ?? "Business"}
            </div>
          </div>
        </div>

        {showSwitcher && (
          <div className="px-4 pb-4">
            <div className="text-xs text-neutral-500 mb-2">Personal</div>
            <button
              className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex items-center gap-3 rounded-md bg-gray-50"
              onClick={() => {
                switchToPersonal();
                router.push("/");
              }}
            >
              <Avatar src={personalProfile?.avatarUrl ?? undefined} name={personalProfile?.name} size={28} />
              <div className="text-sm font-medium text-neutral-900">{personalProfile?.name ?? "Personal"}</div>
            </button>

            {businesses.length > 0 && (
              <ul className="rounded-md bg-gray-50 divide-y divide-gray-100 overflow-hidden mt-3">
                {businesses.map((b) => (
                  <li key={b.id}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex items-center justify-between"
                      onClick={() => {
                        switchToBusiness(b.id);
                        router.push(`/business/${b.id}/menu`);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center">
                          {b.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.logoUrl} alt="logo" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-sm">🏢</span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-neutral-900">{b.name}</div>
                      </div>
                      <span className="text-neutral-400">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Business Quick Actions (4 cards) */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: "Bookings", icon: <CalendarIcon /> },
          { title: "Connections", icon: <UsersIcon /> },
          { title: "Saved", icon: <BookmarkIcon /> },
          { title: "Settings", icon: <CogIcon />, settings: true },
        ].map((item) => (
          <button
            key={item.title}
            className="rounded-xl shadow-sm bg-white py-5 px-4 text-center hover:bg-neutral-50 flex flex-col items-center justify-center gap-2"
            onClick={() => {
              if (item.settings) {
                router.push("/settings");
              }
            }}
          >
            <span className="h-6 w-6 text-neutral-900">
              {item.icon}
            </span>
            <div className="text-sm font-medium text-neutral-900">{item.title}</div>
          </button>
        ))}
      </div>
      
      <section className="space-y-2">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            switchToPersonal();
            router.push("/");
          }}
        >
          Switch to Personal
        </Button>
        {/* Simple switcher list of businesses could be added here. */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            clearAll();
            router.push("/onboarding");
          }}
        >
          Log out (clear local)
        </Button>
      </section>
    </div>
  );
}
