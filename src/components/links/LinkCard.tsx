"use client";

import { useState } from "react";
import { Mail, Phone, Instagram, MessageCircle, Globe, Camera, Twitter, Facebook, Linkedin, MoreHorizontal, Copy, ExternalLink } from "lucide-react";

interface LinkCardProps {
  id: string;
  type: string;
  handle?: string;
  url?: string;
  onCopy?: (handle: string) => void;
}

// Icon mapping for link types
const linkIcons: Record<string, React.ReactNode> = {
  'email': <Mail size={20} className="text-gray-900" strokeWidth={2.5} />,
  'phone': <Phone size={20} className="text-gray-900" strokeWidth={2.5} />,
  'instagram': <Instagram size={20} className="text-gray-900" strokeWidth={2.5} />,
  'whatsapp': <MessageCircle size={20} className="text-gray-900" strokeWidth={2.5} />,
  'website': <Globe size={20} className="text-gray-900" strokeWidth={2.5} />,
  'snapchat': <Camera size={20} className="text-gray-900" strokeWidth={2.5} />,
  'x': <Twitter size={20} className="text-gray-900" strokeWidth={2.5} />,
  'facebook': <Facebook size={20} className="text-gray-900" strokeWidth={2.5} />,
  'linkedin': <Linkedin size={20} className="text-gray-900" strokeWidth={2.5} />,
  'other': <MoreHorizontal size={20} className="text-gray-900" strokeWidth={2.5} />,
};

// Label mapping for link types
const linkLabels: Record<string, string> = {
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

export default function LinkCard({ id, type, handle, url, onCopy }: LinkCardProps) {
  const [hovered, setHovered] = useState(false);

  const handleCopy = () => {
    if (handle && onCopy) {
      onCopy(handle);
    } else if (handle) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(handle);
    }
  };

  const handleLinkClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (url) {
      // Ensure URL has protocol
      const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://') 
        ? url 
        : `https://${url}`;
      
      // Prevent zoom by resetting viewport scale
      const preventZoom = () => {
        // Force viewport reset to prevent zoom
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          // Temporarily change viewport to force reset
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
          // Reset to original after a brief moment
          setTimeout(() => {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content, shrink-to-fit=no');
          }, 50);
        }
      };
      
      // Reset zoom immediately
      preventZoom();
      
      // Use a more mobile-friendly approach - create anchor and click programmatically
      const link = document.createElement('a');
      link.href = urlWithProtocol;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.position = 'fixed';
      link.style.top = '-9999px';
      link.style.left = '-9999px';
      document.body.appendChild(link);
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        link.click();
        // Clean up after a short delay
        setTimeout(() => {
          document.body.removeChild(link);
          // Reset zoom again after link opens
          preventZoom();
        }, 100);
      });
    }
  };

  const icon = linkIcons[type] || linkIcons['other'];
  const label = linkLabels[type] || 'Link';

  return (
    <div
      className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 transition-all duration-200"
      style={{
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: hovered 
          ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
          : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold text-gray-900">{label}</div>
        {handle && (
          <div className="text-sm text-gray-600 mt-1 truncate">{handle}</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {url && (
          <button
            onClick={handleLinkClick}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLinkClick(e);
            }}
            type="button"
            className="px-3 py-2 rounded-xl bg-white text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div className="flex items-center gap-1.5">
              <ExternalLink size={14} className="text-gray-900" strokeWidth={2} />
              <span>Link</span>
            </div>
          </button>
        )}
        {handle && (
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl bg-white text-sm font-medium text-gray-900 transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <Copy size={14} className="text-gray-900" strokeWidth={2} />
              <span>Copy</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

