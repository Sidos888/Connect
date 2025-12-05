"use client";

import { Cake } from "lucide-react";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";

interface LifePageProps {
  profile: {
    id?: string;
    name?: string;
    dateOfBirth?: string;
  };
  onBack: () => void;
}

export default function LifePage({ profile, onBack }: LifePageProps) {
  // Calculate moments (for now, just showing Born)
  const moments = [];
  
  if (profile.dateOfBirth) {
    moments.push({
      id: 'born',
      title: 'Born',
      date: profile.dateOfBirth,
      icon: <Cake size={20} className="text-gray-900" strokeWidth={2} />
    });
  }
  
  // Add Joined Connect moment (placeholder - would come from profile.createdAt)
  moments.push({
    id: 'joined',
    title: 'Joined Connect',
    date: '2025-01-10', // Placeholder
    icon: <div className="w-5 h-5 bg-gray-200 rounded-full" /> // Placeholder icon
  });
  
  // Add Today moment (placeholder)
  moments.push({
    id: 'today',
    title: 'Today',
    date: new Date().toISOString(),
    icon: <div className="w-5 h-5 bg-gray-200 rounded-full" /> // Placeholder icon
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Life"
          backButton
          onBack={onBack}
        />
        
        <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
          paddingTop: 'var(--saved-content-padding-top, 140px)',
          paddingBottom: '32px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <div className="space-y-4">
            {moments.map((moment) => (
              <div key={moment.id} className="flex items-start gap-4">
                {/* Icon Circle */}
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  {moment.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{moment.title}</h3>
                  <p className="text-sm text-gray-600">{formatDate(moment.date)}</p>
                </div>
              </div>
            ))}
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

