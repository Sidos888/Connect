"use client";

import React, { useMemo } from "react";
import { Users, Image as ImageIcon, Trophy, Bookmark, Settings as SettingsIcon } from "lucide-react";
import ProfileCard from "@/components/profile/ProfileCard";
import { useAppStore } from "@/lib/store";

type MenuItem = { id: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> };

const MENU_ITEMS: MenuItem[] = [
  { id: "connections", label: "Connections", Icon: Users },
  { id: "memories", label: "Memories", Icon: ImageIcon },
  { id: "achievements", label: "Achievements", Icon: Trophy },
  { id: "saved", label: "Saved", Icon: Bookmark },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
];

export default function MenuBlankPage() {
  const { personalProfile } = useAppStore();
  const items = useMemo(() => MENU_ITEMS, []);

  return (
    <>
      {/* Desktop/Web: Two-pane layout mirroring My Life */}
      <div className="hidden lg:flex h-screen bg-gray-50" style={{ maxHeight: '100vh', overflow: 'hidden' }}>
        {/* Left Sidebar - matches chat/my-life widths */}
        <div className="w-[380px] xl:w-[420px] bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
          </div>
          
          {/* Profile card (same component used on My Life) */}
          <div className="px-4 pt-4">
            <ProfileCard
              name={personalProfile?.name ?? "Your Name"}
              avatarUrl={personalProfile?.avatarUrl}
            />
          </div>

          {/* Sidebar options styled like For You/My Life cards */}
          <nav className="flex-1 overflow-hidden p-4 space-y-3" style={{ marginTop: '64px' }}>
            {items.map(({ id, label, Icon }) => (
              <div key={id} className="relative">
                <button
                  aria-label={label}
                  className="w-full rounded-xl bg-white flex items-center gap-3 px-4 py-4 transition-all duration-200 focus:outline-none group text-left"
                  style={{
                    minHeight: '72px',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => {/* placeholder - no content for now */}}
                >
                  <div className="flex items-center" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                    <Icon size={20} className="text-gray-900 leading-none" />
                  </div>
                  <span className="text-gray-900 font-semibold" style={{ fontSize: '16px' }}>{label}</span>
                </button>
              </div>
            ))}
          </nav>
        </div>

        {/* Right Content - placeholder */}
        <div className="flex-1 bg-white flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Select a menu option</h2>
            <p className="text-gray-500 mt-2">Content coming soon.</p>
          </div>
        </div>
      </div>

      {/* Mobile: keep simple placeholder for now */}
      <div className="lg:hidden min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Menu</h1>
          <p className="text-gray-500 mt-2">Coming soon.</p>
        </div>
      </div>
    </>
  );
}

