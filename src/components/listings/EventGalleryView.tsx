"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { PageHeader } from "@/components/layout/PageSystem";
import PhotoViewer from "@/components/listings/PhotoViewer";
import { listingsService, EventGalleryItem } from '@/lib/listingsService';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { uploadFilesSequentially } from '@/lib/uploadUtils';
import LoadingMessageCard from "@/components/chat/LoadingMessageCard";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState<Array<{ id: string; file: File; progress: number }>>([]);

  // Hide bottom nav on mobile (same as listing page)
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
    console.log('📸 EventGalleryView: Add photo button clicked');
    
    // Use ref-based approach (more reliable on iOS than dynamically created inputs)
    if (fileInputRef.current) {
      console.log('📸 EventGalleryView: Triggering file picker via ref...');
      fileInputRef.current.click();
    } else {
      console.error('❌ EventGalleryView: File input ref not available');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 EventGalleryView: File input changed event fired');
    const files = e.target.files;
      
      if (!files || files.length === 0) {
        console.log('⚠️ EventGalleryView: No files selected');
        return;
      }
      
      if (!account) {
        console.error('❌ EventGalleryView: No account available');
        return;
      }

      console.log(`📸 EventGalleryView: ${files.length} file(s) selected, starting upload process...`);
      setUploading(true);
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('❌ EventGalleryView: Supabase client not available');
        alert('Supabase client not available');
        setUploading(false);
        return;
      }

      try {
        const fileArray = Array.from(files);
        console.log(`📤 EventGalleryView: Preparing to upload ${fileArray.length} file(s):`, 
          fileArray.map(f => ({ name: f.name, size: f.size, type: f.type }))
        );
        
        // Show loading cards immediately (like chat system)
        const uploadingItems = fileArray.map((file, index) => ({
          id: `upload-${Date.now()}-${index}`,
          file,
          progress: 0
        }));
        setUploadingPhotos(uploadingItems);
        
        const newPhotoUrls: string[] = [];
        const errors: string[] = [];

        // Upload files sequentially with compression and retry
        console.log('🚀 EventGalleryView: Calling uploadFilesSequentially...');
        const uploadResults = await uploadFilesSequentially(
          fileArray,
          {
            bucket: 'listing-photos',
            compress: true,
            maxRetries: 3,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            generatePath: (file, index) => {
              const fileExt = 'jpg';
              const timestamp = Date.now();
              const random = Math.random().toString(36).substring(7);
              return `galleries/${listingId}/${account.id}/${timestamp}-${index}-${random}.${fileExt}`;
            },
          },
          (index, progress) => {
            // Update progress for loading card
            setUploadingPhotos(prev => prev.map((item, i) => 
              i === index ? { ...item, progress } : item
            ));
            console.log(`Uploading ${fileArray[index].name}: ${progress}%`);
          },
          async (index, result) => {
            // File uploaded successfully, add to database
            try {
              const { error: itemError } = await supabase
                .from('event_gallery_items')
                .insert({
                  gallery_id: galleryId,
                  user_id: account.id,
                  photo_url: result.url
                });

              if (itemError) {
                console.error(`Error adding photo ${fileArray[index].name} to gallery:`, itemError);
                errors.push(`${fileArray[index].name}: Failed to add to gallery`);
                // Remove failed upload from loading cards
                setUploadingPhotos(prev => prev.filter((_, i) => i !== index));
              } else {
                newPhotoUrls.push(result.url);
                console.log(`✅ Photo ${index + 1}/${fileArray.length} uploaded and added to gallery`);
                // Remove successful upload from loading cards
                setUploadingPhotos(prev => prev.filter((_, i) => i !== index));
              }
            } catch (dbError) {
              console.error(`Error adding photo ${fileArray[index].name} to database:`, dbError);
              errors.push(`${fileArray[index].name}: Database error`);
              // Remove failed upload from loading cards
              setUploadingPhotos(prev => prev.filter((_, i) => i !== index));
            }
          },
          (index, error) => {
            // File upload failed
            console.error(`Error uploading ${fileArray[index].name}:`, error);
            errors.push(`${fileArray[index].name}: ${error.message}`);
            // Remove failed upload from loading cards
            setUploadingPhotos(prev => prev.filter((_, i) => i !== index));
          }
        );

        // Update local state with successfully uploaded photos
        if (newPhotoUrls.length > 0) {
          setPhotos(prev => [...prev, ...newPhotoUrls]);
        }

        // Show errors if any
        if (errors.length > 0) {
          const errorMessage = errors.length === fileArray.length
            ? `Failed to upload all ${errors.length} file(s):\n${errors.join('\n')}`
            : `Failed to upload ${errors.length} of ${fileArray.length} file(s):\n${errors.join('\n')}`;
          
          alert(errorMessage);
        } else {
          console.log(`✅ Successfully uploaded ${newPhotoUrls.length} photo(s)`);
        }
      } catch (error) {
        console.error('Error uploading photos:', error);
        alert(
          error instanceof Error
            ? `Failed to upload photos: ${error.message}`
            : 'Failed to upload photos. Please try again.'
        );
      } finally {
        setUploading(false);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

  const mainPhoto = listing?.photo_urls && listing.photo_urls.length > 0 
    ? listing.photo_urls[0] 
    : null;

  // Profile card component - Image top center, info card below (matching event chat)
  const profileCard = !loading && listing ? (
            <div
              className="absolute left-0 right-0"
              style={{
        top: "0", // Align with top of leftSection (same as back button)
        height: "44px", // Match leftSection height
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start", // Align items to top
              }}
            >
      {/* Image Component - Top Center - Positioned independently, aligned with back button top */}
              <button
                onClick={handleListingCardClick}
                className="absolute z-10"
                style={{
          cursor: "pointer",
          top: "0", // Align top with back button top
          left: "50%", // Center horizontally
          transform: "translateX(-50%)", // Center horizontally only
                }}
              >
        {/* Square image - 48px to visually match back button */}
                <div
                  className="bg-gray-200 flex items-center justify-center overflow-hidden rounded-lg"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderWidth: '0.5px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(0, 0, 0, 0.08)'
                  }}
                >
                  {mainPhoto ? (
                    <img
                      src={mainPhoto}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-base font-semibold">
                      {listing.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </button>

      {/* Info Card - Below Image - Positioned independently like event chat */}
              <button
                onClick={handleListingCardClick}
                className="absolute z-0"
                style={{
          height: "44px", // Match back button and chat box height
          borderRadius: "100px", // Match chat input box at bottom of page
          background: "rgba(255, 255, 255, 0.96)",
          borderWidth: "0.4px",
          borderColor: "#E5E7EB",
          borderStyle: "solid",
          boxShadow: "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
          willChange: "transform, box-shadow",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between", // Space between text and chevron
          maxWidth: "calc(100% - 32px)", // Account for page padding
          paddingLeft: "16px", // Left padding for text
          paddingRight: "8px", // Tighter right padding for chevron
          top: "42px", // Same as event chat (42px for event chats)
          left: "50%", // Center horizontally
          transform: "translateX(-50%)", // Center horizontally only
          cursor: "pointer"
                }}
                onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)";
                }}
                onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)";
                }}
              >
        {/* Title - left aligned with ellipsis truncation */}
                <div
                  className="font-semibold text-gray-900 text-base flex-1 text-left"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
            minWidth: 0 // Required for flex truncation to work
                  }}
                >
                  {listing.title}
                </div>
        {/* Right chevron icon */}
                <svg
                  className="w-5 h-5 text-gray-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
          style={{ marginLeft: "4px" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
  ) : null;

  return (
    <div className="lg:hidden w-full h-full">
      {/* Hidden file input - ref-based approach for iOS compatibility */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        style={{ display: 'none' }}
      />
      
      {/* Header with central component - matching event chat page */}
      <PageHeader
        title=""
        backButton
        onBack={onBack}
        leftSection={profileCard}
        customActions={
          <button
            onClick={handleAddPhotoClick}
            disabled={uploading}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
              width: '44px',
              height: '44px',
              borderRadius: '22px',
              background: 'rgba(255, 255, 255, 0.96)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            aria-label="Add Photo"
          >
            <Plus size={20} className="text-gray-900" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
        paddingTop: 'var(--saved-content-padding-top, 140px)', // Same as timeline page
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))', // Account for safe area + spacing
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {/* Photo Count Title - Matching timeline year heading style */}
        {/* Positioned to account for profile card height (44px + 42px + 44px = 130px from top of header) */}
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-1" style={{ marginTop: '86px' }}>
          {photos.length + uploadingPhotos.length} {photos.length + uploadingPhotos.length === 1 ? 'photo' : 'photos'}
        </h3>
        
        {/* Photo Grid - Positioned at same height as first timeline card */}
          {photos.length === 0 && uploadingPhotos.length === 0 ? (
            <div className="grid grid-cols-4 gap-4 relative overflow-visible">
              {/* Empty state - just show empty grid, users can use + button to add photos */}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 relative overflow-visible">
              {/* Show loading cards FIRST (at the top) for uploading photos (like chat system) */}
              {uploadingPhotos.map((uploadingPhoto) => (
                <div
                  key={uploadingPhoto.id}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <LoadingMessageCard fileCount={1} status="uploading" />
                </div>
              ))}
              {/* Then show existing photos */}
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
