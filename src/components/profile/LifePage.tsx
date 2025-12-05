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

export default function LifePage({ profile, onBack, onAddMoment, isOwnTimeline = true }: LifePageProps) {
  const supabase = getSupabaseClient();
  const [customMoments, setCustomMoments] = useState<any[]>([]);
  const [loadingMoments, setLoadingMoments] = useState(true);

  // Fetch custom moments from database
  useEffect(() => {
    const fetchMoments = async () => {
      if (!profile?.id) {
        setLoadingMoments(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_moments')
          .select('*')
          .eq('user_id', profile.id)
          .order('start_date', { ascending: false });

        if (error) {
          console.error('Error fetching moments:', error);
          setCustomMoments([]);
        } else {
          setCustomMoments(data || []);
        }
      } catch (error) {
        console.error('Error in fetchMoments:', error);
        setCustomMoments([]);
      } finally {
        setLoadingMoments(false);
      }
    };

    fetchMoments();
  }, [profile?.id, supabase]);

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
          <div className="space-y-3">
            {/* Today Moment - Always displayed */}
            <div className="flex items-center gap-3">
              {/* Circular Date Badge - Day/Month only */}
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
                  {new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                </div>
                <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
                  {new Date().getDate()}
                </div>
              </div>

              {/* Today Card with full date below */}
              <div 
                className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  height: '64px',
                }}
              >
                <Calendar size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Today</span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Moments - Sorted newest first */}
            {customMoments.map((moment) => {
              const startDate = new Date(moment.start_date);
              const endDate = moment.end_date ? new Date(moment.end_date) : null;
              const photoUrls = moment.photo_urls || [];
              
              // Calculate duration if end date exists
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
                  {/* Circular Date Badge - Day/Month only */}
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

                  {/* Moment Card with photo/date */}
                  <button
                    onClick={() => {
                      console.log('Moment clicked:', moment.id);
                      // TODO: Open moment detail view
                    }}
                    className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      height: '64px',
                    }}
                  >
                    {getCategoryIcon(moment.category)}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">{moment.title}</span>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {endDate && ` - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        {durationText}
                      </span>
                    </div>
                    
                    {/* Photo display on right */}
                    {photoUrls.length > 0 && (
                      <div className="flex-shrink-0">
                        {photoUrls.length <= 3 ? (
                          // Single image
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
                          // 2x2 grid
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
            })}

            {/* Joined Connect Moment */}
            {profile.createdAt && (
              <div className="flex items-center gap-3">
                {/* Circular Date Badge - Day/Month only */}
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
                    {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                  <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
                    {new Date(profile.createdAt).getDate()}
                  </div>
                </div>

                {/* Joined Connect Card with full date below */}
                <div 
                  className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    height: '64px',
                  }}
                >
                  <UserCheck size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">Joined Connect</span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Born Moment */}
            {profile.dateOfBirth && (
              <div className="flex items-center gap-3">
                {/* Circular Date Badge - Day/Month only */}
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
                    {new Date(profile.dateOfBirth).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                  <div className="text-xl font-bold text-gray-900" style={{ fontSize: '18px', lineHeight: '20px', fontWeight: 700 }}>
                    {new Date(profile.dateOfBirth).getDate()}
                  </div>
                </div>

                {/* Born Card with full date below */}
                <div 
                  className="flex-1 bg-white rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    height: '64px',
                  }}
                >
                  <Cake size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">Born</span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {new Date(profile.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
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

