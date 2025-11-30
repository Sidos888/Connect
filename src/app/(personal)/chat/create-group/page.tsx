'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import NewGroupChatSlideModal from '@/components/chat/NewGroupChatSlideModal';
import { MobilePage } from '@/components/layout/PageSystem';

export default function CreateGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account } = useAuth();
  const chatService = useChatService();
  
  // Get participant IDs from URL params (memoized to stabilize useEffect deps)
  const participantIds = useMemo(() => {
    const participants = searchParams.get('participants');
    return participants ? participants.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!account?.id) {
      router.push('/chat');
      return;
    }
    
    if (participantIds.length === 0) {
      router.push('/chat');
      return;
    }
  }, [account?.id, participantIds, router]);

  const handleClose = () => {
    router.back();
  };

  const handleGroupCreated = (chatId: string) => {
    // Navigate to the new group chat
    router.push(`/chat/individual?chat=${chatId}`);
  };

  if (!account?.id || participantIds.length === 0 || !chatService) {
    return null;
  }

  return (
    <MobilePage>
      <NewGroupChatSlideModal
        isOpen={isOpen}
        onClose={handleClose}
        selectedContactIds={participantIds}
        hideBackdrop={true}
        hideContainer={true}
      />
    </MobilePage>
  );
}
