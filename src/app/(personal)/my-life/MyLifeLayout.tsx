"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React from "react";
import Avatar from "@/components/Avatar";
import { useAppStore } from "@/lib/store";
import ProfileStrip from "@/components/my-life/ProfileStrip";
import QuickActions from "@/components/my-life/QuickActions";
import Section from "@/components/my-life/Section";
import Carousel from "@/components/my-life/Carousel";
import MiniEventCard from "@/components/my-life/MiniEventCard";
import StatTile from "@/components/my-life/StatTile";
import { User, Plus, Hourglass, Target, RefreshCw, FileText, History as HistoryIcon, MoreVertical, Eye, X, Settings, Pencil } from "lucide-react";
import EditProfileModal from "@/components/chat/EditProfileModal";
import { ChevronLeftIcon } from "@/components/icons";
import EditProfileLanding from "@/components/settings/EditProfileLanding";
import ShareProfileModal from "@/components/ShareProfileModal";
import SettingsContent from "@/components/settings/SettingsContent";
import CenteredAccountSettings from "@/components/settings/CenteredAccountSettings";
import CenteredShareProfile from "@/components/profile/CenteredShareProfile";
import { PageHeader } from "@/components/layout/PageSystem";
import ConnectionsModal from "@/components/chat/ConnectionsModal";
import CenteredConnections from "@/components/connections/CenteredConnections";
import CenteredAddPerson from "@/components/connections/CenteredAddPerson";
import { useAuth } from "@/lib/authContext";
import UnifiedProfileCard from "@/components/profile/UnifiedProfileCard";

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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [showCenteredProfile, setShowCenteredProfile] = React.useState(false);
  const [showCenteredEditLanding, setShowCenteredEditLanding] = React.useState(false);
  const [editProfileFromProfile, setEditProfileFromProfile] = React.useState(false);
  const [showCenteredEditPersonal, setShowCenteredEditPersonal] = React.useState(false);
  const [showShareProfile, setShowShareProfile] = React.useState(false);
  const [showCenteredSettings, setShowCenteredSettings] = React.useState(false);
  const [profileFromSettings, setProfileFromSettings] = React.useState(false);
  const [showCenteredAccountSettings, setShowCenteredAccountSettings] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [showCenteredConnections, setShowCenteredConnections] = React.useState(false);
  const [showCenteredAddPerson, setShowCenteredAddPerson] = React.useState(false);
  const [showCenteredFriendProfile, setShowCenteredFriendProfile] = React.useState(false);
  const [selectedFriend, setSelectedFriend] = React.useState<any>(null);
  const [showCenteredAchievements, setShowCenteredAchievements] = React.useState(false);
  const [showCenteredHighlights, setShowCenteredHighlights] = React.useState(false);
  const [showCenteredShareProfile, setShowCenteredShareProfile] = React.useState(false);
  const { account, signOut, deleteAccount, user } = useAuth();
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const profileMenuButtonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!isProfileMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const clickedInsideMenu = !!(profileMenuRef.current && target && profileMenuRef.current.contains(target));
      const clickedButton = !!(profileMenuButtonRef.current && target && profileMenuButtonRef.current.contains(target));
      if (!clickedInsideMenu && !clickedButton) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isProfileMenuOpen]);

  // Lock background scroll when any centered modal is open
  React.useEffect(() => {
    if (
      showCenteredProfile ||
      showCenteredEditLanding ||
      showCenteredEditPersonal ||
      showCenteredSettings ||
      showCenteredAccountSettings ||
      showCenteredConnections ||
      showCenteredAddPerson ||
      showCenteredFriendProfile ||
      showCenteredAchievements ||
      showCenteredHighlights ||
      showCenteredShareProfile
    ) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showCenteredProfile, showCenteredEditLanding, showCenteredEditPersonal, showCenteredSettings, showCenteredAccountSettings, showCenteredConnections, showCenteredAddPerson, showCenteredFriendProfile, showCenteredAchievements, showCenteredHighlights, showCenteredShareProfile]);

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
            <div 
              className="rounded-2xl bg-white px-5 py-4 grid grid-cols-[40px_1fr_40px] items-center cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onClick={() => {
                setShowCenteredProfile(true);
              }}
            >
              <div className="flex items-center">
                <Avatar
                  src={personalProfile?.avatarUrl ?? undefined}
                  name={personalProfile?.name ?? "Your Name"}
                  size={40}
                />
              </div>
              <div className="text-base font-semibold text-neutral-900 text-center">
                {personalProfile?.name ?? "Your Name"}
              </div>
              <div
                className="flex justify-end relative"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileMenuOpen((v) => !v);
                  }}
                  ref={profileMenuButtonRef}
                  className="flex items-center justify-center w-10 h-10"
                  aria-label="Open profile menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  <MoreVertical className="h-5 w-5 text-gray-900" />
                </button>
                {isProfileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    role="menu"
                    aria-label="Profile actions"
                    className="absolute -right-5 top-12 z-20 w-56 rounded-2xl border border-neutral-200 bg-white shadow-xl p-1"
                  >
                    <button
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileMenuOpen(false);
                    setShowCenteredProfile(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                    >
                      <Eye className="h-5 w-5 text-gray-700" />
                      View Profile
                    </button>
                    <div className="mx-2 my-1 h-px bg-neutral-200" />
                    <button
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileMenuOpen(false);
                        setEditProfileFromProfile(false);
                        setShowCenteredEditLanding(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                    >
                      <Pencil className="h-5 w-5 text-gray-700" />
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clean list items with icons (match Menu card rows) */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
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
        <div className="flex-1 bg-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 capitalize">{active}</h2>
            <p className="text-gray-500 mt-2">This section is coming soon.</p>
          </div>
        </div>
      </div>
      {/* Desktop centered profile modal */}
      {showCenteredProfile && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div 
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowCenteredProfile(false)}
          />

          <UnifiedProfileCard
            profile={{ id: personalProfile?.id, name: personalProfile?.name, avatarUrl: personalProfile?.avatarUrl, bio: personalProfile?.bio }}
            isOwnProfile={true}
            showBackButton={profileFromSettings}
            onClose={() => {
              setShowCenteredProfile(false);
              if (profileFromSettings) {
                setShowCenteredSettings(true);
                setProfileFromSettings(false);
              }
            }}
            onEdit={() => { setShowCenteredProfile(false); setEditProfileFromProfile(true); setShowCenteredEditLanding(true); }}
            onSettings={() => { setShowCenteredProfile(false); setProfileFromSettings(true); setShowCenteredSettings(true); }}
            onShare={() => { setShowCenteredProfile(false); setShowCenteredShareProfile(true); }}
            onOpenTimeline={() => { setShowCenteredProfile(false); router.push('/timeline'); }}
            onOpenHighlights={() => { setShowCenteredProfile(false); setShowCenteredHighlights(true); }}
            onOpenBadges={() => { setShowCenteredProfile(false); setShowCenteredAchievements(true); }}
            onOpenConnections={() => { setShowCenteredProfile(false); setShowCenteredConnections(true); }}
          />
        </div>
      )}

      {/* (share-profile handled by dedicated route with centered card on web) */}
      {/* Centered Edit Profile Modal */}
      {showCenteredEditLanding && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowCenteredEditLanding(false)}
          />
          <EditProfileLanding
            name={personalProfile?.name ?? 'Your Name'}
            avatarUrl={personalProfile?.avatarUrl ?? undefined}
            onBack={() => {
              setShowCenteredEditLanding(false);
              if (editProfileFromProfile) {
                setShowCenteredProfile(true);
                setEditProfileFromProfile(false);
              } else {
                setShowCenteredSettings(true);
              }
            }}
            onOpenLinks={() => { setShowCenteredEditLanding(false); router.push('/settings/edit/links'); }}
            onOpenPersonalDetails={() => { setShowCenteredEditLanding(false); setShowCenteredEditPersonal(true); }}
            onOpenTimeline={() => { setShowCenteredEditLanding(false); router.push('/timeline'); }}
            onOpenHighlights={() => { setShowCenteredEditLanding(false); router.push('/settings/edit/highlights'); }}
          />
        </div>
      )}

      {showCenteredEditPersonal && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowCenteredEditPersonal(false)}
          />
          <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
            <div className="flex flex-col h-full">
              <EditProfileModal
                onBack={() => {
                  setShowCenteredEditPersonal(false);
                  setShowCenteredEditLanding(true);
                }}
                onSave={() => {
                  setShowCenteredEditPersonal(false);
                  setShowCenteredEditLanding(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Centered Settings Modal (web) */}
      {showCenteredSettings && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowCenteredSettings(false)}
          />
          <div 
            className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
            style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
          >
            <PageHeader
              title="Settings"
              backButton
              backIcon={profileFromSettings ? "arrow" : "close"}
              onBack={() => {
                setShowCenteredSettings(false);
                if (profileFromSettings) {
                  setShowCenteredProfile(true);
                  setProfileFromSettings(false);
                }
              }}
            />
            
            <div className="flex-1 overflow-y-auto scrollbar-hide" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <SettingsContent
                onBack={() => setShowCenteredSettings(false)}
                onSignOut={async () => {
                  await signOut();
                  router.push('/');
                }}
                onDeleteAccount={() => setShowDeleteConfirm(true)}
                showDeleteConfirm={showDeleteConfirm}
                showFinalConfirm={showFinalConfirm}
                onConfirmDelete={async () => {
                  setIsDeletingAccount(true);
                  await deleteAccount();
                  setIsDeletingAccount(false);
                  router.push('/');
                }}
                onCancelDelete={() => {
                  setShowDeleteConfirm(false);
                  setShowFinalConfirm(false);
                }}
                onProceedToFinalConfirm={() => setShowFinalConfirm(true)}
                onBackToMenu={() => {
                  setShowDeleteConfirm(false);
                  setShowFinalConfirm(false);
                  setShowCenteredSettings(false);
                }}
                isDeletingAccount={isDeletingAccount}
                personalProfile={personalProfile}
                showBackButton={false}
                onViewProfile={() => {
                  setShowCenteredSettings(false);
                  setProfileFromSettings(true);
                  setShowCenteredProfile(true);
                }}
                onEditProfile={() => {
                  setShowCenteredSettings(false);
                  setEditProfileFromProfile(false);
                  setShowCenteredEditLanding(true);
                }}
                onAccountSettings={() => {
                  setShowCenteredSettings(false);
                  setShowCenteredAccountSettings(true);
                }}
              />
            </div>
            
            {/* Bottom Blur */}
            <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
              <div className="absolute bottom-0 left-0 right-0" style={{
                height: '80px',
                background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
              }} />
              <div className="absolute bottom-0 left-0 right-0" style={{ height: '20px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
              <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '20px', backdropFilter: 'blur(0.3px)', WebkitBackdropFilter: 'blur(0.3px)' }} />
              <div className="absolute left-0 right-0" style={{ bottom: '40px', height: '20px', backdropFilter: 'blur(0.15px)', WebkitBackdropFilter: 'blur(0.15px)' }} />
              <div className="absolute left-0 right-0" style={{ bottom: '60px', height: '20px', backdropFilter: 'blur(0.05px)', WebkitBackdropFilter: 'blur(0.05px)' }} />
            </div>
          </div>
        </div>
      )}

      {/* Centered Connections Modal (web) - shared with Menu */}
      {showCenteredConnections && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowCenteredConnections(false)}
          />
          <CenteredConnections
            onBack={() => setShowCenteredConnections(false)}
            fromProfile={true}
            showAddPersonButton={true}
            onAddPerson={() => {
              setShowCenteredConnections(false);
              setShowCenteredAddPerson(true);
            }}
            onFriendClick={(friend) => {
              setSelectedFriend(friend);
              setShowCenteredConnections(false);
              setShowCenteredFriendProfile(true);
            }}
          />
        </div>
      )}

      {/* Centered Add Person Modal (web) */}
      {showCenteredAddPerson && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowCenteredAddPerson(false)}
          />
          <CenteredAddPerson
            onBack={() => {
              setShowCenteredAddPerson(false);
              setShowCenteredConnections(true);
            }}
            onOpenRequests={() => {
              // TODO: wire Friend Requests centered modal if needed
            }}
          />
        </div>
      )}

      {/* Centered Friend Profile Modal (web) */}
      {showCenteredFriendProfile && selectedFriend && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => {
              setShowCenteredFriendProfile(false);
              setSelectedFriend(null);
            }}
          />
          <UnifiedProfileCard
            profile={{ id: selectedFriend.id, name: selectedFriend.name, avatarUrl: selectedFriend.profile_pic, bio: selectedFriend.bio }}
            isOwnProfile={false}
            showBackButton={true}
            onClose={() => {
              setShowCenteredFriendProfile(false);
              setSelectedFriend(null);
              setShowCenteredConnections(true);
            }}
            onThreeDotsMenu={() => {
              // Inactive for now
            }}
            onOpenConnections={() => {
              // TODO: Show their connections in a modal
            }}
          />
        </div>
      )}

      {/* Centered Achievements Modal (web) */}
      {showCenteredAchievements && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowCenteredAchievements(false)}
          />
          <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
            <div className="flex items-center justify-between p-6">
              <button onClick={() => setShowCenteredAchievements(false)} className="p-2 hover:bg-gray-100 transition-colors rounded-full">
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
              <div className="w-9" />
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-gray-500 text-lg">You don't have any achievements yet ;(</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered Highlights Modal (web) */}
      {showCenteredHighlights && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowCenteredHighlights(false)}
          />
          <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
            <div className="flex items-center justify-between p-6">
              <button onClick={() => setShowCenteredHighlights(false)} className="p-2 hover:bg-gray-100 transition-colors rounded-full">
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Highlights</h2>
              <div className="w-9" />
            </div>
            <div className="flex-1" />
          </div>
        </div>
      )}

      {/* Mobile layout */}
      <div className="lg:hidden min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-6 lg:pt-6">

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

      {/* Centered Account Settings Modal */}
      {showCenteredAccountSettings && (
        <CenteredAccountSettings
          onClose={() => {
            setShowCenteredAccountSettings(false);
            setShowCenteredSettings(true);
          }}
          onDeleteAccount={() => setShowDeleteConfirm(true)}
        />
      )}

      {/* Centered Share Profile Modal */}
      {showCenteredShareProfile && (
        <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
          {/* Dimming overlay */}
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowCenteredShareProfile(false)}
          />
          <CenteredShareProfile onBack={() => setShowCenteredShareProfile(false)} />
        </div>
      )}
    </>
  );
}





