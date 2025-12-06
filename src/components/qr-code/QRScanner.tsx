"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flashlight, QrCode } from "lucide-react";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRScanner({ isOpen, onClose }: QRScannerProps) {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Clean up scanner when modal closes
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
      // Reset torch state when closing
      setTorchEnabled(false);
      videoTrackRef.current = null;
      return;
    }

    // Initialize scanner when modal opens
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
    };
  }, [isOpen]);

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

  const handleScanSuccess = (decodedText: string) => {
    // Stop scanning safely
    if (scannerRef.current) {
      scannerRef.current.stop().catch((err) => {
        // Ignore stop errors
        console.log("Error stopping scanner:", err);
      });
      scannerRef.current = null;
    }

    // Parse the scanned URL
    // Expected format: connect://p/{connectId} or https://.../p/{connectId}
    let connectId: string | null = null;

    // Check for custom scheme: connect://p/{connectId}
    if (decodedText.startsWith("connect://p/")) {
      connectId = decodedText.replace("connect://p/", "").trim();
    }
    // Check for web URL: https://.../p/{connectId}
    else if (decodedText.includes("/p/")) {
      const match = decodedText.match(/\/p\/([A-Z0-9]+)/);
      if (match) {
        connectId = match[1].trim();
      }
    }

    if (connectId) {
      // Close scanner first
      onClose();
      // Navigate to profile page
      setTimeout(() => {
        router.push(`/p/${connectId}`);
      }, 100);
    } else {
      setError("Invalid QR code. Please scan a Connect profile QR code.");
      // Restart scanning after a delay
      setTimeout(() => {
        if (isOpen && !scannerRef.current) {
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
              console.error("Error restarting scanner:", err);
              setError("Failed to restart camera");
            });
        }
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      style={{ height: "100dvh" }}
    >
      {/* Header - Matching Luma scanner style */}
      <div 
        className="flex items-center justify-between px-4"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 70px)',
          paddingBottom: '16px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Back Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Stop scanner before closing
            if (scannerRef.current) {
              scannerRef.current.stop().catch(() => {
                // Ignore errors
              });
              scannerRef.current = null;
            }
            // Close modal
            onClose();
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
          <ArrowLeft size={24} className="text-white" strokeWidth={2.5} />
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

      {/* QR Code Button - Positioned to match scan button on QR code page */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px', // Match exact bottom position of scan button on QR code page
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
            onClose(); // Close scanner
            router.push('/qr-code'); // Navigate to QR code page
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose(); // Close scanner
            router.push('/qr-code'); // Navigate to QR code page
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
          <span className="text-base font-medium text-white">QR code</span>
        </button>
      </div>
    </div>
  );
}

