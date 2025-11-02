"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import QRCode from "qrcode";

export default function ShareProfilePage() {
  const router = useRouter();
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

  // Prevent background scroll while page-level modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-hidden flex flex-col" style={{ paddingBottom: '0' }}>
      {/* Mobile: full screen */}
      <div className="lg:hidden flex flex-col h-full">
        <div className="bg-white px-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 70px)' }}>
          <div className="relative w-full h-14 flex items-center justify-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '56px' }}>
            <button
              onClick={() => router.back()}
              className="absolute left-0 flex items-center justify-center w-10 h-10"
              style={{
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
              }}
              aria-label="Go back"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Share Profile</h1>
          </div>
        </div>
        <div className="flex-1 px-4 py-4 overflow-y-auto">
          {qrCodeDataUrl && (
            <div className="text-center pt-8">
              <p className="text-sm text-gray-600 mb-3">Scan to connect</p>
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-40 h-40" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: dim overlay + centered card */}
      <div className="hidden lg:block fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => router.back()} />
      <div className="hidden lg:flex min-h-screen items-center justify-center p-6">
        <div className="bg-white rounded-3xl w-full max-w-[680px] md:w-[680px] h-[620px] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-out scale-100 relative" style={{ borderWidth: '0.4px', borderColor: '#E5E7EB', borderStyle: 'solid' }}>
          {/* Header with back button and title */}
          <div className="px-4 pb-2 pt-6">
            <div className="flex items-center justify-center relative w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <button
                onClick={() => router.back()}
                className="absolute left-0 flex items-center justify-center w-10 h-10"
                style={{
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                }}
                aria-label="Back"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>Share Profile</h1>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-4">
            {qrCodeDataUrl && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Scan to connect</p>
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-40 h-40" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


