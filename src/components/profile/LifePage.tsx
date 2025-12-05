"use client";

import { Cake, Calendar, UserCheck, Plus, GraduationCap, Briefcase, Heart, Home, Sparkles, MoreHorizontal } from "lucide-react";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Image from "next/image";

interface LifePageProps {
  profile: {
    id?: string;
    name?: string;
    dateOfBirth?: string;
    createdAt?: string;
  };
  onBack: () => void;
  onAddMoment?: () => void;
  onOpenMomentDetail?: (momentId: string) => void;
  isOwnTimeline?: boolean;
}

// Helper to get category icon
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'education':
      return <GraduationCap size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    case 'career':
      return <Briefcase size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    case 'relationships':
      return <Heart size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    case 'life-changes':
      return <Home size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    case 'experiences':
      return <Sparkles size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
    default:
      return <MoreHorizontal size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />;
  }
};

// Helper to get moment type label
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

export default function LifePage({ profile, onBack, onAddMoment, onOpenMomentDetail, isOwnTimeline = true }: LifePageProps) {
  console.log('🔵 LifePage: Component rendering', { 
    profileId: profile?.id, 
    profileName: profile?.name,
    isOwnTimeline 
  });

  const supabase = getSupabaseClient();
  const [customMoments, setCustomMoments] = useState<any[]>([]);
  const [loadingMoments, setLoadingMoments] = useState(true);

  // Immediately clear body padding on mount to prevent whitespace issues
  useEffect(() => {
    console.log('🔵 LifePage: Clearing body padding');
    const beforePadding = document.body.style.paddingBottom;
    console.log('🔵 LifePage: Body padding before clear:', beforePadding);
    
    document.body.style.paddingBottom = '0';
    
    const afterPadding = document.body.style.paddingBottom;
    console.log('🔵 LifePage: Body padding after clear:', afterPadding);
    
    return () => {
      console.log('🔵 LifePage: Cleanup - body padding effect');
    };
  }, []);

  // Fetch custom moments from database
  useEffect(() => {
    console.log('🔵 LifePage: Fetch moments useEffect triggered', { profileId: profile?.id });
    
    const fetchMoments = async () => {
      if (!profile?.id) {
        console.log('🔵 LifePage: No profile ID, skipping fetch');
        setLoadingMoments(false);
        return;
      }

      console.log('🔵 LifePage: Fetching moments from database for user:', profile.id);

      try {
        const { data, error } = await supabase
          .from('user_moments')
          .select('*')
          .eq('user_id', profile.id)
          .order('start_date', { ascending: false });

        console.log('🔵 LifePage: Moments fetch result:', { 
          momentsCount: data?.length || 0, 
          error: error?.message,
          momentTypes: data?.map(m => m.moment_type)
        });

        if (error) {
          console.error('🔵 LifePage: Error fetching moments:', error);
          setCustomMoments([]);
        } else {
          setCustomMoments(data || []);
          console.log('🔵 LifePage: Custom moments set:', data?.length || 0);
        }
      } catch (error) {
        console.error('🔵 LifePage: Error in fetchMoments:', error);
        setCustomMoments([]);
      } finally {
        setLoadingMoments(false);
        console.log('🔵 LifePage: Loading moments complete');
      }
    };

    fetchMoments();
  }, [profile?.id, supabase]);

  // Group all moments by year for display with separators
  const groupedMoments = () => {
    console.log('🔵 LifePage: groupedMoments() called', {
      customMomentsCount: customMoments.length,
      hasCreatedAt: !!profile?.createdAt,
      hasDateOfBirth: !!profile?.dateOfBirth
    });

    const allMoments: Array<{ date: Date; type: string; data: any }> = [];
    
    // Add Today
    allMoments.push({ 
      date: new Date(), 
      type: 'today', 
      data: null 
    });
    
    // Add custom moments
    customMoments.forEach(moment => {
      allMoments.push({
        date: new Date(moment.start_date),
        type: 'custom',
        data: moment
      });
    });
    
    // Add Joined Connect
    if (profile?.createdAt) {
      allMoments.push({
        date: new Date(profile.createdAt),
        type: 'joined',
        data: null
      });
    }
    
    // Add Born
    if (profile?.dateOfBirth) {
      allMoments.push({
        date: new Date(profile.dateOfBirth),
        type: 'born',
        data: null
      });
    }
    
    console.log('🔵 LifePage: Total moments before grouping:', allMoments.length);
    
    // Sort by date (newest first)
    allMoments.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Group by year
    const grouped: Record<number, typeof allMoments> = {};
    allMoments.forEach(moment => {
      const year = moment.date.getFullYear();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(moment);
    });
    
    const years = Object.keys(grouped).map(Number);
    console.log('🔵 LifePage: Grouped by years:', years, 'Total groups:', years.length);
    
    return grouped;
  };

  const momentsByYear = groupedMoments();
  console.log('🔵 LifePage: About to render with momentsByYear:', Object.keys(momentsByYear));

  // Helper to render a moment card
  const renderMomentCard = (momentItem: { date: Date; type: string; data: any }) => {
    const { date, type, data } = momentItem;
    
    if (type === 'today') {
      return (
        <div key="today" className="flex items-center gap-3">
          <div 
            className="bg-white rounded-full flex flex-col items-center justify-center flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              padding: '4px',
              gap: '1px',
            }}
          >
            <div className="text-xs text-gray-900" style={{ fontSize: '9px', lineHeight: '11px', fontWeight: 500 }}>
              {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
            </div>
            <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
              {date.getDate()}
            </div>
          </div>

          <button
            onClick={() => onOpenMomentDetail && onOpenMomentDetail('today')}
            className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              minHeight: '80px',
            }}
          >
            <Calendar size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">Today</span>
              <span className="text-xs text-gray-500 mt-0.5">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </button>
        </div>
      );
    }
    
    if (type === 'joined') {
      return (
        <div key="joined" className="flex items-center gap-3">
          <div 
            className="bg-white rounded-full flex flex-col items-center justify-center flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              padding: '4px',
              gap: '1px',
            }}
          >
            <div className="text-xs text-gray-900" style={{ fontSize: '9px', lineHeight: '11px', fontWeight: 500 }}>
              {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
            </div>
            <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
              {date.getDate()}
            </div>
          </div>

          <button
            onClick={() => onOpenMomentDetail && onOpenMomentDetail('joined-connect')}
            className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              minHeight: '80px',
            }}
          >
            <UserCheck size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">Joined Connect</span>
              <span className="text-xs text-gray-500 mt-0.5">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </button>
        </div>
      );
    }
    
    if (type === 'born') {
      return (
        <div key="born" className="flex items-center gap-3">
          <div 
            className="bg-white rounded-full flex flex-col items-center justify-center flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              padding: '4px',
              gap: '1px',
            }}
          >
            <div className="text-xs text-gray-900" style={{ fontSize: '9px', lineHeight: '11px', fontWeight: 500 }}>
              {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
            </div>
            <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
              {date.getDate()}
            </div>
          </div>

          <button
            onClick={() => onOpenMomentDetail && onOpenMomentDetail('born')}
            className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              minHeight: '80px',
            }}
          >
            <Cake size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">Born</span>
              <span className="text-xs text-gray-500 mt-0.5">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </button>
        </div>
      );
    }
    
    // Custom moment
    const moment = data;
    const startDate = new Date(moment.start_date);
    const endDate = moment.end_date ? new Date(moment.end_date) : null;
    const photoUrls = moment.photo_urls || [];
    
    let durationText = '';
    if (endDate) {
      const years = endDate.getFullYear() - startDate.getFullYear();
      const months = endDate.getMonth() - startDate.getMonth() + (years * 12);
      if (years > 0) {
        durationText = ` (${years} year${years > 1 ? 's' : ''})`;
      } else if (months > 0) {
        durationText = ` (${months} month${months > 1 ? 's' : ''})`;
      }
    }

    return (
      <div key={moment.id} className="flex items-center gap-3">
        <div 
          className="bg-white rounded-full flex flex-col items-center justify-center flex-shrink-0"
          style={{
            width: '48px',
            height: '48px',
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            padding: '4px',
            gap: '1px',
          }}
        >
          <div className="text-xs text-gray-900" style={{ fontSize: '9px', lineHeight: '11px', fontWeight: 500 }}>
            {startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
          </div>
          <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
            {startDate.getDate()}
          </div>
        </div>

        <button
          onClick={() => onOpenMomentDetail && onOpenMomentDetail(moment.id)}
          className="flex-1 bg-white rounded-xl px-4 py-3"
          style={{
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {getCategoryIcon(moment.category)}
          <div className="flex flex-col flex-1 min-w-0 items-start justify-center">
            <span className="text-xs text-gray-600 text-left">
              {getMomentTypeLabel(moment.moment_type)}
            </span>
            <span className="text-sm font-semibold text-gray-900 truncate w-full text-left mt-0.5">
              {moment.title}
            </span>
            <span className="text-xs text-gray-500 mt-0.5 text-left">
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {endDate && ` - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              {durationText}
            </span>
          </div>
          
          {photoUrls.length > 0 && (
            <div className="flex-shrink-0 ml-auto">
              {photoUrls.length <= 3 ? (
                <div 
                  className="w-12 h-12 rounded-lg overflow-hidden"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                  }}
                >
                  <Image
                    src={photoUrls[0]}
                    alt={moment.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 grid grid-cols-2 gap-0.5">
                  {photoUrls.slice(0, 4).map((url: string, i: number) => (
                    <div
                      key={i}
                      className="rounded-sm overflow-hidden"
                      style={{
                        borderWidth: '0.2px',
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <Image
                        src={url}
                        alt={`${moment.title} ${i + 1}`}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </button>
      </div>
    );
  };

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Timeline"
          backButton
          onBack={onBack}
          actions={isOwnTimeline && onAddMoment ? [
            {
              icon: <Plus size={20} strokeWidth={2.5} />,
              onClick: onAddMoment,
              ariaLabel: "Add moment"
            }
          ] : undefined}
        />
        
        <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
          paddingTop: 'var(--saved-content-padding-top, 140px)',
          paddingBottom: '32px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {/* Render moments grouped by year */}
          {Object.keys(momentsByYear)
            .map(Number)
            .sort((a, b) => b - a) // Sort years descending
            .map((year, yearIndex) => (
              <div key={year} className={yearIndex > 0 ? 'mt-6' : ''}>
                {/* Year Separator */}
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">{year}</h3>
                
                {/* Moments for this year */}
                <div className="space-y-3">
                  {momentsByYear[year].map((momentItem) => renderMomentCard(momentItem))}
                </div>
              </div>
            ))}
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
