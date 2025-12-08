"use client";

import { useState, useEffect } from "react";
import { MobilePage } from "@/components/layout/PageSystem";
import { MapPin, Calendar } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Image from "next/image";

interface Highlight {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  location: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface HighlightDetailPageProps {
  highlightId: string;
  onBack: () => void;
}

export default function HighlightDetailPage({ highlightId, onBack }: HighlightDetailPageProps) {
  const supabase = getSupabaseClient();
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlight = async () => {
      if (!highlightId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_highlights')
          .select('*')
          .eq('id', highlightId)
          .single();

        if (error) {
          console.error('Error fetching highlight:', error);
        } else {
          setHighlight(data);
        }
      } catch (error) {
        console.error('Error in fetchHighlight:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlight();
  }, [highlightId, supabase]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const buttonSize = isMobile ? '44px' : '40px';

  // Format date similar to moment detail page
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      
      // Add ordinal suffix
      const getOrdinal = (n: number) => {
        if (n % 10 === 1 && n % 100 !== 11) return n + 'st';
        if (n % 10 === 2 && n % 100 !== 12) return n + 'nd';
        if (n % 10 === 3 && n % 100 !== 13) return n + 'rd';
        return n + 'th';
      };
      
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
      
      return `${month} ${getOrdinal(day)}, ${year} at ${hours}:${minutesStr}${ampm}`;
    } catch {
      return dateString;
    }
  };

  if (loading || !highlight) {
    return (
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          {/* Simple header with just back button */}
          <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
            <div className="px-4 lg:px-8" style={{ 
              paddingTop: isMobile ? 'max(env(safe-area-inset-top), 70px)' : '32px',
              paddingBottom: '16px',
              position: 'relative',
              zIndex: 10,
              pointerEvents: 'auto'
            }}>
              <button
                onClick={onBack}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
                aria-label="Back"
              >
                <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </MobilePage>
      </div>
    );
  }

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        {/* Custom Header - Back button + Title */}
        <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
          {/* Blur layers */}
          <div className="absolute top-0 left-0 right-0" style={{
            height: isMobile ? '135px' : '100px',
            background: isMobile 
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.78) 20%, rgba(255,255,255,0.68) 40%, rgba(255,255,255,0.62) 60%, rgba(255,255,255,0.58) 80%, rgba(255,255,255,0.3) 100%)'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.78) 20%, rgba(255,255,255,0.68) 40%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.25) 80%, rgba(255,255,255,0.05) 100%)'
          }} />
          
          {/* Header content */}
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
              className="absolute left-4 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                top: isMobile ? 'max(env(safe-area-inset-top), 70px)' : '32px',
                width: buttonSize,
                height: buttonSize,
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
              aria-label="Back"
            >
              <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Title (centered) */}
            <div className="flex items-center justify-center" style={{
              height: buttonSize
            }}>
              <span className="text-sm text-gray-600">Highlight</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
          paddingTop: 'var(--saved-content-padding-top, 140px)',
          paddingBottom: '32px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <div className="space-y-6">
            {/* Image Section */}
            {highlight.image_url && (
              <div className="relative">
                <div 
                  className="w-full rounded-2xl overflow-hidden"
                  style={{
                    aspectRatio: '1',
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  }}
                >
                  <Image
                    src={highlight.image_url}
                    alt={highlight.title}
                    width={800}
                    height={800}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Centered Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {highlight.title}
              </h1>
            </div>

            {/* Centered Date/Time */}
            <div className="text-center">
              <p className="text-base font-normal text-gray-500">
                {formatDate(highlight.created_at)}
              </p>
            </div>

            {/* Summary Card */}
            {highlight.summary && (
              <div
                className="bg-white rounded-2xl p-4"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{highlight.summary}</p>
              </div>
            )}

            {/* Location Card */}
            {highlight.location && (
              <div
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  height: '56px',
                }}
              >
                <MapPin size={20} className="text-gray-600 flex-shrink-0" strokeWidth={2} />
                <span className="text-sm font-medium text-gray-900">{highlight.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Blur */}
        <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: '80px',
            background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
          }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '20px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
          <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '20px', backdropFilter: 'blur(0.3px)', WebkitBackdropFilter: 'blur(0.3px)' }} />
          <div className="absolute left-0 right-0" style={{ bottom: '40px', height: '20px', backdropFilter: 'blur(0.15px)', WebkitBackdropFilter: 'blur(0.15px)' }} />
          <div className="absolute left-0 right-0" style={{ bottom: '60px', height: '20px', backdropFilter: 'blur(0.05px)', WebkitBackdropFilter: 'blur(0.05px)' }} />
        </div>
      </MobilePage>
    </div>
  );
}

