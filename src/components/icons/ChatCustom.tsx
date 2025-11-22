import React from 'react';

interface ChatCustomProps {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  className?: string;
}

export const ChatCustom: React.FC<ChatCustomProps> = ({
  size = 24,
  fill = "currentColor",
  stroke = "none",
  className
}) => {
  // Scale up the chat icon to match other icons better
  // Using a larger base size to make it more prominent
  const scale = 1.4; // Scale up by 40% to match other icons better
  
  return (
    <svg
      width={size * (24 / 15) * scale}
      height={size * scale}
      viewBox="0 0 24 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Right speech bubble (larger, behind) */}
      <ellipse
        cx="14.4297"
        cy="6.5"
        rx="6.5"
        ry="5.5"
        fill={fill}
        stroke={stroke}
      />
      
      {/* Left speech bubble (smaller, in front) */}
      <path
        d="M8.42969 0.5C12.2141 0.5 15.4297 3.11125 15.4297 6.5C15.4297 9.88875 12.2141 12.5 8.42969 12.5C4.64525 12.5 1.42969 9.88875 1.42969 6.5C1.42969 3.11125 4.64525 0.5 8.42969 0.5Z"
        fill={fill}
        stroke="white"
        strokeWidth="0.5"
      />
      
      {/* Left bubble tail/pointer */}
      <path
        d="M2.29138 11.9252C1.93972 11.9866 1.68994 11.5915 1.89614 11.3001L4.27103 7.94412C4.43555 7.71163 4.78343 7.72069 4.93564 7.96141L6.61093 10.6111C6.76314 10.8518 6.62214 11.17 6.34157 11.2189L2.29138 11.9252Z"
        fill={fill}
        stroke={stroke}
      />
      
      {/* Right bubble tail/pointer */}
      <path
        d="M21.5237 11.3916C21.7038 11.6997 21.4207 12.0716 21.0757 11.9801L17.102 10.9254C16.8267 10.8523 16.7138 10.5231 16.8863 10.2965L18.7849 7.80198C18.9574 7.57535 19.3048 7.59648 19.4485 7.84234L21.5237 11.3916Z"
        fill={fill}
        stroke={stroke}
      />
    </svg>
  );
};

export default ChatCustom;
