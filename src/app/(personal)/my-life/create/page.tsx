"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, MapPin, Check, Image as ImageIcon, ChevronUp, ChevronDown, X } from 'lucide-react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Avatar from '@/components/Avatar';

function CreateListingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account } = useAuth();
  const chatService = useChatService();
  
  // Check if this is a group event creation
  const groupChatId = searchParams.get('group');
  const [groupChat, setGroupChat] = useState<any>(null);
  const [groupChatLoading, setGroupChatLoading] = useState(false);
  const [isSlidingUp, setIsSlidingUp] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [listingTitle, setListingTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [capacity, setCapacity] = useState(1);
  const [capacityUnlimited, setCapacityUnlimited] = useState(true);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [locationFocused, setLocationFocused] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [includeEndTime, setIncludeEndTime] = useState(true); // Always true - end time is compulsory
  const [addTimes, setAddTimes] = useState(true);
  const [titleFocused, setTitleFocused] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [summaryFocused, setSummaryFocused] = useState(false);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const MAX_PHOTOS = 12;

  // Fetch group chat info if group context
  useEffect(() => {
    const fetchGroupChat = async () => {
      if (groupChatId && chatService) {
        setGroupChatLoading(true);
        try {
          const { chat, error } = await chatService.getChatById(groupChatId);
          if (!error && chat) {
            setGroupChat(chat);
          }
        } catch (error) {
          console.error('Error fetching group chat:', error);
        } finally {
          setGroupChatLoading(false);
        }
      }
    };
    fetchGroupChat();
  }, [groupChatId, chatService]);

  // Slide up animation on mount
  useEffect(() => {
    setIsSlidingUp(true);
    return () => {
      setIsSlidingUp(false);
    };
  }, []);

  // Handle close with slide down animation
  const handleClose = () => {
    setIsClosing(true);
    setIsSlidingUp(false);
    setTimeout(() => {
      router.back();
    }, 300);
  };
  
  // Helper function to get the next coming hour
  const getNextHour = (): Date => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Round up to next hour (e.g., 2:30pm -> 3:00pm)
    return nextHour;
  };

  // Date and time state - preset to next coming hour
  const [startDate, setStartDate] = useState<Date>(() => getNextHour());
  const [endDate, setEndDate] = useState<Date>(() => {
    const nextHour = getNextHour();
    const endHour = new Date(nextHour);
    endHour.setHours(endHour.getHours() + 2, 0, 0, 0); // Default to 2 hours after start
    return endHour;
  });
  const dateTimeInputRef = useRef<HTMLInputElement>(null);
  const endDateTimeInputRef = useRef<HTMLInputElement>(null);
  
  // Update end date when start date changes (set to 2 hours after by default)
  useEffect(() => {
    const newEndDate = new Date(startDate);
    newEndDate.setHours(newEndDate.getHours() + 2); // 2 hours later
    setEndDate(newEndDate);
  }, [startDate]);

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
        coordinates: feature.geometry.coordinates, // [longitude, latitude]
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

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    if (!MAPBOX_ACCESS_TOKEN) {
      return `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
      );

      if (!response.ok) {
        throw new Error('Mapbox reverse geocoding error');
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name || `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      }
      
      return `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
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
    }, 300); // 300ms debounce

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
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${day}, ${month} ${dayNum} at ${hours}:${minutesStr}${ampm}`;
  };
  
  const handleDateTimeClick = () => {
    // Trigger native iOS datetime picker
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
    // Trigger native iOS datetime picker
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
      // If end time is before or equal to start, set it to 1 minute after start
      const adjustedEndDate = new Date(startDate);
      adjustedEndDate.setMinutes(adjustedEndDate.getMinutes() + 1);
      setEndDate(adjustedEndDate);
    } else {
      setEndDate(newDate);
    }
  };

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
        .then((newPhotos) => {
          setPhotos(prev => [...prev, ...newPhotos]);
          // Update sessionStorage with error handling for quota
          try {
            const updated = [...photos, ...newPhotos];
            sessionStorage.setItem('listingPhotos', JSON.stringify(updated));
          } catch (storageError: any) {
            // Handle quota exceeded error
            if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
              console.warn('SessionStorage quota exceeded, storing photos in state only');
              // Photos are still in state, just not in sessionStorage
              // This is okay - they'll be lost on refresh but that's acceptable
            } else {
              throw storageError;
            }
          }
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
    if (photos.length > 0) {
      try {
        // Store photos in sessionStorage for the gallery page
        sessionStorage.setItem('listingPhotos', JSON.stringify(photos));
      } catch (storageError: any) {
        // Handle quota exceeded error gracefully
        if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
          console.warn('SessionStorage quota exceeded, photos will be lost on navigation');
          // Still navigate - photos are in state, just won't persist
        } else {
          console.error('Error saving to sessionStorage:', storageError);
        }
      }
      router.push('/my-life/create/photos');
    }
  };

  // Load all form data from sessionStorage on mount (if coming back from page 2)
  useEffect(() => {
    try {
      // Load photos
      const storedPhotos = sessionStorage.getItem('listingPhotos');
      if (storedPhotos) {
        try {
          const parsed = JSON.parse(storedPhotos);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPhotos(parsed);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Load title
      const storedTitle = sessionStorage.getItem('listingTitle');
      if (storedTitle) {
        setListingTitle(storedTitle);
      }

      // Load summary
      const storedSummary = sessionStorage.getItem('listingSummary');
      if (storedSummary) {
        setSummary(storedSummary);
      }

      // Load location
      const storedLocation = sessionStorage.getItem('listingLocation');
      if (storedLocation) {
        setLocation(storedLocation);
      }

      // Load visibility
      const storedIsPublic = sessionStorage.getItem('listingIsPublic');
      if (storedIsPublic !== null) {
        setIsPublic(storedIsPublic === 'true');
      }

      // Load capacity
      const storedCapacity = sessionStorage.getItem('listingCapacity');
      if (storedCapacity) {
        setCapacity(parseInt(storedCapacity, 10));
      }

      // Load capacity unlimited
      const storedCapacityUnlimited = sessionStorage.getItem('listingCapacityUnlimited');
      if (storedCapacityUnlimited !== null) {
        setCapacityUnlimited(storedCapacityUnlimited === 'true');
      }

      // Load start date
      const storedStartDate = sessionStorage.getItem('listingStartDate');
      if (storedStartDate) {
        setStartDate(new Date(storedStartDate));
      }

      // Load end date
      const storedEndDate = sessionStorage.getItem('listingEndDate');
      if (storedEndDate) {
        setEndDate(new Date(storedEndDate));
      }

      // Load include end time
      const storedIncludeEndTime = sessionStorage.getItem('listingIncludeEndTime');
      if (storedIncludeEndTime !== null) {
        setIncludeEndTime(storedIncludeEndTime === 'true');
      }

      // Mark that we've loaded from storage
      setHasLoadedFromStorage(true);
    } catch (e) {
      console.error('Error loading form data from sessionStorage:', e);
      setHasLoadedFromStorage(true); // Still mark as loaded even if there was an error
    }
  }, []);

  // Update sessionStorage whenever photos change
  useEffect(() => {
    if (photos.length > 0) {
      try {
        sessionStorage.setItem('listingPhotos', JSON.stringify(photos));
      } catch (storageError: any) {
        // Handle quota exceeded error gracefully
        if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
          console.warn('SessionStorage quota exceeded, photos stored in state only');
        } else {
          console.error('Error saving to sessionStorage:', storageError);
        }
      }
    }
  }, [photos]);

  // Update sessionStorage whenever form fields change (but only after initial load)
  useEffect(() => {
    // Don't save on initial mount before we've loaded from storage
    if (!hasLoadedFromStorage) return;

    try {
      sessionStorage.setItem('listingTitle', listingTitle);
      sessionStorage.setItem('listingSummary', summary);
      sessionStorage.setItem('listingLocation', location);
      sessionStorage.setItem('listingIsPublic', isPublic.toString());
      sessionStorage.setItem('listingCapacity', capacity.toString());
      sessionStorage.setItem('listingCapacityUnlimited', capacityUnlimited.toString());
      sessionStorage.setItem('listingStartDate', startDate.toISOString());
      sessionStorage.setItem('listingEndDate', endDate.toISOString());
      sessionStorage.setItem('listingIncludeEndTime', includeEndTime.toString());
    } catch (storageError: any) {
      // Handle quota exceeded error gracefully
      if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
        console.warn('SessionStorage quota exceeded, form data stored in state only');
      } else {
        console.error('Error saving form data to sessionStorage:', storageError);
      }
    }
  }, [hasLoadedFromStorage, listingTitle, summary, location, isPublic, capacity, capacityUnlimited, startDate, endDate, includeEndTime]);

  // Convert base64 data URL to File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Upload photos to Supabase Storage
  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    
    const supabase = await getSupabaseClient();
    if (!supabase || !account) {
      throw new Error('Not authenticated');
    }

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const file = dataURLtoFile(photo, `listing-photo-${Date.now()}-${i}.jpg`);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${account.id}/${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Failed to upload photo:', uploadError);
        throw new Error(`Failed to upload photo ${i + 1}: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('listing-photos')
        .getPublicUrl(uploadData.path);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  // Handle save listing
  const handleSaveListing = async () => {
    if (!listingTitle.trim()) {
      alert('Please enter a listing title');
      return;
    }

    if (photos.length === 0) {
      alert('Please add at least one photo');
      return;
    }

    setSaving(true);
    try {
      // Upload photos to Supabase Storage
      const photoUrls = await uploadPhotos();
      
      // TODO: Save listing to database with photo URLs
      // For now, just log and navigate back
      console.log('Listing data:', {
        title: listingTitle,
        summary,
        isPublic,
        capacity: capacityUnlimited ? null : capacity,
        capacityUnlimited,
        includeEndTime,
        addTimes,
        photos: photoUrls
      });

      // Clear sessionStorage
      sessionStorage.removeItem('listingPhotos');
      
      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error saving listing:', error);
      alert('Failed to save listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Check if all required fields are filled
  const isFormComplete = photos.length > 0 && listingTitle.trim().length > 0;
  
  const handleNextPage = () => {
    if (isFormComplete) {
      // Store all listing data for page 2 (and for when returning to page 1)
      try {
        sessionStorage.setItem('listingTitle', listingTitle);
        sessionStorage.setItem('listingSummary', summary);
        sessionStorage.setItem('listingLocation', location);
        sessionStorage.setItem('listingIsPublic', isPublic.toString());
        sessionStorage.setItem('listingCapacity', capacity.toString());
        sessionStorage.setItem('listingCapacityUnlimited', capacityUnlimited.toString());
        sessionStorage.setItem('listingStartDate', startDate.toISOString());
        sessionStorage.setItem('listingEndDate', endDate.toISOString());
        sessionStorage.setItem('listingIncludeEndTime', includeEndTime.toString());
      } catch (e) {
        console.error('Error storing listing data:', e);
      }
      // Preserve group context so Page 2 can show the Group Chat card
      if (groupChatId) {
        router.push(`/my-life/create/details?group=${groupChatId}`);
      } else {
      router.push('/my-life/create/details');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isClosing ? 0 : 1
        }}
        onClick={handleClose}
      />
      
      {/* Content Container with Slide Animation */}
      <div 
        className="relative w-full bg-white transition-transform duration-300 ease-out overflow-hidden"
        style={{
          height: '100%',
          transform: isSlidingUp ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Create Listing"
          subtitle={<span className="text-sm font-medium text-gray-500">Page 1/2</span>}
              backButton={false}
              customBackButton={
                <button
                  onClick={handleClose}
                  className="absolute left-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
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
                  aria-label="Close"
                >
                  <X size={18} className="text-gray-900" strokeWidth={2.5} />
                </button>
              }
          customActions={
            <button
              onClick={handleNextPage}
              disabled={!isFormComplete || saving}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '100px',
                background: isFormComplete ? '#FF6600' : '#9CA3AF',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                if (!saving && isFormComplete) {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              aria-label="Next"
            >
              <Check size={18} className="text-white" />
            </button>
          }
        />

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
                    alt="Listing photo" 
                    className="w-full h-full object-cover"
                  />
                ) : photos.length >= 4 ? (
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
                
                {/* Photo Count - Bottom Right */}
                {photos.length > 0 && (
                  <button
                    onClick={handleViewPhotos}
                    className="absolute bottom-3 right-3 flex items-center justify-center gap-1.5 bg-white z-10 cursor-pointer"
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
                  </button>
                )}
                
                {/* Add + Button - Bottom Right when no photos, to the left of photo count when photos exist */}
                {/* Spacing: 12px (right-3) from card border to photo count, 53px photo count width, 12px gap, then + button */}
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

              {/* Listing Title Card with Floating Label */}
              <div className="relative mt-12">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={listingTitle}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Auto-capitalize first letter of each word
                    // Split by spaces and capitalize first letter of each word
                    const words = value.split(' ');
                    const capitalizedWords = words.map((word, index) => {
                      if (word.length === 0) return word;
                      // Get cursor position to preserve it
                      const cursorPos = e.target.selectionStart || 0;
                      // Capitalize first letter, keep rest as-is (don't force lowercase)
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    });
                    const newValue = capitalizedWords.join(' ');
                    setListingTitle(newValue);
                    
                    // Preserve cursor position after state update
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
                  className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-black rounded-xl ${(titleFocused || listingTitle) ? 'pt-6 pb-2' : 'py-5'}`}
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
                {/* Floating label when focused or filled */}
                {(titleFocused || listingTitle) && (
                  <label className="absolute left-4 top-1.5 text-xs font-medium text-gray-500 pointer-events-none">
                    Title
                  </label>
                )}
                {/* Default centered label when empty and unfocused */}
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
                {/* Floating label when focused or filled */}
                {(summaryFocused || summary) && (
                  <label className="absolute left-4 top-1.5 text-xs font-medium text-gray-500 pointer-events-none">
                    Short Summary
                  </label>
                )}
                {/* Default label when empty and unfocused - positioned on first line */}
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
                    {/* Hidden native iOS datetime picker */}
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
                    {/* Hidden native iOS datetime picker */}
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
                {/* Floating label when location is selected */}
                {(locationFocused || location) && (
                  <label className="absolute left-4 top-1.5 text-xs font-medium text-gray-500 pointer-events-none">
                    Location
                  </label>
                )}
                {/* Default centered label when empty */}
                {!locationFocused && !location && (
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-gray-400 pointer-events-none">
                    Choose Location
                  </label>
                )}
              </div>

              {/* Visibility - Show group card if group context, otherwise show public/private */}
              {groupChatId && groupChat ? (
                <div
                  className="rounded-xl bg-white px-4 h-14 flex items-center justify-between w-full"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                >
                  <span className="text-base font-semibold text-gray-900">Visibility</span>
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={groupChat.photo}
                      name={groupChat.name || 'Group'}
                      size={24}
                    />
                    <span className="text-sm font-medium text-gray-700">{groupChat.name || 'Group'}</span>
                  </div>
                </div>
              ) : (
              <button
                onClick={() => setShowVisibilityModal(true)}
                className="rounded-xl bg-white px-4 h-14 flex items-center justify-between w-full text-left"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.95';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <span className="text-base font-semibold text-gray-900">Visibility</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{isPublic ? 'Public' : 'Private'}</span>
                  <div className="flex flex-col">
                    <ChevronUp size={16} className="text-gray-400 -mb-1" />
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </div>
              </button>
              )}

              {/* Capacity */}
              <button
                onClick={() => setShowCapacityModal(true)}
                className="rounded-xl bg-white px-4 h-14 flex items-center justify-between w-full text-left"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.95';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <span className="text-base font-semibold text-gray-900">Capacity</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{capacityUnlimited ? 'Unlimited' : capacity}</span>
                  <div className="flex flex-col">
                    <ChevronUp size={16} className="text-gray-400 -mb-1" />
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
              </div>
              </button>

            </div>
          </div>
        </PageContent>
      </MobilePage>
        </div>
      </div>

      {/* Visibility Modal */}
      {showVisibilityModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
          onClick={() => setShowVisibilityModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal - with padding from sides and bottom */}
          <div 
            className="relative bg-white overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'calc(100% - 16px)',
              maxWidth: '500px',
              marginTop: '20px',
              marginBottom: '8px',
              height: '50vh',
              borderTopLeftRadius: '60px',
              borderTopRightRadius: '60px',
              borderBottomLeftRadius: '60px',
              borderBottomRightRadius: '60px',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-center px-6 pt-8 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Visibility</h2>
              <button
                onClick={() => setShowVisibilityModal(false)}
                className="absolute right-8 top-8 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
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

            {/* Content */}
            <div className="px-6 pb-6 flex-1 overflow-y-auto scrollbar-hide"
              style={{
                paddingTop: 'calc(32px * 1.3)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* Public Option */}
              <button
                onClick={() => {
                  setIsPublic(true);
                }}
                className="w-full text-left p-4 rounded-xl mb-3 transition-all bg-white hover:bg-gray-50"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isPublic ? 'border-[#FF6600] bg-[#FF6600]' : 'border-gray-300 bg-white'
                  }`}
                  style={{
                    borderWidth: '2px',
                  }}
                  >
                    {isPublic && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 mb-1">Public</div>
                    <div className="text-sm font-normal text-gray-600 leading-relaxed">
                      Visible to everyone on Connect
                    </div>
                  </div>
                  {/* World/Globe Icon */}
                  <div className="flex-shrink-0 ml-2 flex items-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 10H18M10 2C11.3132 4.57536 12.0156 7.41233 12 10.25C12.0156 13.0877 11.3132 15.9246 10 18.5C8.6868 15.9246 7.98438 13.0877 8 10.25C7.98438 7.41233 8.6868 4.57536 10 2Z" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </button>

              {/* Private Option */}
              <button
                onClick={() => {
                  setIsPublic(false);
                }}
                className="w-full text-left p-4 rounded-xl transition-all bg-white hover:bg-gray-50"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    !isPublic ? 'border-[#FF6600] bg-[#FF6600]' : 'border-gray-300 bg-white'
                  }`}
                  style={{
                    borderWidth: '2px',
                  }}
                  >
                    {!isPublic && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 mb-1">Private</div>
                    <div className="text-sm font-normal text-gray-600 leading-relaxed">
                      Only people you share it with
                    </div>
                  </div>
                  {/* Sparkle Icon */}
                  <div className="flex-shrink-0 ml-2 flex items-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 2L11.5 7.5L17 9L11.5 10.5L10 16L8.5 10.5L3 9L8.5 7.5L10 2Z" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 flex items-center justify-center">
              <button
                onClick={() => setShowVisibilityModal(false)}
                className="text-base font-semibold transition-colors flex items-center justify-center"
                style={{
                  width: '120px',
                  height: '40px',
                  borderRadius: '100px',
                  backgroundColor: '#FF6600',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E55A00';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6600';
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Modal */}
      {showCapacityModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
          onClick={() => setShowCapacityModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal */}
          <div 
            className="relative bg-white overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'calc(100% - 16px)',
              maxWidth: '500px',
              marginTop: '20px',
              marginBottom: '8px',
              height: '50vh',
              borderTopLeftRadius: '60px',
              borderTopRightRadius: '60px',
              borderBottomLeftRadius: '60px',
              borderBottomRightRadius: '60px',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-center px-6 pt-8 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Max Capacity</h2>
              <button
                onClick={() => setShowCapacityModal(false)}
                className="absolute right-8 top-8 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
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

            {/* Content */}
            <div className="px-6 pb-6 flex-1 overflow-y-auto scrollbar-hide"
              style={{
                paddingTop: 'calc(32px * 1.3)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <p className="text-sm font-normal text-gray-600 mb-6 leading-relaxed">
                Auto-close registration when the capacity is reached. Only approved guests count toward the cap.
              </p>

              {/* Capacity Input */}
              <div className="mb-6">
                <input
                  type="number"
                  min="1"
                  value={capacityUnlimited ? '' : capacity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setCapacity(Math.max(1, val));
                    setCapacityUnlimited(false);
                  }}
                  className="w-full px-4 py-3 text-3xl font-semibold text-gray-900 rounded-xl text-center focus:outline-none transition-all"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF6600';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  placeholder="50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setCapacityUnlimited(true);
                  setShowCapacityModal(false);
                }}
                className="text-base font-semibold transition-colors"
                style={{
                  width: '120px',
                  height: '40px',
                  borderRadius: '100px',
                  backgroundColor: '#F3F4F6',
                  color: '#111827',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                Remove
              </button>
              <button
                onClick={() => {
                  setCapacityUnlimited(false);
                  setShowCapacityModal(false);
                }}
                className="text-base font-semibold transition-colors flex items-center justify-center"
                style={{
                  width: '120px',
                  height: '40px',
                  borderRadius: '100px',
                  backgroundColor: '#FF6600',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E55A00';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6600';
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal */}
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
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-3">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

            {/* Search Bar */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  {/* Search Icon */}
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
                        // Directly use the input value without any transformation
                        const input = e.target as HTMLInputElement;
                        setLocationSearchQuery(input.value);
                      }
                    }}
                    onInput={(e) => {
                      // Catch autofill events and ensure we use the actual typed value
                      const input = e.target as HTMLInputElement;
                      // Force sync the value to prevent iOS transformations
                      if (input.value !== locationSearchQuery) {
                        setLocationSearchQuery(input.value);
                      }
                    }}
                    onCompositionStart={() => {
                      setIsComposing(true);
                    }}
                    onCompositionEnd={(e) => {
                      setIsComposing(false);
                      setLocationSearchQuery(e.currentTarget.value);
                    }}
                    onKeyDown={(e) => {
                      // Only prevent Enter to avoid form submission
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    onKeyPress={(e) => {
                      // Prevent iOS from applying smart capitalization
                      // This fires before the character is inserted
                      const input = e.currentTarget as HTMLInputElement;
                      // Set autocorrect off but allow shift key to work
                      input.setAttribute('autocorrect', 'off');
                      // Remove autocapitalize to allow shift key functionality
                      input.removeAttribute('autocapitalize');
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
                      // Set attributes to prevent auto-capitalization but allow shift key
                      input.setAttribute('autocorrect', 'off');
                      input.setAttribute('spellcheck', 'false');
                      input.setAttribute('inputmode', 'text');
                      input.style.textTransform = 'none';
                      // Remove autocapitalize to allow shift key to work normally
                      input.removeAttribute('autocapitalize');
                      input.autocorrect = false;
                      // Set autocapitalize to empty string to allow shift while preventing auto-cap
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

            {/* Search Results */}
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
                  {/* Circular Map Icon Card */}
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
                  
                  {/* Address Text */}
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

export default function CreateListingPage() {
  return (
    <ProtectedRoute title="Create Listing" description="Log in / sign up to create a new listing" buttonText="Log in">
      <CreateListingPageContent />
    </ProtectedRoute>
  );
}

