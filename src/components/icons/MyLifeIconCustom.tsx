import React from 'react';

interface MyLifeIconCustomProps {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  className?: string;
  active?: boolean; // New prop to indicate selected state
}

export const MyLifeIconCustom: React.FC<MyLifeIconCustomProps> = ({
  size = 24,
  fill = "currentColor",
  stroke = "none",
  className,
  active = false
}) => {
  const scale = size / 17; // Scale factor based on original 17px size
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {!active ? (
        /* Exact structure from MY LIFE ICON #8.svg - Outline/Unselected */
        <>
          <path d="M2 2.53947H15C15.6904 2.53947 16.25 3.09912 16.25 3.78947V15.0004C16.2498 15.6906 15.6902 16.2504 15 16.2504H2C1.30978 16.2504 0.750222 15.6906 0.75 15.0004V3.78947C0.75 3.09912 1.30964 2.53947 2 2.53947Z" fill="white" stroke="black" strokeWidth="1.5"/>
          <rect x="11" width="2" height="3.77778" rx="1" fill="black"/>
          <rect x="4" width="2" height="3.77778" rx="1" fill="black"/>
          <line x1="1" y1="7.30263" x2="16" y2="7.30263" stroke="black" strokeWidth="1.5"/>
        </>
      ) : (
        /* Exact structure from MY LIFE FILL #8.svg - Selected */
        <>
          <mask id="path-1-inside-1_1036_3159" fill="white">
            <path d="M0 8.5C0 8.22386 0.223858 8 0.5 8H16.5C16.7761 8 17 8.22386 17 8.5V15C17 16.1046 16.1046 17 15 17H2C0.89543 17 0 16.1046 0 15V8.5Z"/>
      </mask>
          <path d="M0 8.5C0 8.22386 0.223858 8 0.5 8H16.5C16.7761 8 17 8.22386 17 8.5V15C17 16.1046 16.1046 17 15 17H2C0.89543 17 0 16.1046 0 15V8.5Z" fill="#FF6600" stroke="#FF6600" strokeWidth="3" mask="url(#path-1-inside-1_1036_3159)"/>
          <mask id="path-2-inside-2_1036_3159" fill="white">
            <path d="M0 4C0 2.89543 0.895431 2 2 2H15C16.1046 2 17 2.89543 17 4V6C17 6.27614 16.7761 6.5 16.5 6.5H0.5C0.223858 6.5 0 6.27614 0 6V4Z"/>
      </mask>
          <path d="M0 4C0 2.89543 0.895431 2 2 2H15C16.1046 2 17 2.89543 17 4V6C17 6.27614 16.7761 6.5 16.5 6.5H0.5C0.223858 6.5 0 6.27614 0 6V4Z" fill="#FF6600" stroke="#FF6600" strokeWidth="3" mask="url(#path-2-inside-2_1036_3159)"/>
          <path d="M3 2H7V3C7 4.10457 6.10457 5 5 5V5C3.89543 5 3 4.10457 3 3V2Z" fill="white"/>
          <rect x="4" width="2" height="3.77778" rx="1" fill="#FF6600"/>
          <path d="M10 2H14V3C14 4.10457 13.1046 5 12 5V5C10.8954 5 10 4.10457 10 3V2Z" fill="white"/>
          <rect x="11" width="2" height="3.77778" rx="1" fill="#FF6600"/>
        </>
      )}
    </svg>
  );
};

export default MyLifeIconCustom;
