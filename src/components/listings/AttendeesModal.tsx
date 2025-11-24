"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { listingsService } from '@/lib/listingsService';
import { connectionsService } from '@/lib/connectionsService';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Avatar from '@/components/Avatar';

interface Attendee {
  id: string;
  name: string;
  profile_pic: string | null;
  role: 'host' | 'participant';
  eventStatus: 'viewing' | 'host' | 'attendee';
  relationshipStatus: 'me' | 'friends' | 'mutuals' | null;
  isCurrentUser: boolean;
}

interface AttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingHostId: string | null; // The host_id from the listing
  currentUserId: string;
  isCurrentUserParticipant: boolean; // Whether current user is registered as participant
}

export default function AttendeesModal({ 
  isOpen, 
  onClose, 
  listingId,
  listingHostId,
  currentUserId,
  isCurrentUserParticipant 
}: AttendeesModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
      loadAttendees();
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
  }, [isOpen, listingId, currentUserId, isCurrentUserParticipant]);

  // Detect device corner radius on mount
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  const loadAttendees = async () => {
    if (!listingId || !currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Database connection failed');
        setLoading(false);
        return;
      }

      // 1. Get all participants from listing_participants table
      const { participants: rawParticipants, error: participantsError } = 
        await listingsService.getListingParticipants(listingId);

      if (participantsError) {
        setError('Failed to load attendees');
        setLoading(false);
        return;
      }

      // 2. Get host account info if host_id exists and host is not already in participants
      let hostAccount: { id: string; name: string; profile_pic: string | null } | null = null;
      if (listingHostId) {
        const hostInParticipants = rawParticipants.find(p => p.id === listingHostId);
        if (!hostInParticipants) {
          // Host is not in listing_participants, fetch from accounts table
          const { data: hostData, error: hostError } = await supabase
            .from('accounts')
            .select('id, name, profile_pic')
            .eq('id', listingHostId)
            .single();

          if (!hostError && hostData) {
            hostAccount = {
              id: hostData.id,
              name: hostData.name,
              profile_pic: hostData.profile_pic,
            };
          }
        }
      }

      // 3. Check if current user is viewing (not registered)
      const currentUserIsViewing = !isCurrentUserParticipant;

      // 4. Process each participant to determine relationships
      const processedAttendees: Attendee[] = await Promise.all(
        rawParticipants.map(async (participant) => {
          const isCurrentUser = participant.id === currentUserId;
          
          // Determine event status
          let eventStatus: 'viewing' | 'host' | 'attendee';
          if (isCurrentUser && currentUserIsViewing) {
            eventStatus = 'viewing';
          } else if (participant.role === 'host' || participant.id === listingHostId) {
            eventStatus = 'host';
          } else {
            eventStatus = 'attendee';
          }

          // Determine relationship status
          let relationshipStatus: 'me' | 'friends' | 'mutuals' | null = null;
          
          if (isCurrentUser) {
            relationshipStatus = 'me';
          } else {
            // Check if friends (accepted connections only)
            const supabase = getSupabaseClient();
            if (supabase) {
              const { data: connectionData, error: connectionError } = await supabase
                .from('connections')
                .select('id, status')
                .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${participant.id}),and(user1_id.eq.${participant.id},user2_id.eq.${currentUserId})`)
                .eq('status', 'accepted')
                .limit(1)
                .maybeSingle();

              if (!connectionError && connectionData) {
                relationshipStatus = 'friends';
              } else {
                // Check for mutual friends using SQL function
                try {
                  const { data: mutualCount, error: mutualError } = await supabase
                    .rpc('get_mutual_connections_count', {
                      user1_id: currentUserId,
                      user2_id: participant.id
                    });

                  if (!mutualError && mutualCount && mutualCount > 0) {
                    relationshipStatus = 'mutuals';
                  }
                } catch (err) {
                  console.warn('Error checking mutual connections:', err);
                }
              }
            }
          }

          return {
            id: participant.id,
            name: participant.name,
            profile_pic: participant.profile_pic,
            role: participant.role,
            eventStatus,
            relationshipStatus,
            isCurrentUser,
          };
        })
      );

      // 5. Add host if they're not already in the participants list
      if (hostAccount) {
        const hostInList = processedAttendees.find(a => a.id === hostAccount!.id);
        if (!hostInList) {
          // Process host's relationship status
          let hostRelationshipStatus: 'me' | 'friends' | 'mutuals' | null = null;
          
          if (hostAccount.id === currentUserId) {
            hostRelationshipStatus = 'me';
          } else {
            // Check if friends
            const { data: connectionData, error: connectionError } = await supabase
              .from('connections')
              .select('id, status')
              .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${hostAccount.id}),and(user1_id.eq.${hostAccount.id},user2_id.eq.${currentUserId})`)
              .eq('status', 'accepted')
              .limit(1)
              .maybeSingle();

            if (!connectionError && connectionData) {
              hostRelationshipStatus = 'friends';
            } else {
              // Check for mutual friends
              try {
                const { data: mutualCount, error: mutualError } = await supabase
                  .rpc('get_mutual_connections_count', {
                    user1_id: currentUserId,
                    user2_id: hostAccount.id
                  });

                if (!mutualError && mutualCount && mutualCount > 0) {
                  hostRelationshipStatus = 'mutuals';
                }
              } catch (err) {
                console.warn('Error checking mutual connections for host:', err);
              }
            }
          }

          processedAttendees.push({
            id: hostAccount.id,
            name: hostAccount.name,
            profile_pic: hostAccount.profile_pic,
            role: 'host',
            eventStatus: 'host',
            relationshipStatus: hostRelationshipStatus,
            isCurrentUser: hostAccount.id === currentUserId,
          });
        }
      }

      // 6. Add current user as "viewing" if they're not in the participants list
      if (currentUserIsViewing) {
        const currentUserInList = processedAttendees.find(a => a.isCurrentUser);
        if (!currentUserInList) {
          // Get current user's account info
          const supabase = getSupabaseClient();
          if (supabase) {
            const { data: accountData } = await supabase
              .from('accounts')
              .select('id, name, profile_pic')
              .eq('id', currentUserId)
              .single();

            if (accountData) {
              processedAttendees.unshift({
                id: accountData.id,
                name: accountData.name,
                profile_pic: accountData.profile_pic,
                role: 'participant',
                eventStatus: 'viewing',
                relationshipStatus: 'me',
                isCurrentUser: true,
              });
            }
          }
        }
      }

      // 7. Sort attendees: user (top), hosts, friends, mutuals, attendees
      const sortedAttendees = sortAttendees(processedAttendees);

      setAttendees(sortedAttendees);
      setLoading(false);
    } catch (err) {
      console.error('Error loading attendees:', err);
      setError('Failed to load attendees');
      setLoading(false);
    }
  };

  const sortAttendees = (attendees: Attendee[]): Attendee[] => {
    // Separate into groups
    const currentUser = attendees.find(a => a.isCurrentUser);
    const hosts = attendees.filter(a => a.role === 'host' && !a.isCurrentUser);
    const friends = attendees.filter(
      a => a.relationshipStatus === 'friends' && !a.isCurrentUser && a.role !== 'host'
    );
    const mutuals = attendees.filter(
      a => a.relationshipStatus === 'mutuals' && !a.isCurrentUser && a.role !== 'host'
    );
    const regularAttendees = attendees.filter(
      a => !a.isCurrentUser && 
           a.role !== 'host' && 
           a.relationshipStatus !== 'friends' && 
           a.relationshipStatus !== 'mutuals'
    );

    // Combine in order: user, hosts, friends, mutuals, attendees
    const sorted: Attendee[] = [];
    if (currentUser) sorted.push(currentUser);
    sorted.push(...hosts);
    sorted.push(...friends);
    sorted.push(...mutuals);
    sorted.push(...regularAttendees);

    return sorted;
  };

  if (!shouldRender) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAttendeeClick = (attendeeId: string) => {
    router.push(`/profile?id=${attendeeId}`);
    handleClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: 'calc(100% - 16px)',
          maxWidth: '500px',
          marginTop: '20px',
          marginBottom: '8px',
          height: '85vh',
          borderTopLeftRadius: `${cornerRadius}px`,
          borderTopRightRadius: `${cornerRadius}px`,
          borderBottomLeftRadius: `${cornerRadius}px`,
          borderBottomRightRadius: `${cornerRadius}px`,
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
          <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Participants</h2>
          <button
            onClick={handleClose}
            className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              right: '24px',
              top: '24px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
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
            <X size={18} className="text-gray-900" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-y-auto" style={{ padding: '0 24px 24px 24px' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500">Loading attendees...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : attendees.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500">No attendees yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendees.map((attendee) => (
                <button
                  key={attendee.id}
                  onClick={() => handleAttendeeClick(attendee.id)}
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
                      src={attendee.profile_pic || undefined}
                      name={attendee.name}
                      size={40}
                    />
                  </div>

                  {/* Name and Status */}
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 mb-1 truncate">
                      {attendee.name}
                    </div>
                    <div className="text-sm font-normal text-gray-900 truncate">
                      {attendee.eventStatus === 'viewing' ? 'Viewing' : 
                       attendee.eventStatus === 'host' ? 'Host' : 
                       'Attendee'}
                    </div>
                  </div>

                  {/* Relationship Status */}
                  {attendee.relationshipStatus && (
                    <div className="flex-shrink-0">
                      <span className="text-sm font-normal text-gray-500">
                        {attendee.relationshipStatus === 'me' ? 'Me' :
                         attendee.relationshipStatus === 'friends' ? 'Friends' :
                         'Mutuals'}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

