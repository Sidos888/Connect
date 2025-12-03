"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { PageContent } from "@/components/layout/PageSystem";
import PhotoViewer from "@/components/listings/PhotoViewer";
import { listingsService, EventGalleryItem } from '@/lib/listingsService';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';

interface EventGalleryViewProps {
  listingId: string;
  galleryId: string;
  title: string;
  onBack: () => void;
}

export default function EventGalleryView({
  listingId,
  galleryId,
  title,
  onBack
}: EventGalleryViewProps) {
  const router = useRouter();
  const { account } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [listing, setListing] = useState<any>(null);

  // Load listing data and gallery photos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load listing
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: listingData } = await supabase
            .from('listings')
            .select('id, title, photo_urls')
            .eq('id', listingId)
            .single();
          
          if (listingData) {
            setListing(listingData);
          }
        }

        // Load gallery photos
        const { items, error } = await listingsService.getEventGalleryItems(galleryId);
        if (error) {
          console.error('Error loading gallery photos:', error);
        } else {
          setPhotos(items.map(item => item.photo_url));
        }
      } catch (error) {
        console.error('Error loading gallery data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (galleryId && listingId) {
      loadData();
    }
  }, [galleryId, listingId]);

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleClosePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  const handleListingCardClick = () => {
    // Store current URL in sessionStorage so listing page can return here
    sessionStorage.setItem('gallery_return_url', window.location.href);
    // Navigate to listing detail view
    router.push(`/listing?id=${listingId}`);
  };

  const handleAddPhotoClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0 || !account) return;

      setUploading(true);
      const supabase = getSupabaseClient();
      if (!supabase) {
        alert('Supabase client not available');
        setUploading(false);
        return;
      }

      try {
        const newPhotoUrls: string[] = [];

        for (const file of Array.from(files)) {
          const fileExt = 'jpg';
          const fileName = `galleries/${listingId}/${account.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('listing-photos')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('listing-photos')
            .getPublicUrl(fileName);

          // Add to event_gallery_items
          const { error: itemError } = await supabase
            .from('event_gallery_items')
            .insert({
              gallery_id: galleryId,
              user_id: account.id,
              photo_url: publicUrl
            });

          if (itemError) {
            console.error('Error adding photo to gallery:', itemError);
          } else {
            newPhotoUrls.push(publicUrl);
          }
        }

        // Update local state
        setPhotos(prev => [...prev, ...newPhotoUrls]);
      } catch (error) {
        console.error('Error uploading photos:', error);
        alert('Failed to upload photos. Please try again.');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const mainPhoto = listing?.photo_urls && listing.photo_urls.length > 0 
    ? listing.photo_urls[0] 
    : null;

  return (
    <div className="lg:hidden">
      {/* Custom Header with Listing Card */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-white"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 70px)',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Back Button - chevron only */}
          <button
            onClick={onBack}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Listing Card with Photo and Title */}
          {!loading && listing && (
            <button
              onClick={handleListingCardClick}
              className="flex-1 bg-white rounded-xl p-3 flex items-center gap-3 text-left cursor-pointer transition-all duration-200 hover:-translate-y-[1px] min-w-0"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              {/* Listing Photo */}
              {mainPhoto && (
                <div 
                  className="flex-shrink-0 rounded-lg overflow-hidden"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                  }}
                >
                  <img
                    src={mainPhoto}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Listing Title (no date/time) */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-base font-semibold text-gray-900 truncate" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {listing.title}
                </div>
              </div>
            </button>
          )}

          {/* Add Photo Button */}
          <button
            onClick={handleAddPhotoClick}
            disabled={uploading}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            <Plus size={20} className="text-gray-900" strokeWidth={2.5} />
          </button>
        </div>

        {/* Photo Count - Below header like Page 2/2 */}
        <div className="flex justify-center mt-4 items-center gap-1.5">
          <ImageIcon size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-500">{photos.length} {photos.length === 1 ? 'Item' : 'Items'}</span>
        </div>
      </div>

      <PageContent>
        <div 
          className="px-4 pb-8" 
          style={{ 
            paddingTop: 'calc(max(env(safe-area-inset-top), 70px) + 16px + 76px + 16px + 28px + 24px)', // Header height + padding + card height + spacing + count height + extra spacing
          }}
        >
          {photos.length === 0 ? (
            <div className="grid grid-cols-4 gap-4 relative overflow-visible">
              {/* Empty state - just show empty grid, users can use + button to add photos */}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 relative overflow-visible">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => handlePhotoClick(index)}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                >
                  <img
                    src={photo}
                    alt={`Gallery photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </PageContent>

      {selectedPhotoIndex !== null && (
        <PhotoViewer
          isOpen={selectedPhotoIndex !== null}
          photos={photos}
          initialIndex={selectedPhotoIndex}
          onClose={handleClosePhotoViewer}
        />
      )}
    </div>
  );
}
