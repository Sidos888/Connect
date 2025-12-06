"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { MobilePage, PageHeader } from "@/components/layout/PageSystem";
import { LinksService } from "@/lib/linksService";
import { useAuth } from "@/lib/authContext";

// Link type definitions with labels
const linkTypeLabels: Record<string, string> = {
  'email': 'Email',
  'phone': 'Phone',
  'instagram': 'Instagram',
  'whatsapp': 'Whatsapp',
  'website': 'Website',
  'snapchat': 'Snapchat',
  'x': 'X',
  'facebook': 'Facebook',
  'linkedin': 'Linkedin',
  'other': 'Other',
};

interface AddLinkFormProps {
  linkType: string;
}

export default function AddLinkForm({ linkType }: AddLinkFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [handle, setHandle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Form is valid if at least one field is filled
  const isValid = (handle.trim() !== "" || linkUrl.trim() !== "") && !saving;

  const handleSave = async () => {
    if (!isValid || !user?.id) return;

    setSaving(true);
    try {
      const linksService = new LinksService();
      const { link, error } = await linksService.createLink(
        user.id,
        linkType,
        handle.trim() || undefined,
        linkUrl.trim() || undefined
      );

      if (error) {
        console.error('Error saving link:', error);
        alert('Failed to save link. Please try again.');
        setSaving(false);
        return;
      }

      // Navigate back to links page
      router.push('/links');
    } catch (error) {
      console.error('Error saving link:', error);
      alert('Failed to save link. Please try again.');
      setSaving(false);
    }
  };

  const linkTypeLabel = linkTypeLabels[linkType] || 'Link';

  return (
    <div style={{ '--saved-content-padding-top': '140px' } as React.CSSProperties}>
      <MobilePage>
        <PageHeader
          title={linkTypeLabel}
          backButton
          backIcon="arrow"
          onBack={() => router.back()}
          customActions={
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-40"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '100px',
                background: isValid ? '#FF6600' : '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                cursor: isValid ? 'pointer' : 'not-allowed',
                border: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              <Check size={20} className="text-white" strokeWidth={2.5} />
            </button>
          }
        />
        
        {/* Form Content */}
        <div 
          className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" 
          style={{ 
            paddingTop: 'var(--saved-content-padding-top, 140px)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className="space-y-4 max-w-screen-sm mx-auto">
            {/* Handle Input */}
            <div>
              <input
                type="text"
                placeholder="Handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-white rounded-2xl px-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  height: '56px',
                }}
              />
            </div>

            {/* Link URL Input */}
            <div>
              <input
                type="text"
                placeholder="Link URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full bg-white rounded-2xl px-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  height: '56px',
                }}
              />
            </div>
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

