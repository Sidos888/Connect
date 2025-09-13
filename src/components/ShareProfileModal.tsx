'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Share2 } from 'lucide-react';
import Button from '@/components/Button';
import { useAppStore } from '@/lib/store';
import QRCode from 'qrcode';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareProfileModal({ isOpen, onClose }: ShareProfileModalProps) {
  const { personalProfile } = useAppStore();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const profileUrl = personalProfile?.connectId 
    ? `${window.location.origin}/p/${personalProfile.connectId}`
    : '';

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && profileUrl) {
      QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(setQrCodeDataUrl)
      .catch(console.error);
    }
  }, [isOpen, profileUrl]);

  const handleCopyLink = async () => {
    if (profileUrl) {
      try {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = profileUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && profileUrl) {
      try {
        await navigator.share({
          title: `${personalProfile?.name}'s Connect Profile`,
          text: `Check out ${personalProfile?.name}'s profile on Connect`,
          url: profileUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copy link
        handleCopyLink();
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !personalProfile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="w-9" />
          <h2 className="text-xl font-semibold text-gray-900">Share Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {/* Profile Preview */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {personalProfile.avatarUrl ? (
                <img
                  src={personalProfile.avatarUrl}
                  alt={personalProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-semibold text-orange-600">
                    {personalProfile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{personalProfile.name}</h3>
            {personalProfile.bio && (
              <p className="text-gray-600 text-sm mt-1">{personalProfile.bio}</p>
            )}
          </div>

          {/* Connect ID */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Your Connect ID</p>
              <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                {personalProfile.connectId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                connect.app/p/{personalProfile.connectId}
              </p>
            </div>
          </div>

          {/* QR Code */}
          {qrCodeDataUrl && (
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-3">Scan to connect</p>
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-32 h-32"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            )}
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Share this link or QR code to let others connect with you
          </p>
        </div>
      </div>
    </div>
  );
}
