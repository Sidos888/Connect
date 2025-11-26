"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useChatService } from "@/lib/chatProvider";
import InlineProfileView from "@/components/InlineProfileView";
import GroupInfoModal from "@/components/chat/GroupInfoModal";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import { ChevronRight } from "lucide-react";

export const dynamic = 'force-dynamic';

function ChatDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = searchParams.get('chat');
  const { account } = useAuth();
  const chatService = useChatService();
  const [loading, setLoading] = useState(true);
  const [chatType, setChatType] = useState<'direct' | 'group' | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

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
            setShowUserProfile(true);
          } else {
            router.replace('/chat');
          }
        } else {
          // Group chat
          setShowGroupInfo(true);
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

  const handleStartChat = async (chatId: string) => {
    router.push(`/chat?chat=${chatId}`);
  };

  if (loading) {
    return (
      <MobilePage>
        <PageHeader
          title="Details"
          backButton
          onBack={() => router.back()}
        />
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </MobilePage>
    );
  }

  // If no chatId, show error state
  if (!chatId) {
    return (
      <MobilePage>
        <PageHeader
          title="Details"
          backButton
          onBack={() => router.back()}
        />
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Chat not found</div>
        </div>
      </MobilePage>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* User Profile for Direct Messages */}
      {chatType === 'direct' && otherUserId && showUserProfile && (
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => {
              setShowUserProfile(false);
              router.back();
            }}
          />
          <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative z-10">
            <div className="flex flex-col h-full">
              <InlineProfileView
                userId={otherUserId}
                entryPoint="chat"
                onBack={() => {
                  setShowUserProfile(false);
                  router.back();
                }}
                onStartChat={handleStartChat}
              />
            </div>
          </div>
        </div>
      )}

      {/* Group Info Modal for Group Chats */}
      {chatType === 'group' && chatId && showGroupInfo && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => {
            setShowGroupInfo(false);
            router.back();
          }}
          chatId={chatId}
        />
      )}

      {/* Fallback: If neither modal is showing, show a page structure */}
      {!showUserProfile && !showGroupInfo && (
        <MobilePage>
          <PageHeader
            title="Details"
            backButton
            onBack={() => router.back()}
          />
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading details...</div>
          </div>
        </MobilePage>
      )}
    </div>
  );
}

export default function ChatDetailsPage() {
  return (
    <Suspense fallback={
      <MobilePage>
        <PageHeader
          title="Details"
          backButton
          onBack={() => {}}
        />
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </MobilePage>
    }>
      <ChatDetailsContent />
    </Suspense>
  );
}

