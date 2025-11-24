import React from 'react';

interface SFClockProps {
  size?: number;
  className?: string;
}

export const SFClock: React.FC<SFClockProps> = ({
  size = 14,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* SF Symbols style clock */}
      <path
        d="M7 0C3.13 0 0 3.13 0 7C0 10.87 3.13 14 7 14C10.87 14 14 10.87 14 7C14 3.13 10.87 0 7 0ZM7 12.5C4.52 12.5 2.5 10.48 2.5 8C2.5 5.52 4.52 3.5 7 3.5C9.48 3.5 11.5 5.52 11.5 8C11.5 10.48 9.48 12.5 7 12.5ZM7.5 4.5H6.5V8.5L9.5 10.5L10.25 9.75L7.5 8.25V4.5Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default SFClock;

