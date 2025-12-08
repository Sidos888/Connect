"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, Plus, MapPin, Image as ImageIcon } from 'lucide-react';
import { MobilePage, PageContent } from "@/components/layout/PageSystem";
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { compressImage, fileToDataURL } from '@/lib/imageUtils';

export default function CreateHighlightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const MAX_PHOTOS = 12;
  const [saving, setSaving] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [summaryFocused, setSummaryFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  // Date and time state - preset to current date/time
  const getNextHour = (): Date => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return nextHour;
  };
  const [highlightDate, setHighlightDate] = useState<Date>(() => getNextHour());
  const dateTimeInputRef = useRef<HTMLInputElement>(null);

  // Hide bottom nav on mount
  useEffect(() => {
    const hideBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
        (bottomNav as HTMLElement).style.visibility = 'hidden';
        (bottomNav as HTMLElement).style.opacity = '0';
        (bottomNav as HTMLElement).style.transform = 'translateY(100%)';
      }
      document.body.style.paddingBottom = '0';
    };

    const showBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
        (bottomNav as HTMLElement).style.visibility = '';
        (bottomNav as HTMLElement).style.opacity = '';
        (bottomNav as HTMLElement).style.transform = '';
      }
      document.body.style.paddingBottom = '';
    };

    hideBottomNav();

    return () => {
      showBottomNav();
    };
  }, []);

  // Convert base64 data URL to Blob
  const dataURLtoBlob = (dataurl: string): Blob => {
    try {
      if (!dataurl || typeof dataurl !== 'string') {
        throw new Error('Invalid data URL: not a string');
      }

      if (!dataurl.includes(',')) {
        throw new Error('Invalid data URL format: missing comma separator');
      }

      const arr = dataurl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      const base64Data = arr[1];
      
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Empty base64 data');
      }

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
      throw new Error(`Failed to convert photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
    
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
    setHighlightDate(newDate);
  };

  // Upload multiple images to Supabase Storage (matches listing upload system)
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

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
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
        const fileName = `${account.id}/highlights/${timestamp}_${i}_${randomStr}.${fileExt}`;
        
        console.log(`📤 Uploading highlight photo ${i + 1}/${photos.length}: ${fileName} (${Math.round(blob.size / 1024)}KB, type: ${blob.type})`);
        
        // Upload to Supabase Storage using Blob with retry logic
        let uploadData;
        let uploadError;
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
          try {
            const uploadPromise = supabase.storage
              .from('highlights-photos')
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
              console.warn(`Upload attempt ${retryCount} failed for photo ${i + 1}, retrying... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              continue;
            }
              
            break; // Non-retryable error or max retries reached
          } catch (timeoutError) {
            if (retryCount < maxRetries - 1) {
              retryCount++;
              console.warn(`Upload timeout for photo ${i + 1}, retrying... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            uploadError = timeoutError as any;
            break;
          }
        }

        if (uploadError) {
          console.error(`Failed to upload photo ${i + 1} after ${retryCount + 1} attempts:`, uploadError);
          throw new Error(`Failed to upload photo ${i + 1}: ${uploadError.message || 'Unknown error'}`);
        }

        if (!uploadData || !uploadData.path) {
          console.error(`❌ Upload succeeded but no path returned for photo ${i + 1}:`, uploadData);
          throw new Error(`Upload succeeded but no path returned for photo ${i + 1}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('highlights-photos')
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

  // Handle multiple image selection
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85
        });
        
        // Convert to base64
        return await fileToDataURL(compressedFile);
      });
      
      const newPhotos = await Promise.all(loadPromises);
      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (error) {
      console.error('Error loading photos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to load photos: ${errorMessage}`);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPhoto = () => {
    if (photos.length >= MAX_PHOTOS) return;
    fileInputRef.current?.click();
  };

  // Handle save highlight
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (photos.length === 0) {
      alert('Please add at least one photo');
      return;
    }

    if (!account) {
      alert('Please sign in to create a highlight');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Upload photos
      const photoUrls = await uploadPhotos();
      
      if (photoUrls.length === 0) {
        throw new Error('Failed to upload photos');
      }

      // Create highlight record
      // Store first image as image_url for backward compatibility, all images in photo_urls array
      const { data: highlightData, error: highlightError } = await supabase
        .from('user_highlights')
        .insert({
          user_id: account.id,
          title: title.trim(),
          summary: summary.trim() || null,
          location: location.trim() || null,
          image_url: photoUrls[0], // First photo for backward compatibility
          photo_urls: photoUrls.length > 1 ? photoUrls : null, // All photos if multiple
          highlight_date: highlightDate.toISOString(), // Custom date/time
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (highlightError) {
        console.error('Error creating highlight:', highlightError);
        throw new Error(`Failed to create highlight: ${highlightError.message}`);
      }

      console.log('✅ Highlight created successfully:', highlightData);

      // Navigate back to highlights page
      const from = searchParams.get('from') || '/menu?view=highlights';
      router.push(from);
    } catch (error) {
      console.error('Error saving highlight:', error);
      alert(`Failed to save highlight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

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

  const canSave = title.trim().length > 0 && photos.length > 0;

  return (
    <div className="lg:hidden">
      <div style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
        <MobilePage>
          <div className="fixed top-0 left-0 right-0 z-[60] bg-white"
            style={{
              paddingTop: 'max(env(safe-area-inset-top), 70px)',
              paddingBottom: '16px',
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  const from = searchParams.get('from') || '/menu?view=highlights';
                  router.push(from);
                }}
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

              <div className="flex-1 text-center">
                <h1 className="text-xl font-semibold text-gray-900">Create Highlight</h1>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !canSave}
                className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '100px',
                  background: canSave ? '#FF6600' : '#9CA3AF',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  if (canSave && !saving) {
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

          <PageContent>
            <div 
              className="px-4 pb-16" 
              style={{ 
                paddingTop: 'var(--saved-content-padding-top, 180px)',
                overflowX: 'hidden',
              }}
            >
              <div className="space-y-4" style={{ overflowX: 'hidden' }}>
                {/* Photos Section - Large Square Card aligned with button inside edges */}
                <div className="relative rounded-xl bg-gray-100 overflow-hidden"
                  style={{
                    marginLeft: '40px',
                    marginRight: '40px',
                    aspectRatio: '1',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                >
                  {/* Display photos - single for 1-3, grid for 4+ */}
                  {photos.length > 0 && photos.length <= 3 ? (
                    <img 
                      src={photos[0]} 
                      alt="Highlight photo" 
                      className="w-full h-full object-cover"
                    />
                  ) : photos.length >= 4 ? (
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0">
                      {photos.slice(0, 4).map((photo, index) => (
                        <div key={index} className="w-full h-full overflow-hidden">
                          <img 
                            src={photo} 
                            alt={`Highlight photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  
                  {/* Photo Count - Bottom Right (display only, no navigation) */}
                  {photos.length > 0 && (
                    <div
                      className="absolute bottom-3 right-3 flex items-center justify-center gap-1.5 bg-white z-10"
                      style={{
                        width: '53px',
                        height: '40px',
                        borderRadius: '20px',
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      }}
                    >
                      <span className="text-sm font-medium text-gray-900">{photos.length}</span>
                      <ImageIcon size={18} className="text-gray-900" />
                    </div>
                  )}
                  
                  {/* Add + Button - Bottom Right when no photos, to the left of photo count when photos exist */}
                  {photos.length < MAX_PHOTOS && (
                    <button
                      onClick={handleAddPhoto}
                      className={`absolute bottom-3 flex items-center justify-center bg-white focus:outline-none z-10 ${photos.length > 0 ? 'right-[77px]' : 'right-3'}`}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '100px',
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      }}
                    >
                      <Plus size={18} className="text-gray-900" />
                    </button>
                  )}
                </div>

                {/* Title Input with Floating Label */}
                <div className="relative mt-12">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => {
                      const value = e.target.value;
                      const words = value.split(' ');
                      const capitalizedWords = words.map((word) => {
                        if (word.length === 0) return word;
                        return word.charAt(0).toUpperCase() + word.slice(1);
                      });
                      const newValue = capitalizedWords.join(' ');
                      setTitle(newValue);
                      
                      setTimeout(() => {
                        if (titleInputRef.current) {
                          const newCursorPos = Math.min(e.target.selectionStart || 0, newValue.length);
                          titleInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                        }
                      }, 0);
                    }}
                    onFocus={() => setTitleFocused(true)}
                    onBlur={() => setTitleFocused(false)}
                    placeholder=""
                    className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-black rounded-xl ${(titleFocused || title) ? 'pt-6 pb-2' : 'py-5'}`}
                    style={{ 
                      fontSize: '17px', 
                      lineHeight: '1.4', 
                      fontFamily: 'inherit',
                      fontWeight: '500',
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: titleFocused
                        ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'box-shadow'
                    }}
                    onMouseEnter={(e) => {
                      if (!titleFocused) {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!titleFocused) {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="words"
                  />
                  {(titleFocused || title) && (
                    <label className="absolute left-4 top-1.5 text-xs font-medium text-gray-500 pointer-events-none">
                      Title
                    </label>
                  )}
                  {!titleFocused && !title && (
                    <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-gray-400 pointer-events-none">
                      Title
                    </label>
                  )}
                </div>

                {/* Summary Textarea with Floating Label */}
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
                      boxShadow: summaryFocused
                        ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                        : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'box-shadow'
                    }}
                    onMouseEnter={(e) => {
                      if (!summaryFocused) {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!summaryFocused) {
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
                  {/* Date/Time Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Date and time</span>
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
                        {formatDateTime(highlightDate)}
                      </span>
                      {/* Hidden native iOS datetime picker */}
                      <input
                        ref={dateTimeInputRef}
                        type="datetime-local"
                        value={highlightDate.toISOString().slice(0, 16)}
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
                </div>

                {/* Location Button with Floating Label */}
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
            </div>
          </PageContent>
        </MobilePage>
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
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
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
}

