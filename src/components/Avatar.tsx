"use client";

import * as React from "react";

type Props = {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
};

export default function Avatar({ src, name = "?", size = 32, className }: Props) {
  
  const [imageError, setImageError] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const borderWidth = isMobile ? '2.5px' : '2px';
  
  return (
    <div
      className={`rounded-full ${src && !imageError ? 'bg-neutral-200 text-neutral-700' : 'border-dashed border-gray-400 bg-transparent text-gray-400'} flex items-center justify-center ${className ?? ""}`}
      style={{ 
        width: size, 
        height: size,
        borderWidth: src && !imageError ? '0' : borderWidth,
        borderStyle: src && !imageError ? 'none' : 'dashed',
        overflow: 'hidden',
        position: 'relative'
      }}
      aria-label={name}
    >
      {src && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover" 
          style={{
            borderRadius: '50%',
            display: 'block'
          }}
          onError={(e) => {
            console.error('Avatar image failed to load:', src, e);
            setImageError(true);
          }}
          onLoad={() => {
            // Image loaded successfully
          }}
        />
      ) : (
        <span className="text-xs font-medium">{name && name.trim() ? name.charAt(0).toUpperCase() : ''}</span>
      )}
    </div>
  );
}


