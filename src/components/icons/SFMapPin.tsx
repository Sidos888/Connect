import React from 'react';

interface SFMapPinProps {
  size?: number;
  className?: string;
}

export const SFMapPin: React.FC<SFMapPinProps> = ({
  size = 16,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* SF Symbols style map pin */}
      <path
        d="M8 0C5.24 0 3 2.24 3 5C3 9 8 16 8 16C8 16 13 9 13 5C13 2.24 10.76 0 8 0ZM8 6.5C7.17 6.5 6.5 5.83 6.5 5C6.5 4.17 7.17 3.5 8 3.5C8.83 3.5 9.5 4.17 9.5 5C9.5 5.83 8.83 6.5 8 6.5Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default SFMapPin;

