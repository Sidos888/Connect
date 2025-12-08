"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import ListingPhotoCollage from '@/components/listings/ListingPhotoCollage';
import PhotoViewer from '@/components/listings/PhotoViewer';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";

interface Highlight {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  location: string | null;
  image_url: string | null;
  photo_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

interface HighlightsProps {
  userId?: string;
  onHighlightClick?: (highlight: Highlight) => void;
}

export default function Highlights({ userId, onHighlightClick }: HighlightsProps) {
  const searchParams = useSearchParams();
  const { account } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [gridViewHighlight, setGridViewHighlight] = useState<Highlight | null>(null);

  // Get userId from props, searchParams, or use current user
  const targetUserId = userId || searchParams?.get('userId') || account?.id;

  useEffect(() => {
    const loadHighlights = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase client not available');
        }

        const { data, error: fetchError } = await supabase
          .from('user_highlights')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Process highlights to ensure photo_urls is properly formatted
        const processedHighlights = (data || []).map((highlight: any) => ({
          ...highlight,
          // If photo_urls exists and is an array, use it; otherwise fall back to image_url
          photo_urls: highlight.photo_urls && Array.isArray(highlight.photo_urls) && highlight.photo_urls.length > 0
            ? highlight.photo_urls
            : highlight.image_url
              ? [highlight.image_url] // Convert single image_url to array
              : []
        }));

        setHighlights(processedHighlights);
      } catch (err: any) {
        console.error('Error loading highlights:', err);
        setError(err.message || 'Failed to load highlights');
        setHighlights([]);
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();
  }, [targetUserId]);

  const handleHighlightClick = (highlight: Highlight) => {
    // Always open highlight detail page when card is clicked
    if (onHighlightClick) {
      onHighlightClick(highlight);
    }
  };

  const handlePhotoClick = (highlight: Highlight, photoIndex?: number) => {
    // Clicking the card/image always opens highlight detail page
    if (onHighlightClick) {
      onHighlightClick(highlight);
    }
  };

  const handleGridClick = (highlight: Highlight) => {
    // From highlights page, clicking # icon should open grid view
    setGridViewHighlight(highlight);
  };

  const handleBackFromGrid = () => {
    setGridViewHighlight(null);
  };

  if (loading) {
    return (
      <div className="flex-1 px-8 pb-8 overflow-y-auto scrollbar-hide flex items-center justify-center" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        minHeight: '400px'
      }}>
        <div className="text-gray-400 text-sm">Loading highlights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-8 pb-8 overflow-y-auto scrollbar-hide flex items-center justify-center" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        minHeight: '400px'
      }}>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="flex-1 px-8 pb-8 overflow-y-auto scrollbar-hide flex items-center justify-center" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        minHeight: '400px'
      }}>
        <div className="text-gray-400 text-sm">No highlights yet</div>
      </div>
    );
  }

  // Get photos for selected highlight
  const selectedPhotos = selectedHighlight 
    ? (selectedHighlight.photo_urls || (selectedHighlight.image_url ? [selectedHighlight.image_url] : []))
    : [];

  // Get photos for grid view highlight
  const gridViewPhotos = gridViewHighlight
    ? (gridViewHighlight.photo_urls || (gridViewHighlight.image_url ? [gridViewHighlight.image_url] : []))
    : [];

  // If grid view is active, show the grid
  if (gridViewHighlight && gridViewPhotos.length > 0) {
    return (
      <div style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Highlight Photos"
            subtitle={<span className="text-xs font-medium text-gray-900">{gridViewPhotos.length} {gridViewPhotos.length === 1 ? 'photo' : 'photos'}</span>}
            backButton
            onBack={handleBackFromGrid}
          />
          <PageContent>
            <div className="px-4 pb-8" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
              <div className="grid grid-cols-4 gap-4">
                {gridViewPhotos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setGridViewHighlight(null);
                      setSelectedHighlight(gridViewHighlight);
                      setSelectedPhotoIndex(index);
                    }}
                    className="relative aspect-square bg-transparent overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-[1px]"
                    style={{ 
                      borderWidth: '0.4px', 
                      borderColor: '#E5E7EB',
                      backgroundColor: 'transparent',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      willChange: 'transform, box-shadow',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                    }}
                  >
                    <img 
                      src={photo} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                      style={{
                        backgroundColor: 'transparent',
                        display: 'block',
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </PageContent>
        </MobilePage>
      </div>
    );
  }

  return (
    <>
    <div className="flex-1 px-4 pb-8 overflow-y-auto scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* Grid of highlights */}
      <div className="grid grid-cols-4 gap-2">
          {highlights.map((highlight) => {
            const photos = highlight.photo_urls || (highlight.image_url ? [highlight.image_url] : []);
            
            // On highlights grid page:
            // - Single photo: show just the image, no # icon
            // - 2-3 photos: show first image, no # icon
            // - 4+ photos: show 2x2 grid, no # icon
            // All cards clickable to open highlight detail page
            
            if (photos.length === 0) {
              return (
                <div
                  key={highlight.id}
                  className="aspect-square rounded-xl bg-gray-100"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                  }}
                />
              );
            }
            
            if (photos.length === 1) {
              // Single photo: just show image, no # icon
              return (
                <button
                  key={highlight.id}
                  onClick={() => handleHighlightClick(highlight)}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:opacity-90"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                  }}
                >
                  <img 
                    src={photos[0]} 
                    alt={highlight.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            }
            
            if (photos.length <= 3) {
              // 2-3 photos: show first image, no # icon badge
              return (
              <button
            key={highlight.id}
            onClick={() => handleHighlightClick(highlight)}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:opacity-90"
                style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
            }}
          >
              <img 
                    src={photos[0]} 
                alt={highlight.title}
                className="w-full h-full object-cover"
              />
                </button>
              );
            }
            
            // 4+ photos: show 2x2 grid, no # icon badge
            return (
              <div
                key={highlight.id}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:opacity-90"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                }}
                onClick={(e) => {
                  // Only trigger if clicking on the background (not a grid item)
                  const target = e.target as HTMLElement;
                  if (!target.closest('[data-photo-index]')) {
                    handleHighlightClick(highlight);
                  }
                }}
              >
                <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0">
                  {photos.slice(0, 4).map((photo, index) => (
                    <div 
                      key={index} 
                      className="w-full h-full overflow-hidden"
                      data-photo-index={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open highlight detail page when clicking a specific grid image
                        handleHighlightClick(highlight);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <img 
                        src={photo} 
                        alt={`${highlight.title} photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
          </div>
        ))}
      </div>
    </div>
            );
          })}
        </div>
      </div>

      {/* Photo Viewer */}
      {selectedHighlight && selectedPhotoIndex !== null && selectedPhotos.length > 0 && (
        <PhotoViewer
          isOpen={selectedPhotoIndex !== null}
          photos={selectedPhotos}
          initialIndex={selectedPhotoIndex}
          onClose={() => {
            setSelectedPhotoIndex(null);
            setSelectedHighlight(null);
          }}
        />
      )}
    </>
  );
}

