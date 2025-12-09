'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin } from 'lucide-react';
import { MobilePage, PageHeader } from '@/components/layout/PageSystem';
import { LOCATION_CONFIGS } from '@/lib/locationConfig';

interface LocationResult {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  context?: any[];
}

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
  placeholder?: string;
}

export default function LocationSearchModal({
  isOpen,
  onClose,
  onSelect,
  placeholder = 'Choose location'
}: LocationSearchModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      
      // Focus input after animation
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
      setTimeout(() => {
        setShouldRender(false);
        setSearchQuery('');
        setSearchResults([]);
      }, 300);
    }
  }, [isOpen]);

  const searchMapboxLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Cancel any previous search
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    searchAbortControllerRef.current = new AbortController();

    const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiY29ubmVjdC1sb2NhdGlvbiIsImEiOiJjbWkzdG5pcDgxNGh6MmlvZWdtbWxmMnVmIn0.9aWRKS5gofTwZCSSdRAX9g';
    
    if (!MAPBOX_ACCESS_TOKEN) {
      console.error('📍 LocationSearchModal: Mapbox access token not found');
      return;
    }

    console.log('📍 LocationSearchModal: Searching for:', query);
    setIsLoading(true);
    try {
      // Always try to get user's GPS location for proximity ranking (independent of explore filter)
      // This ranks local results first but still allows global results
      const { getUserLocation } = await import('@/lib/locationConfig');
      console.log('📍 LocationSearchModal: Getting user location for proximity ranking...');
      const locationConfig = await Promise.race([
        getUserLocation(),
        new Promise<typeof LOCATION_CONFIGS['Adelaide']>((resolve) => {
          setTimeout(() => {
            console.log('📍 LocationSearchModal: getUserLocation timeout, using Adelaide fallback for proximity');
            resolve(LOCATION_CONFIGS['Adelaide']);
          }, 2000); // 2 second timeout
        })
      ]);
      console.log('📍 LocationSearchModal: Using location for proximity:', locationConfig);

      // Build API URL - global search with local proximity ranking
      const baseUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        limit: '5',
        types: 'place,address,poi',
        // No country restriction - allow global location search
        // No bbox restriction - allow global results
      });

      // Add proximity bias to rank local results first (but still show global results)
      if (locationConfig.center) {
        params.append('proximity', `${locationConfig.center[0]},${locationConfig.center[1]}`);
        console.log('📍 LocationSearchModal: Added proximity for local ranking:', locationConfig.center);
      }

      const url = `${baseUrl}?${params.toString()}`;
      console.log('📍 LocationSearchModal: Fetching from:', url.replace(MAPBOX_ACCESS_TOKEN, 'TOKEN_HIDDEN'));

      const response = await fetch(url, {
        signal: searchAbortControllerRef.current.signal
      });
      console.log('📍 LocationSearchModal: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📍 LocationSearchModal: API error response:', errorText);
        throw new Error(`Mapbox API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📍 LocationSearchModal: Full API response:', JSON.stringify(data).substring(0, 500));
      console.log('📍 LocationSearchModal: Received', data.features?.length || 0, 'results');
      
      if (!data.features || !Array.isArray(data.features)) {
        console.error('📍 LocationSearchModal: Invalid response format - no features array');
        setSearchResults([]);
        return;
      }
      
      const results: LocationResult[] = data.features.map((feature: any, index: number) => ({
        id: feature.id || `mapbox-${index}`,
        name: feature.text || feature.place_name?.split(',')[0] || 'Unknown',
        address: feature.place_name || feature.text,
        coordinates: feature.geometry?.coordinates || [0, 0],
        context: feature.context || []
      }));

      console.log('📍 LocationSearchModal: Mapped results:', results);
      setSearchResults(results);
      console.log('📍 LocationSearchModal: Set', results.length, 'results to state');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('📍 LocationSearchModal: Search was aborted (new search started)');
        return; // Don't update state if aborted
      }
      console.error('📍 LocationSearchModal: Error searching locations:', error);
      if (error instanceof Error) {
        console.error('📍 LocationSearchModal: Error message:', error.message);
        console.error('📍 LocationSearchModal: Error stack:', error.stack);
      }
      setSearchResults([]);
    } finally {
      setIsLoading(false);
      console.log('📍 LocationSearchModal: Search completed, loading set to false');
    }
  };

  // Debounced search
  useEffect(() => {
    console.log('📍 LocationSearchModal: Search query changed:', searchQuery);
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        console.log('📍 LocationSearchModal: Calling searchMapboxLocations after debounce');
        searchMapboxLocations(searchQuery);
      } else {
        console.log('📍 LocationSearchModal: Query empty, clearing results');
        setSearchResults([]);
      }
    }, 300);

    return () => {
      console.log('📍 LocationSearchModal: Clearing debounce timeout');
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);
  
  // Debug: Log when searchResults changes
  useEffect(() => {
    console.log('📍 LocationSearchModal: searchResults state changed:', searchResults.length, 'results');
  }, [searchResults]);

  const handleSelect = (result: LocationResult) => {
    onSelect(result.address || result.name);
    onClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div
      className="fixed z-[100] bg-white"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100dvh',
        minHeight: '100vh',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-out',
        overflow: 'hidden',
        position: 'fixed',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader title="" />
          
          {/* Search Bar with X Button - Full width */}
          <div 
            className="absolute left-0 right-0 flex items-center gap-3 px-4"
            style={{
              top: 'max(env(safe-area-inset-top, 0px), 70px)',
              height: '44px',
              zIndex: 30,
              alignItems: 'center'
            }}
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full focus:outline-none"
                style={{
                  borderRadius: '100px',
                  height: '44px',
                  background: 'rgba(255, 255, 255, 0.96)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow',
                  paddingLeft: '48px',
                  paddingRight: '24px',
                  fontSize: '16px',
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  color: '#111827'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              />
              <div className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none" style={{ width: '48px' }}>
                <Search size={20} className="text-gray-900" strokeWidth={2.5} />
              </div>
            </div>
            {/* Circular X Button */}
            <button
              onClick={handleClose}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.96)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <X size={20} className="text-gray-900" strokeWidth={2.5} />
            </button>
          </div>
          
          {/* Search Results */}
          <div
            className="flex-1 px-4 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto scrollbar-hide"
            style={{
              paddingTop: 'var(--saved-content-padding-top, 140px)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm font-medium text-gray-500">Searching...</div>
              </div>
            )}
            
            {!isLoading && searchResults.length === 0 && searchQuery && (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm font-medium text-gray-500">No results found</div>
              </div>
            )}
            
            {!isLoading && searchResults.length > 0 && (
              <div className="space-y-2 pt-2">
                {searchResults.map((result) => {
                  // Parse address to extract address/title and suburb, state
                  // Mapbox format: "Name, Suburb, State, Country" or "Address, Suburb, State"
                  const fullAddress = result.address || result.name || '';
                  const parts = fullAddress.split(',').map(p => p.trim()).filter(p => p);
                  
                  // First part is usually the address/title
                  const addressTitle = parts[0] || result.name || 'Address';
                  
                  // Suburb and state are usually parts 1 and 2 (skip country if present)
                  const suburbStateParts = parts.slice(1, 3).filter(p => p && !p.match(/^(Australia|AU)$/i));
                  const suburbState = suburbStateParts.length > 0 
                    ? suburbStateParts.join(', ')
                    : parts.length > 1 ? parts.slice(1).join(', ') : '';
                  
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="w-full text-left flex items-center gap-4 transition-all hover:bg-gray-50 rounded-2xl"
                      style={{
                        backgroundColor: 'white',
                        borderWidth: '0.4px',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        padding: '16px',
                        minHeight: '64px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      }}
                    >
                      {/* Location Pin Icon - Same as filter card */}
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <MapPin size={24} className="text-gray-900" strokeWidth={2.5} />
                      </div>
                      {/* Location Info - Two Line Format with truncation */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ gap: '4px' }}>
                        {/* Top line: Address/Title - Bold, truncate with ellipsis */}
                        <div 
                          className="text-base font-semibold text-gray-900 leading-tight"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={addressTitle}
                        >
                          {addressTitle}
                        </div>
                        {/* Bottom line: Suburb, State - Lighter, truncate with ellipsis */}
                        {suburbState && (
                          <div 
                            className="text-sm font-normal text-gray-500 leading-tight"
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={suburbState}
                          >
                            {suburbState}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </MobilePage>
      </div>
    </div>
  );
}

