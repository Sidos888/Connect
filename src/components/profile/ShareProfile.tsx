"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import QRCode from "qrcode";

/**
 * ShareProfile - Unified component for Share Profile page
 * Used by both mobile route and web modal
 */
export default function ShareProfile() {
  const { personalProfile } = useAppStore();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const profileUrl = typeof window !== "undefined" && personalProfile?.connectId
    ? `${window.location.origin}/p/${personalProfile.connectId}`
    : "";

  useEffect(() => {
    if (!profileUrl) return;
    QRCode.toDataURL(profileUrl, {
      width: 240,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" }
    }).then(setQrCodeDataUrl).catch(() => setQrCodeDataUrl(""));
  }, [profileUrl]);

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {qrCodeDataUrl ? (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-6">Scan to connect</p>
          <div 
            className="inline-block p-6 bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
              borderWidth: '0.4px', 
              borderColor: '#E5E7EB', 
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            <img src={qrCodeDataUrl} alt="QR Code" className="w-60 h-60" />
          </div>
          
          {/* Profile URL */}
          {profileUrl && (
            <div className="mt-8">
              <p className="text-xs text-gray-500 mb-2">Your profile link</p>
              <div 
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
                style={{ 
                  borderWidth: '0.4px', 
                  borderColor: '#E5E7EB', 
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onClick={() => {
                  navigator.clipboard.writeText(profileUrl);
                }}
              >
                <p className="text-sm text-gray-900 font-mono break-all">{profileUrl}</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">Click to copy</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500">Loading QR code...</p>
          </div>
        </div>
      )}
    </div>
  );
}

