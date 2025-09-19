"use client";

import ProfileStrip from "@/components/my-life/ProfileStrip";
import QuickActions from "@/components/my-life/QuickActions";
import Section from "@/components/my-life/Section";
import Carousel from "@/components/my-life/Carousel";
import MiniEventCard from "@/components/my-life/MiniEventCard";
import StatTile from "@/components/my-life/StatTile";
import MobileTitle from "@/components/MobileTitle";
import { useAppStore } from "@/lib/store";
import Button from "@/components/Button";
import { CalendarIcon, PlusIcon } from "@/components/icons";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MyLifeLayout from "./MyLifeLayout";

export default function Page() {
  const { personalProfile, context } = useAppStore();
  
  console.log('My Life page - personalProfile:', personalProfile);
  console.log('My Life page - avatarUrl:', personalProfile?.avatarUrl);

  const upcoming = [
    { title: "Minion Sailing Comp", dateTime: "Jan 15 • 10:15am", thumbnail: "⛵" },
    { title: "Minion Sailing Comp", dateTime: "Jan 15 • 10:15am", thumbnail: "⛵" },
    { title: "Minion Sailing Comp", dateTime: "Jan 15 • 10:15am", thumbnail: "⛵" },
  ];
  const hosting = [{ title: "Minion Mafia Training", dateTime: "Jan 15 • 10:15am", chip: "Host", thumbnail: "🎯" }];
  const ongoing = [
    { title: "Minion Sailing Comp", dateTime: "Jan 15 • 10:15am", thumbnail: "⛵" },
    { title: "Minion Sailing Comp", dateTime: "Jan 15 • 10:15am", thumbnail: "⛵" },
  ];


  if (context.type === "business") {
    return (
      <div>
        <MobileTitle title="My Business" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="mb-6 lg:mb-8">
            <div className="max-w-lg mx-auto lg:max-w-xl">
              <ProfileStrip name={personalProfile?.name ?? "Business Owner"} avatarUrl={personalProfile?.avatarUrl ?? undefined} />
            </div>
          </div>

          <div className="space-y-8">
            {/* Business Quick Actions */}
            <div className="flex justify-center gap-2">
              <Button variant="secondary" className="justify-self-center w-32 md:w-40 rounded-2xl py-3 text-sm shadow-sm border border-neutral-200 bg-white text-neutral-900 flex items-center justify-center gap-2">
                <CalendarIcon width={18} height={18} />
                <span>Calendar</span>
              </Button>
              <Button variant="secondary" className="justify-self-center w-32 md:w-40 rounded-2xl py-3 text-sm shadow-sm border border-neutral-200 bg-white text-neutral-900 flex items-center justify-center gap-2">
                <PlusIcon width={18} height={18} />
                <span>Create</span>
              </Button>
            </div>

            {/* Hubs Section */}
            <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Hubs</h3>
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No listings yet</p>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Places */}
              <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Places</h3>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No listings yet</p>
                </div>
              </div>

              {/* Services */}
              <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Services</h3>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No listings yet</p>
                </div>
              </div>

              {/* Rentals */}
              <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Rentals</h3>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No listings yet</p>
                </div>
              </div>

              {/* Events */}
              <div className="rounded-2xl bg-white shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Events</h3>
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No listings yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Personal account content -> new two-pane layout with sidebar tabs
  return (
    <ProtectedRoute title="My Life" description="Log in / sign up to view your personal events and activities" buttonText="Log in">
      <MyLifeLayout />
    </ProtectedRoute>
  );
}


