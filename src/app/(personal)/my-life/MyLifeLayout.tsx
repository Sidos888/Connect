"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Avatar from "@/components/Avatar";
import { useAppStore } from "@/lib/store";
import { useModal } from "@/lib/modalContext";
import ProfileStrip from "@/components/my-life/ProfileStrip";
import QuickActions from "@/components/my-life/QuickActions";
import Section from "@/components/my-life/Section";
import Carousel from "@/components/my-life/Carousel";
import MiniEventCard from "@/components/my-life/MiniEventCard";
import StatTile from "@/components/my-life/StatTile";
import { User, Plus, Hourglass, Target, RefreshCw, FileText, History as HistoryIcon, MoreVertical } from "lucide-react";
import ProfileCard from "@/components/profile/ProfileCard";
import EditProfileModal from "@/components/chat/EditProfileModal";
import { ChevronLeftIcon } from "@/components/icons";
import EditProfileLanding from "@/components/settings/EditProfileLanding";
import ShareProfileModal from "@/components/ShareProfileModal";
import SettingsContent from "@/components/settings/SettingsContent";
import CenteredAccountSettings from "@/components/settings/CenteredAccountSettings";
import CenteredShareProfile from "@/components/profile/CenteredShareProfile";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import ConnectionsModal from "@/components/chat/ConnectionsModal";
import CenteredConnections from "@/components/connections/CenteredConnections";
import CenteredAddPerson from "@/components/connections/CenteredAddPerson";
import { useAuth } from "@/lib/authContext";
import ProfilePage from "@/components/profile/ProfilePage";
import CenteredTimeline from "@/components/timeline/CenteredTimeline";
import ProfileSwitcherSheet from "@/components/profile/ProfileSwitcherSheet";

type TabDef = { id: string; label: string; Icon?: React.ComponentType<{ size?: number; className?: string }> };

const TABS: Array<TabDef> = [
  { id: "profile", label: "Profile", Icon: User },
  { id: "create", label: "Create", Icon: Plus },
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
  const modal = useModal(); // Use unified modal system
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [showProfileSwitcher, setShowProfileSwitcher] = React.useState(false);
  const { account, signOut, deleteAccount, user } = useAuth();

  // Lock body scroll on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) { // lg breakpoint
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const setTab = (id: string) => {
    const sp = new URLSearchParams(searchParams as any);
    sp.set("tab", id);
    router.push(`/my-life?${sp.toString()}`);
  };

  return (
    <>
      {/* Desktop (web) layout with Menu design principles */}
      <div className="hidden lg:flex h-screen bg-gray-50" style={{ maxHeight: '100vh', overflow: 'hidden' }}>
        {/* Sidebar - width matches chat */}
        <div className="w-[380px] xl:w-[420px] bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">My Life</h1>
          </div>

          {/* Profile card at top (mirrors Menu profile card) */}
          <div className="px-4 pt-4">
            <ProfileCard
                  name={personalProfile?.name ?? "Your Name"}
              avatarUrl={personalProfile?.avatarUrl}
              onClick={() => setTimeout(() => modal.showProfile(), 0)}
              onViewProfile={() => setTimeout(() => modal.showProfile(), 0)}
              onEditProfile={() => setTimeout(() => modal.showEditProfile('my-life'), 0)}
              onShareProfile={() => setTimeout(() => modal.showShareProfile('my-life'), 0)}
            />
          </div>

          {/* Clean list items with icons (match Menu card rows) */}
          <nav className="flex-1 overflow-hidden p-4 space-y-2">
            {TABS.filter(t => t.id !== "profile").map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-4 text-left text-gray-900 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                  active === id ? "bg-neutral-50" : "bg-transparent"
                }`}
              >
                {Icon ? <Icon size={20} className="text-gray-900 transition-all duration-200" /> : null}
                <span className="font-medium text-base transition-all duration-200">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 capitalize">{active}</h2>
            <p className="text-gray-500 mt-2">This section is coming soon.</p>
          </div>
        </div>
      </div>
      
      {/* Mobile layout */}
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader 
            title="My Life"
            customBackButton={
              <button
                onClick={() => setShowProfileSwitcher(true)}
                className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow',
                  padding: '2px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                aria-label="Switch account"
              >
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden">
                  <Avatar 
                    src={account?.profile_pic || personalProfile?.avatarUrl} 
                    name={account?.name || personalProfile?.name || ""} 
                    size={36} 
              />
            </div>
              </button>
            }
          />

          <div
            className="flex-1 px-4 lg:px-8 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto scrollbar-hide"
            style={{
              paddingTop: 'var(--saved-content-padding-top, 140px)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div className="space-y-8 pb-6">
              <ProfileCard
                name={personalProfile?.name ?? "Your Name"}
                avatarUrl={personalProfile?.avatarUrl}
                onClick={() => setTimeout(() => modal.showProfile(), 0)}
                onViewProfile={() => setTimeout(() => modal.showProfile(), 0)}
                onEditProfile={() => setTimeout(() => modal.showEditProfile('my-life'), 0)}
                onShareProfile={() => setTimeout(() => modal.showShareProfile('my-life'), 0)}
              />

          {/* Sections */}
              <div className="space-y-6">
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
                <div className="grid grid-cols-2 gap-3">
              <StatTile title="Drafts" value="0" />
              <StatTile title="History" value="0" />
            </div>
          </div>
        </div>
          </div>
        </MobilePage>
      </div>

      {/* Profile Switcher Sheet */}
      <ProfileSwitcherSheet 
        isOpen={showProfileSwitcher}
        onClose={() => setShowProfileSwitcher(false)}
      />
    </>
  );
}
