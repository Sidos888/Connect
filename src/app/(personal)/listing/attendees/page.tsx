"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { listingsService } from '@/lib/listingsService';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { MobilePage, PageHeader } from '@/components/layout/PageSystem';
import { Plus } from 'lucide-react';

interface Attendee {
  id: string;
  name: string;
  profile_pic: string | null;
  role: 'host' | 'participant';
}

interface InvitedUser {
  id: string;
  name: string;
  profile_pic: string | null;
  inviter_id: string;
  status: 'pending' | 'accepted' | 'declined';
  invite_id: string; // The listing_invites.id
}

export default function ListingAttendeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account } = useAuth();
  const queryClient = useQueryClient();
  const listingId = searchParams.get('id');
  const from = searchParams.get('from') || '/listing?id=' + listingId + '&view=manage';

  const [activePill, setActivePill] = useState<'attending' | 'invited'>('attending');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (listingId) {
      loadData();
    }
  }, [listingId]);

  // Refresh data when page becomes visible (e.g., returning from invite page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && listingId) {
        console.log('📋 Attendees page: Page visible, refreshing data');
        setTimeout(() => {
          loadData();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [listingId]);

  // Also refresh when the page is focused
  useEffect(() => {
    const handleFocus = () => {
      if (listingId) {
        console.log('📋 Attendees page: Page focused, refreshing data');
        setTimeout(() => {
          loadData();
        }, 300);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [listingId]);

  const loadData = async () => {
    if (!listingId) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Database connection failed');
        setLoading(false);
        return;
      }

      // Load attendees (participants)
      const { participants, error: participantsError } = 
        await listingsService.getListingParticipants(listingId);

      if (participantsError) {
        console.error('Error loading participants:', participantsError);
      } else {
        setAttendees(participants.map(p => ({
          id: p.id,
          name: p.name,
          profile_pic: p.profile_pic,
          role: p.role
        })));
      }

      // Check if user is host
      if (account) {
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('host_id')
          .eq('id', listingId)
          .single();

        if (!listingError && listingData) {
          setIsHost(listingData.host_id === account.id);
        }
      }

      // Load invited users
      console.log('📋 Attendees page: Loading invited users for listing', listingId);
      const { data: invitesData, error: invitesError } = await supabase
        .from('listing_invites')
        .select(`
          id,
          invitee_id,
          inviter_id,
          status,
          created_at,
          updated_at,
          accounts!listing_invites_invitee_id_fkey (
            id,
            name,
            profile_pic
          )
        `)
        .eq('listing_id', listingId)
        .in('status', ['pending', 'accepted', 'declined'])
        .order('updated_at', { ascending: false });

      if (invitesError) {
        console.error('📋 Attendees page: Error loading invites:', invitesError);
      } else {
        const invited: InvitedUser[] = (invitesData || [])
          .filter((inv: any) => inv.accounts)
          .map((inv: any) => ({
            id: inv.accounts.id,
            name: inv.accounts.name,
            profile_pic: inv.accounts.profile_pic,
            inviter_id: inv.inviter_id,
            status: inv.status,
            invite_id: inv.id
          }));
        console.log('📋 Attendees page: Loaded invited users', {
          total: invited.length,
          pending: invited.filter(inv => inv.status === 'pending').length,
          accepted: invited.filter(inv => inv.status === 'accepted').length,
          declined: invited.filter(inv => inv.status === 'declined').length
        });
        setInvitedUsers(invited);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(from);
  };

  const handleInvite = () => {
    if (!listingId) return;
    const currentPath = `/listing/attendees?id=${listingId}&from=${encodeURIComponent(from)}`;
    router.push(`/listing/invite?id=${listingId}&from=${encodeURIComponent(currentPath)}`);
  };

  const handleProfileClick = (userId: string) => {
    const currentPath = `/listing/attendees?id=${listingId}&from=${encodeURIComponent(from)}`;
    router.push(`/profile?id=${userId}&from=${encodeURIComponent(currentPath)}`);
  };

  const handleCancelInvite = async (inviteId: string, inviteeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the profile click
    
    if (!listingId || !account) {
      console.error('Cannot cancel invite: missing listingId or account');
      return;
    }

    try {
      const { success, error } = await listingsService.cancelListingInvite(
        inviteId,
        listingId,
        account.id
      );

      if (error || !success) {
        console.error('Error canceling invite:', error);
        alert('Failed to cancel invite. Please try again.');
        return;
      }

      // Remove the invite from the local state
      setInvitedUsers(prev => prev.filter(inv => inv.invite_id !== inviteId));

      // Invalidate queries to refresh notifications
      queryClient.invalidateQueries({ queryKey: ['listing-invites', inviteeId] });
      queryClient.invalidateQueries({ queryKey: ['listing-invites'] });
      
      console.log('✅ Invite canceled successfully');
    } catch (err) {
      console.error('Error canceling invite:', err);
      alert('Failed to cancel invite. Please try again.');
    }
  };

  const attendingCount = attendees.length;
  const invitedCount = invitedUsers.filter(inv => inv.status === 'pending').length;

  // Categories for pills - matching connections page structure
  const categories = [
    { id: 'attending', label: 'Attending', count: attendingCount },
    { id: 'invited', label: 'Invited', count: invitedCount },
  ];

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Attendees"
          backButton
          onBack={handleBack}
          actions={[
            {
              icon: <Plus size={20} className="text-gray-900" />,
              onClick: handleInvite,
              label: "Invite"
            }
          ]}
        />
        
        <div className="flex-1 px-8 overflow-y-auto scrollbar-hide" style={{
          paddingTop: 'var(--saved-content-padding-top, 140px)',
          paddingBottom: '32px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
            {/* Category Pills - Matching connections page styling */}
            <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 -mx-1" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
            {categories.map((category) => {
              const isActive = activePill === category.id;
              return (
                <div
                  key={category.id}
                  className="flex-shrink-0"
                  style={{ 
                    paddingLeft: isActive ? '2px' : '0',
                    paddingRight: isActive ? '2px' : '0',
                    paddingTop: isActive ? '2px' : '0',
                    paddingBottom: isActive ? '2px' : '0',
                  }}
                >
                  <button
                    onClick={() => setActivePill(category.id as 'attending' | 'invited')}
                    className="inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-all duration-200 focus:outline-none bg-white"
                    style={{
                      minHeight: isActive ? '44px' : '40px',
                      paddingLeft: isActive ? '18px' : '16px',
                      paddingRight: isActive ? '18px' : '16px',
                      paddingTop: isActive ? '12px' : '10px',
                      paddingBottom: isActive ? '12px' : '10px',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      color: isActive ? '#111827' : '#6B7280',
                      willChange: 'transform, box-shadow',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      e.currentTarget.style.transform = isActive ? 'scale(1.05) translateY(-1px)' : 'scale(1) translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1)';
                    }}
                  >
                    <span className="text-sm font-medium leading-none">{category.label}</span>
                    {category.count !== null && (
                      <span
                        className={`ml-2 text-xs leading-none ${
                          isActive ? 'text-neutral-700' : 'text-neutral-500'
                        }`}
                      >
                        {category.count}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-orange-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : activePill === 'attending' ? (
            attendees.length > 0 ? (
              attendees.map((attendee) => (
                <div 
                  key={attendee.id} 
                  onClick={() => handleProfileClick(attendee.id)}
                  className="bg-white rounded-2xl p-4 min-h-[70px] cursor-pointer transition-all duration-200 hover:-translate-y-[1px] w-full" 
                  style={{ 
                    borderWidth: '0.4px', 
                    borderColor: '#E5E7EB', 
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
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{
                        borderWidth: '0.5px',
                        borderStyle: 'solid',
                        borderColor: 'rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      {attendee.profile_pic ? (
                        <img src={attendee.profile_pic} alt={attendee.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-sm font-medium">{attendee.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{attendee.name}</h3>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-500 text-sm">No attendees yet</p>
              </div>
            )
          ) : (
            invitedUsers.filter(inv => inv.status === 'pending').length > 0 ? (
              invitedUsers
                .filter(inv => inv.status === 'pending')
                .map((invited) => (
                  <div 
                    key={invited.id} 
                    onClick={() => handleProfileClick(invited.id)}
                    className="bg-white rounded-2xl p-4 min-h-[70px] cursor-pointer transition-all duration-200 hover:-translate-y-[1px] w-full" 
                    style={{ 
                      borderWidth: '0.4px', 
                      borderColor: '#E5E7EB', 
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
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{
                          borderWidth: '0.5px',
                          borderStyle: 'solid',
                          borderColor: 'rgba(0, 0, 0, 0.08)'
                        }}
                      >
                        {invited.profile_pic ? (
                          <img src={invited.profile_pic} alt={invited.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">{invited.name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{invited.name}</h3>
                      </div>
                      {isHost && (
                        <button
                          onClick={(e) => handleCancelInvite(invited.invite_id, invited.id, e)}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="flex-shrink-0 px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
                          style={{
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            borderStyle: 'solid',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            willChange: 'transform, box-shadow',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                          }}
                        >
                          Cancel Invite
                        </button>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📧</div>
                <p className="text-gray-500 text-sm">No pending invitations</p>
              </div>
            )
          )}
          </div>
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
      </MobilePage>
    </div>
  );
}
