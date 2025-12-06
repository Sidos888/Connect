"use client";

import { ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";
import { useAuth } from "@/lib/authContext";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * QRCode - Component for displaying QR code and scan button
 * Used by the QR code page
 */
export default function QRCode() {
  const { account } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const originalFrom = searchParams.get('from'); // Get the original 'from' parameter
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Generate profile URL from user's connect_id
  // Use custom scheme for in-app scanning: connect://p/{connectId}
  // This keeps everything within the app and works with our QR scanner
  const getProfileUrl = () => {
    if (!account?.connect_id) return "";
    
    // Use custom scheme for in-app deep linking
    // Format: connect://p/{connectId}
    return `connect://p/${account.connect_id}`;
  };

  const profileUrl = getProfileUrl();

  // Generate QR code when component mounts or account changes
  useEffect(() => {
    console.log('QRCode: Account data:', { 
      hasAccount: !!account, 
      connect_id: account?.connect_id,
      profileUrl,
      isCapacitor: typeof window !== "undefined" && (window.Capacitor || (window as any).CapacitorWeb)
    });

    if (!profileUrl) {
      console.warn('QRCode: No profile URL available - connect_id missing or window undefined');
      setLoading(false);
      return;
    }

    // Use the profile URL as-is (it already has the connect:// scheme)
    const fullUrl = profileUrl;

    console.log('QRCode: Generating QR code for URL:', fullUrl);

    setLoading(true);
    QRCodeLib.toDataURL(fullUrl, {
      width: 280,
      margin: 2, // Increased margin for better scannability
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: 'M' // Medium error correction for better reliability
    })
      .then((dataUrl) => {
        console.log('QRCode: Successfully generated QR code');
        setQrCodeDataUrl(dataUrl);
        setLoading(false);
      })
      .catch((error) => {
        console.error('QRCode: Error generating QR code:', error);
        setQrCodeDataUrl("");
        setLoading(false);
      });
  }, [profileUrl, account]);

  return (
    <div 
      className="w-full h-full relative"
      style={{ 
        height: '100%',
      }}
    >
      {/* QR Code Display - Simply centered vertically on page */}
      <div 
        style={{ 
          position: 'fixed',
          top: '50vh',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}
      >
        {loading ? (
          <div 
            className="bg-gray-100 rounded-2xl flex items-center justify-center"
            style={{
              width: '280px',
              height: '280px',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
            }}
          >
            <span className="text-gray-500 text-lg font-medium">Loading QR code...</span>
          </div>
        ) : qrCodeDataUrl ? (
          <div 
            className="bg-white rounded-2xl flex items-center justify-center p-6"
            style={{
              width: '280px',
              height: '280px',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <img 
              src={qrCodeDataUrl} 
              alt="Profile QR Code" 
              className="w-full h-full object-contain"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>
        ) : (
          <div 
            className="bg-gray-100 rounded-2xl flex items-center justify-center"
            style={{
              width: '280px',
              height: '280px',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
            }}
          >
            <span className="text-gray-500 text-lg font-medium">No QR code available</span>
          </div>
        )}
      </div>

      {/* Scan QR Code Button - Positioned with fixed spacing from QR code card */}
      {/* Card bottom is at: 50vh + 140px (center + half card height) */}
      {/* Button positioned with gap from card bottom */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(50vh + 140px + 40px)', // Card bottom (50vh + 140px) + 40px gap
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingLeft: '16px',
          paddingRight: '16px',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Navigate to scan page, preserving the original 'from' parameter
            // This ensures the back button always returns to the original page (e.g., /menu)
            const fromParam = originalFrom ? `?from=${encodeURIComponent(originalFrom)}` : '';
            const targetUrl = `/scan${fromParam}`;
            console.log('🔵 QRCode: Navigate to scan button clicked', {
              originalFrom,
              fromParam,
              targetUrl,
              currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
            });
            router.push(targetUrl);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Navigate to scan page, preserving the original 'from' parameter
            // This ensures the back button always returns to the original page (e.g., /menu)
            const fromParam = originalFrom ? `?from=${encodeURIComponent(originalFrom)}` : '';
            const targetUrl = `/scan${fromParam}`;
            console.log('🔵 QRCode: Navigate to scan button touched', {
              originalFrom,
              fromParam,
              targetUrl,
              currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
            });
            router.push(targetUrl);
          }}
          className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-[1px]"
          style={{
            width: 'auto',
            minWidth: '200px',
            maxWidth: '280px',
            background: 'rgba(255, 255, 255, 0.96)',
            borderWidth: '0.4px',
            borderColor: '#E5E7EB',
            borderStyle: 'solid',
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            willChange: 'transform, box-shadow',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
          }}
        >
          <ScanLine size={20} className="text-gray-900" strokeWidth={2.5} />
          <span className="text-base font-medium text-gray-900">Scan QR code</span>
        </button>
      </div>
    </div>
  );
}

