"use client";

import { useState } from 'react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import ChatPhotoViewer from "@/components/chat/ChatPhotoViewer";
import type { MediaAttachment } from '@/lib/types';

interface ChatAttachmentGalleryViewProps {
  isOpen: boolean;
  attachments: MediaAttachment[];
  onClose: () => void;
}

export default function ChatAttachmentGalleryView({
  isOpen,
  attachments,
  onClose
}: ChatAttachmentGalleryViewProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!isOpen || attachments.length === 0) {
    return null;
  }

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleClosePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  return (
    <>
      <div className="lg:hidden fixed inset-0 z-[100] bg-white" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Photos & Videos"
            subtitle={`${attachments.length} ${attachments.length === 1 ? 'Item' : 'Items'}`}
            backButton
            onBack={onClose}
          />

          <PageContent>
            <div 
              className="px-4 pb-8" 
              style={{ 
                paddingTop: 'var(--saved-content-padding-top, 180px)',
              }}
            >
              <div className="grid grid-cols-4 gap-4 relative overflow-visible">
                {attachments.map((attachment, index) => {
                  // Validate URL - check if it's a valid URL
                  const isValidUrl = attachment.file_url && (
                    attachment.file_url.startsWith('http://') ||
                    attachment.file_url.startsWith('https://') ||
                    attachment.file_url.startsWith('blob:') ||
                    attachment.file_url.startsWith('data:')
                  );
                  
                  console.log(`Attachment ${index}:`, {
                    id: attachment.id,
                    file_url: attachment.file_url,
                    file_type: attachment.file_type,
                    isValidUrl,
                    urlLength: attachment.file_url?.length
                  });
                  
                  return (
                  <button
                    key={attachment.id || index}
                    onClick={() => handlePhotoClick(index)}
                    className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    }}
                  >
                    {attachment.file_type === 'video' ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                        {attachment.thumbnail_url ? (
                          <>
                            <img
                              src={attachment.thumbnail_url}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                            {/* Play icon overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Check if URL is a blob URL - these won't work when loading from database */}
                        {(attachment.file_url.startsWith('blob:') || attachment.file_url.startsWith('capacitor://')) ? (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div className="text-xs text-gray-500">Unavailable</div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <img
                              src={attachment.file_url}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // If image fails to load, show placeholder
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.parentElement?.querySelector('.image-placeholder');
                                if (placeholder) {
                                  (placeholder as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                            <div className="image-placeholder absolute inset-0 bg-gray-100 flex items-center justify-center" style={{ display: 'none' }}>
                              <div className="text-center">
                                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div className="text-xs text-gray-500">Failed to load</div>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </button>
                  );
                })}
              </div>
            </div>
          </PageContent>
        </MobilePage>
      </div>

      {selectedPhotoIndex !== null && (
        <ChatPhotoViewer
          isOpen={selectedPhotoIndex !== null}
          attachments={attachments}
          initialIndex={selectedPhotoIndex}
          onClose={handleClosePhotoViewer}
        />
      )}
    </>
  );
}

