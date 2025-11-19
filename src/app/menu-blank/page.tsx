"use client";

import React, { useMemo, useState, useRef } from "react";
import { Users, Image as ImageIcon, Trophy, Bookmark, Pencil, Plus, QrCode } from "lucide-react";
import ProfileCard from "@/components/profile/ProfileCard";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useModal } from "@/lib/modalContext";
import { connectionsService } from "@/lib/connectionsService";
import ProfilePage from "@/components/profile/ProfilePage";
import EditProfileLanding from "@/components/settings/EditProfileLanding";
import EditPersonalDetails, { EditPersonalDetailsRef } from "@/components/settings/EditPersonalDetails";
import PageHeader from "@/components/layout/PageHeader";
import CenteredAddPerson from "@/components/connections/CenteredAddPerson";

type MenuItem = { id: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> };

const MENU_ITEMS: MenuItem[] = [
  { id: "connections", label: "Connections", Icon: Users },
  { id: "memories", label: "Memories", Icon: ImageIcon },
  { id: "achievements", label: "Achievements", Icon: Trophy },
  { id: "saved", label: "Saved", Icon: Bookmark },
];

export default function MenuBlankPage() {
  const { personalProfile } = useAppStore();
  const { account } = useAuth();
  const modal = useModal();
  const items = useMemo(() => MENU_ITEMS, []);
  type View = 'none' | 'profile' | 'memories' | 'achievements' | 'saved' | 'connections';
  const [view, setView] = useState<View>('profile');
  const [connectionsTab, setConnectionsTab] = useState<'friends' | 'following'>('friends');
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showEditPersonalDetails, setShowEditPersonalDetails] = useState(false);
  const [editPersonalLoading, setEditPersonalLoading] = useState(false);
  const [editPersonalHasChanges, setEditPersonalHasChanges] = useState(false);
  const editPersonalRef = useRef<EditPersonalDetailsRef>(null);
  const [selectedProfileOption, setSelectedProfileOption] = useState<'timeline' | 'highlights' | 'links' | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);

  React.useEffect(() => {
    const loadConnections = async () => {
      if (view !== 'connections' || !account?.id) return;
      setLoadingConnections(true);
      try {
        const { connections: list } = await connectionsService.getConnections(account.id);
        setConnections(list || []);
      } catch (e) {
        console.error('Failed to load connections', e);
        setConnections([]);
      } finally {
        setLoadingConnections(false);
      }
    };
    loadConnections();
  }, [view, account?.id]);

  // Track changes in edit personal details
  React.useEffect(() => {
    if (editPersonalRef.current) {
      const checkChanges = () => {
        setEditPersonalHasChanges(editPersonalRef.current?.hasChanges || false);
      };
      // Check immediately and set up interval to check periodically
      checkChanges();
      const interval = setInterval(checkChanges, 500);
      return () => clearInterval(interval);
    }
  }, [showEditPersonalDetails]);

  // Debug: log when showEditPersonalDetails changes
  React.useEffect(() => {
    console.log('showEditPersonalDetails changed to:', showEditPersonalDetails);
  }, [showEditPersonalDetails]);

  return (
    <>
      {/* Desktop/Web: Two-pane layout mirroring My Life */}
      <div
        className="hidden lg:flex bg-gray-50"
        style={{
          height: 'calc(100vh - 80px)',
          maxHeight: 'calc(100vh - 80px)',
          overflow: selectedFriend ? 'visible' : 'hidden'
        }}
      >
        {/* Left Sidebar - matches chat/my-life widths */}
        <div className="w-[380px] xl:w-[420px] bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
          </div>
          
          {/* Profile card (same component used on My Life) */}
          <div className="px-4 pt-4">
            <ProfileCard
              name={personalProfile?.name ?? "Your Name"}
              avatarUrl={personalProfile?.avatarUrl}
              onClick={() => setView('profile')}
              onViewProfile={() => setView('profile')}
              customActionIcon={QrCode}
              onCustomAction={() => modal.showShareProfile('menu')}
            />
          </div>

          {/* Sidebar options styled like For You/My Life cards */}
          <nav className="flex-1 overflow-hidden p-4 space-y-3" style={{ marginTop: '64px' }}>
            {items.map(({ id, label, Icon }) => {
              const isSelected = view === (id as View);
              return (
              <div key={id} className="relative">
                <button
                  aria-label={label}
                  className="w-full rounded-xl bg-white flex items-center gap-3 px-4 py-4 transition-all duration-200 focus:outline-none group text-left"
                  style={{
                    minHeight: '72px',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: isSelected
                      ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = isSelected
                      ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => {
                    if (id === 'memories' || id === 'achievements' || id === 'saved' || id === 'connections') {
                      setView(id as View);
                    }
                  }}
                >
                  <div className="flex items-center" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                    <Icon size={20} className="text-gray-900 leading-none" />
                  </div>
                  <span className="text-gray-900 font-semibold" style={{ fontSize: '16px' }}>{label}</span>
                </button>
                {isSelected && (
                  <div
                    className="absolute bg-gray-900"
                    style={{
                      right: '-16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '60%',
                      borderTopLeftRadius: '2px',
                      borderBottomLeftRadius: '2px'
                    }}
                  />
                )}
              </div>
            )})}
          </nav>
        </div>

        {/* Right Content - independently scrollable */}
        <div className="flex-1 bg-white overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {view === 'profile' ? (
            <div className="w-full min-h-full">
              <div style={{ height: '32px' }} />
              <div className="px-8 relative">
                {/* Edit button - positioned at same height as top of profile pic card */}
                <div className="absolute" style={{ top: '0', right: '32px', zIndex: 10 }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Edit button clicked!');
                      setShowEditPersonalDetails(true);
                    }}
                    aria-label="Edit profile"
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                      position: 'relative',
                      zIndex: 100,
                      pointerEvents: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Pencil size={18} className="text-gray-900" />
                  </button>
                </div>
                {/* Profile content in top section - horizontal layout */}
                <div className="flex items-start gap-6">
                  {/* Avatar - left side */}
                  <div
                    className="rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
                    style={{ width: '180px', height: '180px' }}
                  >
                    {personalProfile?.avatarUrl ? (
                      <img
                        src={personalProfile.avatarUrl}
                        alt={personalProfile?.name || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  {/* Name and Bio - right side */}
                  <div className="flex-1 flex flex-col relative" style={{ height: '180px' }}>
                    {/* Name - positioned at top third of avatar */}
                    <div className="relative" style={{ top: '60px' }}>
                      <h2 className="text-4xl font-bold text-gray-900">
                        {personalProfile?.name ?? "Your Name"}
                      </h2>
                    </div>
                    {/* Bio - positioned at bottom third of avatar */}
                    {personalProfile?.bio && (
                      <div className="absolute" style={{ top: '120px' }}>
                        <p className="text-base text-gray-600">
                          {personalProfile.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Divider */}
                <div className="mt-8 w-full border-t" style={{ borderColor: '#E5E7EB' }} />
                {/* Options row - pill style like Connections page */}
                <div className="mt-8 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProfileOption(selectedProfileOption === 'highlights' ? null : 'highlights')}
                    className="inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                    style={{
                      width: '100px',
                      borderWidth: '0.4px',
                      borderColor: selectedProfileOption === 'highlights' ? '#D1D5DB' : '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: selectedProfileOption === 'highlights'
                        ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      color: selectedProfileOption === 'highlights' ? '#111827' : '#374151',
                      willChange: 'transform, box-shadow'
                    }}
                  >
                    <span className="text-sm font-medium leading-none">Highlights</span>
                  </button>
                  <button
                    onClick={() => setSelectedProfileOption(selectedProfileOption === 'timeline' ? null : 'timeline')}
                    className="inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                    style={{
                      width: '100px',
                      borderWidth: '0.4px',
                      borderColor: selectedProfileOption === 'timeline' ? '#D1D5DB' : '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: selectedProfileOption === 'timeline'
                        ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      color: selectedProfileOption === 'timeline' ? '#111827' : '#374151',
                      willChange: 'transform, box-shadow'
                    }}
                  >
                    <span className="text-sm font-medium leading-none">Timeline</span>
                  </button>
                  <button
                    onClick={() => setSelectedProfileOption(selectedProfileOption === 'links' ? null : 'links')}
                    className="inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                    style={{
                      width: '100px',
                      borderWidth: '0.4px',
                      borderColor: selectedProfileOption === 'links' ? '#D1D5DB' : '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: selectedProfileOption === 'links'
                        ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      color: selectedProfileOption === 'links' ? '#111827' : '#374151',
                      willChange: 'transform, box-shadow'
                    }}
                  >
                    <span className="text-sm font-medium leading-none">Links</span>
                  </button>
                </div>
                {/* Selected option card */}
                {selectedProfileOption && (
                  <div className="mt-8 w-full max-w-md mx-auto">
                    <div
                      className="rounded-xl bg-white px-6 py-4"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{selectedProfileOption}</h3>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : view === 'memories' ? (
            <div className="w-full min-h-full">
              <div style={{ height: '32px' }} />
              <div className="px-8">
                <h1 className="text-3xl font-bold text-gray-900">Memories</h1>
                <div className="mt-8 w-full border-t" style={{ borderColor: '#E5E7EB' }} />
                <div className="py-24 text-gray-500">Coming soon.</div>
              </div>
            </div>
          ) : view === 'achievements' ? (
            <div className="w-full min-h-full">
              <div style={{ height: '32px' }} />
              <div className="px-8">
                <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
                <div className="mt-8 w-full border-t" style={{ borderColor: '#E5E7EB' }} />
                <div className="py-24 text-gray-500">Coming soon.</div>
              </div>
            </div>
          ) : view === 'saved' ? (
            <div className="w-full min-h-full">
              <div style={{ height: '32px' }} />
              <div className="px-8">
                <h1 className="text-3xl font-bold text-gray-900">Saved</h1>
                <div className="mt-8 w-full border-t" style={{ borderColor: '#E5E7EB' }} />
                <div className="py-24 text-gray-500">Coming soon.</div>
              </div>
            </div>
          ) : view === 'connections' ? (
            <div className="w-full min-h-full">
              <div style={{ height: '32px' }} />
              <div className="px-8">
                <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
                <div className="mt-8 w-full border-t" style={{ borderColor: '#E5E7EB' }} />
                {/* Pills row like Chats page */}
                <div className="mt-6">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1 -mx-1">
                      {[
                        { id: 'friends', label: 'Friends' },
                        { id: 'following', label: 'Following' }
                      ].map((p) => {
                        const active = connectionsTab === (p.id as 'friends' | 'following');
                        return (
                          <button
                            key={p.id}
                            onClick={() => setConnectionsTab(p.id as 'friends' | 'following')}
                            className="inline-flex items-center justify-center gap-2 h-10 flex-shrink-0 px-4 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                            style={{
                              borderWidth: '0.4px',
                              borderColor: active ? '#D1D5DB' : '#E5E7EB',
                              borderStyle: 'solid',
                              boxShadow: active
                                ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)'
                                : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                              color: active ? '#111827' : '#374151',
                              willChange: 'transform, box-shadow'
                            }}
                          >
                            <span className="text-sm font-medium leading-none">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Add Person Button */}
                    <button
                      onClick={() => setShowAddPerson(true)}
                      className="flex items-center justify-center rounded-full bg-white transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
                      style={{
                        width: '40px',
                        height: '40px',
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
                    >
                      <Plus size={20} className="text-gray-900" />
                    </button>
                  </div>
                </div>
                {/* Connections Grid - real data */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {loadingConnections ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-2xl bg-white flex items-center justify-between px-4 py-4"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          borderStyle: 'solid',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))
                  ) : connections && connections.length > 0 ? (
                    connections.map((connection: any) => {
                      const friend = connection.user1?.id === account?.id ? connection.user2 : connection.user1;
                      if (!friend) return null;
                      return (
                        <div
                          key={connection.id}
                          className="rounded-2xl bg-white flex items-center justify-between px-4 py-4"
                          style={{
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            borderStyle: 'solid',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                          }}
                          onClick={() => setSelectedFriend(friend)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                              {friend.profile_pic ? (
                                <img src={friend.profile_pic} alt={friend.name} className="w-full h-full object-cover" />
                              ) : null}
                            </div>
                            <span className="text-base font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                              {friend.name}
                            </span>
                          </div>
                          <button className="text-sm text-gray-500 hover:text-gray-700" onClick={(e) => { e.stopPropagation(); setSelectedFriend(friend); }}>
                            View
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-gray-500 py-24 text-center">No connections yet.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24">
              <h2 className="text-2xl font-semibold text-gray-900">Select a menu option</h2>
              <p className="text-gray-500 mt-2">Content coming soon.</p>
            </div>
          )}
        </div>
      </div>
      {/* Friend profile modal */}
      {view === 'connections' && selectedFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedFriend(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-[720px] max-h-[90vh] overflow-hidden shadow-2xl">
            <ProfilePage
              profile={{
                id: selectedFriend.id,
                name: selectedFriend.name,
                avatarUrl: selectedFriend.profile_pic,
                bio: selectedFriend.bio
              }}
              isOwnProfile={false}
              showBackButton={true}
              onClose={() => setSelectedFriend(null)}
              onEdit={() => setSelectedFriend(null)}
              onSettings={() => setSelectedFriend(null)}
              onShare={() => {}}
              onOpenTimeline={() => {}}
              onOpenHighlights={() => {}}
              onOpenBadges={() => {}}
              onOpenConnections={() => {}}
            />
          </div>
        </div>
      )}
      {/* Edit profile modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEdit(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-[720px] max-h-[90vh] overflow-hidden shadow-2xl">
            <EditProfileLanding
              name={personalProfile?.name}
              avatarUrl={personalProfile?.avatarUrl}
              onBack={() => setShowEdit(false)}
              onOpenLinks={() => setShowEdit(false)}
              onOpenPersonalDetails={() => setShowEdit(false)}
              onOpenTimeline={() => setShowEdit(false)}
              onOpenHighlights={() => setShowEdit(false)}
            />
          </div>
        </div>
      )}
      {/* Edit Personal Details Modal */}
      {showEditPersonalDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowEditPersonalDetails(false)}
          />
          <div 
            className="relative bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100"
            style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}
          >
            <PageHeader
              title="Personal Details"
              backButton
              backIcon="close"
              onBack={() => setShowEditPersonalDetails(false)}
              customActions={
                editPersonalHasChanges ? (
                  <button
                    key="save"
                    onClick={async () => {
                      if (editPersonalRef.current && !editPersonalLoading) {
                        setEditPersonalLoading(true);
                        try {
                          await editPersonalRef.current.save();
                          setShowEditPersonalDetails(false);
                          setEditPersonalLoading(false);
                          setEditPersonalHasChanges(false);
                        } catch (e) {
                          console.error('Error saving:', e);
                          setEditPersonalLoading(false);
                        }
                      }
                    }}
                    disabled={editPersonalLoading}
                    className="flex items-center justify-center transition-all"
                    style={{
                      height: '40px',
                      paddingLeft: editPersonalLoading ? '20px' : '20px',
                      paddingRight: editPersonalLoading ? '20px' : '20px',
                      minWidth: editPersonalLoading ? '70px' : 'auto',
                      borderRadius: '100px',
                      background: '#FF6600',
                      borderWidth: '0.4px',
                      borderColor: 'rgba(0, 0, 0, 0.04)',
                      borderStyle: 'solid',
                      boxShadow: editPersonalLoading 
                        ? '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        : '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      transform: editPersonalLoading ? 'translateY(0)' : 'translateY(0)',
                      willChange: 'transform, box-shadow',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: editPersonalLoading ? 'not-allowed' : 'pointer',
                      opacity: editPersonalLoading ? 0.7 : 1,
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!editPersonalLoading) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!editPersonalLoading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                  >
                    {editPersonalLoading ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
                      </div>
                    ) : (
                      'Save'
                    )}
                  </button>
                ) : null
              }
            />
            <EditPersonalDetails
              ref={editPersonalRef}
              loading={editPersonalLoading}
            />
          </div>
        </div>
      )}
      {/* Add Person Modal */}
      {showAddPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => setShowAddPerson(false)}
          />
          <CenteredAddPerson
            onBack={() => setShowAddPerson(false)}
          />
        </div>
      )}

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

