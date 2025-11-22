import React from 'react';

interface MyLifeIconCustomProps {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  className?: string;
}

export const MyLifeIconCustom: React.FC<MyLifeIconCustomProps> = ({
  size = 24,
  fill = "currentColor",
  stroke = "none",
  className
}) => {
  return (
    <svg
      width={size * (17 / 18)}
      height={size}
      viewBox="0 0 17 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <mask id="path-1-inside-1_886_839" fill="white">
        <path d="M0 8.5C0 8.22386 0.223858 8 0.5 8H16.5C16.7761 8 17 8.22386 17 8.5V16C17 17.1046 16.1046 18 15 18H2C0.89543 18 0 17.1046 0 16V8.5Z"/>
      </mask>
      <path
        d="M0 8.5C0 8.22386 0.223858 8 0.5 8H16.5C16.7761 8 17 8.22386 17 8.5V16C17 17.1046 16.1046 18 15 18H2C0.89543 18 0 17.1046 0 16V8.5Z"
        fill={fill}
        stroke={fill}
        strokeWidth="2"
        mask="url(#path-1-inside-1_886_839)"
      />
      <mask id="path-2-inside-2_886_839" fill="white">
        <path d="M0 4C0 2.89543 0.895431 2 2 2H15C16.1046 2 17 2.89543 17 4V6.5C17 6.77614 16.7761 7 16.5 7H0.5C0.223858 7 0 6.77614 0 6.5V4Z"/>
      </mask>
      <path
        d="M0 4C0 2.89543 0.895431 2 2 2H15C16.1046 2 17 2.89543 17 4V6.5C17 6.77614 16.7761 7 16.5 7H0.5C0.223858 7 0 6.77614 0 6.5V4Z"
        fill={fill}
        stroke={fill}
        strokeWidth="2"
        mask="url(#path-2-inside-2_886_839)"
      />
      <path
        d="M10 2H14V3C14 4.10457 13.1046 5 12 5V5C10.8954 5 10 4.10457 10 3V2Z"
        fill="white"
      />
      <path
        d="M3 2H7V3C7 4.10457 6.10457 5 5 5V5C3.89543 5 3 4.10457 3 3V2Z"
        fill="white"
      />
      <rect x="11" width="2" height="4" rx="1" fill={fill}/>
      <rect x="4" width="2" height="4" rx="1" fill={fill}/>
    </svg>
  );
};

export default MyLifeIconCustom;
