"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";

export default function ListingPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    // Load photos from sessionStorage
    const stored = sessionStorage.getItem('listingPhotos');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPhotos(parsed);
        }
      } catch (e) {
        // If no photos, go back
        router.back();
      }
    } else {
      // If no photos, go back
      router.back();
    }
  }, [router]);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Listing Photos"
          subtitle={<span className="text-xs font-medium text-gray-900">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>}
          backButton
          onBack={handleBack}
        />

        <PageContent>
          <div className="px-4 pb-8" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
            {/* Photo Grid - 4 columns */}
            <div className="grid grid-cols-4 gap-0.5">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-gray-100 overflow-hidden rounded-xl"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                  }}
                >
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}

