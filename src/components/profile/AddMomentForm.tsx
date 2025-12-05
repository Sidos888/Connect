"use client";

import { useState, useRef } from "react";
import { X, Check, Plus, MapPin } from "lucide-react";
import Image from "next/image";

interface AddMomentFormProps {
  momentType: string;
  momentLabel: string;
  category: string;
  onBack: () => void;
  onSave: (momentData: {
    title: string;
    summary: string;
    start_date: Date;
    end_date: Date | null;
    location: string;
    photo_urls: string[];
  }) => void;
}

export default function AddMomentForm({ 
  momentType, 
  momentLabel,
  category,
  onBack, 
  onSave 
}: AddMomentFormProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [includeEndTime, setIncludeEndTime] = useState(false);
  const [location, setLocation] = useState("");
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if form is valid (title and start date/time required)
  const isValid = title.trim() !== "" && startDate !== "" && startTime !== "";

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

  const handleSave = () => {
    if (!isValid) return;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = includeEndTime && endDate && endTime 
      ? new Date(`${endDate}T${endTime}`)
      : null;

    onSave({
      title,
      summary,
      start_date: startDateTime,
      end_date: endDateTime,
      location,
      photo_urls: pendingPhotos
    });
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
          {/* X Button */}
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
          >
            <X size={20} className="text-gray-900" strokeWidth={2.5} />
          </button>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 flex-1 text-center min-w-0">
            {momentLabel}
          </h1>
          
          {/* Orange Tick Button */}
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] flex-shrink-0 disabled:opacity-40"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '100px',
              background: isValid ? '#FF6600' : '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
          >
            <Check size={20} className="text-white" strokeWidth={2.5} />
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
                      <img
                        src={photoData}
                        alt={`Photo ${index + 1}`}
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
      </div>
    </div>
  );
}

