"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { MobilePage, PageContent } from "@/components/layout/PageSystem";
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';

export default function CreateListingDetailsPage() {
  const router = useRouter();
  const { account } = useAuth();
  const [listingTitle, setListingTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [capacity, setCapacity] = useState(1);
  const [capacityUnlimited, setCapacityUnlimited] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [includeEndTime, setIncludeEndTime] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Format date as "Mon, Nov 17 at 7:00pm"
  const formatDateTime = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dayNum = date.getDate();
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
    
    return `${day}, ${month} ${dayNum} at ${hours}:${minutesStr}${ampm}`;
  };

  // Load data from sessionStorage
  useEffect(() => {
    try {
      const storedTitle = sessionStorage.getItem('listingTitle');
      const storedSummary = sessionStorage.getItem('listingSummary');
      const storedLocation = sessionStorage.getItem('listingLocation');
      const storedIsPublic = sessionStorage.getItem('listingIsPublic');
      const storedCapacity = sessionStorage.getItem('listingCapacity');
      const storedCapacityUnlimited = sessionStorage.getItem('listingCapacityUnlimited');
      const storedStartDate = sessionStorage.getItem('listingStartDate');
      const storedEndDate = sessionStorage.getItem('listingEndDate');
      const storedIncludeEndTime = sessionStorage.getItem('listingIncludeEndTime');
      const storedPhotos = sessionStorage.getItem('listingPhotos');

      if (storedTitle) setListingTitle(storedTitle);
      if (storedSummary) setSummary(storedSummary);
      if (storedLocation) setLocation(storedLocation);
      if (storedIsPublic !== null) setIsPublic(storedIsPublic === 'true');
      if (storedCapacity) setCapacity(parseInt(storedCapacity, 10));
      if (storedCapacityUnlimited !== null) setCapacityUnlimited(storedCapacityUnlimited === 'true');
      if (storedStartDate) setStartDate(new Date(storedStartDate));
      if (storedEndDate) setEndDate(new Date(storedEndDate));
      if (storedIncludeEndTime) setIncludeEndTime(storedIncludeEndTime === 'true');
      if (storedPhotos) {
        try {
          const parsed = JSON.parse(storedPhotos);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate that all photos are valid base64 data URLs
            const validPhotos = parsed.filter((photo: any) => {
              if (typeof photo !== 'string') {
                console.warn('Invalid photo: not a string', photo);
                return false;
              }
              if (!photo.startsWith('data:image/')) {
                console.warn('Invalid photo: not a data URL', photo.substring(0, 50));
                return false;
              }
              if (!photo.includes(',')) {
                console.warn('Invalid photo: missing comma separator', photo.substring(0, 50));
                return false;
              }
              return true;
            });
            
            if (validPhotos.length > 0) {
              console.log(`Loaded ${validPhotos.length} valid photos from sessionStorage`);
              setPhotos(validPhotos);
            } else {
              console.warn('No valid photos found in sessionStorage');
            }
          }
        } catch (e) {
          console.error('Error parsing photos from sessionStorage:', e);
        }
      }
    } catch (e) {
      console.error('Error loading listing data:', e);
    }
  }, []);

  const getDisplayDate = (): string => {
    if (!startDate) return 'Date and time';
    if (includeEndTime && endDate) {
      return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`;
    }
    return formatDateTime(startDate);
  };

  // Convert base64 data URL to Blob (more reliable than File)
  const dataURLtoBlob = (dataurl: string): Blob => {
    try {
      // Handle data URL format: data:image/jpeg;base64,/9j/4AAQ...
      if (!dataurl || typeof dataurl !== 'string') {
        throw new Error('Invalid data URL: not a string');
      }

      if (!dataurl.includes(',')) {
        throw new Error('Invalid data URL format: missing comma separator');
      }

      const arr = dataurl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      // Decode base64
      const base64Data = arr[1];
      
      // Validate base64 data
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Empty base64 data');
      }

      // Try to decode base64
      let bstr: string;
      try {
        bstr = atob(base64Data);
      } catch (e) {
        throw new Error(`Invalid base64 encoding: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }

      const n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      
      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error('Error converting data URL to Blob:', error);
      console.error('Data URL preview:', dataurl ? dataurl.substring(0, 100) + '...' : 'null');
      throw new Error(`Failed to convert photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Upload photos to Supabase Storage
  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    
    if (!account) {
      throw new Error('Not authenticated');
    }

    // Check authentication session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Verify the bucket exists and is accessible
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
      } else {
        const listingPhotosBucket = buckets?.find(b => b.id === 'listing-photos');
        if (!listingPhotosBucket) {
          throw new Error('The listing-photos storage bucket does not exist. Please create it in your Supabase dashboard or run the setup script.');
        }
        console.log('✅ listing-photos bucket found:', listingPhotosBucket);
      }
    } catch (error) {
      // If bucket check fails, log but continue - the upload will fail with a clearer error
      console.warn('Could not verify bucket existence:', error);
    }

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      try {
        const photo = photos[i];
        
        if (!photo || typeof photo !== 'string') {
          throw new Error(`Photo ${i + 1} is invalid`);
        }

        // Convert base64 to Blob
        let blob: Blob;
        try {
          blob = dataURLtoBlob(photo);
        } catch (conversionError) {
          console.error(`Failed to convert photo ${i + 1} to blob:`, conversionError);
          throw new Error(`Photo ${i + 1} is corrupted or invalid: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
        }
        
        // Validate blob
        if (!blob || blob.size === 0) {
          throw new Error(`Photo ${i + 1} is empty (size: ${blob?.size || 0} bytes)`);
        }

        // Check blob size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (blob.size > maxSize) {
          throw new Error(`Photo ${i + 1} is too large (${Math.round(blob.size / 1024)}KB). Maximum size is 10MB.`);
        }

        // Determine file extension from blob type
        let fileExt = 'jpg';
        if (blob.type.includes('png')) fileExt = 'png';
        else if (blob.type.includes('webp')) fileExt = 'webp';
        else if (blob.type.includes('gif')) fileExt = 'gif';
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 11);
        const fileName = `${account.id}/${timestamp}_${i}_${randomStr}.${fileExt}`;
        
        console.log(`Uploading photo ${i + 1}/${photos.length}: ${fileName} (${Math.round(blob.size / 1024)}KB, type: ${blob.type})`);
        
        // Upload to Supabase Storage using Blob
        // Add timeout and retry logic for network issues
        let uploadData;
        let uploadError;
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
          try {
            const uploadPromise = supabase.storage
          .from('listing-photos')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: blob.type
          });
            
            // Add timeout (30 seconds per upload)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
            );
            
            const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
            uploadData = result.data;
            uploadError = result.error;
            
            if (!uploadError) {
              break; // Success, exit retry loop
            }
            
            // If error is retryable, try again
            if (retryCount < maxRetries - 1 && (
              uploadError.message?.includes('network') || 
              uploadError.message?.includes('timeout') ||
              uploadError.message?.includes('Load failed')
            )) {
              retryCount++;
              console.warn(`Upload attempt ${retryCount} failed, retrying... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              continue;
            }
            
            break; // Non-retryable error or max retries reached
          } catch (timeoutError) {
            if (retryCount < maxRetries - 1) {
              retryCount++;
              console.warn(`Upload timeout, retrying... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            uploadError = timeoutError as any;
            break;
          }
        }

        if (uploadError) {
          console.error(`Failed to upload photo ${i + 1} after ${retryCount + 1} attempts:`, uploadError);
          console.error(`Upload error details:`, {
            name: uploadError.name,
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError,
            blobSize: blob.size,
            blobType: blob.type,
            fileName: fileName
          });
          
          // Provide more helpful error message
          let errorMessage = `Failed to upload photo ${i + 1}`;
          if (uploadError.message) {
            errorMessage += `: ${uploadError.message}`;
          } else if (uploadError.name === 'StorageUnknownError') {
            errorMessage += ': Storage bucket may not exist or may not have proper permissions. Please check your Supabase storage configuration.';
          } else if (uploadError.message?.includes('timeout') || uploadError.message?.includes('Load failed')) {
            errorMessage += ': Network timeout. Please check your internet connection and try again.';
          } else {
            errorMessage += ': Unknown error occurred';
          }
          
          throw new Error(errorMessage);
        }

        if (!uploadData || !uploadData.path) {
          throw new Error(`Upload succeeded but no path returned for photo ${i + 1}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(uploadData.path);

        if (!publicUrl) {
          throw new Error(`Failed to get public URL for photo ${i + 1}`);
        }

        uploadedUrls.push(publicUrl);
        console.log(`✅ Photo ${i + 1} uploaded successfully: ${publicUrl}`);
      } catch (error) {
        console.error(`Error uploading photo ${i + 1}:`, error);
        throw error;
      }
    }

    return uploadedUrls;
  };

  // Handle save listing
  const handleSaveListing = async () => {
    if (!listingTitle.trim()) {
      alert('Please enter a listing title');
      return;
    }

    if (!account) {
      alert('Please sign in to create a listing');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Upload photos to Supabase Storage
      const photoUrls = await uploadPhotos();
      
      // Create listing record in database
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .insert({
          host_id: account.id,
          title: listingTitle.trim(),
          summary: summary.trim() || null,
          location: location.trim() || null,
          start_date: startDate?.toISOString() || null,
          end_date: includeEndTime && endDate ? endDate.toISOString() : null,
          capacity: capacityUnlimited ? null : capacity,
          is_public: isPublic,
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (listingError) {
        console.error('Error creating listing:', listingError);
        throw new Error(`Failed to create listing: ${listingError.message}`);
      }

      console.log('✅ Listing created successfully:', listingData);

      // Add creator as both host and participant (so it appears in both Upcoming and Hosting)
      const { error: participantError } = await supabase
        .from('listing_participants')
        .insert({
          listing_id: listingData.id,
          user_id: account.id,
          role: 'host',
          status: 'upcoming',
          joined_at: new Date().toISOString()
        });

      if (participantError) {
        console.error('Error adding creator as participant:', participantError);
        // Don't throw error - listing was created successfully, this is just for tracking
      } else {
        console.log('✅ Creator added as participant');
      }

      // Clear sessionStorage
      sessionStorage.removeItem('listingTitle');
      sessionStorage.removeItem('listingSummary');
      sessionStorage.removeItem('listingLocation');
      sessionStorage.removeItem('listingIsPublic');
      sessionStorage.removeItem('listingCapacity');
      sessionStorage.removeItem('listingCapacityUnlimited');
      sessionStorage.removeItem('listingStartDate');
      sessionStorage.removeItem('listingEndDate');
      sessionStorage.removeItem('listingIncludeEndTime');
      sessionStorage.removeItem('listingPhotos');
      
      // Navigate back to my-life page
      router.push('/my-life');
    } catch (error) {
      console.error('Error saving listing:', error);
      alert(`Failed to save listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
      <MobilePage>
        {/* Custom Header with Card */}
        <div className="fixed top-0 left-0 right-0 z-[60] bg-white"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 70px)',
            paddingBottom: '16px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0"
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
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>

            {/* Card with Photo, Title, and Date/Time */}
            <button
              onClick={() => router.push('/my-life/create/preview')}
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
              {/* Photo - match display logic from preview page */}
              {photos.length > 0 && (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {photos.length <= 3 ? (
                    // 1-3 photos: show single image
                    <img 
                      src={photos[0]} 
                      alt="Listing" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // 4+ photos: show 2x2 grid
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0">
                      {photos.slice(0, 4).map((photo, index) => (
                        <div key={index} className="w-full h-full overflow-hidden">
                          <img 
                            src={photo} 
                            alt={`Listing photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Title and Date/Time */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-base font-semibold text-gray-900 truncate mb-1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {listingTitle || 'Untitled Listing'}
                </div>
                <div className="text-sm font-normal text-gray-500 truncate" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getDisplayDate()}
                </div>
              </div>
            </button>

            {/* Orange Tick Button */}
            <button
              onClick={handleSaveListing}
              disabled={saving || !listingTitle.trim()}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '100px',
                background: saving || !listingTitle.trim() ? '#9CA3AF' : '#FF6600',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                if (!saving && listingTitle.trim()) {
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

          {/* Page Count */}
          <div className="flex justify-center mt-4">
            <span className="text-sm font-medium text-gray-500">Page 2/2</span>
          </div>
        </div>

        <PageContent>
          <div 
            className="px-4 pb-16" 
            style={{ 
              paddingTop: 'var(--saved-content-padding-top, 180px)',
            }}
          >
            {/* Page 2 content will go here */}
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}

