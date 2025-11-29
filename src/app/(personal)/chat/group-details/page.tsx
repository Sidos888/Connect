"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { ArrowLeft, Settings, ChevronRight, Plus } from "lucide-react";
import { SearchIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";
import ChatDetailsSearchModal from "@/components/chat/ChatDetailsSearchModal";
import { useChatMessages } from "@/lib/chatQueries";
import type { SimpleMessage } from "@/lib/types";


function GroupDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
  const [loading, setLoading] = useState(true);
  const [chatType, setChatType] = useState<'direct' | 'group' | null>(null);
  const [groupName, setGroupName] = useState<string>('Group Name');
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [mediaCount, setMediaCount] = useState<number>(0);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load messages for search
  const { data: messages = [] } = useChatMessages(chatService, chatId, 1000);
  
  // Convert messages to format expected by search modal
  const searchMessages = messages.map((msg: SimpleMessage) => ({
    id: msg.id,
    text: msg.text || '',
    sender_name: msg.sender_name,
    created_at: msg.created_at || new Date().toISOString(),
  }));

  useEffect(() => {
    const loadChat = async () => {
      if (!chatId || !account?.id || !chatService) {
        setLoading(false);
        return;
      }

      try {
        const { chat, error } = await chatService.getChatById(chatId);
        if (error || !chat) {
          console.error('Error loading chat:', error);
          router.replace('/chat');
          return;
        }

        setChatType(chat.type === 'direct' ? 'direct' : 'group');

        if (chat.type === 'group') {
          setGroupName(chat.name || 'Group Name');
          setGroupPhoto(chat.photo || null);
          setMembersCount(chat.participants?.length || 0);
        } else {
          // Redirect DMs to DM details page
          router.replace(`/chat/dm-details?chat=${chatId}`);
        }
        
        // Fetch media count
        if (chatId) {
          const { media, error } = await chatService.getChatMedia(chatId);
          if (!error && media) {
            setMediaCount(media.length);
          }
        }

        // Fetch events for this group
        if (chatId) {
          try {
            const supabase = chatService['supabase']; // Access supabase client
            const { data: groupEvents, error: eventsError } = await supabase
              .from('listings')
              .select('id, title, start_date, end_date, photo_urls')
              .eq('group_chat_id', chatId)
              .order('start_date', { ascending: true });

            if (!eventsError && groupEvents) {
              setEvents(groupEvents);
            }
          } catch (error) {
            console.error('Error fetching events:', error);
          } finally {
            setEventsLoading(false);
          }
        } else {
          setEventsLoading(false);
        }
      } catch (error) {
        console.error('Error in loadChat:', error);
        router.replace('/chat');
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [chatId, account?.id, chatService, router]);

  const handleSettingsClick = () => {
    if (chatId) {
      router.push(`/chat/group-details/settings?chat=${chatId}`);
    }
  };

  const handleBack = () => {
    // Always navigate back to the chat page, not using router.back() to avoid redirect loops
    if (chatId) {
      router.push(`/chat/individual?chat=${chatId}`);
    } else {
      router.push('/chat');
    }
  };

  if (loading) {
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Chat Details"
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

  // Only show for group chats
  if (!chatId || chatType !== 'group') {
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Chat Details"
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
              <div className="text-gray-500">Group not found</div>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }


  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Group Details"
          backButton
          onBack={handleBack}
          customActions={
            <div
              className="flex items-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '88px', // Double the normal button width (44px * 2)
                height: '44px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.96)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              {/* Search Icon - Left Side */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSearchOpen(true);
                }}
                className="flex items-center justify-center flex-1 h-full"
              >
                <SearchIcon size={20} className="text-gray-900" style={{ strokeWidth: 2.5 }} />
              </button>
              {/* Settings Icon - Right Side */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSettingsClick();
                }}
                className="flex items-center justify-center flex-1 h-full"
              >
                <Settings size={20} className="text-gray-900" strokeWidth={2.5} />
              </button>
            </div>
          }
        />

        <PageContent>
          <div 
            className="px-4 pb-[max(env(safe-area-inset-bottom),24px)]"
            style={{
              paddingTop: 'var(--saved-content-padding-top, 140px)',
            }}
          >
          {/* Top Spacing - Increased for more space from header */}
          <div style={{ height: '32px' }} />
          
          {/* Profile Card - Group name and members count */}
          <div
            style={{
              marginBottom: '32px', // Increased spacing before media card
            }}
          >
            <button
              onClick={() => {
                if (chatId) {
                  router.push(`/chat/group-details/members?chat=${chatId}`);
                }
              }}
              className="rounded-2xl bg-white flex items-center relative w-full cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                paddingLeft: '24px', // px-6 equivalent (matching ProfileCard slim mode)
                paddingRight: '24px',
                paddingTop: '16px', // Matching ProfileCard
                paddingBottom: '16px', // Matching ProfileCard
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
              {/* Avatar - Left positioned */}
              <div className="flex items-center flex-shrink-0">
                <Avatar
                  src={groupPhoto}
                  name={groupName}
                  size={36}
                />
              </div>
              
              {/* Group Name and Members - Left aligned, next to avatar */}
              <div className="flex-1 flex flex-col ml-3 min-w-0 items-start">
                <div className="text-base font-semibold text-gray-900 text-left">
                  {groupName}
                </div>
                <div className="text-sm text-gray-600 mt-0.5 text-left">
                  {membersCount} Members - View
                </div>
              </div>
            </button>
          </div>

          {/* Media Section */}
          <button
            type="button"
            disabled={!chatId}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('📷 Media button clicked', { chatId, mediaCount });
              if (chatId) {
                router.push(`/chat/media?chat=${chatId}`);
              } else {
                console.warn('📷 Media button: No chatId available');
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('📷 Media button touched', { chatId, mediaCount });
              if (chatId) {
                router.push(`/chat/media?chat=${chatId}`);
              } else {
                console.warn('📷 Media button: No chatId available');
              }
            }}
            className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-between w-full cursor-pointer transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98]"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              position: 'relative',
              zIndex: 10,
              pointerEvents: 'auto',
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
            <div className="text-base font-semibold text-gray-900">Media</div>
            <div className="flex items-center gap-1">
              <span className="text-base text-gray-600">{mediaCount}</span>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </button>

          {/* Events Section */}
          <div className="mb-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (chatId) {
                  router.push(`/chat/events?chat=${chatId}`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (chatId) {
                    router.push(`/chat/events?chat=${chatId}`);
                  }
                }
              }}
              className="bg-white rounded-2xl p-4 w-full transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              {/* Header row: title, count, plus */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-900">Events</span>
                  {events.length > 0 && !eventsLoading && (
                    <span className="text-sm font-medium text-gray-500">{events.length}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (chatId) {
                      router.push(`/my-life/create?group=${chatId}`);
                    }
                  }}
                  className="p-0 bg-transparent border-none outline-none flex items-center justify-center"
                  style={{ cursor: 'pointer' }}
                >
                  <Plus size={20} className="text-gray-900" strokeWidth={2.4} />
                </button>
              </div>

              {/* Body: loading / empty / first event preview */}
              {eventsLoading ? (
                <div className="text-sm text-gray-500 py-2">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">No events yet</div>
              ) : (
                (() => {
                  const event = events[0];
                  const formatDateTime = (dateString: string) => {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });
                  };

                  const thumbnailUrl =
                    event.photo_urls && event.photo_urls.length > 0 ? event.photo_urls[0] : null;

                  return (
                    <div
                      className="mt-1 bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                      }}
                    >
                      {/* Event Image */}
                      <div
                        className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-200"
                        style={{
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          borderStyle: 'solid',
                        }}
                      >
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Event
                          </div>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-base font-semibold text-gray-900 mb-1 truncate">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {event.start_date ? formatDateTime(event.start_date) : 'Date and time'}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
        </PageContent>
      </MobilePage>

      {/* Search Modal */}
      <ChatDetailsSearchModal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery("");
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        messages={searchMessages}
      />
    </div>
  );
}

export default function GroupDetailsPage() {
  return (
    <Suspense fallback={
      <MobilePage>
        <PageHeader
          title="Chat Details"
          backButton
          onBack={() => {}}
        />
        <PageContent>
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        </PageContent>
      </MobilePage>
    }>
      <GroupDetailsContent />
    </Suspense>
  );
}







