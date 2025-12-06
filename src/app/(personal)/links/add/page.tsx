"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Mail, Phone, Instagram, MessageCircle, Globe, Camera, Twitter, Facebook, Linkedin, MoreHorizontal } from "lucide-react";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";

interface LinkType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const linkTypes: LinkType[] = [
  { id: 'email', label: 'Email', icon: <Mail size={20} className="text-gray-900" strokeWidth={2.5} /> },
  { id: 'phone', label: 'Phone', icon: <Phone size={20} className="text-gray-900" strokeWidth={2.5} /> },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={20} className="text-gray-900" strokeWidth={2.5} /> },
  { id: 'whatsapp', label: 'Whatsapp', icon: <MessageCircle size={20} className="text-gray-900" strokeWidth={2.5} /> },
  { id: 'website', label: 'Website', icon: <Globe size={20} className="text-gray-900" strokeWidth={2.5} /> },
  { id: 'snapchat', label: 'Snapchat', icon: <Camera size={20} className="text-gray-900" strokeWidth={2.5} /> },
  { id: 'x', label: 'X', icon: <Twitter size={20} className="text-gray-900" strokeWidth={2.5} /> },
  { id: 'facebook', label: 'Facebook', icon: <Facebook size={20} className="text-gray-900" strokeWidth={2.5} /> },
  { id: 'linkedin', label: 'Linkedin', icon: <Linkedin size={20} className="text-gray-900" strokeWidth={2.5} /> },
  { id: 'other', label: 'Other', icon: <MoreHorizontal size={20} className="text-gray-900" strokeWidth={2.5} /> },
];

export default function AddLinkPage() {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLinkTypeSelect = (linkType: string) => {
    console.log('Selected link type:', linkType);
    // Navigate to the form page for this link type
    router.push(`/links/add/${linkType}`);
  };

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title="Add Link"
          backButton
          backIcon="arrow"
          onBack={() => router.back()}
        />
        
        {/* Link Type Options */}
        <div 
          className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" 
          style={{ 
            paddingTop: 'var(--saved-content-padding-top, 140px)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className="space-y-2 max-w-screen-sm mx-auto">
            {linkTypes.map((linkType) => (
              <button
                key={linkType.id}
                onClick={() => handleLinkTypeSelect(linkType.id)}
                onMouseEnter={() => setHoveredItem(linkType.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 bg-white"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: hoveredItem === linkType.id 
                    ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                    : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  willChange: 'transform, box-shadow',
                  transform: hoveredItem === linkType.id ? 'translateY(-1px)' : 'translateY(0)',
                }}
              >
                <div className="flex items-center gap-3">
                  {linkType.icon}
                  <span className="text-base font-medium text-gray-900">{linkType.label}</span>
                </div>
                <Plus size={20} className="text-gray-900" strokeWidth={2.5} />
              </button>
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

