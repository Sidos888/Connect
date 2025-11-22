"use client";

import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      {/* Connect Logo - Centered with subtle fade-in */}
      <div className="flex items-center justify-center animate-pulse">
        <Image
          src="/connect-logo.png"
          alt="Connect Logo"
          width={240}
          height={240}
          className="object-contain"
          priority
          style={{
            maxWidth: '240px',
            maxHeight: '240px',
            width: 'auto',
            height: 'auto'
          }}
        />
      </div>
    </div>
  );
}
