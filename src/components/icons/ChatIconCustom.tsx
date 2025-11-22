import React from 'react';

interface ChatIconCustomProps {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  className?: string;
}

export const ChatIconCustom: React.FC<ChatIconCustomProps> = ({
  size = 24,
  fill = "currentColor",
  stroke = "none",
  className
}) => {
  return (
    <svg
      width={size * (21 / 17)}
      height={size}
      viewBox="0 0 21 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left speech bubble (smaller, in front) */}
      <path
        d="M7 0.5C10.6649 0.5 13.5 3.03197 13.5 6C13.5 8.96803 10.6649 11.5 7 11.5C3.33506 11.5 0.5 8.96803 0.5 6C0.5 3.03197 3.33506 0.5 7 0.5Z"
        fill={fill}
        stroke={fill}
      />
      
      {/* Right speech bubble (larger, behind) */}
      <circle
        cx="14"
        cy="10"
        r="6.5"
        fill={fill}
        stroke="white"
        strokeWidth="1"
      />
      
      {/* Left bubble tail/pointer */}
      <path
        d="M2.14689 12.3104C1.82847 12.4412 1.50454 12.1354 1.61677 11.81L2.37823 9.6021C2.47296 9.32743 2.81967 9.2422 3.03095 9.44164L4.42984 10.7622C4.64112 10.9616 4.57599 11.3127 4.30724 11.4231L2.14689 12.3104Z"
        fill={fill}
        stroke={stroke}
      />
      
      {/* Right bubble tail/pointer */}
      <path
        d="M19.5305 14.846C19.7015 15.1715 19.3797 15.5359 19.0355 15.4064L17.442 14.8067C17.1799 14.708 17.0977 14.3774 17.2831 14.1675L18.0847 13.26C18.2701 13.05 18.6084 13.0908 18.7386 13.3387L19.5305 14.846Z"
        fill={fill}
        stroke={stroke}
      />
    </svg>
  );
};

export default ChatIconCustom;

