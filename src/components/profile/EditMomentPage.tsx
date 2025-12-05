"use client";

import { useState, useEffect } from "react";
import { MobilePage } from "@/components/layout/PageSystem";
import { Check, GraduationCap, Briefcase, Heart, Home, Sparkles, MoreHorizontal, MapPin, Plus, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";

interface EditMomentPageProps {
  moment: any;
  onBack: () => void;
  onSave: () => void;
}

// Category and moment type mappings
const CATEGORIES = [
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'career', label: 'Career', icon: Briefcase },
  { value: 'relationships', label: 'Relationships', icon: Heart },
  { value: 'life-changes', label: 'Life Changes', icon: Home },
  { value: 'experiences', label: 'Experiences', icon: Sparkles },
  { value: 'other', label: 'Other', icon: MoreHorizontal }
];

const MOMENT_TYPES: Record<string, Array<{ value: string; label: string }>> = {
  'education': [
    { value: 'preschool', label: 'Preschool' },
    { value: 'primary-school', label: 'Primary School' },
    { value: 'high-school', label: 'High School' },
    { value: 'university-tafe', label: 'University/Tafe' },
    { value: 'course-certificate', label: 'Course / Certificate' }
  ],
  'career': [
    { value: 'first-job', label: 'First Job' },
    { value: 'new-job', label: 'New Job' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'business-started', label: 'Business Started' }
  ],
  'relationships': [
    { value: 'relationship-started', label: 'Relationship Started' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'marriage', label: 'Marriage' },
    { value: 'child-born', label: 'Child Born' }
  ],
  'life-changes': [
    { value: 'moved-house', label: 'Moved House' },
    { value: 'bought-home', label: 'Bought a Home' },
    { value: 'major-transition', label: 'Major Transition' }
  ],
  'experiences': [
    { value: 'major-trip', label: 'Major Trip' },
    { value: 'big-achievement', label: 'Big Achievement' },
    { value: 'important-memory', label: 'Important Memory' }
  ],
  'other': [
    { value: 'personal-milestone', label: 'Personal Milestone' },
    { value: 'custom-moment', label: 'Custom Moment' }
  ]
};

export default function EditMomentPage({ moment, onBack, onSave }: EditMomentPageProps) {
  const supabase = getSupabaseClient();
  const { account } = useAuth();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [category, setCategory] = useState(moment.category || 'education');
  const [momentType, setMomentType] = useState(moment.moment_type || '');
  const [title, setTitle] = useState(moment.title || '');
  const [startDate, setStartDate] = useState<Date>(() => 
    moment.start_date ? new Date(moment.start_date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | null>(() => 
    moment.end_date ? new Date(moment.end_date) : null
  );
  const [hasEndDate, setHasEndDate] = useState(!!moment.end_date);
  const [summary, setSummary] = useState(moment.summary || '');
  const [location, setLocation] = useState(moment.location || '');
  const [photos, setPhotos] = useState<string[]>(moment.photo_urls || []);

  // Original values for change detection
  const originalValues = {
    category: moment.category || 'education',
    momentType: moment.moment_type || '',
    title: moment.title || '',
    startDate: moment.start_date ? new Date(moment.start_date).toISOString() : '',
    endDate: moment.end_date ? new Date(moment.end_date).toISOString() : '',
    hasEndDate: !!moment.end_date,
    summary: moment.summary || '',
    location: moment.location || '',
    photos: moment.photo_urls || []
  };

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const buttonSize = isMobile ? '44px' : '40px';

  // Check for changes
  useEffect(() => {
    const photosChanged = 
      photos.length !== originalValues.photos.length ||
      photos.some((photo, index) => {
        if (photo.startsWith('data:image/')) return true;
        return photo !== originalValues.photos[index];
      });

    const changed = 
      category !== originalValues.category ||
      momentType !== originalValues.momentType ||
      title !== originalValues.title ||
      startDate.toISOString() !== originalValues.startDate ||
      hasEndDate !== originalValues.hasEndDate ||
      (hasEndDate && endDate && endDate.toISOString() !== originalValues.endDate) ||
      summary !== originalValues.summary ||
      location !== originalValues.location ||
      photosChanged;

    setHasChanges(changed);
  }, [category, momentType, title, startDate, endDate, hasEndDate, summary, location, photos]);

  // Handle save
  const handleSave = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);
    try {
      // Upload new photos if any
      let finalPhotos = photos.filter(p => !p.startsWith('data:image/'));
      
      for (const photo of photos.filter(p => p.startsWith('data:image/'))) {
        const fileName = `${moment.user_id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        
        // Convert base64 to blob
        const response = await fetch(photo);
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('moment-photos')
          .upload(fileName, blob);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('moment-photos')
            .getPublicUrl(fileName);
          finalPhotos.push(publicUrl);
        }
      }

      // Update moment in database
      const { error } = await supabase
        .from('user_moments')
        .update({
          category,
          moment_type: momentType,
          title,
          start_date: startDate.toISOString(),
          end_date: hasEndDate && endDate ? endDate.toISOString() : null,
          summary: summary || null,
          location: location || null,
          photo_urls: finalPhotos,
          updated_at: new Date().toISOString()
        })
        .eq('id', moment.id);

      if (error) {
        console.error('Error updating moment:', error);
        alert('Failed to update moment');
      } else {
        onSave();
      }
    } catch (error) {
      console.error('Error saving moment:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotosArray: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      if (photos.length + newPhotosArray.length >= 12) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPhotosArray.push(event.target.result as string);
          processed++;

          if (processed === files.length) {
            setPhotos([...photos, ...newPhotosArray]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Format date for input
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div style={{ '--saved-content-padding-top': '104px' } as React.CSSProperties}>
      <MobilePage>
        {/* Custom Header */}
        <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
          {/* Blur background */}
          <div className="absolute top-0 left-0 right-0" style={{
            height: isMobile ? '135px' : '100px',
            background: isMobile 
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.78) 20%, rgba(255,255,255,0.68) 40%, rgba(255,255,255,0.62) 60%, rgba(255,255,255,0.58) 80%, rgba(255,255,255,0.3) 100%)'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.78) 20%, rgba(255,255,255,0.68) 40%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.25) 80%, rgba(255,255,255,0.05) 100%)'
          }} />
          
          <div className="px-4 lg:px-8" style={{ 
            paddingTop: isMobile ? 'max(env(safe-area-inset-top), 70px)' : '32px',
            paddingBottom: '16px',
            position: 'relative',
            zIndex: 10,
            pointerEvents: 'auto'
          }}>
            {/* Back button */}
            <button
              onClick={onBack}
              className="absolute left-4 flex items-center justify-center transition-all duration-200"
              style={{
                top: isMobile ? 'max(env(safe-area-inset-top), 70px)' : '32px',
                width: buttonSize,
                height: buttonSize,
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Title */}
            <div className="flex items-center justify-center" style={{ height: buttonSize }}>
              <h1 className="text-lg font-semibold text-gray-900">Edit Moment</h1>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="absolute right-4 flex items-center justify-center transition-all duration-200"
              style={{
                top: isMobile ? 'max(env(safe-area-inset-top), 70px)' : '32px',
                width: buttonSize,
                height: buttonSize,
                borderRadius: '100px',
                background: hasChanges ? '#FF6B35' : 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                opacity: hasChanges ? 1 : 0.5,
                cursor: hasChanges ? 'pointer' : 'default'
              }}
            >
              <Check size={20} className={hasChanges ? "text-white" : "text-gray-400"} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
          paddingTop: 'var(--saved-content-padding-top, 104px)',
          paddingBottom: '32px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <div className="space-y-4">
            {/* Photos Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover rounded-xl"
                      style={{
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      }}
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X size={14} className="text-white" strokeWidth={3} />
                    </button>
                  </div>
                ))}
                
                {photos.length < 12 && (
                  <label className="aspect-square flex items-center justify-center rounded-xl cursor-pointer"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      background: 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    <Plus size={24} className="text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setMomentType(''); // Reset moment type when category changes
                }}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Moment Type */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">Type</label>
              <select
                value={momentType}
                onChange={(e) => setMomentType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              >
                <option value="">Select type...</option>
                {MOMENT_TYPES[category]?.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">Start Date</label>
              <input
                type="date"
                value={formatDateForInput(startDate)}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              />
            </div>

            {/* End Date Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => {
                  setHasEndDate(e.target.checked);
                  if (e.target.checked && !endDate) {
                    setEndDate(new Date(startDate.getTime() + 86400000)); // Next day
                  }
                }}
                className="w-5 h-5"
              />
              <label className="text-sm text-gray-700">Include end date</label>
            </div>

            {/* End Date */}
            {hasEndDate && (
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">End Date</label>
                <input
                  type="date"
                  value={endDate ? formatDateForInput(endDate) : ''}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                />
              </div>
            )}

            {/* Summary */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Add a summary..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl resize-none"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">Location</label>
              <div className="relative">
                <MapPin size={20} className="absolute left-4 top-3.5 text-gray-400" strokeWidth={2} />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </MobilePage>
    </div>
  );
}

