"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter, useSearchParams } from "next/navigation";
import { Flashlight, QrCode } from "lucide-react";
import { PageContent } from "@/components/layout/PageSystem";
import ProfilePage from "@/components/profile/ProfilePage";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from'); // Get the 'from' parameter

  // Log the 'from' parameter for debugging
  React.useEffect(() => {
    console.log('🔵 ScanPage: Component mounted/updated', {
      from,
      fullUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      search: typeof window !== 'undefined' ? window.location.search : 'N/A'
    });
  }, [from]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<{
    id: string;
    name: string;
    avatarUrl?: string;
    bio?: string;
    profile_visibility?: 'public' | 'private';
    dateOfBirth?: string;
    createdAt?: string;
    connectId?: string;
  } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);


  useEffect(() => {
    // Initialize scanner when page mounts
    const startScanner = async () => {
      try {
        setError(null);
        setScanning(true);

        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 280, height: 280 }, // Match QR code card size
          },
          (decodedText) => {
            // QR code scanned successfully
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
          }
        );

        // Get the video track for torch control
        // Wait a bit for the video element to be created
        setTimeout(() => {
          try {
            const videoElement = document.getElementById("qr-reader")?.querySelector("video");
            if (videoElement && videoElement.srcObject) {
              const stream = videoElement.srcObject as MediaStream;
              const videoTrack = stream.getVideoTracks()[0];
              if (videoTrack) {
                videoTrackRef.current = videoTrack;
              }
            }
          } catch (err) {
            console.log("Could not get video track for torch:", err);
          }
        }, 500);
      } catch (err: any) {
        console.error("Error starting QR scanner:", err);
        setError(err.message || "Failed to start camera");
        setScanning(false);
        scannerRef.current = null; // Clear ref on error
      }
    };

    startScanner();

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        try {
          scannerRef.current
            .stop()
            .then(() => {
              scannerRef.current = null;
            })
            .catch(() => {
              // Ignore errors when stopping (scanner might not be running)
              scannerRef.current = null;
            });
        } catch (err) {
          // Ignore any synchronous errors during cleanup
          scannerRef.current = null;
        }
      }
      setTorchEnabled(false);
      videoTrackRef.current = null;
    };
  }, []);

  const toggleTorch = async () => {
    try {
      let track = videoTrackRef.current;
      
      // If track is not available, try to get it from the video element
      if (!track) {
        const videoElement = document.getElementById("qr-reader")?.querySelector("video");
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrackRef.current = videoTrack;
            track = videoTrack;
          }
        }
      }

      if (!track) {
        console.log("No video track available for torch");
        return;
      }

      const capabilities = track.getCapabilities();
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled }]
        });
        setTorchEnabled(!torchEnabled);
      } else {
        console.log("Torch not supported on this device");
      }
    } catch (err) {
      console.error("Error toggling torch:", err);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    console.log('ScanPage: QR code scanned:', decodedText);
    
    // Stop scanning safely
    if (scannerRef.current) {
      scannerRef.current.stop().catch((err) => {
        // Ignore stop errors
        console.log("ScanPage: Error stopping scanner:", err);
      });
      scannerRef.current = null;
    }

    // Parse the scanned URL
    // Expected format: connect://p/{connectId} or https://.../p/{connectId}
    let connectId: string | null = null;

    // Check for custom scheme: connect://p/{connectId}
    if (decodedText.startsWith("connect://p/")) {
      connectId = decodedText.replace("connect://p/", "").trim();
      console.log('ScanPage: Extracted connectId from custom scheme:', connectId);
    }
    // Check for web URL: https://.../p/{connectId} or http://.../p/{connectId}
    else if (decodedText.includes("/p/")) {
      // More flexible regex to match any alphanumeric connectId (case-insensitive)
      const match = decodedText.match(/\/p\/([A-Z0-9a-z]+)/i);
      if (match && match[1]) {
        connectId = match[1].trim().toUpperCase(); // Convert to uppercase as expected by backend
        console.log('ScanPage: Extracted connectId from web URL:', connectId);
      }
    }
    // Also check if the entire text is just a connectId (fallback)
    else if (/^[A-Z0-9a-z]+$/.test(decodedText.trim())) {
      connectId = decodedText.trim().toUpperCase();
      console.log('ScanPage: Using entire text as connectId:', connectId);
    }

    if (connectId && connectId.length > 0) {
      console.log('ScanPage: Looking up user by connectId:', connectId);
      
      try {
        // Look up user by connect_id (like WeChat - no page reload!)
        const supabase = getSupabaseClient();
        const { data, error: lookupError } = await supabase
          .from('accounts')
          .select('id')
          .eq('connect_id', connectId.toUpperCase())
          .single();

        if (lookupError || !data) {
          console.error('ScanPage: User not found:', lookupError);
          setError("Profile not found. Please scan a valid Connect QR code.");
          // Restart scanning after a delay
          setTimeout(() => {
            if (scannerRef.current === null) {
              const html5QrCode = new Html5Qrcode("qr-reader");
              scannerRef.current = html5QrCode;
              scannerRef.current
                .start(
                  { facingMode: "environment" },
                  { fps: 10, qrbox: { width: 280, height: 280 } },
                  handleScanSuccess,
                  () => {}
                )
                .catch((err) => {
                  console.error("ScanPage: Error restarting scanner:", err);
                  setError("Failed to restart camera");
                });
            }
          }, 2000);
          return;
        }

        console.log('ScanPage: ✅ Found user:', data.id);
        
        // Show loading screen
        setIsLoadingProfile(true);
        setError(null);
        
        // Fetch full profile data (like connections page does)
        const { data: profileData, error: profileError } = await supabase
          .from('accounts')
          .select('id, name, profile_pic, bio, profile_visibility, dob, created_at, connect_id')
          .eq('id', data.id)
          .single();

        if (profileError || !profileData) {
          console.error('ScanPage: Error fetching profile data:', profileError);
          setIsLoadingProfile(false);
          setError("Failed to load profile data. Please try again.");
          // Restart scanning
          setTimeout(() => {
            if (scannerRef.current === null) {
              const html5QrCode = new Html5Qrcode("qr-reader");
              scannerRef.current = html5QrCode;
              scannerRef.current
                .start(
                  { facingMode: "environment" },
                  { fps: 10, qrbox: { width: 280, height: 280 } },
                  handleScanSuccess,
                  () => {}
                )
                .catch((err) => {
                  console.error("ScanPage: Error restarting scanner:", err);
                  setError("Failed to restart camera");
                });
            }
          }, 2000);
          return;
        }

        // Prepare profile data
        const profile = {
          id: profileData.id,
          name: profileData.name,
          avatarUrl: profileData.profile_pic || undefined,
          bio: profileData.bio || undefined,
          profile_visibility: profileData.profile_visibility || 'public',
          dateOfBirth: profileData.dob || undefined,
          createdAt: profileData.created_at || undefined,
          connectId: profileData.connect_id || connectId || undefined
        };

        // Small delay to ensure smooth transition (1-2 seconds)
        // This gives ProfilePage time to prepare and provides better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Open profile in modal (smooth like WeChat - no reload!)
        setScannedProfile(profile);
        setIsLoadingProfile(false);
        setShowProfileModal(true);
        setError(null);
      } catch (err) {
        console.error('ScanPage: Error looking up user:', err);
        setError("Failed to load profile. Please try again.");
        // Restart scanning
        setTimeout(() => {
          if (scannerRef.current === null) {
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;
            scannerRef.current
              .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 280, height: 280 } },
                handleScanSuccess,
                () => {}
              )
              .catch((err) => {
                console.error("ScanPage: Error restarting scanner:", err);
                setError("Failed to restart camera");
              });
          }
        }, 2000);
      }
    } else {
      console.warn('ScanPage: Invalid QR code format:', decodedText);
      setError("Invalid QR code. Please scan a Connect profile QR code.");
      // Restart scanning after a delay
      setTimeout(() => {
        if (scannerRef.current === null) {
          const html5QrCode = new Html5Qrcode("qr-reader");
          scannerRef.current = html5QrCode;
          scannerRef.current
            .start(
              { facingMode: "environment" },
              { fps: 10, qrbox: { width: 280, height: 280 } },
              handleScanSuccess,
              () => {}
            )
            .catch((err) => {
              console.error("ScanPage: Error restarting scanner:", err);
              setError("Failed to restart camera");
            });
        }
      }, 2000);
    }
  };

  return (
    <div 
      className="lg:hidden" 
      style={{ 
        background: 'black', 
        minHeight: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {/* Header - Matching QR code page style */}
      <div 
        className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 70px)',
          paddingBottom: '16px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Back Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 ScanPage: Back button clicked', {
              from,
              decodedFrom: from ? decodeURIComponent(from) : null,
              willUseFrom: !!from,
              willUseRouterBack: !from
            });
            // Prioritize using the 'from' parameter to return to the exact previous page
            if (from) {
              const targetUrl = decodeURIComponent(from);
              console.log('🔵 ScanPage: Navigating to original page via from parameter:', targetUrl);
              router.replace(targetUrl);
            } else {
              console.log('🔵 ScanPage: No from parameter, using router.back()');
              router.back();
            }
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 ScanPage: Back button touched', {
              from,
              decodedFrom: from ? decodeURIComponent(from) : null,
              willUseFrom: !!from,
              willUseRouterBack: !from
            });
            // Prioritize using the 'from' parameter to return to the exact previous page
            if (from) {
              const targetUrl = decodeURIComponent(from);
              console.log('🔵 ScanPage: Navigating to original page via from parameter:', targetUrl);
              router.replace(targetUrl);
            } else {
              console.log('🔵 ScanPage: No from parameter, using router.back()');
              router.back();
            }
          }}
          className="flex items-center justify-center transition-all duration-200"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '100px',
            background: 'rgba(255, 255, 255, 0.1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>

        {/* Title */}
        <h2 className="text-white text-lg font-semibold">Scan</h2>

        {/* Torch Button */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await toggleTorch();
          }}
          className="flex items-center justify-center transition-all duration-200"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '100px',
            background: torchEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Flashlight 
            size={20} 
            className="text-white" 
            strokeWidth={2.5}
            fill={torchEnabled ? "white" : "none"}
          />
        </button>
      </div>

      <PageContent bottomBlur={false} className="bg-black">
        <div 
          className="px-4 relative" 
          style={{ 
            paddingTop: 'calc(max(env(safe-area-inset-top), 70px) + 16px + 76px)', // Header: safe-area + padding-bottom + content height
            paddingBottom: '24px', // Space at bottom for button
            height: 'calc(100vh - max(env(safe-area-inset-top), 70px) - 16px - 76px - 24px)', // Full height minus header and bottom padding
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Prevent scrolling
            background: 'black', // Black background for camera view
            width: '100%',
          }}
        >
          {/* Camera Section - Positioned exactly like QR code card */}
          <div 
            style={{ 
              position: 'fixed',
              top: '50vh',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <div className="relative" style={{ width: '280px', height: '280px' }}>
              {/* Camera Feed Container - Matches QR code card size exactly */}
              <div
                id="qr-reader"
                className="w-full h-full rounded-2xl overflow-hidden"
                style={{
                  width: '280px',
                  height: '280px',
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  borderStyle: 'solid',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                }}
              />
              
              {/* Scanning Frame Overlay - Visual guide matching card border */}
              {scanning && !error && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '16px',
                  }}
                />
              )}

              {/* Error Message */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                  <div className="bg-red-500 text-white px-4 py-3 rounded-lg text-center mx-4">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Button - Positioned with same fixed spacing from camera card as scan button from QR code card */}
          {/* Camera card bottom is at: 50vh + 140px (center + half card height) */}
          {/* Button positioned with same gap from card bottom */}
          <div
            style={{
              position: 'fixed',
              top: 'calc(50vh + 140px + 40px)', // Card bottom (50vh + 140px) + 40px gap (matches QR code page)
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
                // Navigate to QR code page, preserving the original 'from' parameter
                // This ensures the back button always returns to the original page (e.g., /menu)
                const urlParams = new URLSearchParams(window.location.search);
                const originalFrom = urlParams.get('from');
                // Always preserve the original 'from' parameter if it exists
                // This is the page the user was on when they first clicked to view QR code
                const fromParam = originalFrom ? `?from=${encodeURIComponent(originalFrom)}` : '';
                const targetUrl = `/qr-code${fromParam}`;
                console.log('🔵 ScanPage: Navigate to QR code button clicked', {
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
                // Navigate to QR code page, preserving the original 'from' parameter
                // This ensures the back button always returns to the original page (e.g., /menu)
                const urlParams = new URLSearchParams(window.location.search);
                const originalFrom = urlParams.get('from');
                // Always preserve the original 'from' parameter if it exists
                // This is the page the user was on when they first clicked to view QR code
                const fromParam = originalFrom ? `?from=${encodeURIComponent(originalFrom)}` : '';
                const targetUrl = `/qr-code${fromParam}`;
                console.log('🔵 ScanPage: Navigate to QR code button clicked', {
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
                background: 'rgba(255, 255, 255, 0.1)',
                borderWidth: '0px',
                willChange: 'transform',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <QrCode size={20} className="text-white" strokeWidth={2.5} />
              <span className="text-base font-medium text-white">View QR code</span>
            </button>
          </div>
        </div>
      </PageContent>

      {/* Loading Screen - Show while fetching profile data */}
      {isLoadingProfile && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
          <div className="text-center space-y-4">
            {/* 3-dot loading animation */}
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-gray-500 text-sm">Loading profile...</p>
          </div>
        </div>
      )}

      {/* Profile Modal - Full page overlay (WeChat-style, no page reload!) */}
      {showProfileModal && scannedProfile && !isLoadingProfile && (
        <div className="fixed inset-0 z-[100] bg-white">
          {/* Full page profile view - matches connections page ProfilePage */}
          <div className="w-full h-full overflow-hidden">
            <ProfilePage
              profile={scannedProfile}
              isOwnProfile={false}
              showBackButton={true}
              onClose={() => {
                setShowProfileModal(false);
                setScannedProfile(null);
                // Restart scanner when modal closes
                if (scannerRef.current === null) {
                  const html5QrCode = new Html5Qrcode("qr-reader");
                  scannerRef.current = html5QrCode;
                  scannerRef.current
                    .start(
                      { facingMode: "environment" },
                      { fps: 10, qrbox: { width: 280, height: 280 } },
                      handleScanSuccess,
                      () => {}
                    )
                    .catch((err) => {
                      console.error("ScanPage: Error restarting scanner:", err);
                    });
                }
              }}
              onOpenConnections={() => {
                // Navigate to connections page for this user
                router.push(`/connections?userId=${scannedProfile.id}`);
                setShowProfileModal(false);
                setScannedProfile(null);
              }}
              onOpenFullLife={() => {
                // Navigate to timeline page for this user
                // Pass connectId so timeline can route back to profile page
                if (scannedProfile.connectId) {
                  router.push(`/timeline?userId=${scannedProfile.id}&from=scan&connectId=${scannedProfile.connectId}`);
                } else {
                  router.push(`/timeline?userId=${scannedProfile.id}&from=scan`);
                }
                // Close profile modal when navigating to timeline
                setShowProfileModal(false);
                setScannedProfile(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

