"use client";

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { X, Check, Plus, MapPin } from 'lucide-react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function CreateItineraryPageContent() {
  const router = useRouter();
  const { account } = useAuth();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours later
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateTimeInputRef = useRef<HTMLInputElement>(null);
  const endDateTimeInputRef = useRef<HTMLInputElement>(null);
  const [titleFocused, setTitleFocused] = useState(false);
  const [summaryFocused, setSummaryFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);

  // Load existing itinerary items
  const [existingItems, setExistingItems] = useState<any[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('listingItinerary');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setExistingItems(parsed);
        }
      } catch (e) {
        console.error('Error parsing itinerary:', e);
      }
    }
  }, []);

  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

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
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image
      const compressedFile = await compressImage(file);
      
      // Upload to Supabase immediately
      const supabase = getSupabaseClient();
      if (!supabase || !account) {
        alert('Not authenticated');
        return;
      }

      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${account.id}/itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(fileName, compressedFile);

      if (uploadError) {
        console.error('Failed to upload photo:', uploadError);
        alert('Failed to upload photo');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-photos')
        .getPublicUrl(fileName);

      setPhoto(publicUrl);
    } catch (error) {
      console.error('Error processing photo:', error);
      alert('Failed to process photo');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFormComplete = title.trim().length > 0;

  const handleSave = () => {
    if (!isFormComplete) {
      return; // Don't save if title is empty
    }

    const newItem = {
      title: title.trim(),
      summary: summary.trim(),
      location: location.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      photo: photo
    };

    const updatedItems = [...existingItems, newItem];
    sessionStorage.setItem('listingItinerary', JSON.stringify(updatedItems));
    router.back();
  };

  const formatDateTime = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
    
    return `${day} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
  };

  const handleDateTimeClick = () => {
    dateTimeInputRef.current?.showPicker?.();
    dateTimeInputRef.current?.focus();
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newStartDate = new Date(e.target.value);
      setStartDate(newStartDate);
      
      // Ensure end date is at least 1 minute after start
      if (newStartDate >= endDate) {
        const newEndDate = new Date(newStartDate.getTime() + 60 * 1000); // 1 minute later
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateTimeClick = () => {
    endDateTimeInputRef.current?.showPicker?.();
    endDateTimeInputRef.current?.focus();
  };

  const handleEndDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newEndDate = new Date(e.target.value);
      
      // Ensure end date is at least 1 minute after start
      if (newEndDate <= startDate) {
        alert('End time must be after start time');
        return;
      }
      
      setEndDate(newEndDate);
    }
  };

  return (
    <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Itinerary"
          backButton={false}
          customBackButton={
            <button
              onClick={() => router.back()}
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
              aria-label="Back"
            >
              <X size={18} className="text-gray-900" strokeWidth={2.5} />
            </button>
          }
          customActions={
            <button
              onClick={handleSave}
              disabled={!isFormComplete}
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
                if (isFormComplete) {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              aria-label="Save"
            >
              <Check size={18} className="text-white" strokeWidth={2.5} />
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
              {/* Photo Section - Square Card matching page 1 */}
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
                {photo && (
                  <img 
                    src={photo} 
                    alt="Itinerary photo" 
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                
                {/* Add + Button - Bottom Right */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center justify-center bg-white focus:outline-none z-10"
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
              </div>

              {/* Title Card with Floating Label */}
              <div className="relative mt-12">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={() => setTitleFocused(true)}
                  onBlur={() => setTitleFocused(false)}
                  placeholder=""
                  autoCapitalize="words"
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
                />
                {/* Floating label when focused or filled */}
                {(titleFocused || title) && (
                  <label className="absolute left-4 top-1.5 text-xs font-medium text-gray-500 pointer-events-none">
                    Title
                  </label>
                )}
                {/* Default centered label when empty and unfocused */}
                {!titleFocused && !title && (
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-gray-400 pointer-events-none">
                    Title
                  </label>
                )}
              </div>

              {/* Short Summary Card with Floating Label */}
              <div className="relative">
                <textarea
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

                {/* Row 2: Ends */}
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
                  onClick={() => setLocationFocused(true)}
                  type="button"
                  className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-left rounded-xl ${(locationFocused || location) ? 'pt-6 pb-2' : 'py-5'}`}
                  style={{ 
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    transform: locationFocused ? 'translateY(-1px)' : 'translateY(0)',
                    boxShadow: locationFocused
                      ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                      : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                  }}
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

              {/* Simple Location Input Modal */}
              {locationFocused && (
                <>
                  <div 
                    className="fixed inset-0 z-[9997]"
                    onClick={() => setLocationFocused(false)}
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                  />
                  <div
                    className="fixed inset-x-0 bottom-0 z-[9998] bg-white rounded-t-3xl p-6"
                    style={{
                      paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
                    }}
                  >
                    <div className="flex justify-center mb-4">
                      <div
                        style={{
                          width: '36px',
                          height: '4px',
                          backgroundColor: '#D1D5DB',
                          borderRadius: '100px',
                        }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold mb-4">Enter Location</h3>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Type location..."
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={() => setLocationFocused(false)}
                      className="w-full mt-4 py-3 rounded-xl bg-orange-500 text-white font-medium"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </PageContent>
      </MobilePage>
    </div>
  );
}

export default function CreateItineraryPage() {
  return (
    <ProtectedRoute title="Create Itinerary" description="Log in / sign up to create an itinerary item" buttonText="Log in">
      <CreateItineraryPageContent />
    </ProtectedRoute>
  );
}

