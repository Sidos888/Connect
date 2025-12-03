"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Listing } from '@/lib/listingsService';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Check, MapPin, Plus, Image as ImageIcon } from 'lucide-react';
import ListingPhotoCollage from '@/components/listings/ListingPhotoCollage';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

interface EditListingDetailsViewProps {
  listing: Listing;
  listingId: string;
  onBack: () => void;
  onSave: () => void;
  onHasChanges?: (hasChanges: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
}

export interface EditListingDetailsViewRef {
  save: () => Promise<void>;
}

const EditListingDetailsView = forwardRef<EditListingDetailsViewRef, EditListingDetailsViewProps>(
  ({ listing, listingId, onSave, onBack, onHasChanges, onSavingChange }, ref) => {
  const router = useRouter();
  const { account } = useAuth();
  const queryClient = useQueryClient();
  const [listingTitle, setListingTitle] = useState(listing.title || '');
  const [summary, setSummary] = useState(listing.summary || '');
  const [location, setLocation] = useState<string>(listing.location || '');
  const [locationFocused, setLocationFocused] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [includeEndTime, setIncludeEndTime] = useState(true); // Always true - end time is compulsory
  const [titleFocused, setTitleFocused] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [summaryFocused, setSummaryFocused] = useState(false);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Photo state - initialize with existing listing photos (as URLs, not base64)
  const [photos, setPhotos] = useState<string[]>(listing.photo_urls || []);
  const [newPhotos, setNewPhotos] = useState<string[]>([]); // Track newly added photos (base64)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTOS = 12;

  // Check for pending photo changes from ManageListingPhotosView
  // These are stored in a separate cache key and will be applied on save
  useEffect(() => {
    const pendingPhotos = queryClient.getQueryData<string[]>(['listing-photo-changes', listingId]);
    
    if (pendingPhotos) {
      // Only update if pending photos are different from current photos
      if (JSON.stringify(pendingPhotos) !== JSON.stringify(photos)) {
        console.log('📸 EditListingDetailsView: Found pending photo changes', { 
          oldCount: photos.length, 
          newCount: pendingPhotos.length 
        });
        setPhotos(pendingPhotos);
      }
    }
  }, [listingId, queryClient]);

  // Notify parent of saving state changes
  useEffect(() => {
    if (onSavingChange) {
      onSavingChange(saving);
    }
  }, [saving, onSavingChange]);

  // Initialize dates from listing
  const [startDate, setStartDate] = useState<Date>(() => {
    return listing.start_date ? new Date(listing.start_date) : new Date();
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    return listing.end_date ? new Date(listing.end_date) : (() => {
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1);
      return nextHour;
    })();
  });
  const dateTimeInputRef = useRef<HTMLInputElement>(null);
  const endDateTimeInputRef = useRef<HTMLInputElement>(null);

  // Track original values for change detection
  const originalValues = {
    title: listing.title || '',
    summary: listing.summary || '',
    location: listing.location || '',
    startDate: listing.start_date ? new Date(listing.start_date).toISOString() : '',
    endDate: listing.end_date ? new Date(listing.end_date).toISOString() : '',
    includeEndTime: !!listing.end_date,
    photos: listing.photo_urls || []
  };

  // Check for changes
  useEffect(() => {
    const currentValues = {
      title: listingTitle,
      summary: summary,
      location: location,
      startDate: startDate.toISOString(),
      endDate: includeEndTime ? endDate.toISOString() : '',
      includeEndTime: includeEndTime,
      photos: photos
    };

    // Compare photos - check if count or URLs changed
    // Also check for new photos (base64 data URLs) that haven't been uploaded yet
    const photosChanged = 
      photos.length !== originalValues.photos.length ||
      photos.some((photo, index) => {
        // If photo is a base64 data URL (new photo), it's a change
        if (photo.startsWith('data:image/')) return true;
        // Otherwise compare with original
        return photo !== originalValues.photos[index];
      });

    const changed = 
      currentValues.title !== originalValues.title ||
      currentValues.summary !== originalValues.summary ||
      currentValues.location !== originalValues.location ||
      currentValues.startDate !== originalValues.startDate ||
      (currentValues.includeEndTime !== originalValues.includeEndTime) ||
      (currentValues.includeEndTime && currentValues.endDate !== originalValues.endDate) ||
      photosChanged;

    setHasChanges(changed);
    if (onHasChanges) {
      onHasChanges(changed);
    }
  }, [listingTitle, summary, location, startDate, endDate, includeEndTime, photos, originalValues, onHasChanges]);

  // Update end date when start date changes (set to 2 hours later by default)
  useEffect(() => {
    if (!endDate || endDate <= startDate) {
      const newEndDate = new Date(startDate);
      newEndDate.setHours(newEndDate.getHours() + 2); // 2 hours later
      setEndDate(newEndDate);
    }
  }, [startDate, endDate]);

  // Mapbox Geocoding API functions
  const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiY29ubmVjdC1sb2NhdGlvbiIsImEiOiJjbWkzdG5pcDgxNGh6MmlvZWdtbWxmMnVmIn0.9aWRKS5gofTwZCSSdRAX9g';

  const searchMapboxLocations = async (query: string) => {
    if (!query.trim() || !MAPBOX_ACCESS_TOKEN) {
      setLocationSearchResults([]);
      return;
    }

    setLocationSearchLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=5&types=place,address,poi`
      );

      if (!response.ok) {
        throw new Error('Mapbox API error');
      }

      const data = await response.json();
      
      const results = data.features.map((feature: any, index: number) => ({
        id: feature.id || `mapbox-${index}`,
        name: feature.text || feature.place_name?.split(',')[0] || 'Unknown',
        address: feature.place_name || feature.text,
        coordinates: feature.geometry.coordinates,
        context: feature.context || []
      }));

      setLocationSearchResults(results);
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocationSearchResults([]);
    } finally {
      setLocationSearchLoading(false);
    }
  };

  // Debounced search for Mapbox locations
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationSearchQuery.trim()) {
        searchMapboxLocations(locationSearchQuery);
      } else {
        setLocationSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationSearchQuery]);

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
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${day}, ${month} ${dayNum} at ${hours}:${minutesStr}${ampm}`;
  };

  const handleDateTimeClick = () => {
    if (dateTimeInputRef.current) {
      if (dateTimeInputRef.current.showPicker) {
        dateTimeInputRef.current.showPicker();
      } else {
        dateTimeInputRef.current.click();
      }
    }
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setStartDate(newDate);
    
    // If end time is before or equal to new start time, update it to 1 minute after start
    if (endDate <= newDate) {
      const newEndDate = new Date(newDate);
      newEndDate.setMinutes(newEndDate.getMinutes() + 1);
      setEndDate(newEndDate);
    }
  };

  const handleEndDateTimeClick = () => {
    if (endDateTimeInputRef.current) {
      if (endDateTimeInputRef.current.showPicker) {
        endDateTimeInputRef.current.showPicker();
      } else {
        endDateTimeInputRef.current.click();
      }
    }
  };

  const handleEndDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    
    // Ensure end time is after start time (even 1 minute is fine)
    if (newDate <= startDate) {
      const adjustedEndDate = new Date(startDate);
      adjustedEndDate.setMinutes(adjustedEndDate.getMinutes() + 1);
      setEndDate(adjustedEndDate);
    } else {
      setEndDate(newDate);
    }
  };

  // Photo handling functions
  const handleAddPhoto = () => {
    if (photos.length >= MAX_PHOTOS) return;
    fileInputRef.current?.click();
  };

  // Compress image to reduce file size
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
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
              const compressedFile = new File([blob], file.name, {
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const remainingSlots = MAX_PHOTOS - photos.length;
      const filesToAdd = Array.from(files).slice(0, remainingSlots);
      
      const loadPromises = filesToAdd.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }
        
        // Compress image to reduce storage size
        const compressedFile = await compressImage(file);
        
        // Convert to base64
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result as string);
            } else {
              reject(new Error(`Failed to read file ${file.name}`));
            }
          };
          reader.onerror = () => {
            reject(new Error(`Error reading file ${file.name}`));
          };
          reader.readAsDataURL(compressedFile);
        });
      });
      
      Promise.all(loadPromises)
        .then((newPhotoBase64) => {
          // Validate that all photos are base64 data URLs
          const validBase64Photos = newPhotoBase64.filter(photo => {
            const isValid = typeof photo === 'string' && photo.startsWith('data:image/');
            if (!isValid) {
              console.warn('📸 EditListingDetailsView: Skipping invalid photo (not base64)', photo.substring(0, 50));
            }
            return isValid;
          });
          
          if (validBase64Photos.length === 0) {
            console.warn('📸 EditListingDetailsView: No valid base64 photos to add');
            return;
          }
          
          // Add new photos as base64 (they'll be uploaded on save)
          setNewPhotos(prev => [...prev, ...validBase64Photos]);
          // Also add to photos array for display (using base64 data URLs)
          const updatedPhotos = [...photos, ...validBase64Photos];
          setPhotos(updatedPhotos);
          
          // Update query cache so change detection works
          queryClient.setQueryData(['listing', listingId], (oldData: Listing | undefined) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              photo_urls: updatedPhotos
            };
          });
        })
        .catch((error) => {
          console.error('Error loading photos:', error);
          const errorMessage = error.message || 'Unknown error';
          if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceededError')) {
            alert('Too many photos or photos are too large. Please try adding fewer photos or smaller images.');
          } else {
            alert(`Failed to load photos: ${errorMessage}`);
          }
        });
    } catch (error) {
      console.error('Error in handlePhotoChange:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceededError')) {
        alert('Storage limit reached. Please try adding fewer photos.');
      } else {
        alert(`Failed to process photos: ${errorMessage}`);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewPhotos = () => {
    console.log('📸 EditListingDetailsView: handleViewPhotos called', { listingId, photosCount: photos.length });
    if (photos.length > 0) {
      // Navigate to manage-photos view with proper URL encoding
      const params = new URLSearchParams();
      params.set('id', listingId);
      params.set('view', 'manage-photos');
      params.set('manageFrom', 'edit-details');
      // Encode the current page as 'from' parameter
      const currentFrom = encodeURIComponent(`/listing?id=${listingId}&view=edit-details`);
      params.set('from', currentFrom);
      const finalUrl = `/listing?${params.toString()}`;
      console.log('📸 EditListingDetailsView: Navigating to', finalUrl);
      router.push(finalUrl);
    } else {
      console.log('📸 EditListingDetailsView: No photos to view');
    }
  };

  // Convert base64 data URL to Blob (more reliable than File on mobile)
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
      throw error;
    }
  };

  // Upload new photos to Supabase Storage
  const uploadNewPhotos = async (): Promise<string[]> => {
    if (newPhotos.length === 0) return [];
    
    const supabase = getSupabaseClient();
    if (!supabase || !account) {
      throw new Error('Not authenticated');
    }

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < newPhotos.length; i++) {
      const photo = newPhotos[i];
      
      // Validate that photo is a base64 data URL
      if (!photo.startsWith('data:image/')) {
        console.warn(`📸 EditListingDetailsView: Skipping photo ${i + 1} - not a base64 data URL`, photo.substring(0, 50));
        continue;
      }
      
      try {
        // Convert base64 to Blob (more reliable than File on mobile)
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
        
        console.log(`📸 EditListingDetailsView: Uploading photo ${i + 1}/${newPhotos.length}`, {
          fileName,
          fileSize: blob.size,
          fileType: blob.type
        });
        
        // Upload to Supabase Storage with retry logic (like create listing flow)
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
              console.warn(`📸 EditListingDetailsView: Upload attempt ${retryCount} failed, retrying... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              continue;
            }
            
            break; // Non-retryable error or max retries reached
          } catch (timeoutError) {
            if (retryCount < maxRetries - 1) {
              retryCount++;
              console.warn(`📸 EditListingDetailsView: Upload timeout, retrying... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            uploadError = timeoutError as any;
            break;
          }
        }

        if (uploadError) {
          console.error(`📸 EditListingDetailsView: Failed to upload photo ${i + 1} after ${retryCount + 1} attempts:`, uploadError);
          console.error(`📸 EditListingDetailsView: Upload error details:`, {
            name: uploadError.name,
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError
          });
          throw new Error(`Failed to upload photo ${i + 1}: ${uploadError.message || 'Unknown storage error'}`);
        }

        if (!uploadData?.path) {
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
        console.log(`📸 EditListingDetailsView: Photo ${i + 1} uploaded successfully`, { publicUrl });
      } catch (photoError) {
        console.error(`📸 EditListingDetailsView: Error processing photo ${i + 1}:`, photoError);
        throw new Error(`Failed to upload photo ${i + 1}: ${photoError instanceof Error ? photoError.message : 'Unknown error'}`);
      }
    }

    return uploadedUrls;
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Get current photos - check for pending changes from ManageListingPhotosView first
      // Then merge with any new photos that need to be uploaded
      const pendingPhotos = queryClient.getQueryData<string[]>(['listing-photo-changes', listingId]);
      let currentPhotos = pendingPhotos || photos;
      
      console.log('📸 EditListingDetailsView: Saving listing', {
        pendingPhotosCount: pendingPhotos?.length,
        currentPhotosCount: photos.length,
        newPhotosCount: newPhotos.length,
        finalPhotosCount: currentPhotos.length
      });
      
      // Upload new photos if any (base64 data URLs only)
      let finalPhotoUrls = [...currentPhotos];
      if (newPhotos.length > 0) {
        try {
          const uploadedUrls = await uploadNewPhotos();
          // Replace base64 photos with uploaded URLs
          finalPhotoUrls = [
            ...currentPhotos.filter(photo => !photo.startsWith('data:image/')), // Keep existing URLs (not base64)
            ...uploadedUrls // Add new uploaded URLs
          ];
          console.log('📸 EditListingDetailsView: Uploaded new photos', { uploadedCount: uploadedUrls.length });
        } catch (uploadError) {
          console.error('📸 EditListingDetailsView: Error uploading photos:', uploadError);
          throw new Error(`Failed to upload photos: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      const updateData: any = {
        title: listingTitle.trim(),
        summary: summary.trim() || null,
        location: location.trim() || null,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(), // Always include end_date (compulsory)
        photo_urls: finalPhotoUrls,
        updated_at: new Date().toISOString()
      };

      console.log('📸 EditListingDetailsView: Updating listing in database', {
        listingId,
        photoUrlsCount: finalPhotoUrls.length,
        updateData: { ...updateData, photo_urls: finalPhotoUrls }
      });

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      if (error) {
        console.error('📸 EditListingDetailsView: Error updating listing:', error);
        throw new Error(`Failed to update listing: ${error.message}`);
      }

      console.log('📸 EditListingDetailsView: Listing updated successfully');

      // Clear pending photo changes cache
      queryClient.removeQueries({ queryKey: ['listing-photo-changes', listingId] });
      
      // Clear newPhotos state
      setNewPhotos([]);
      
      // Invalidate listing query to refresh with new data
      await queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      
      console.log('📸 EditListingDetailsView: Cache cleared, navigating back');
      
      // Success - navigate back to initial listing page
      onSave();
    } catch (error) {
      console.error('📸 EditListingDetailsView: Error saving listing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to update listing: ${errorMessage}`);
      setSaving(false);
    }
  };

  // Expose save method via ref
  useImperativeHandle(ref, () => ({
    save: handleSave
  }));

  return (
    <div className="px-4 pb-16" style={{ paddingTop: 'var(--saved-content-padding-top, 140px)' }}>
      <div className="space-y-4" style={{ overflowX: 'hidden' }}>
        {/* Photos Section - Use ListingPhotoCollage component */}
        <div style={{ marginLeft: '40px', marginRight: '40px', width: 'calc(100% - 80px)', position: 'relative' }}>
          <ListingPhotoCollage 
            photos={photos}
            editable={false}
            onPhotoClick={handleViewPhotos}
          />
          
          {/* Add Photo Button - Positioned to the left of the photo count badge */}
          {/* Badge is at bottom-3 right-3 (12px from right), 53px wide, so + button should be at right: calc(53px + 12px + 8px) = 73px */}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={handleAddPhoto}
              className="absolute bottom-3 flex items-center justify-center bg-white focus:outline-none transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                cursor: 'pointer',
                willChange: 'transform, box-shadow',
                zIndex: 50,
                right: 'calc(53px + 12px + 8px)' // Badge width (53px) + badge right offset (12px) + gap (8px)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <Plus size={20} className="text-gray-900" />
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Listing Title Card with Floating Label */}
        <div className="relative mt-12">
          <input
            ref={titleInputRef}
            type="text"
            value={listingTitle}
            onChange={(e) => setListingTitle(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            placeholder=""
            className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-black rounded-xl ${(titleFocused || listingTitle) ? 'pt-6 pb-2' : 'py-5'}`}
            style={{ 
              fontSize: '17px', 
              lineHeight: '1.4', 
              fontFamily: 'inherit',
              fontWeight: '500',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              transform: titleFocused ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: titleFocused
                ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              if (!titleFocused) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!titleFocused) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="words"
          />
          {(titleFocused || listingTitle) && (
            <label className="absolute left-4 top-1.5 text-xs font-medium text-gray-500 pointer-events-none">
              Title
            </label>
          )}
          {!titleFocused && !listingTitle && (
            <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-gray-400 pointer-events-none">
              Title
            </label>
          )}
        </div>

        {/* Short Summary Card with Floating Label */}
        <div className="relative">
          <textarea
            ref={summaryRef}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onFocus={() => setSummaryFocused(true)}
            onBlur={() => setSummaryFocused(false)}
            placeholder=""
            rows={4}
            className={`w-full pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-black resize-none rounded-xl ${(summaryFocused || summary) ? 'pt-6 pb-2' : 'py-5'}`}
            style={{ 
              fontSize: '17px', 
              lineHeight: '1.5', 
              fontFamily: 'inherit',
              fontWeight: '400',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              transform: summaryFocused ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: summaryFocused
                ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              if (!summaryFocused) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!summaryFocused) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            spellCheck={false}
          />
          {(summaryFocused || summary) && (
            <label className="absolute left-4 top-1.5 text-xs font-medium text-gray-500 pointer-events-none">
              Short Summary
            </label>
          )}
          {!summaryFocused && !summary && (
            <label className="absolute left-4 top-5 text-base font-medium text-gray-400 pointer-events-none">
              Short Summary
            </label>
          )}
        </div>

        {/* Date and Time Card */}
        <div className="rounded-xl bg-white p-4 space-y-4 mt-8"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          }}
        >
          {/* Row 1: Starts */}
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">Starts</span>
            <button
              type="button"
              onClick={handleDateTimeClick}
              className="relative cursor-pointer focus:outline-none"
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <span className="text-sm font-medium text-gray-700">
                {formatDateTime(startDate)}
              </span>
              <input
                ref={dateTimeInputRef}
                type="datetime-local"
                value={startDate.toISOString().slice(0, 16)}
                onChange={handleDateTimeChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ 
                  position: 'absolute',
                  left: '-50%',
                  right: '-50%',
                  width: '200%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </button>
          </div>

          {/* Row 2: Ends (compulsory) */}
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">
              Ends
            </span>
            <button
              type="button"
              onClick={handleEndDateTimeClick}
              className="relative cursor-pointer focus:outline-none"
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <span className="text-sm font-medium text-gray-700">
                {formatDateTime(endDate)}
              </span>
              <input
                ref={endDateTimeInputRef}
                type="datetime-local"
                value={endDate.toISOString().slice(0, 16)}
                min={startDate.toISOString().slice(0, 16)}
                onChange={handleEndDateTimeChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ 
                  position: 'absolute',
                  left: '-50%',
                  right: '-50%',
                  width: '200%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </button>
          </div>
        </div>

        {/* Location Card with Floating Label */}
        <div className="relative">
          <button
            onClick={() => setShowLocationModal(true)}
            className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-left rounded-xl scrollbar-hide ${(locationFocused || location) ? 'pt-6 pb-2' : 'py-5'}`}
            style={{ 
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              transform: locationFocused ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: locationFocused
                ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              color: 'transparent',
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (!locationFocused) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!locationFocused) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
          >
            {location && (
              <span 
                className="text-sm font-medium text-gray-700"
                style={{ 
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                }}
              >
                {location}
              </span>
            )}
          </button>
          {(locationFocused || location) && (
            <label className="absolute left-4 top-1.5 text-xs font-medium text-gray-500 pointer-events-none">
              Location
            </label>
          )}
          {!locationFocused && !location && (
            <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-gray-400 pointer-events-none">
              Choose Location
            </label>
          )}
        </div>
      </div>

      {/* Location Search Modal */}
      {showLocationModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
          onClick={() => {
            setShowLocationModal(false);
            setLocationSearchQuery("");
            setLocationSearchResults([]);
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          <div 
            className="relative w-full bg-white rounded-t-3xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              height: '92vh',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <div className="flex justify-center pt-3 pb-3">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="px-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 19L14.65 14.65" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <input
                    ref={locationInputRef}
                    type="text"
                    inputMode="text"
                    value={locationSearchQuery}
                    onChange={(e) => {
                      if (!isComposing) {
                        const input = e.target as HTMLInputElement;
                        setLocationSearchQuery(input.value);
                      }
                    }}
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (input.value !== locationSearchQuery) {
                        setLocationSearchQuery(input.value);
                      }
                    }}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={(e) => {
                      setIsComposing(false);
                      setLocationSearchQuery(e.currentTarget.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Search Locations..."
                    className="w-full pl-12 pr-4 rounded-xl focus:outline-none transition-all"
                    style={{
                      height: '40px',
                      backgroundColor: '#FFFFFF',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      fontSize: '17px',
                      fontWeight: '400',
                      caretColor: '#FF6600',
                      textTransform: 'none',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25), 0 0 8px rgba(0, 0, 0, 0.08)';
                      const input = e.currentTarget;
                      input.setAttribute('autocorrect', 'off');
                      input.setAttribute('spellcheck', 'false');
                      input.setAttribute('inputmode', 'text');
                      input.style.textTransform = 'none';
                      input.removeAttribute('autocapitalize');
                      input.autocorrect = false;
                      if (input.autocapitalize !== undefined) {
                        (input as any).autocapitalize = '';
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setShowLocationModal(false);
                    setLocationSearchQuery("");
                    setLocationSearchResults([]);
                  }}
                  className="flex items-center justify-center flex-shrink-0"
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
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 5L5 15M5 5L15 15" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {locationSearchLoading && (
                <div className="flex items-center justify-center py-8 px-6">
                  <div className="text-sm font-medium text-gray-500">Searching...</div>
                </div>
              )}
              {!locationSearchLoading && locationSearchResults.length === 0 && locationSearchQuery && (
                <div className="flex items-center justify-center py-8 px-6">
                  <div className="text-sm font-medium text-gray-500">No results found</div>
                </div>
              )}
              {!locationSearchLoading && locationSearchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    setLocation(result.address || result.name);
                    setLocationFocused(true);
                    setShowLocationModal(false);
                    setLocationSearchQuery("");
                    setLocationSearchResults([]);
                  }}
                  className="w-full text-left px-6 py-4 flex items-start gap-3 transition-all hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    }}
                  >
                    <MapPin size={18} className="text-gray-700" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      <span className="text-sm font-semibold text-gray-900">{result.name}</span>
                      {result.address && result.address !== result.name && (
                        <>
                          <br />
                          <span className="text-sm font-normal text-gray-600">{result.address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

EditListingDetailsView.displayName = 'EditListingDetailsView';

export default EditListingDetailsView;

