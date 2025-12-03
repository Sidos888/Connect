"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import { ChevronRight } from "lucide-react";
import RemoveFriendSlideModal from "@/components/chat/RemoveFriendSlideModal";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";

export default function DmSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
  const [showRemoveFriendModal, setShowRemoveFriendModal] = useState(false);
  const [otherParticipantName, setOtherParticipantName] = useState<string | null>(null);
  const [otherParticipantId, setOtherParticipantId] = useState<string | null>(null);

  // Bottom settings cards (dangerous actions with red text)
  const bottomCards = [
    { id: 'remove-friend', label: 'Remove Friend' },
  ];

  // Load conversation data to get other participant info
  useEffect(() => {
    const loadConversation = async () => {
      if (!chatId || !account?.id || !chatService) return;

      try {
        const { chat, error } = await chatService.getChatById(chatId);
        if (error || !chat) {
          console.error('Error loading chat:', error);
          return;
        }

        // For direct chats, find the other participant
        if (chat.type === 'direct' && chat.participants) {
          const otherParticipant = chat.participants.find((p: any) => p.id && p.id !== account.id);
          if (otherParticipant) {
            setOtherParticipantName(otherParticipant.name || 'Unknown');
            setOtherParticipantId(otherParticipant.id);
          }
        }
      } catch (error) {
        console.error('Error in loadConversation:', error);
      }
    };

    loadConversation();
  }, [chatId, account?.id, chatService]);

  const handleCardClick = (cardId: string) => {
    console.log('DmSettingsPage: Card clicked:', cardId);
    if (cardId === 'remove-friend') {
      console.log('DmSettingsPage: Opening remove friend modal');
      console.log('DmSettingsPage: otherParticipantName:', otherParticipantName);
      console.log('DmSettingsPage: otherParticipantId:', otherParticipantId);
      setShowRemoveFriendModal(true);
    } else {
      // Placeholder - add functionality later
      console.log(`${cardId} clicked for chat ${chatId}`);
    }
  };

  const renderCard = (card: { id: string; label: string }, isRed: boolean = false) => (
    <button
      key={card.id}
      onClick={() => handleCardClick(card.id)}
      className="w-full bg-white rounded-xl flex items-center justify-between transition-all duration-200 hover:-translate-y-[1px]"
      style={{
        padding: '16px',
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
      <div className={`text-base font-medium ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        {card.label}
      </div>
      <ChevronRight size={20} className="text-gray-400" />
    </button>
  );

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="DM Settings"
          backButton
          onBack={() => {
            if (chatId) {
              router.push(`/chat/dm-details?chat=${chatId}`);
            } else {
              router.push('/chat');
            }
          }}
        />

        <div
          className="flex-1 px-4 overflow-y-auto scrollbar-hide flex flex-col"
          style={{
            paddingTop: 'var(--saved-content-padding-top, 140px)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Bottom Cards - Pushed to bottom */}
          <div className="space-y-4 mt-auto pb-12 pt-6">
            {bottomCards.map((card) => renderCard(card, true))}
          </div>
        </div>
      </MobilePage>

      {/* Remove Friend Modal */}
      <RemoveFriendSlideModal
        isOpen={showRemoveFriendModal}
        onClose={() => setShowRemoveFriendModal(false)}
        userName={otherParticipantName || 'this user'}
        userId={otherParticipantId || undefined}
        chatId={chatId || undefined}
      />
    </div>
  );
}

