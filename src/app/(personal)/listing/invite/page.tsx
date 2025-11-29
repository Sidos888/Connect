"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { Users, Check } from 'lucide-react';
import { MobilePage, PageHeader, PageContent } from '@/components/layout/PageSystem';
import Avatar from '@/components/Avatar';
import { SearchIcon } from '@/components/icons';

interface Contact {
  id: string;
  name: string;
  profile_pic?: string | null;
  profilePic?: string | null;
  connect_id?: string;
  connectId?: string;
  type: 'person' | 'business';
}

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');
  const { account } = useAuth();
  const chatService = useChatService();
  const queryClient = useQueryClient();
  const [friends, setFriends] = useState<Contact[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no listing ID
  useEffect(() => {
    if (!listingId) {
      router.push('/my-life');
    }
  }, [listingId, router]);

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      if (!account?.id || !chatService || !listingId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await getSupabaseClient().auth.getUser();
        if (!user) {
          setError('User not authenticated');
          return;
        }

        const { contacts, error: contactsError } = await chatService.getContacts(user.id);

        if (contactsError) {
          setError('Failed to load contacts');
          return;
        }

        // Fetch existing pending invites for this listing
        const supabase = getSupabaseClient();
        const { data: existingInvites, error: invitesError } = await supabase
          .from('listing_invites')
          .select('invitee_id')
          .eq('listing_id', listingId)
          .eq('status', 'pending');

        if (invitesError) {
          console.error('Error fetching existing invites:', invitesError);
          // Continue anyway, just won't filter
        }

        // Create a set of user IDs who already have pending invites
        const pendingInviteeIds = new Set(
          (existingInvites || []).map((inv: any) => inv.invitee_id)
        );

        // Filter out contacts who already have pending invites
        const friendsList: Contact[] = contacts
          .filter(contact => !pendingInviteeIds.has(contact.id))
          .map(contact => ({
            id: contact.id,
            name: contact.name,
            profile_pic: contact.profile_pic,
            profilePic: contact.profile_pic,
            connect_id: contact.connect_id,
            connectId: contact.connect_id,
            type: 'person' as const,
          }));

        setFriends(friendsList);
        setFilteredFriends(friendsList);
      } catch (err) {
        console.error('Error loading contacts:', err);
        setError('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [account?.id, chatService, listingId]);

  // Filter contacts based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.connect_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.connectId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [searchQuery, friends]);

  const handleContactToggle = (contactId: string) => {
    const contact = friends.find(c => c.id === contactId);
    if (!contact) return;

    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contactId);
      if (isSelected) {
        return prev.filter(c => c.id !== contactId);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const handleSendInvites = async () => {
    console.log('📧 handleSendInvites: Called', {
      listingId,
      accountId: account?.id,
      selectedCount: selectedContacts.length,
      selectedIds: selectedContacts.map(c => c.id)
    });

    if (!listingId || !account?.id || selectedContacts.length === 0) {
      console.warn('📧 handleSendInvites: Early return', {
        hasListingId: !!listingId,
        hasAccountId: !!account?.id,
        hasSelectedContacts: selectedContacts.length > 0
      });
      return;
    }

    setSending(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Database connection failed');
      }

      // For each contact, check if there's an existing invite
      const inviteeIds = selectedContacts.map(contact => contact.id);
      console.log('📧 handleSendInvites: Fetching existing invites', { listingId, inviteeIds });
      
      // Get existing invites for these users and this listing
      const { data: existingInvites, error: fetchError } = await supabase
        .from('listing_invites')
        .select('id, invitee_id, status')
        .eq('listing_id', listingId)
        .in('invitee_id', inviteeIds);

      if (fetchError) {
        console.error('📧 handleSendInvites: Error fetching existing invites:', fetchError);
        // Continue anyway, will try to insert
      } else {
        console.log('📧 handleSendInvites: Existing invites found', { count: existingInvites?.length || 0, invites: existingInvites });
      }

      const existingInvitesMap = new Map(
        (existingInvites || []).map((inv: any) => [inv.invitee_id, inv])
      );

      // Separate contacts into: new invites, declined invites (to re-invite), and pending (skip)
      const newInvites: Array<{ listing_id: string; inviter_id: string; invitee_id: string; status: string }> = [];
      const invitesToUpdate: Array<{ id: string; status: string }> = [];

      for (const contact of selectedContacts) {
        const existing = existingInvitesMap.get(contact.id);
        
        if (!existing) {
          // No existing invite - create new one
          newInvites.push({
            listing_id: listingId,
            inviter_id: account.id,
            invitee_id: contact.id,
            status: 'pending'
          });
        } else if (existing.status === 'declined' || existing.status === 'accepted') {
          // Existing invite is declined or accepted - update to pending (re-invite)
          // Check if user is still a participant (if accepted)
          if (existing.status === 'accepted') {
            const { data: participant } = await supabase
              .from('listing_participants')
              .select('id')
              .eq('listing_id', listingId)
              .eq('user_id', contact.id)
              .eq('status', 'upcoming')
              .maybeSingle();

            // If user is still a participant, skip re-inviting
            if (participant) {
              continue;
            }
          }
          
          // User declined or left - re-invite by updating to pending
          invitesToUpdate.push({
            id: existing.id,
            status: 'pending'
          });
        }
        // If status is 'pending', skip (already invited)
      }

      console.log('📧 handleSendInvites: Processing invites', {
        newInvites: newInvites.length,
        invitesToUpdate: invitesToUpdate.length
      });

      // Update declined/accepted invites to pending
      if (invitesToUpdate.length > 0) {
        console.log('📧 handleSendInvites: Updating invites', { count: invitesToUpdate.length, inviteIds: invitesToUpdate.map(i => i.id) });
        for (const invite of invitesToUpdate) {
          const { data: updatedData, error: updateError } = await supabase
            .from('listing_invites')
            .update({ status: 'pending', updated_at: new Date().toISOString() })
            .eq('id', invite.id)
            .select();

          if (updateError) {
            console.error('📧 handleSendInvites: Error updating invite:', updateError);
            throw updateError; // Throw error to prevent navigation
          } else {
            console.log('📧 handleSendInvites: Update response', { 
              id: invite.id, 
              updatedRows: updatedData?.length || 0,
              newStatus: updatedData?.[0]?.status || 'unknown',
              fullData: updatedData
            });
            
            // Verify the update actually worked
            if (!updatedData || updatedData.length === 0) {
              console.error('📧 handleSendInvites: WARNING - No rows updated', { inviteId: invite.id });
              throw new Error(`Failed to update invite ${invite.id}: No rows affected`);
            }
            
            if (updatedData[0].status !== 'pending') {
              console.error('📧 handleSendInvites: WARNING - Status not updated correctly', { 
                inviteId: invite.id,
                expected: 'pending',
                actual: updatedData[0].status
              });
              throw new Error(`Failed to update invite ${invite.id}: Status is ${updatedData[0].status} instead of pending`);
            }
            
            console.log('✅ 📧 handleSendInvites: Verified invite status is now pending', { inviteId: invite.id });
          }
        }
      }

      // Insert new invites
      if (newInvites.length > 0) {
        console.log('📧 handleSendInvites: Inserting new invites', { count: newInvites.length, invites: newInvites });
        const { error: insertError } = await supabase
          .from('listing_invites')
          .insert(newInvites);

        if (insertError) {
          console.error('📧 handleSendInvites: Error sending invites:', insertError);
          
          // Check if table doesn't exist
          if (insertError.code === 'PGRST205' || insertError.message?.includes('Could not find the table')) {
            setError('Database table not found. Please run the migration: sql/create-listing-invites-table.sql');
          } else {
            setError(`Failed to send invitations: ${insertError.message || 'Unknown error'}`);
          }
          setSending(false);
          return;
        } else {
          console.log('📧 handleSendInvites: Successfully inserted invites', { count: newInvites.length });
        }
      }

      console.log('📧 handleSendInvites: All invites processed successfully, invalidating queries');
      
      // Invalidate React Query caches to refresh notifications and attendees
      if (account?.id) {
        // Invalidate invites for all invitees (they should see the new invite)
        for (const contact of selectedContacts) {
          queryClient.invalidateQueries({ queryKey: ['listing-invites', contact.id] });
        }
        // Also invalidate the current user's invites (in case they're viewing their own notifications)
        queryClient.invalidateQueries({ queryKey: ['listing-invites', account.id] });
        // Invalidate listing participants to refresh attendees page
        queryClient.invalidateQueries({ queryKey: ['listing-participant'] });
        // Invalidate listing data
        queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      }
      
      // Add a delay to ensure database updates are committed before navigation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSending(false);

      // Navigate back - check if we came from attendees page
      const fromParam = searchParams.get('from');
      if (fromParam) {
        router.push(fromParam);
      } else {
        router.push(`/listing?id=${listingId}`);
      }
    } catch (err) {
      console.error('Error sending invites:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('listing_invites')) {
        setError('Database table not found. Please run the migration: sql/create-listing-invites-table.sql');
      } else {
        setError(`Failed to send invitations: ${errorMessage}`);
      }
      setSending(false);
    }
  };

  const hasChanges = selectedContacts.length > 0;

  if (!listingId) {
    return null;
  }

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Invite"
          backButton
          onBack={() => {
            const fromParam = searchParams.get('from');
            if (fromParam) {
              router.push(fromParam);
            } else {
              router.push(`/listing?id=${listingId}`);
            }
          }}
          customActions={
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📧 Invite button clicked', { hasChanges, sending, selectedCount: selectedContacts.length });
                handleSendInvites();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              disabled={!hasChanges || sending}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '100px',
                background: hasChanges && !sending ? '#FF6600' : '#9CA3AF',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                pointerEvents: 'auto',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                if (hasChanges && !sending) {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <Check size={18} className="text-white" />
            </button>
          }
        />

        <PageContent>
          <div 
            className="px-4 pb-[max(env(safe-area-inset-bottom),24px)]"
            style={{
              paddingTop: 'var(--saved-content-padding-top, 140px)',
            }}
          >
            {/* Top Spacing */}
            <div style={{ height: '24px' }} />

            {/* Search Bar */}
            <div className="flex-shrink-0 mb-4" style={{ padding: '0 0 16px 0' }}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full focus:outline-none"
                  style={{
                    borderRadius: "100px",
                    height: "46.5px",
                    background: "rgba(255, 255, 255, 0.9)",
                    borderWidth: "0.4px",
                    borderColor: "#E5E7EB",
                    borderStyle: "solid",
                    boxShadow:
                      "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
                    willChange: "transform, box-shadow",
                    paddingLeft: "48px",
                    paddingRight: "24px",
                    fontSize: "16px",
                    WebkitAppearance: "none",
                    WebkitTapHighlightColor: "transparent",
                    color: "#111827",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)";
                  }}
                />
                <div
                  className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none"
                  style={{ width: "48px" }}
                >
                  <SearchIcon
                    size={20}
                    className="text-gray-900"
                    style={{ strokeWidth: 2.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Contacts List */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-500">Loading contacts...</p>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-500">
                    {searchQuery ? "No contacts found" : "No contacts yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFriends
                    .filter(friend => friend.id !== account?.id)
                    .map((friend) => {
                      const isSelected = selectedContacts.some(c => c.id === friend.id);
                      return (
                        <button
                          key={friend.id}
                          onClick={() => handleContactToggle(friend.id)}
                          className="w-full bg-white rounded-xl p-4 flex items-center gap-3 text-left transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
                          style={{
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            borderStyle: 'solid',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            minHeight: '72px',
                            cursor: 'pointer',
                            willChange: 'transform, box-shadow'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                          }}
                        >
                          {/* Profile Picture */}
                          <div className="flex-shrink-0">
                            <Avatar
                              src={friend.profile_pic || undefined}
                              name={friend.name}
                              size={40}
                            />
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-gray-900 truncate">
                              {friend.name}
                            </div>
                          </div>

                          {/* Selection Circle */}
                          <div className="flex-shrink-0">
                            <div
                              className="flex items-center justify-center"
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                borderWidth: '2px',
                                borderColor: isSelected ? '#F97316' : '#D1D5DB',
                                borderStyle: 'solid',
                                background: isSelected ? '#F97316' : 'transparent'
                              }}
                            >
                              {isSelected && (
                                <div
                                  style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: 'white'
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}
