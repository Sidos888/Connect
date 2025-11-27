"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { Plus } from "lucide-react";
import Avatar from "@/components/Avatar";
import AddGroupMembersModal from "@/components/chat/AddGroupMembersModal";

interface GroupMember {
  id: string;
  name: string;
  profile_pic?: string | null;
  role?: 'admin' | 'member';
}

export default function GroupMembersClient() {
  console.log('🔍 GroupMembersClient: Component rendering');
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState<string>('Group');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  console.log('🔍 GroupMembersClient: Initial state', {
    chatId,
    hasAccount: !!account,
    accountId: account?.id,
    hasChatService: !!chatService,
    loading
  });

  useEffect(() => {
    console.log('🔍 GroupMembersClient: useEffect triggered', {
      chatId,
      accountId: account?.id,
      hasChatService: !!chatService
    });
    loadGroupData();
  }, [chatId, account?.id, chatService]);

  const handleBack = () => {
    if (chatId) {
      router.push(`/chat/group-details?chat=${chatId}`);
    } else {
      router.push('/chat');
    }
  };

  const handleAddMember = () => {
    setShowAddMembersModal(true);
  };

  const handleMembersAdded = () => {
    // Reload group data to show new members
    if (chatId && account?.id && chatService) {
      loadGroupData();
    }
  };

  const loadGroupData = async () => {
    console.log('🔍 GroupMembersClient: loadGroupData called', {
      chatId,
      hasAccount: !!account,
      accountId: account?.id,
      hasChatService: !!chatService
    });

    if (!chatId || !account?.id || !chatService) {
      console.log('🔍 GroupMembersClient: Missing required data, skipping load');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 GroupMembersClient: Calling getChatById', { chatId });
      const { chat, error } = await chatService.getChatById(chatId);
      console.log('🔍 GroupMembersClient: getChatById result', {
        hasChat: !!chat,
        error: error?.message,
        participantsCount: chat?.participants?.length
      });

      if (error || !chat) {
        console.error('🔍 GroupMembersClient: Error loading chat:', error);
        router.replace('/chat');
        return;
      }

      // Only allow group chats
      if (chat.type !== 'group') {
        console.log('🔍 GroupMembersClient: Not a group chat, redirecting');
        router.replace('/chat');
        return;
      }

      setGroupName(chat.name || 'Group');
      
      // Extract members from participants - filter out any invalid entries
      console.log('🔍 GroupMembersClient: Processing participants', {
        participantsType: typeof chat.participants,
        isArray: Array.isArray(chat.participants),
        participantsLength: chat.participants?.length
      });

      const participants = Array.isArray(chat.participants) ? chat.participants : [];
      console.log('🔍 GroupMembersClient: Participants array', participants);

      const groupMembers: GroupMember[] = participants
        .filter((p: any) => {
          // Ensure p exists and has required properties
          if (!p || typeof p !== 'object') {
            console.log('🔍 GroupMembersClient: Filtering out invalid participant', p);
            return false;
          }
          // Check if id exists and is a valid string
          if (!p.id || typeof p.id !== 'string') {
            console.log('🔍 GroupMembersClient: Filtering out participant without valid id', p);
            return false;
          }
          return true;
        })
        .map((p: any) => {
          console.log('🔍 GroupMembersClient: Mapping participant', {
            id: p.id,
            name: p.name,
            hasProfilePic: !!p.profile_pic,
            role: p.role
          });
          return {
            id: p.id,
            name: p.name || 'User Name',
            profile_pic: p.profile_pic || null,
            role: p.role || 'member',
          };
        });

      console.log('🔍 GroupMembersClient: Final groupMembers', groupMembers);
      setMembers(groupMembers);
      setMembersCount(groupMembers.length);
    } catch (error) {
      console.error('🔍 GroupMembersClient: Error in loadGroupData:', error);
      router.replace('/chat');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (memberId: string) => {
    if (chatId) {
      router.push(`/profile?id=${memberId}&from=${encodeURIComponent(`/chat/group-details/members?chat=${chatId}`)}`);
    }
  };

  console.log('🔍 GroupMembersClient: Render state', {
    loading,
    membersCount,
    membersLength: members.length,
    hasAccount: !!account,
    hasChatService: !!chatService
  });

  if (loading) {
    console.log('🔍 GroupMembersClient: Rendering loading state');
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Group"
            backButton
            onBack={handleBack}
          />
          <PageContent>
            <div 
              className="flex items-center justify-center h-full"
              style={{
                paddingTop: 'var(--saved-content-padding-top, 140px)',
              }}
            >
              <div className="text-gray-500">Loading...</div>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  console.log('🔍 GroupMembersClient: Rendering main content', {
    membersCount,
    members: members.map(m => ({ id: m.id, name: m.name }))
  });

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Group"
          backButton
          onBack={handleBack}
          subtitle={
            <div className="text-sm text-gray-500 mt-1">
              {membersCount} Members
            </div>
          }
          customActions={
            <button
              onClick={handleAddMember}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.96)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <Plus size={20} className="text-gray-900" strokeWidth={2.5} />
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
            
            {/* Members List */}
            <div className="space-y-3">
              {Array.isArray(members) && members.length > 0 ? (
                members.map((member) => {
                  if (!member || !member.id) {
                    console.warn('🔍 GroupMembersClient: Invalid member in map', member);
                    return null;
                  }
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleMemberClick(member.id)}
                      className="w-full rounded-2xl bg-white flex items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-[1px]"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        willChange: 'transform, box-shadow',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <Avatar
                          src={member.profile_pic || undefined}
                          name={member.name || 'Unknown'}
                          size={40}
                        />
                      </div>
                      
                      {/* Member Name */}
                      <div className="flex-1 text-left">
                        <div className="text-base font-semibold text-gray-900">
                          {member.name || 'Unknown'}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-gray-500 text-center py-8">No members found</div>
              )}
            </div>
          </div>
        </PageContent>
      </MobilePage>

      {/* Add Members Modal */}
      {chatId && (
        <AddGroupMembersModal
          isOpen={showAddMembersModal}
          onClose={() => setShowAddMembersModal(false)}
          chatId={chatId}
          existingMemberIds={Array.isArray(members) ? members.map(m => m?.id).filter((id): id is string => Boolean(id)) : []}
          onMembersAdded={handleMembersAdded}
        />
      )}
    </div>
  );
}

