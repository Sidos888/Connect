"use client";

import { useState, useEffect } from "react";
import { MobilePage } from "@/components/layout/PageSystem";
import { GraduationCap, Briefcase, Heart, Home, Sparkles, MoreHorizontal, MapPin, Hash, Calendar, UserCheck, Cake, Pencil } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import EditMomentPage from "./EditMomentPage";

interface MomentDetailPageProps {
  momentId: string;
  profile?: {
    id?: string;
    name?: string;
    dateOfBirth?: string;
    createdAt?: string;
  };
  onBack: () => void;
  onOpenPhotoGrid?: (photos: string[], initialIndex: number) => void;
}

// Helper to get category icon
const getCategoryIcon = (category: string, size = 24) => {
  const className = "text-gray-900";
  const strokeWidth = 2;
  
  switch (category) {
    case 'education':
      return <GraduationCap size={size} className={className} strokeWidth={strokeWidth} />;
    case 'career':
      return <Briefcase size={size} className={className} strokeWidth={strokeWidth} />;
    case 'relationships':
      return <Heart size={size} className={className} strokeWidth={strokeWidth} />;
    case 'life-changes':
      return <Home size={size} className={className} strokeWidth={strokeWidth} />;
    case 'experiences':
      return <Sparkles size={size} className={className} strokeWidth={strokeWidth} />;
    default:
      return <MoreHorizontal size={size} className={className} strokeWidth={strokeWidth} />;
  }
};

// Helper to map moment_type to display label
const getMomentTypeLabel = (momentType: string): string => {
  const labelMap: Record<string, string> = {
    'preschool': 'Preschool',
    'primary-school': 'Primary School',
    'high-school': 'High School',
    'university-tafe': 'University/Tafe',
    'course-certificate': 'Course / Certificate',
    'first-job': 'First Job',
    'new-job': 'New Job',
    'promotion': 'Promotion',
    'business-started': 'Business Started',
    'relationship-started': 'Relationship Started',
    'engagement': 'Engagement',
    'marriage': 'Marriage',
    'child-born': 'Child Born',
    'moved-house': 'Moved House',
    'bought-home': 'Bought a Home',
    'major-transition': 'Major Transition',
    'major-trip': 'Major Trip',
    'big-achievement': 'Big Achievement',
    'important-memory': 'Important Memory',
    'personal-milestone': 'Personal Milestone',
    'custom-moment': 'Custom Moment'
  };
  
  return labelMap[momentType] || momentType;
};

export default function MomentDetailPage({ momentId, profile, onBack, onOpenPhotoGrid }: MomentDetailPageProps) {
  const supabase = getSupabaseClient();
  const { account } = useAuth();
  const [moment, setMoment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditPage, setShowEditPage] = useState(false);

  useEffect(() => {
    const fetchMoment = async () => {
      // Handle built-in moments
      if (momentId === 'today') {
        setMoment({
          id: 'today',
          moment_type: 'today',
          category: 'system',
          title: 'Today',
          start_date: new Date().toISOString(),
          summary: null,
          location: null,
          photo_urls: []
        });
        setLoading(false);
        return;
      }

      if (momentId === 'joined-connect' && profile?.createdAt) {
        setMoment({
          id: 'joined-connect',
          moment_type: 'joined-connect',
          category: 'system',
          title: 'Joined Connect',
          start_date: profile.createdAt,
          summary: null,
          location: null,
          photo_urls: []
        });
        setLoading(false);
        return;
      }

      if (momentId === 'born' && profile?.dateOfBirth) {
        setMoment({
          id: 'born',
          moment_type: 'born',
          category: 'system',
          title: 'Born',
          start_date: profile.dateOfBirth,
          summary: null,
          location: null,
          photo_urls: []
        });
        setLoading(false);
        return;
      }

      // Fetch custom moments from database
      try {
        const { data, error } = await supabase
          .from('user_moments')
          .select('*')
          .eq('id', momentId)
          .single();

        if (error) {
          console.error('Error fetching moment:', error);
        } else {
          setMoment(data);
        }
      } catch (error) {
        console.error('Error in fetchMoment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoment();
  }, [momentId, profile, supabase]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const buttonSize = isMobile ? '44px' : '40px';

  if (loading || !moment) {
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

  const startDate = new Date(moment.start_date);
  const endDate = moment.end_date ? new Date(moment.end_date) : null;
  const photoUrls = moment.photo_urls || [];
  const hasPhotos = photoUrls.length > 0;
  
  // Get display label for moment type (e.g., "Primary School" not "GOODWOOD PRIMARY")
  const subcategoryLabel = getMomentTypeLabel(moment.moment_type);
  
  // Get icon for system moments or category icon for custom moments
  const getMomentIcon = () => {
    if (moment.moment_type === 'today') {
      return <Calendar size={20} className="text-gray-900" strokeWidth={2} />;
    }
    if (moment.moment_type === 'joined-connect') {
      return <UserCheck size={20} className="text-gray-900" strokeWidth={2} />;
    }
    if (moment.moment_type === 'born') {
      return <Cake size={20} className="text-gray-900" strokeWidth={2} />;
    }
    return getCategoryIcon(moment.category, 20);
  };

  // Format date similar to listing page: "December 1st • 5:10pm-5:20pm" or just date if no time
  const formatDateTime = (startDate: Date, endDate: Date | null): string => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[startDate.getMonth()];
    const day = startDate.getDate();
    
    // Add ordinal suffix
    const getOrdinal = (n: number) => {
      if (n % 10 === 1 && n % 100 !== 11) return n + 'st';
      if (n % 10 === 2 && n % 100 !== 12) return n + 'nd';
      if (n % 10 === 3 && n % 100 !== 13) return n + 'rd';
      return n + 'th';
    };
    
    const year = startDate.getFullYear();
    
    // If end date exists, show date range with duration
    if (endDate) {
      const endMonth = months[endDate.getMonth()];
      const endDay = endDate.getDate();
      const endYear = endDate.getFullYear();
      
      // Calculate duration
      const years = endDate.getFullYear() - startDate.getFullYear();
      const months = endDate.getMonth() - startDate.getMonth() + (years * 12);
      let durationText = '';
      
      if (years > 0) {
        durationText = ` • ${years} year${years > 1 ? 's' : ''}`;
      } else if (months > 0) {
        durationText = ` • ${months} month${months > 1 ? 's' : ''}`;
      }
      
      if (year === endYear) {
        return `${month} ${getOrdinal(day)} - ${endMonth} ${getOrdinal(endDay)}, ${year}${durationText}`;
      }
      return `${month} ${getOrdinal(day)}, ${year} - ${endMonth} ${getOrdinal(endDay)}, ${endYear}${durationText}`;
    }
    
    // Single date
    return `${month} ${getOrdinal(day)}, ${year}`;
  };
  
  const dateTimeDisplay = formatDateTime(startDate, endDate);
  
  // Handle edit button click
  const handleEdit = () => {
    setShowEditPage(true);
  };

  // Handle edit save
  const handleEditSave = async () => {
    // Refetch moment data
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_moments')
        .select('*')
        .eq('id', momentId)
        .single();

      if (!error && data) {
        setMoment(data);
      }
    } catch (error) {
      console.error('Error refetching moment:', error);
    } finally {
      setLoading(false);
      setShowEditPage(false);
    }
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setShowEditPage(false);
  };

  const showEditButton = moment.user_id && account?.id && moment.user_id === account.id && 
    moment.moment_type !== 'today' && moment.moment_type !== 'joined-connect' && moment.moment_type !== 'born';

  // Show edit page if requested
  if (showEditPage && moment) {
    return (
      <EditMomentPage
        moment={moment}
        momentLabel={subcategoryLabel}
        onBack={handleEditCancel}
        onSave={handleEditSave}
      />
    );
  }

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        {/* Custom Header - Back button + Category + Edit button */}
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

            {/* Category icon + subcategory (centered) */}
            <div className="flex items-center justify-center gap-2" style={{
              height: buttonSize
            }}>
              {getMomentIcon()}
              <span className="text-sm text-gray-600">{subcategoryLabel}</span>
            </div>

            {/* Edit button */}
            {showEditButton && (
              <button
                onClick={handleEdit}
                className="absolute right-4 flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
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
                aria-label="Edit moment"
              >
                <Pencil size={18} className="text-gray-900" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
          paddingTop: 'var(--saved-content-padding-top, 140px)',
          paddingBottom: '32px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <div className="space-y-6">
            {/* Photo Section with # icon if photos exist */}
            {hasPhotos && (
              <div className="relative">
                {/* Main Photo or 2x2 Grid */}
                {photoUrls.length === 1 ? (
                  // Single photo - full width
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
                      src={photoUrls[0]}
                      alt={moment.title}
                      width={800}
                      height={800}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  // 2x2 grid for multiple photos
                  <div className="w-full grid grid-cols-2 gap-2">
                    {photoUrls.slice(0, 4).map((url: string, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden"
                        style={{
                          aspectRatio: '1',
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                        }}
                      >
                        <Image
                          src={url}
                          alt={`${moment.title} ${i + 1}`}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* # Photo Icon Button */}
                {photoUrls.length > 1 && (
                  <button
                    onClick={() => {
                      if (onOpenPhotoGrid) {
                        onOpenPhotoGrid(photoUrls, 0);
                      }
                    }}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center"
                    style={{
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Hash size={18} className="text-gray-900" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}

            {/* Centered Title (User's input title for custom moments) */}
            {moment.moment_type !== 'today' && moment.moment_type !== 'joined-connect' && moment.moment_type !== 'born' && moment.title && (
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {moment.title}
                </h1>
              </div>
            )}

            {/* Centered Date/Time */}
            <div className="text-center">
              <p className="text-base font-normal text-gray-500">
                {dateTimeDisplay}
              </p>
            </div>

            {/* Summary Card */}
            {moment.summary && (
              <div
                className="bg-white rounded-2xl p-4"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{moment.summary}</p>
              </div>
            )}

            {/* Location Card */}
            {moment.location && (
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
                <span className="text-sm font-medium text-gray-900">{moment.location}</span>
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

