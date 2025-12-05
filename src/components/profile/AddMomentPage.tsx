"use client";

import { Plus, GraduationCap, Briefcase, Heart, Home, Sparkles, MoreHorizontal } from "lucide-react";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";

interface MomentOption {
  id: string;
  label: string;
}

interface MomentCategory {
  title: string;
  icon: React.ReactNode;
  options: MomentOption[];
}

interface AddMomentPageProps {
  onBack: () => void;
  onSelectMoment?: (momentId: string) => void;
}

export default function AddMomentPage({ onBack, onSelectMoment }: AddMomentPageProps) {
  const categories: MomentCategory[] = [
    {
      title: "Education",
      icon: <GraduationCap size={18} className="text-gray-900" strokeWidth={2} />,
      options: [
        { id: "preschool", label: "Preschool" },
        { id: "primary-school", label: "Primary School" },
        { id: "high-school", label: "High School" },
        { id: "university-tafe", label: "University/Tafe" },
        { id: "course-certificate", label: "Course / Certificate" }
      ]
    },
    {
      title: "Career",
      icon: <Briefcase size={18} className="text-gray-900" strokeWidth={2} />,
      options: [
        { id: "first-job", label: "First Job" },
        { id: "new-job", label: "New Job" },
        { id: "promotion", label: "Promotion" },
        { id: "business-started", label: "Business Started" }
      ]
    },
    {
      title: "Relationships",
      icon: <Heart size={18} className="text-gray-900" strokeWidth={2} />,
      options: [
        { id: "relationship-started", label: "Relationship Started" },
        { id: "engagement", label: "Engagement" },
        { id: "marriage", label: "Marriage" },
        { id: "child-born", label: "Child Born" }
      ]
    },
    {
      title: "Life Changes",
      icon: <Home size={18} className="text-gray-900" strokeWidth={2} />,
      options: [
        { id: "moved-house", label: "Moved House" },
        { id: "bought-home", label: "Bought a Home" },
        { id: "major-transition", label: "Major Transition" }
      ]
    },
    {
      title: "Experiences",
      icon: <Sparkles size={18} className="text-gray-900" strokeWidth={2} />,
      options: [
        { id: "major-trip", label: "Major Trip" },
        { id: "big-achievement", label: "Big Achievement" },
        { id: "important-memory", label: "Important Memory" },
        { id: "personal-milestone", label: "Personal Milestone" }
      ]
    },
    {
      title: "Other",
      icon: <MoreHorizontal size={18} className="text-gray-900" strokeWidth={2} />,
      options: [
        { id: "custom-moment", label: "Custom Moment" }
      ]
    }
  ];

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Add"
          backButton
          onBack={onBack}
        />
        
        <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
          paddingTop: 'var(--saved-content-padding-top, 140px)',
          paddingBottom: '32px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {categories.map((category, index) => (
            <div key={category.title} className={index > 0 ? 'mt-6' : ''}>
              {/* Category Title with Icon */}
              <div className="flex items-center gap-2 mb-3 px-1">
                {category.icon}
                <h3 className="text-sm font-semibold text-gray-900">{category.title}</h3>
              </div>
              
              {/* Options */}
              <div className="space-y-2">
                {category.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      console.log('Moment option clicked:', option.id);
                      // Placeholder for now
                      if (onSelectMoment) {
                        onSelectMoment(option.id);
                      }
                    }}
                    className="w-full bg-white rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{
                      borderWidth: '0.4px',
                      borderColor: '#E5E7EB',
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                      height: '60px',
                      willChange: 'transform, box-shadow'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    <Plus size={20} className="text-gray-900 flex-shrink-0" strokeWidth={2.5} />
                  </button>
                ))}
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

