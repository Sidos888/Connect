"use client";

import { useState, useEffect } from 'react';
import { X, Clock, MapPin, ChevronLeft, Calendar, Check } from 'lucide-react';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useAppStore } from '@/lib/store';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FiltersModal({
  isOpen,
  onClose,
}: FiltersModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45); // Default to 45px
  const [currentView, setCurrentView] = useState<'filters' | 'when' | 'where'>('filters');
  const { selectedWhen, selectedWhere, setSelectedWhen, setSelectedWhere } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      // Mount modal and trigger slide-up animation
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      // Trigger slide-down animation before unmounting
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match transition duration
    }
  }, [isOpen]);

  // Detect device corner radius on mount
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  if (!shouldRender) return null;

  const handleClose = () => {
    // Trigger slide-down animation
    setIsVisible(false);
    // Close modal after animation completes
    setTimeout(() => {
      onClose();
      // Reset view to filters when closing
      setCurrentView('filters');
    }, 300); // Match transition duration
  };

  const handleWhenPillClick = () => {
    setCurrentView('when');
  };

  const handleWherePillClick = () => {
    setCurrentView('where');
  };

  const handleBackClick = () => {
    setCurrentView('filters');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      onClick={(e) => {
        // Close modal if clicking anywhere outside the modal content
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Backdrop - slight dim, no blur */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />
      
      {/* Modal - slides up from bottom */}
      <div 
        className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        onClick={(e) => {
          // Prevent clicks inside modal from closing it
          e.stopPropagation();
        }}
        style={{
          width: 'calc(100% - 16px)',
          maxWidth: '500px',
          marginTop: '20px',
          marginBottom: '8px',
          height: '50vh',
          // Match iOS screen corner radius (detected per device)
          // This ensures even spacing from screen edges
          borderTopLeftRadius: `${cornerRadius}px`,
          borderTopRightRadius: `${cornerRadius}px`,
          borderBottomLeftRadius: `${cornerRadius}px`,
          borderBottomRightRadius: `${cornerRadius}px`,
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Content Container with Slide Animation */}
        <div className="relative flex-1 overflow-hidden">
          {/* Filters View */}
          <div
            className="absolute inset-0 flex flex-col transition-transform duration-300 ease-out"
            style={{
              transform: currentView === 'filters' 
                ? 'translateX(0)' 
                : 'translateX(-100%)', // Slide left when going to when/where view
            }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
              <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Filters</h2>
              <button
                onClick={handleClose}
                className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  right: '24px',
                  top: '24px',
                  width: '44px',
                  height: '44px',
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
                <X size={20} className="text-gray-900" />
              </button>
            </div>

            {/* Filters Content */}
            <div className="px-6 pb-6 flex-1 flex flex-col justify-start overflow-y-auto"
              style={{
                paddingTop: '32px',
              }}
            >
              <div className="w-full max-w-sm mx-auto space-y-6">
                {/* When Filter Pill */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    When
                  </label>
                  <div 
                    onClick={handleWhenPillClick}
                    className="w-full rounded-full bg-white flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                      minHeight: '56px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                  >
                    <Clock size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-base font-semibold text-gray-900">{selectedWhen || 'Anytime'}</span>
                  </div>
                </div>

                {/* Where Filter Pill */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Where
                  </label>
                  <div 
                    onClick={handleWherePillClick}
                    className="w-full rounded-full bg-white flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      borderStyle: 'solid',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                      minHeight: '56px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                  >
                    <MapPin size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-base font-semibold text-gray-900">{selectedWhere || 'Adelaide'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* When Selection View */}
          <div
            className="absolute inset-0 flex flex-col transition-transform duration-300 ease-out"
            style={{
              transform: currentView === 'when'
                ? 'translateX(0)'
                : currentView === 'filters'
                  ? 'translateX(100%)' // Start from right, slide left when going back to filters
                  : 'translateX(-100%)', // Slide left when going to where view
            }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
              {/* Back Button */}
              <button
                onClick={handleBackClick}
                className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  left: '24px',
                  top: '24px',
                  width: '44px',
                  height: '44px',
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
                <ChevronLeft size={20} className="text-gray-900" />
              </button>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>When</h2>
            </div>

            {/* When Selection Content */}
            <div className="px-6 pb-6 flex-1 flex flex-col justify-start"
              style={{
                paddingTop: '8px',
                overflow: 'hidden'
              }}
            >
              <div className="w-full max-w-sm mx-auto space-y-3">
                {/* Anytime Option */}
                <div 
                  onClick={() => setSelectedWhen('Anytime')}
                  className="w-full rounded-2xl bg-white flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    minHeight: '56px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <span className="text-base font-semibold text-gray-900">Anytime</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    selectedWhen === 'Anytime'
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedWhen === 'Anytime' && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>

                {/* Today Option */}
                <div 
                  onClick={() => setSelectedWhen('Today')}
                  className="w-full rounded-2xl bg-white flex items-center justify-between px-5 py-3 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <span className="text-base font-semibold text-gray-900">Today</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    selectedWhen === 'Today'
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedWhen === 'Today' && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>

                {/* Tomorrow Option */}
                <div 
                  onClick={() => setSelectedWhen('Tomorrow')}
                  className="w-full rounded-2xl bg-white flex items-center justify-between px-5 py-3 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <span className="text-base font-semibold text-gray-900">Tomorrow</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    selectedWhen === 'Tomorrow'
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedWhen === 'Tomorrow' && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>

                {/* This Weekend Option */}
                <div 
                  onClick={() => setSelectedWhen('This Weekend')}
                  className="w-full rounded-2xl bg-white flex items-center justify-between px-5 py-3 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <span className="text-base font-semibold text-gray-900">This Weekend</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    selectedWhen === 'This Weekend'
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedWhen === 'This Weekend' && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>

                {/* Select Dates Option */}
                <div 
                  className="w-full rounded-2xl bg-white flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    minHeight: '56px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <Calendar size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-base font-semibold text-gray-900">Select Dates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Where Selection View */}
          <div
            className="absolute inset-0 flex flex-col transition-transform duration-300 ease-out"
            style={{
              transform: currentView === 'where'
                ? 'translateX(0)'
                : currentView === 'filters'
                  ? 'translateX(100%)' // Start from right, slide left when going back to filters
                  : 'translateX(-100%)', // Slide left when going to when view
            }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-center" style={{ paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px', minHeight: '60px' }}>
              {/* Back Button */}
              <button
                onClick={handleBackClick}
                className="absolute flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  left: '24px',
                  top: '24px',
                  width: '44px',
                  height: '44px',
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
                <ChevronLeft size={20} className="text-gray-900" />
              </button>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-900" style={{ lineHeight: '44px' }}>Where</h2>
            </div>

            {/* Where Selection Content */}
            <div className="px-6 pb-6 flex-1 flex flex-col justify-start"
              style={{
                paddingTop: '8px',
                overflow: 'hidden'
              }}
            >
              <div className="w-full max-w-sm mx-auto space-y-3">
                {/* Near me Option */}
                <div 
                  onClick={() => setSelectedWhere('Near me')}
                  className="w-full rounded-2xl bg-white flex items-center justify-between px-5 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    minHeight: '56px',
                    paddingTop: '10px',
                    paddingBottom: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <div className="flex flex-col items-start justify-center" style={{ gap: '2px' }}>
                    <span className="text-base font-semibold text-gray-900 leading-tight">Near me</span>
                    <span className="text-sm text-gray-500 leading-tight">Adelaide</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    selectedWhere === 'Near me'
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedWhere === 'Near me' && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>

                {/* Anywhere Option */}
                <div 
                  onClick={() => setSelectedWhere('Anywhere')}
                  className="w-full rounded-2xl bg-white flex items-center justify-between px-5 py-3 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <span className="text-base font-semibold text-gray-900">Anywhere</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    selectedWhere === 'Anywhere'
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedWhere === 'Anywhere' && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>

                {/* Choose location Option */}
                <div 
                  className="w-full rounded-2xl bg-white flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    minHeight: '56px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  <MapPin size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-base font-semibold text-gray-900">Choose location</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
