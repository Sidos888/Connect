"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { ArrowLeft, Settings, ChevronRight } from "lucide-react";
import { SearchIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";
import ChatDetailsSearchModal from "@/components/chat/ChatDetailsSearchModal";
import { useChatMessages } from "@/lib/chatQueries";
import type { SimpleMessage } from "@/lib/types";

export const dynamic = 'force-dynamic';

function DmDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
  const [loading, setLoading] = useState(true);
  const [chatType, setChatType] = useState<'direct' | 'group' | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('User Name');
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [mediaCount, setMediaCount] = useState<number>(0);
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

        if (chat.type === 'direct') {
          // Find the other participant
          const otherParticipant = chat.participants?.find((p: any) => p.id !== account.id);
          if (otherParticipant) {
            setOtherUserId(otherParticipant.id);
            setOtherUserName(otherParticipant.name || 'User Name');
            setOtherUserAvatar(otherParticipant.profile_pic || null);
          } else {
            router.replace('/chat');
          }
        }
        
        // Fetch media count
        if (chatId) {
          const { media, error } = await chatService.getChatMedia(chatId);
          if (!error && media) {
            setMediaCount(media.length);
          }
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
      router.push(`/chat/dm-details/settings?chat=${chatId}`);
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

  // Only show for direct messages
  if (!chatId || chatType !== 'direct' || !otherUserId) {
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
              <div className="text-gray-500">Chat not found</div>
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
              title="Chat Details"
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
          
          {/* Profile Card - Matching menu page ProfileCard styling with normal page padding */}
          <div
            style={{
              marginBottom: '32px', // Increased spacing before media card
            }}
          >
            <button
              onClick={() => {
                if (otherUserId && chatId) {
                  router.push(`/profile?id=${otherUserId}&from=${encodeURIComponent(`/chat/dm-details?chat=${chatId}`)}`);
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
              {/* Avatar - Left positioned (matching ProfileCard) */}
              <div className="flex items-center flex-shrink-0">
                <Avatar
                  src={otherUserAvatar}
                  name={otherUserName}
                  size={36}
                />
              </div>
              
              {/* User Name - Centered to entire card */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-900"
                style={{
                  pointerEvents: 'none',
                }}
              >
                {otherUserName}
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
            <h2 className="text-lg font-bold text-gray-900 mb-3">Events</h2>
            
            {/* Event Card */}
            <div
              className="bg-white rounded-2xl p-4 flex items-center gap-3"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              {/* Event Placeholder Image */}
              <div
                className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                }}
              >
                <div className="text-gray-400 text-xs">Event</div>
              </div>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-gray-900 mb-1 truncate">
                  Event Name
                </div>
                <div className="text-sm text-gray-500 truncate">
                  Date and Time
                </div>
              </div>

              {/* Navigation Arrow */}
              <div className="flex-shrink-0">
                <ChevronRight size={20} className="text-gray-400" />
              </div>
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

export default function DmDetailsPage() {
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
      <DmDetailsContent />
    </Suspense>
  );
}

