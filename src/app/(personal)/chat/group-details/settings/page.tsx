"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { ChevronRight } from "lucide-react";
import LeaveGroupSlideModal from "@/components/chat/LeaveGroupSlideModal";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";

function GroupSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);
  const [groupName, setGroupName] = useState<string>('Group');

  // Load group name for the leave group modal
  useEffect(() => {
    const loadGroupData = async () => {
      if (!chatId || !chatService) return;

      try {
        const { chat, error } = await chatService.getChatById(chatId);
        if (error || !chat) {
          console.error('Error loading chat:', error);
          return;
        }

        if (chat.type === 'group') {
          setGroupName(chat.name || 'Group');
        }
      } catch (error) {
        console.error('Error in loadGroupData:', error);
      }
    };

    loadGroupData();
  }, [chatId, chatService]);

  const handleBack = () => {
    if (chatId) {
      router.push(`/chat/group-details?chat=${chatId}`);
    } else {
      router.push('/chat');
    }
  };

  const handleCardClick = (cardId: string) => {
    if (cardId === 'group-details') {
      if (chatId) {
        router.push(`/chat/group-details/settings/edit?chat=${chatId}`);
      }
    } else if (cardId === 'leave-group') {
      setShowLeaveGroupModal(true);
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
      <ChevronRight size={20} className="text-gray-400" strokeWidth={2.5} />
    </button>
  );

  // Top settings cards
  const topCards = [
    { id: 'notifications', label: 'Notifications' },
    { id: 'group-details', label: 'Group Details' },
  ];

  // Bottom settings cards (dangerous actions with red text)
  const bottomCards = [
    { id: 'leave-group', label: 'Leave Group' },
  ];

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Chat Settings"
          backButton
          onBack={handleBack}
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

            {/* Top Cards */}
            <div className="space-y-3 mb-6">
              {topCards.map(card => renderCard(card))}
            </div>

            {/* Bottom Cards - Red text for dangerous actions */}
            <div className="space-y-3">
              {bottomCards.map(card => renderCard(card, true))}
            </div>
          </div>
        </PageContent>
      </MobilePage>

      {/* Leave Group Modal */}
      {chatId && (
        <LeaveGroupSlideModal
          isOpen={showLeaveGroupModal}
          onClose={() => setShowLeaveGroupModal(false)}
          groupName={groupName}
          chatId={chatId}
        />
      )}
    </div>
  );
}

export default function GroupSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GroupSettingsContent />
    </Suspense>
  );
}
