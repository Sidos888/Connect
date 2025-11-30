"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import AddMembersSlideModal from '@/components/chat/AddMembersSlideModal';
import { MobilePage } from '@/components/layout/PageSystem';

export default function AddMembersPage() {
  const router = useRouter();
  const { account } = useAuth();
  const chatService = useChatService();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    router.back();
  };

  const handleNext = (selectedContactIds: string[]) => {
    if (selectedContactIds.length === 0) return;
    
    // Navigate to group setup page with selected participants
    const participantIds = selectedContactIds.join(',');
    router.push(`/chat/create-group?participants=${participantIds}`);
  };

  if (!account?.id || !chatService) {
    return null;
  }

  return (
    <MobilePage>
      <AddMembersSlideModal
        isOpen={isOpen}
        onClose={handleClose}
        onNext={handleNext}
        hideBackdrop={true}
        hideContainer={true}
      />
    </MobilePage>
  );
}

