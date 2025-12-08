"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { uploadFilesSequentially } from "@/lib/uploadUtils";

function CompleteListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingId = searchParams.get('id');
  const { account } = useAuth();
  const supabase = getSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]); // Base64 data URLs for preview
  const [uploading, setUploading] = useState(false);

  // Hide bottom nav
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

  useEffect(() => {
    const loadListing = async () => {
      if (!listingId) {
        router.push('/my-life');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();

        if (error || !data) {
          console.error('Error loading listing:', error);
          router.push('/my-life');
          return;
        }

        setListing(data);
      } catch (error) {
        console.error('Error in loadListing:', error);
        router.push('/my-life');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [listingId, supabase, router]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setPendingPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPendingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (pendingPhotos.length > 0 && account?.id) {
      setUploading(true);
      try {
        // First, get or create the event gallery
        let galleryId: string | null = null;
        
        // Check if gallery exists
        const { data: existingGallery } = await supabase
          .from('event_galleries')
          .select('id')
          .eq('listing_id', listingId)
          .single();

        if (existingGallery) {
          galleryId = existingGallery.id;
        } else {
          // Create gallery if it doesn't exist
          const { data: newGallery, error: galleryError } = await supabase
            .from('event_galleries')
            .insert({
              listing_id: listingId,
              title: `${listing.title} Gallery`
            })
            .select('id')
            .single();

          if (galleryError) {
            console.error('Error creating gallery:', galleryError);
            throw galleryError;
          }
          
          galleryId = newGallery.id;
        }

        if (!galleryId) {
          throw new Error('Failed to get or create gallery');
        }

        // Upload all pending photos to storage and add to gallery
        // Convert base64 data URLs to blobs
        const blobs = await Promise.all(
          pendingPhotos.map(async (photoData) => {
          const response = await fetch(photoData);
            return response.blob();
          })
        );

        // Upload with compression and retry
        const uploadResults = await uploadFilesSequentially(
          blobs,
          {
            bucket: 'listing-photos',
            compress: true,
            maxRetries: 3,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            generatePath: (blob, index) => {
          const fileExt = 'jpg';
              const timestamp = Date.now();
              const random = Math.random().toString(36).substring(7);
              return `galleries/${listingId}/${account.id}/${timestamp}-${index}-${random}.${fileExt}`;
            },
          },
          undefined, // No per-file progress needed
          async (index, result) => {
            // Photo uploaded successfully, add to database
            try {
          const { error: itemError } = await supabase
            .from('event_gallery_items')
            .insert({
              gallery_id: galleryId,
              user_id: account.id,
                  photo_url: result.url
            });

          if (itemError) {
                console.error(`Error adding photo ${index + 1} to gallery:`, itemError);
              } else {
                console.log(`✅ Photo ${index + 1}/${blobs.length} uploaded and added to gallery`);
              }
            } catch (dbError) {
              console.error(`Error adding photo ${index + 1} to database:`, dbError);
            }
          },
          (index, error) => {
            // Photo upload failed
            console.error(`Error uploading photo ${index + 1}:`, error);
          }
        );

        console.log(`✅ Successfully uploaded ${uploadResults.length} of ${blobs.length} photo(s) to gallery`);
      } catch (error) {
        console.error('Error in handleComplete:', error);
      } finally {
        setUploading(false);
      }
    }

    // Set flag to prevent redirect loop
    localStorage.setItem('just_completed_listing', 'true');
    router.push('/my-life');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const hasGallery = listing.has_gallery === true;
  const mainPhoto = listing.photo_urls && listing.photo_urls.length > 0 
    ? listing.photo_urls[0] 
    : null;

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden" style={{ paddingBottom: 0 }}>
      {/* Custom Header - matching create listing page style */}
      <div 
        className="flex-shrink-0 bg-white"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 70px)',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 flex-1 min-w-0 truncate">
            {listing.title} Completed!
          </h1>
          
          {/* Orange Checkmark Button - always clickable */}
          <button
            onClick={handleComplete}
            disabled={uploading}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0 disabled:opacity-50"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '100px',
              background: '#FF6600',
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
            <Check size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ paddingTop: '32px' }}>
        {/* Main listing image - squared like listing page */}
        {mainPhoto && (
          <div 
            className="w-full rounded-2xl overflow-hidden mb-6"
            style={{
              aspectRatio: '1', // Square
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <Image
              src={mainPhoto}
              alt={listing.title}
              width={800}
              height={800}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Photo upload section - only show if has_gallery is true */}
        {hasGallery && (
          <div
            className="bg-white rounded-2xl p-4"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            {/* Header */}
            {pendingPhotos.length === 0 ? (
              // No photos yet - "Upload Photos" on left, + on right
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Upload Photos</h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-900"
                >
                  <Plus size={20} strokeWidth={2.5} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            ) : (
              // Has photos - show header with count and + button
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Photos</h2>
                    <p className="text-sm text-gray-500">
                      {pendingPhotos.length} Selected
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-900"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>

                {/* Photo grid - horizontal scroll */}
                <div 
                  className="flex gap-2 overflow-x-auto no-scrollbar"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {pendingPhotos.map((photoData, index) => (
                    <div
                      key={index}
                      className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                      }}
                    >
                      <img
                        src={photoData}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Delete button */}
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black bg-opacity-60 flex items-center justify-center"
                      >
                        <X size={14} className="text-white" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Uploading indicator */}
            {uploading && (
              <div className="mt-3 text-center text-sm text-gray-500">
                Uploading...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompleteListingPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <CompleteListingContent />
    </Suspense>
  );
}
