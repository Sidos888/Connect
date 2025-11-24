"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
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

  // Load gallery photos
  useEffect(() => {
    const loadGalleryPhotos = async () => {
      setLoading(true);
      try {
        const { items, error } = await listingsService.getEventGalleryItems(galleryId);
        if (error) {
          console.error('Error loading gallery photos:', error);
        } else {
          setPhotos(items.map(item => item.photo_url));
        }
      } catch (error) {
        console.error('Error loading gallery photos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (galleryId) {
      loadGalleryPhotos();
    }
  }, [galleryId]);

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleClosePhotoViewer = () => {
    setSelectedPhotoIndex(null);
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
        // Compress and upload files in parallel for speed
        const uploadPromises = Array.from(files).map(async (file, i) => {
          // Validate file size (10MB limit)
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            throw new Error(`Photo ${i + 1} is too large (${Math.round(file.size / 1024)}KB). Maximum size is 10MB.`);
          }

          // Compress image if it's large (>1MB or likely to be large)
          // This significantly reduces upload time
          let fileToUpload: File = file;
          if (file.size > 1024 * 1024 || file.type.startsWith('image/')) {
            try {
              fileToUpload = await compressImageFile(file, 1920, 1920, 0.85);
              console.log(`Compressed photo ${i + 1}: ${Math.round(file.size / 1024)}KB → ${Math.round(fileToUpload.size / 1024)}KB`);
            } catch (compressError) {
              console.warn(`Failed to compress photo ${i + 1}, uploading original:`, compressError);
              // Continue with original file if compression fails
            }
          }

          // Generate unique filename
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 11);
          const fileExt = 'jpg'; // Always use jpg after compression
          const fileName = `${galleryId}/${timestamp}_${i}_${randomStr}.${fileExt}`;
          
          console.log(`Uploading gallery photo ${i + 1}/${files.length}: ${fileName} (${Math.round(fileToUpload.size / 1024)}KB)`);
          
          // Upload with minimal retry (faster)
          let uploadData;
          let uploadError;
          const maxRetries = 2; // Reduced from 3
          let retryCount = 0;
          
          while (retryCount < maxRetries) {
            try {
              const uploadPromise = supabase.storage
                .from('event-galleries')
                .upload(fileName, fileToUpload, {
                  cacheControl: '3600',
                  upsert: false,
                  contentType: 'image/jpeg'
                });
              
              // Shorter timeout (20 seconds)
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Upload timeout')), 20000)
              );
              
              const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
              uploadData = result.data;
              uploadError = result.error;
              
              if (!uploadError) {
                break; // Success
              }
              
              // Quick retry for network errors only
              if (retryCount < maxRetries - 1 && (
                uploadError.message?.includes('network') || 
                uploadError.message?.includes('timeout') ||
                uploadError.message?.includes('Load failed') ||
                uploadError.name === 'StorageUnknownError'
              )) {
                retryCount++;
                // Shorter delay (500ms instead of exponential)
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
              }
              
              break;
            } catch (timeoutError) {
              if (retryCount < maxRetries - 1) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
              }
              uploadError = timeoutError as any;
              break;
            }
          }

          if (uploadError) {
            throw new Error(`Failed to upload photo ${i + 1}: ${uploadError.message || 'Unknown error'}`);
          }

          if (!uploadData || !uploadData.path) {
            throw new Error(`Upload succeeded but no path returned for photo ${i + 1}`);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('event-galleries')
            .getPublicUrl(uploadData.path);

          if (!publicUrl) {
            throw new Error(`Failed to get public URL for photo ${i + 1}`);
          }

          // Add to gallery items
          const { item, error: itemError } = await listingsService.addGalleryPhoto(
            galleryId,
            account.id,
            publicUrl
          );

          if (itemError) {
            throw new Error(`Failed to add photo ${i + 1} to gallery: ${itemError.message}`);
          }

          return publicUrl;
        });

        // Upload all files in parallel
        const uploadedUrls = await Promise.all(uploadPromises);
        
        // Add all to local state at once
        setPhotos(prev => [...prev, ...uploadedUrls]);
        
        console.log(`✅ All ${uploadedUrls.length} gallery photos uploaded successfully`);
      } catch (error) {
        console.error('Error uploading photos:', error);
        alert(`Failed to upload photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Compress image file (returns File, not base64 - faster and more efficient)
  const compressImageFile = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.85): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  if (loading) {
    return (
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Gallery"
            backButton
            onBack={onBack}
          />
          <PageContent>
            <div className="px-4 py-8 text-center text-gray-500">
              Loading gallery...
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
          title={title}
          subtitle={`${photos.length} ${photos.length === 1 ? 'Item' : 'Items'}`}
          backButton
          onBack={onBack}
          customActions={
            <button
              onClick={handleAddPhotoClick}
              disabled={uploading}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '40px',
                height: '40px',
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
              <Plus size={18} className="text-gray-900" />
            </button>
          }
        />

        <PageContent>
          <div 
            className="px-4 pb-8" 
            style={{ 
              paddingTop: 'var(--saved-content-padding-top, 180px)',
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
      </MobilePage>

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

