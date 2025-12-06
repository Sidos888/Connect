"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, Plus, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import DeleteMomentModal from "./DeleteMomentModal";

interface EditMomentPageProps {
  moment: any;
  momentLabel: string; // e.g., "Primary School"
  onBack: () => void;
  onSave: () => void;
}

// Convert base64 data URL to Blob with proper MIME type (same as listing creation)
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
    console.error('dataURLtoBlob error:', error);
    throw error;
  }
};

export default function EditMomentPage({ moment, momentLabel, onBack, onSave }: EditMomentPageProps) {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with existing moment data
  const [title, setTitle] = useState(moment.title || "");
  const [summary, setSummary] = useState(moment.summary || "");
  const [startDate, setStartDate] = useState(() => {
    if (!moment.start_date) return "";
    const date = new Date(moment.start_date);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [startTime, setStartTime] = useState(() => {
    if (!moment.start_date) return "";
    const date = new Date(moment.start_date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [endDate, setEndDate] = useState(() => {
    if (!moment.end_date) return "";
    const date = new Date(moment.end_date);
    return date.toISOString().split('T')[0];
  });
  const [endTime, setEndTime] = useState(() => {
    if (!moment.end_date) return "";
    const date = new Date(moment.end_date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [includeEndTime, setIncludeEndTime] = useState(!!moment.end_date);
  const [location, setLocation] = useState(moment.location || "");
  const [pendingPhotos, setPendingPhotos] = useState<string[]>(moment.photo_urls || []);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Original values for change detection
  const originalValues = {
    title: moment.title || "",
    summary: moment.summary || "",
    startDate: startDate,
    startTime: startTime,
    endDate: endDate,
    endTime: endTime,
    includeEndTime: !!moment.end_date,
    location: moment.location || "",
    photos: JSON.stringify(moment.photo_urls || [])
  };

  // Check for changes
  const hasChanges = 
    title !== originalValues.title ||
    summary !== originalValues.summary ||
    startDate !== originalValues.startDate ||
    startTime !== originalValues.startTime ||
    endDate !== originalValues.endDate ||
    endTime !== originalValues.endTime ||
    includeEndTime !== originalValues.includeEndTime ||
    location !== originalValues.location ||
    JSON.stringify(pendingPhotos) !== originalValues.photos;

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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPendingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;

    console.log('💾 EditMomentPage: Starting save process');
    setSaving(true);
    
    try {
      // Separate existing photos from new photos
      const existingPhotos = pendingPhotos.filter(p => !p.startsWith('data:image/'));
      const newPhotos = pendingPhotos.filter(p => p.startsWith('data:image/'));
      
      console.log('📸 EditMomentPage: Photo analysis', {
        total: pendingPhotos.length,
        existing: existingPhotos.length,
        new: newPhotos.length
      });
      
      let finalPhotos = [...existingPhotos];
      
      // Upload new photos if any
      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i];
        console.log(`📤 EditMomentPage: Uploading photo ${i + 1}/${newPhotos.length}`);
        
        let fileName: string | undefined;
        try {
          // Convert base64 data URL to blob with proper MIME type
          const blob = dataURLtoBlob(photo);
          
          console.log('📤 EditMomentPage: Blob created (proper conversion)', {
            size: blob.size,
            type: blob.type
          });
          
          // Validate blob
          if (!blob || blob.size === 0) {
            console.error('❌ EditMomentPage: Invalid blob', { size: blob?.size });
            continue;
          }
          
          // Determine file extension from blob type
          let fileExt = 'jpg';
          if (blob.type.includes('png')) fileExt = 'png';
          else if (blob.type.includes('webp')) fileExt = 'webp';
          else if (blob.type.includes('gif')) fileExt = 'gif';
          
          // Generate unique filename (same format as creation)
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 11);
          fileName = `moments/${moment.user_id}/${timestamp}-${randomStr}.${fileExt}`;
          
          console.log('📤 EditMomentPage: Uploading to storage', {
            bucket: 'listing-photos',
            fileName,
            contentType: blob.type,
            blobSize: blob.size,
            isBlob: blob instanceof Blob
          });
          
          // Upload with retry logic (EXACT same as listing creation)
          if (!supabase) {
            throw new Error('Supabase client not available');
          }

          // 🔍 DEBUG: Check Supabase client state before upload
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('🔍 EditMomentPage: Auth state check', {
              hasSession: !!session,
              userId: session?.user?.id,
              sessionError: sessionError?.message,
              hasSupabaseClient: !!supabase,
              storageAvailable: !!supabase.storage
            });
          } catch (authCheckError) {
            console.error('🔍 EditMomentPage: Auth check failed', authCheckError);
          }

          // 🔍 DEBUG: Validate blob before upload
          console.log('🔍 EditMomentPage: Blob validation', {
            isBlob: blob instanceof Blob,
            blobSize: blob.size,
            blobType: blob.type,
            blobConstructor: blob.constructor.name,
            hasArrayBuffer: typeof blob.arrayBuffer === 'function',
            hasStream: typeof blob.stream === 'function',
            hasText: typeof blob.text === 'function'
          });
          
          let uploadData;
          let uploadError;
          const maxRetries = 3;
          let retryCount = 0;
          
          while (retryCount < maxRetries) {
            try {
              console.log(`🔍 EditMomentPage: Starting upload attempt ${retryCount + 1}/${maxRetries}`, {
                fileName,
                blobSize: blob.size,
                blobType: blob.type,
                timestamp: Date.now()
              });

              const uploadStartTime = performance.now();
              console.log('🔍 EditMomentPage: Step 12 - Converting Blob to File for iOS compatibility');
              // Convert Blob to File (iOS WebView handles File objects better than Blobs from base64)
              const file = new File([blob], fileName, { type: blob.type });
              console.log('🔍 EditMomentPage: File created', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                isFile: file instanceof File,
                isBlob: file instanceof Blob
              });
              
              console.log('🔍 EditMomentPage: Step 13 - Calling upload() method with File');
              const uploadPromise = supabase.storage
                .from('listing-photos')
                .upload(fileName, file, {
                  cacheControl: '3600',
                  upsert: false,
                  contentType: file.type
                });
              
              console.log('🔍 EditMomentPage: Step 14 - Upload promise created', {
                hasPromise: !!uploadPromise,
                promiseType: typeof uploadPromise,
                isPromise: uploadPromise instanceof Promise,
                timestamp: Date.now()
              });
              
              // Add timeout (30 seconds per upload)
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
              );
              
              console.log('🔍 EditMomentPage: Step 15 - Racing upload vs timeout (30s)');
              const raceStartTime = performance.now();
              const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
              const raceDuration = performance.now() - raceStartTime;
              const uploadDuration = performance.now() - uploadStartTime;
              
              console.log('🔍 EditMomentPage: Step 16 - Promise race completed', {
                raceDuration: `${raceDuration.toFixed(2)}ms`,
                totalDuration: `${uploadDuration.toFixed(2)}ms`
              });
              
              console.log('🔍 EditMomentPage: Upload race completed', {
                duration: `${uploadDuration.toFixed(2)}ms`,
                hasData: !!result?.data,
                hasError: !!result?.error,
                resultKeys: result ? Object.keys(result) : []
              });
              
              uploadData = result.data;
              uploadError = result.error;
              
              if (!uploadError) {
                console.log('✅ EditMomentPage: Upload succeeded on attempt', retryCount + 1, {
                  uploadData,
                  duration: `${uploadDuration.toFixed(2)}ms`
                });
                break; // Success, exit retry loop
              }
              
              // 🔍 DEBUG: Log detailed error information
              console.error(`🔍 EditMomentPage: Upload attempt ${retryCount + 1} failed`, {
                error: uploadError,
                errorName: uploadError?.name,
                errorMessage: uploadError?.message,
                errorStack: uploadError?.stack,
                statusCode: uploadError?.statusCode,
                errorDetails: JSON.stringify(uploadError, null, 2),
                duration: `${uploadDuration.toFixed(2)}ms`,
                blobSize: blob.size,
                blobType: blob.type,
                fileName
              });
              
              // If error is retryable, try again
              if (retryCount < maxRetries - 1 && (
                uploadError.message?.includes('network') || 
                uploadError.message?.includes('timeout') ||
                uploadError.message?.includes('Load failed')
              )) {
                retryCount++;
                const backoffDelay = 1000 * retryCount;
                console.warn(`📤 EditMomentPage: Upload attempt ${retryCount} failed, retrying in ${backoffDelay}ms... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay)); // Exponential backoff
                continue;
              }
              
              break; // Non-retryable error or max retries reached
            } catch (timeoutError) {
              console.error(`🔍 EditMomentPage: Upload exception on attempt ${retryCount + 1}`, {
                error: timeoutError,
                errorName: timeoutError?.name,
                errorMessage: timeoutError?.message,
                errorStack: timeoutError?.stack,
                isTimeout: timeoutError instanceof Error && timeoutError.message.includes('timeout')
              });
              
              if (retryCount < maxRetries - 1) {
                retryCount++;
                const backoffDelay = 1000 * retryCount;
                console.warn(`📤 EditMomentPage: Upload timeout, retrying in ${backoffDelay}ms... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                continue;
              }
              uploadError = timeoutError as any;
              break;
            }
          }

          if (uploadError) {
            console.error(`❌ EditMomentPage: Upload failed after ${retryCount + 1} attempts`, {
              error: uploadError,
              errorName: uploadError?.name,
              errorMessage: uploadError?.message,
              fileName,
              blobSize: blob.size,
              blobType: blob.type
            });
            continue; // Skip this photo but continue with others
          }

          console.log('✅ EditMomentPage: Upload successful', { uploadData });

          const { data: { publicUrl } } = supabase.storage
            .from('listing-photos')
            .getPublicUrl(fileName);
            
          console.log('🔗 EditMomentPage: Got public URL', { publicUrl });
          finalPhotos.push(publicUrl);
        } catch (photoError) {
          console.error('❌ EditMomentPage: Photo upload failed', {
            error: photoError,
            fileName: fileName || 'unknown'
          });
        }
      }

      console.log('📸 EditMomentPage: Final photos array', {
        count: finalPhotos.length,
        urls: finalPhotos
      });

      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = includeEndTime && endDate && endTime 
        ? new Date(`${endDate}T${endTime}`)
        : null;

      console.log('📅 EditMomentPage: Date/time values', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime?.toISOString()
      });

      // Update moment in database
      const updateData = {
        title,
        summary: summary || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime ? endDateTime.toISOString() : null,
        location: location || null,
        photo_urls: finalPhotos,
        updated_at: new Date().toISOString()
      };
      
      console.log('💾 EditMomentPage: Updating database', {
        momentId: moment.id,
        updateData
      });

      if (!supabase) {
        console.error('❌ EditMomentPage: Supabase client not available');
        alert('Failed to update moment: Database connection error');
        return;
      }

      const { data: updateResult, error } = await supabase
        .from('user_moments')
        .update(updateData)
        .eq('id', moment.id)
        .select();

      if (error) {
        console.error('❌ EditMomentPage: Database update error', error);
        alert('Failed to update moment');
      } else {
        console.log('✅ EditMomentPage: Database updated successfully', { updateResult });
        onSave();
      }
    } catch (error) {
      console.error('❌ EditMomentPage: Save process error', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!supabase || deleting) return;

    setDeleting(true);
    try {
      console.log('🗑️ EditMomentPage: Deleting moment', moment.id);

      const { error } = await supabase
        .from('user_moments')
        .delete()
        .eq('id', moment.id);

      if (error) {
        console.error('❌ EditMomentPage: Delete error', error);
        alert('Failed to delete moment. Please try again.');
        setDeleting(false);
        return;
      }

      console.log('✅ EditMomentPage: Moment deleted successfully');
      
      // Navigate to timeline full page after deletion
      router.push('/menu?view=timeline');
    } catch (error) {
      console.error('❌ EditMomentPage: Delete failed', error);
      alert('Failed to delete moment. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden">
      {/* Header */}
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
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: 'white',
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
            <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 flex-1 text-center min-w-0">
            {momentLabel}
          </h1>
          
          {/* Save Button - Grey initially, Orange when changes detected */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: hasChanges ? '#FF6600' : '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow',
              opacity: hasChanges ? 1 : 0.6
            }}
          >
            <Check size={20} className={hasChanges ? "text-white" : "text-gray-400"} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ paddingTop: '32px' }}>
        <div className="space-y-3">
          {/* Upload Photos Card */}
          <div
            className="bg-white rounded-2xl p-4"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            {pendingPhotos.length === 0 ? (
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

                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {pendingPhotos.map((photoData, index) => (
                    <div
                      key={index}
                      className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <Image
                        src={photoData}
                        alt={`Photo ${index + 1}`}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
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
          </div>

          {/* Title Input */}
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white rounded-2xl px-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              height: '56px',
            }}
          />

          {/* Summary Textarea */}
          <textarea
            placeholder="Write a short summary ..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full bg-white rounded-2xl px-4 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              minHeight: '120px',
            }}
          />

          {/* Date & Time Card */}
          <div
            className="bg-white rounded-2xl p-4"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            {/* Start Date/Time */}
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-900 mb-2 block">Starts</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none"
                  style={{ height: '40px' }}
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none"
                  style={{ height: '40px' }}
                />
              </div>
            </div>

            {/* Include End Time Toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-900">Include end time</span>
              <button
                onClick={() => setIncludeEndTime(!includeEndTime)}
                className="relative w-11 h-6 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: includeEndTime ? '#FF6600' : '#E5E7EB',
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                  style={{
                    left: includeEndTime ? 'calc(100% - 22px)' : '2px',
                  }}
                />
              </button>
            </div>

            {/* End Date/Time (conditional) */}
            {includeEndTime && (
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-900 mb-2 block">Ends</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none"
                    style={{ height: '40px' }}
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none"
                    style={{ height: '40px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location Input */}
          <div
            className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              height: '56px',
            }}
          >
            <input
              type="text"
              placeholder="Choose Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
            />
            <MapPin size={20} className="text-gray-400 flex-shrink-0" strokeWidth={2} />
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full rounded-2xl transition-all duration-200 hover:-translate-y-[1px] mt-6"
          style={{
            padding: '16px',
            background: 'white',
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
          <div className="flex items-center justify-center gap-2">
            <Trash2 size={18} className="text-red-600" strokeWidth={2.5} />
            <span className="text-base font-medium text-red-600">Delete Moment</span>
          </div>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteMomentModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        momentTitle={moment.title || undefined}
      />
    </div>
  );
}

