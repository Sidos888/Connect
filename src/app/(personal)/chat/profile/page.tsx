"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InlineProfileView from "@/components/InlineProfileView";
import GroupInfoModal from "@/components/chat/GroupInfoModal";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const chatId = searchParams.get('chatId');
  
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const isGroupProfile = !!chatId;
  const isUserProfile = !!userId;

  // Show the appropriate modal based on the URL parameters
  useEffect(() => {
    if (isUserProfile && userId) {
      setShowUserProfile(true);
    } else if (isGroupProfile && chatId) {
      setShowGroupInfo(true);
    }
  }, [isUserProfile, isGroupProfile, userId, chatId]);

  const handleStartChat = async (chatId: string) => {
    router.push(`/chat?chat=${chatId}`);
  };

  return (
    <>
      {/* User Profile Modal */}
      {isUserProfile && userId && showUserProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-in-out"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
            onClick={() => {
              setShowUserProfile(false);
              router.back();
            }}
          />
          <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative">
            <div className="flex flex-col h-full">
              <InlineProfileView
                userId={userId}
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

      {/* Group Info Modal */}
      {isGroupProfile && chatId && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => {
            setShowGroupInfo(false);
            router.back();
          }}
          chatId={chatId}
        />
      )}
    </>
  );
}
