"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React from "react";
import Avatar from "@/components/Avatar";
import { useAppStore } from "@/lib/store";
import MobileTitle from "@/components/MobileTitle";
import ProfileStrip from "@/components/my-life/ProfileStrip";
import QuickActions from "@/components/my-life/QuickActions";
import Section from "@/components/my-life/Section";
import Carousel from "@/components/my-life/Carousel";
import MiniEventCard from "@/components/my-life/MiniEventCard";
import StatTile from "@/components/my-life/StatTile";
import { User, Calendar, Pencil, Hourglass, Target, RefreshCw, FileText, History as HistoryIcon } from "lucide-react";

type TabDef = { id: string; label: string; Icon?: React.ComponentType<{ size?: number; className?: string }> };

const TABS: Array<TabDef> = [
  { id: "profile", label: "Profile", Icon: User },
  { id: "calendar", label: "Calendar", Icon: Calendar },
  { id: "create", label: "Create", Icon: Pencil },
  { id: "upcoming", label: "Upcoming", Icon: Hourglass },
  { id: "hosting", label: "Hosting", Icon: Target },
  { id: "ongoing", label: "Ongoing", Icon: RefreshCw },
  { id: "drafts", label: "Drafts", Icon: FileText },
  { id: "history", label: "History", Icon: HistoryIcon }
];

export default function MyLifeLayout(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const active = searchParams.get("tab") || "profile";
  const { personalProfile } = useAppStore();

  const setTab = (id: string) => {
    const sp = new URLSearchParams(searchParams as any);
    sp.set("tab", id);
    router.push(`/my-life?${sp.toString()}`);
  };

  return (
    <>
      {/* Desktop (web) layout with Menu design principles */}
      <div className="hidden lg:flex h-screen bg-gray-50">
        {/* Sidebar - width matches chat */}
        <div className="w-[380px] xl:w-[420px] bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">My Life</h1>
          </div>

          {/* Profile card at top (mirrors Menu profile card) */}
          <div className="px-4 pt-4">
            <div className="rounded-2xl border border-neutral-200 shadow-sm bg-white px-5 py-4 grid grid-cols-[40px_1fr] items-center">
              <div className="flex items-center">
                <Avatar
                  src={personalProfile?.avatarUrl ?? undefined}
                  name={personalProfile?.name ?? "Your Name"}
                  size={36}
                />
              </div>
              <div className="text-base font-semibold text-neutral-900 text-left">
                {personalProfile?.name ?? "Your Name"}
              </div>
            </div>
          </div>

          {/* Clean list items with icons (match Menu card rows) */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {TABS.filter(t => t.id !== "profile").map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-4 text-left text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors ${
                  active === id ? "bg-neutral-50" : "bg-transparent"
                }`}
              >
                {Icon ? <Icon size={20} className="text-gray-700" /> : null}
                <span className="font-medium text-base">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 capitalize">{active}</h2>
            <p className="text-gray-500 mt-2">This section is coming soon.</p>
          </div>
        </div>
      </div>
      {/* Mobile layout */}
      <div className="lg:hidden min-h-screen bg-white">
        <MobileTitle title="My Life" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Profile */}
          <div className="mb-6 lg:mb-8">
            <div className="max-w-lg mx-auto lg:max-w-xl">
              <ProfileStrip name={personalProfile?.name ?? "Your Name"} avatarUrl={personalProfile?.avatarUrl ?? undefined} />
            </div>
          </div>

          {/* Quick actions */}
          <QuickActions />

          {/* Stats moved to bottom as Drafts/History */}

          {/* Sections */}
          <div className="space-y-6 mt-6">
            <Section title="Upcoming">
              <Carousel>
                <MiniEventCard title="Minion Sailing Comp" dateTime="Jan 15 • 10:15am" thumbnail="⛵" />
                <MiniEventCard title="Minion Sailing Comp" dateTime="Jan 15 • 10:15am" thumbnail="⛵" />
                <MiniEventCard title="Minion Sailing Comp" dateTime="Jan 15 • 10:15am" thumbnail="⛵" />
              </Carousel>
            </Section>

            <Section title="Hosting">
              <Carousel>
                <MiniEventCard title="Minion Mafia Training" dateTime="Jan 15 • 10:15am" thumbnail="🎯" chip="Host" />
              </Carousel>
            </Section>

            <Section title="Ongoing">
              <Carousel>
                <MiniEventCard title="Minion Sailing Comp" dateTime="Jan 15 • 10:15am" thumbnail="⛵" />
                <MiniEventCard title="Minion Sailing Comp" dateTime="Jan 15 • 10:15am" thumbnail="⛵" />
              </Carousel>
            </Section>

            {/* Drafts & History tiles at very bottom */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <StatTile title="Drafts" value="0" />
              <StatTile title="History" value="0" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


