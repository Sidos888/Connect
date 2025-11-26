import React from 'react';

interface ChatIconCustomProps {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  className?: string;
  active?: boolean; // New prop to indicate selected state
}

export const ChatIconCustom: React.FC<ChatIconCustomProps> = ({
  size = 24,
  fill = "currentColor",
  stroke = "none",
  className,
  active = false
}) => {
  const scale = size / 17; // Scale factor - width is 21, height is 17
  
  return (
    <svg
      width={(size * 21) / 17}
      height={size}
      viewBox="0 0 21 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {!active ? (
        /* Exact structure from CHAT ICON #8.svg - Outline/Unselected */
        <>
          <path d="M7 0.75C10.5644 0.75 13.25 3.2048 13.25 6C13.25 8.7952 10.5644 11.25 7 11.25C3.43559 11.25 0.75 8.7952 0.75 6C0.75 3.2048 3.43559 0.75 7 0.75Z" fill="white" stroke="black" strokeWidth="1.5"/>
          <circle cx="14" cy="10" r="6.5" fill="black" stroke="white"/>
          <path d="M19.5305 14.846C19.7015 15.1715 19.3797 15.5359 19.0355 15.4064L17.442 14.8067C17.1799 14.708 17.0977 14.3774 17.2831 14.1675L18.0847 13.26C18.2701 13.05 18.6084 13.0908 18.7386 13.3387L19.5305 14.846Z" fill="black"/>
          <path d="M1.14689 12.3103C0.828471 12.4411 0.504542 12.1353 0.616774 11.8099L1.37823 9.60207C1.47296 9.3274 1.81967 9.24217 2.03095 9.44161L3.42984 10.7621C3.64112 10.9616 3.57599 11.3126 3.30724 11.423L1.14689 12.3103Z" fill="black"/>
          <circle cx="14" cy="10" r="5.25" fill="white" stroke="black" strokeWidth="1.5"/>
        </>
      ) : (
        /* Exact structure from CHAT ICON FILL #8.svg - Selected */
        <>
          <path d="M7 0.75C10.5644 0.75 13.25 3.2048 13.25 6C13.25 8.7952 10.5644 11.25 7 11.25C3.43559 11.25 0.75 8.7952 0.75 6C0.75 3.2048 3.43559 0.75 7 0.75Z" fill="#FF6600" stroke="#FF6600" strokeWidth="1.5"/>
          <circle cx="14" cy="10" r="6.5" fill="black" stroke="white"/>
          <path d="M19.5305 14.846C19.7015 15.1715 19.3797 15.5359 19.0355 15.4064L17.442 14.8067C17.1799 14.708 17.0977 14.3774 17.2831 14.1675L18.0847 13.26C18.2701 13.05 18.6084 13.0908 18.7386 13.3387L19.5305 14.846Z" fill="#FF6600"/>
          <path d="M1.14689 12.3103C0.828471 12.4411 0.504542 12.1353 0.616774 11.8099L1.37823 9.60207C1.47296 9.3274 1.81967 9.24217 2.03095 9.44161L3.42984 10.7621C3.64112 10.9616 3.57599 11.3126 3.30724 11.423L1.14689 12.3103Z" fill="#FF6600"/>
          <circle cx="14" cy="10" r="5.25" fill="#FF6600" stroke="#FF6600" strokeWidth="1.5"/>
        </>
      )}
    </svg>
  );
};

export default ChatIconCustom;

