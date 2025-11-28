"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabaseClient';
import ChatPhotoViewer from "@/components/chat/ChatPhotoViewer";
import type { MediaAttachment } from '@/lib/types';

export default function ChatPhotosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageId = searchParams.get('messageId');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);

  // Hide bottom nav on mobile
  useEffect(() => {
    document.body.classList.add('hide-bottom-nav');
    document.documentElement.classList.add('hide-bottom-nav');
    
    const hideBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
        (bottomNav as HTMLElement).style.visibility = 'hidden';
        (bottomNav as HTMLElement).style.opacity = '0';
        (bottomNav as HTMLElement).style.transform = 'translateY(100%)';
        (bottomNav as HTMLElement).style.position = 'fixed';
        (bottomNav as HTMLElement).style.bottom = '-100px';
        (bottomNav as HTMLElement).style.zIndex = '-1';
      }
      document.body.style.paddingBottom = '0';
    };

    const showBottomNav = () => {
      document.body.classList.remove('hide-bottom-nav');
      document.documentElement.classList.remove('hide-bottom-nav');
      
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
        (bottomNav as HTMLElement).style.visibility = '';
        (bottomNav as HTMLElement).style.opacity = '';
        (bottomNav as HTMLElement).style.transform = '';
        (bottomNav as HTMLElement).style.position = '';
        (bottomNav as HTMLElement).style.bottom = '';
        (bottomNav as HTMLElement).style.zIndex = '';
      }
      document.body.style.paddingBottom = '';
    };

    hideBottomNav();
    const timeoutId = setTimeout(hideBottomNav, 100);
    const intervalId = setInterval(hideBottomNav, 500);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      showBottomNav();
    };
  }, []);

  // Fetch message attachments
  const { data: attachmentsData, isLoading } = useQuery({
    queryKey: ['chat-message-attachments', messageId],
    queryFn: async () => {
      if (!messageId) return null;
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching message attachments:', error);
        return null;
      }

      return data as MediaAttachment[];
    },
    enabled: !!messageId,
  });

  useEffect(() => {
    if (attachmentsData) {
      setAttachments(attachmentsData);
    } else if (attachmentsData === null && !isLoading) {
      // No attachments found, go back
      router.back();
    }
  }, [attachmentsData, isLoading, router]);

  useEffect(() => {
    if (!messageId && !isLoading) {
      // No message ID, go back
      router.back();
    }
  }, [messageId, isLoading, router]);

  const handleBack = () => {
    router.back();
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleClosePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  if (isLoading) {
    return (
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Chat Photos"
            backButton
            onBack={handleBack}
          />
          <PageContent>
            <div className="px-4 pb-8 text-center text-gray-500" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
              <p>Loading photos...</p>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Chat Photos"
            backButton
            onBack={handleBack}
          />
          <PageContent>
            <div className="px-4 pb-8 text-center text-gray-500" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
              <p>No photos available</p>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  return (
    <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Chat Photos"
          subtitle={<span className="text-xs font-medium text-gray-900">{attachments.length} {attachments.length === 1 ? 'photo' : 'photos'}</span>}
          backButton
          onBack={handleBack}
        />

        <PageContent>
          <div className="px-4 pb-8" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)', boxSizing: 'border-box' }}>
            {/* Photo Grid - 4 columns */}
            <div className="grid grid-cols-4 gap-0.5" style={{ boxSizing: 'border-box', width: '100%' }}>
              {attachments.map((attachment, index) => (
                <div
                  key={attachment.id || index}
                  onClick={() => handlePhotoClick(index)}
                  className="relative aspect-square bg-gray-100 overflow-hidden rounded-xl"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    cursor: 'pointer'
                  }}
                >
                  {attachment.file_type === 'video' && attachment.thumbnail_url ? (
                    <>
                      <img
                        src={attachment.thumbnail_url}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <img 
                      src={attachment.file_url} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </PageContent>
      </MobilePage>

      {/* Full Page Photo Viewer */}
      {selectedPhotoIndex !== null && (
        <ChatPhotoViewer
          isOpen={selectedPhotoIndex !== null}
          attachments={attachments}
          initialIndex={selectedPhotoIndex}
          onClose={handleClosePhotoViewer}
        />
      )}
    </div>
  );
}

