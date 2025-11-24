"use client";

import { Camera, Users, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listingsService, EventGalleryWithItems } from "@/lib/listingsService";
import { useAuth } from "@/lib/authContext";

/**
 * Memories - Unified component for Memories page
 * Used by both mobile route and web modal
 * Displays event galleries from listings the user has attended
 */
export default function Memories() {
  const router = useRouter();
  const { account } = useAuth();
  const [galleries, setGalleries] = useState<EventGalleryWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGalleries = async () => {
      if (!account?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { galleries: galleryData, error } = await listingsService.getUserEventGalleries(account.id);
        if (error) {
          console.error('Error loading galleries:', error);
        } else {
          setGalleries(galleryData);
        }
      } catch (error) {
        console.error('Error loading galleries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGalleries();
  }, [account?.id]);

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
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

  const handleGalleryClick = (listingId: string) => {
    router.push(`/listing?id=${listingId}&view=gallery`);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="text-center py-8 text-gray-500">Loading galleries...</div>
      </div>
    );
  }

  if (galleries.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="text-center py-8 text-gray-500">No event galleries yet</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* Event Galleries Section */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          {galleries.map((gallery) => {
            // Get listing data from gallery (it should have listings relation)
            const listing = (gallery as any).listings;
            const photoUrls = gallery.items.map(item => item.photo_url);
            
            return (
              <div key={gallery.id} className="space-y-2">
                <button
                  onClick={() => handleGalleryClick(gallery.listing_id)}
                  className="bg-white rounded-2xl overflow-hidden w-full transition-all duration-200 hover:-translate-y-[1px] cursor-pointer relative"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    willChange: 'transform, box-shadow',
                    aspectRatio: '1'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  {/* Photo Display */}
                  {photoUrls.length === 0 ? (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  ) : photoUrls.length <= 3 ? (
                    // 1-3 photos: show single image
                    <img 
                      src={photoUrls[0]} 
                      alt={gallery.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // 4+ photos: show 2x2 grid
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0">
                      {photoUrls.slice(0, 4).map((url, index) => (
                        <div key={index} className="w-full h-full overflow-hidden">
                          <img 
                            src={url} 
                            alt={`${gallery.title} photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Count Badges */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    {/* People Count */}
                    <div 
                      className="bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1"
                      style={{ borderRadius: '60px' }}
                    >
                      <Users size={12} className="text-gray-900" />
                      <span className="text-xs font-medium text-gray-900">{gallery.people_count}</span>
                    </div>
                    {/* Photo Count */}
                    <div 
                      className="bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1"
                      style={{ borderRadius: '60px' }}
                    >
                      <ImageIcon size={12} className="text-gray-900" />
                      <span className="text-xs font-medium text-gray-900">{gallery.photo_count}</span>
                    </div>
                  </div>
                </button>

                {/* Title and Date/Time Below Card */}
                <div className="px-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">{gallery.title}</h4>
                  {listing?.start_date && (
                    <span className="text-xs text-gray-500">{formatDateTime(listing.start_date)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

