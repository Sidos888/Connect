"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { compressImage, fileToDataURL } from '@/lib/imageUtils';

interface ItineraryItem {
  title: string;
  summary?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  photo?: string | null;
}

interface EditItineraryModalProps {
  isOpen: boolean;
  itineraryItem: ItineraryItem;
  listingId: string;
  itemIndex: number;
  onClose: () => void;
  onSave: (updatedItem: ItineraryItem) => void;
  onDelete: () => void;
}

export default function EditItineraryModal({
  isOpen,
  itineraryItem,
  listingId,
  itemIndex,
  onClose,
  onSave,
  onDelete,
}: EditItineraryModalProps) {
  const { account } = useAuth();
  const [title, setTitle] = useState(itineraryItem.title || "");
  const [summary, setSummary] = useState(itineraryItem.summary || "");
  const [location, setLocation] = useState(itineraryItem.location || "");
  const [startDate, setStartDate] = useState<Date>(
    itineraryItem.startDate ? new Date(itineraryItem.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState<Date>(
    itineraryItem.endDate ? new Date(itineraryItem.endDate) : new Date(Date.now() + 2 * 60 * 60 * 1000)
  );
  const [photo, setPhoto] = useState<string | null>(itineraryItem.photo || null);
  const [originalPhoto] = useState<string | null>(itineraryItem.photo || null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateTimeInputRef = useRef<HTMLInputElement>(null);
  const endDateTimeInputRef = useRef<HTMLInputElement>(null);
  const [titleFocused, setTitleFocused] = useState(false);
  const [summaryFocused, setSummaryFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);

  // Reset state when modal opens with new item
  useEffect(() => {
    if (isOpen) {
      setTitle(itineraryItem.title || "");
      setSummary(itineraryItem.summary || "");
      setLocation(itineraryItem.location || "");
      setStartDate(itineraryItem.startDate ? new Date(itineraryItem.startDate) : new Date());
      setEndDate(itineraryItem.endDate ? new Date(itineraryItem.endDate) : new Date(Date.now() + 2 * 60 * 60 * 1000));
      setPhoto(itineraryItem.photo || null);
    }
  }, [isOpen, itineraryItem]);

  // Check if any changes were made
  const hasChanges = 
    title !== (itineraryItem.title || "") ||
    summary !== (itineraryItem.summary || "") ||
    location !== (itineraryItem.location || "") ||
    startDate.toISOString() !== (itineraryItem.startDate || new Date().toISOString()) ||
    endDate.toISOString() !== (itineraryItem.endDate || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()) ||
    photo !== originalPhoto;

  const isFormComplete = title.trim().length > 0;

  // Convert base64 data URL to Blob
  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Upload photo to Supabase Storage
  const uploadPhoto = async (photoData: string): Promise<string> => {
    const supabase = getSupabaseClient();
    if (!supabase || !account) {
      throw new Error('Not authenticated');
    }

    const blob = dataURLtoBlob(photoData);
    let fileExt = 'jpg';
    if (blob.type.includes('png')) fileExt = 'png';
    else if (blob.type.includes('webp')) fileExt = 'webp';

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    const fileName = `${account.id}/itinerary_${timestamp}_${randomStr}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('listing-photos')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: blob.type
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('listing-photos')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  // Handle photo selection
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Image is too large (max 10MB)');
        return;
      }

      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
      });

      const dataUrl = await fileToDataURL(compressedFile);
      setPhoto(dataUrl);
    } catch (error) {
      console.error('Error processing photo:', error);
      alert('Failed to process photo');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!isFormComplete || !hasChanges) return;

    setSaving(true);
    try {
      let photoUrl: string | null = photo;

      // Upload new photo if it's a base64 data URL (not an existing URL)
      if (photo && photo.startsWith('data:')) {
        photoUrl = await uploadPhoto(photo);
      }

      const updatedItem: ItineraryItem = {
        title: title.trim(),
        summary: summary.trim(),
        location: location.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        photo: photoUrl
      };

      onSave(updatedItem);
    } catch (error) {
      console.error('Error saving itinerary item:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
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
      if (newStartDate >= endDate) {
        setEndDate(new Date(newStartDate.getTime() + 60 * 1000));
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
      if (newEndDate <= startDate) {
        alert('End time must be after start time');
        return;
      }
      setEndDate(newEndDate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-white" style={{ overflowX: 'hidden' }}>
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-10 bg-white"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 70px)',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex items-center justify-center relative">
          {/* Close Button - Absolute Left */}
          <button
            onClick={onClose}
            className="absolute left-0 flex items-center justify-center transition-all duration-200"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <X size={18} className="text-gray-900" strokeWidth={2.5} />
          </button>

          {/* Title - Centered */}
          <h1 className="text-xl font-semibold text-gray-900">Edit Itinerary</h1>

          {/* Save Button - Absolute Right */}
          <button
            onClick={handleSave}
            disabled={!isFormComplete || !hasChanges || saving}
            className="absolute right-0 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '100px',
              background: (isFormComplete && hasChanges && !saving) ? '#FF6600' : '#9CA3AF',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <Check size={18} className="text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="overflow-y-auto overflow-x-hidden"
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top), 70px) + 80px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 120px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          height: '100%',
        }}
      >
        <div className="space-y-4" style={{ overflowX: 'hidden' }}>
          {/* Photo Section */}
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
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            
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

          {/* Title Input */}
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
              }}
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

          {/* Summary Input */}
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
              }}
            />
            {(summaryFocused || summary) && (
              <label className="absolute left-4 top-1.5 text-xs font-medium text-gray-500 pointer-events-none">
                Summary
              </label>
            )}
            {!summaryFocused && !summary && (
              <label className="absolute left-4 top-5 text-base font-medium text-gray-400 pointer-events-none">
                Summary
              </label>
            )}
          </div>

          {/* Date and Time Card */}
          <div className="rounded-xl bg-white p-4 space-y-4"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Starts</span>
              <button
                type="button"
                onClick={handleDateTimeClick}
                className="relative cursor-pointer focus:outline-none"
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
                  style={{ width: '200%', left: '-50%' }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Ends</span>
              <button
                type="button"
                onClick={handleEndDateTimeClick}
                className="relative cursor-pointer focus:outline-none"
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
                  style={{ width: '200%', left: '-50%' }}
                />
              </button>
            </div>
          </div>

          {/* Location Input */}
          <div className="relative">
            <button
              onClick={() => setLocationFocused(true)}
              type="button"
              className={`w-full h-14 pl-4 pr-4 focus:ring-0 focus:outline-none transition-all bg-white text-left rounded-xl ${(locationFocused || location) ? 'pt-6 pb-2' : 'py-5'}`}
              style={{ 
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              {location && (
                <span className="text-sm font-medium text-gray-700">
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
                Location
              </label>
            )}
          </div>

          {/* Location Modal */}
          {locationFocused && (
            <>
              <div 
                className="fixed inset-0 z-[10001]"
                onClick={() => setLocationFocused(false)}
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              />
              <div
                className="fixed inset-x-0 bottom-0 z-[10002] bg-white rounded-t-3xl p-6"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
              >
                <div className="flex justify-center mb-4">
                  <div style={{ width: '36px', height: '4px', backgroundColor: '#D1D5DB', borderRadius: '100px' }} />
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

          {/* Delete Itinerary Button */}
          <div className="pt-8">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <span className="text-base font-semibold text-red-600">Delete Itinerary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 z-[10003]"
            onClick={() => setShowDeleteConfirm(false)}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[10004] bg-white rounded-t-3xl p-6"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
          >
            <div className="flex justify-center mb-4">
              <div style={{ width: '36px', height: '4px', backgroundColor: '#D1D5DB', borderRadius: '100px' }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Itinerary Item?</h3>
            <p className="text-gray-500 mb-6">This action cannot be undone.</p>
            
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-medium mb-3"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete();
              }}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-medium"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
