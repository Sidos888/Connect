"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { useAuth } from '@/lib/authContext';
import ListingPhotoCollage from '@/components/listings/ListingPhotoCollage';
import ListingHeader from '@/components/listings/ListingHeader';
import ListingInfoCards from '@/components/listings/ListingInfoCards';

export default function CreateListingPreviewPage() {
  const router = useRouter();
  const { account } = useAuth();
  const [listingTitle, setListingTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [includeEndTime, setIncludeEndTime] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [capacity, setCapacity] = useState(1);
  const [capacityUnlimited, setCapacityUnlimited] = useState(true);


  // Load data from sessionStorage
  useEffect(() => {
    try {
      const storedTitle = sessionStorage.getItem('listingTitle');
      const storedSummary = sessionStorage.getItem('listingSummary');
      const storedLocation = sessionStorage.getItem('listingLocation');
      const storedStartDate = sessionStorage.getItem('listingStartDate');
      const storedEndDate = sessionStorage.getItem('listingEndDate');
      const storedIncludeEndTime = sessionStorage.getItem('listingIncludeEndTime');
      const storedCapacity = sessionStorage.getItem('listingCapacity');
      const storedCapacityUnlimited = sessionStorage.getItem('listingCapacityUnlimited');
      const storedPhotos = sessionStorage.getItem('listingPhotos');

      if (storedTitle) setListingTitle(storedTitle);
      if (storedSummary) setSummary(storedSummary);
      if (storedLocation) setLocation(storedLocation);
      if (storedStartDate) setStartDate(new Date(storedStartDate));
      if (storedEndDate) setEndDate(new Date(storedEndDate));
      if (storedIncludeEndTime) setIncludeEndTime(storedIncludeEndTime === 'true');
      if (storedCapacity) setCapacity(parseInt(storedCapacity, 10));
      if (storedCapacityUnlimited !== null) setCapacityUnlimited(storedCapacityUnlimited === 'true');
      if (storedPhotos) {
        try {
          const parsed = JSON.parse(storedPhotos);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPhotos(parsed);
          }
        } catch (e) {
          console.error('Error parsing photos:', e);
        }
      }
    } catch (e) {
      console.error('Error loading listing data:', e);
    }
  }, []);


  return (
    <div className="lg:hidden" style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title=""
          customBackButton={
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
          }
        />

        <PageContent>
          <div 
            className="px-4 pb-16" 
            style={{ 
              paddingTop: 'var(--saved-content-padding-top, 140px)',
            }}
          >
            <div className="space-y-6">
              {/* Photo Collage */}
              <ListingPhotoCollage 
                photos={photos}
                editable={true}
                onPhotoClick={() => router.push('/my-life/create/photos')}
              />

              {/* Header */}
              <ListingHeader 
                title={listingTitle || 'Untitled Listing'}
                date={startDate ? startDate.toISOString() : null}
                summary={summary}
              />

              {/* Information Cards */}
              <ListingInfoCards
                capacity={capacity}
                capacityUnlimited={capacityUnlimited}
                location={location}
                host={account ? {
                  id: account.id,
                  name: account.name,
                  profile_pic: account.profile_pic || null
                } : null}
              />
            </div>
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}

