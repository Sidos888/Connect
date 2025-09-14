"use client";

import * as React from "react";

type Props = {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
};

export default function Avatar({ src, name = "?", size = 32, className }: Props) {
  console.log('Avatar component:', { src, name, size });
  
  const [imageError, setImageError] = React.useState(false);
  
  return (
    <div
      className={`rounded-full overflow-hidden ${src && !imageError ? 'bg-neutral-200 text-neutral-700' : 'border-2 border-dashed border-gray-400 bg-transparent text-gray-400'} flex items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {src && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover rounded-full" 
          onError={(e) => {
            console.error('Avatar image failed to load:', src, e);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('Avatar image loaded successfully:', src);
          }}
        />
      ) : (
        <span className="text-xs font-medium">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}


