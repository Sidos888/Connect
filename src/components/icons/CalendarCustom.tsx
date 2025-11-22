import React from 'react';

interface CalendarCustomProps {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  className?: string;
}

export const CalendarCustom: React.FC<CalendarCustomProps> = ({
  size = 24,
  fill = "currentColor",
  stroke = "none",
  className
}) => {
  return (
    <svg
      width={size * (18 / 19)}
      height={size}
      viewBox="0 0 18 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main calendar body - bottom section */}
      <path
        d="M0 9.2C0 9.08954 0.0895431 9 0.2 9H17.8C17.9105 9 18 9.08954 18 9.2V18C18 18.5523 17.5523 19 17 19H1C0.447716 19 0 18.5523 0 18V9.2Z"
        fill={fill}
        stroke={stroke}
      />
      
      {/* Main calendar body - top section */}
      <path
        d="M0 3C0 2.44772 0.447715 2 1 2H17C17.5523 2 18 2.44772 18 3V7.8C18 7.91046 17.9105 8 17.8 8H0.200001C0.0895436 8 0 7.91046 0 7.8V3Z"
        fill={fill}
        stroke={stroke}
      />
      
      {/* Left tab - outer white part */}
      <rect
        x="3.375"
        y="1"
        width="4.5"
        height="5"
        rx="2.25"
        fill="white"
      />
      
      {/* Right tab - outer white part */}
      <rect
        x="10.125"
        y="1"
        width="4.5"
        height="5"
        rx="2.25"
        fill="white"
      />
      
      {/* Left tab - inner colored part */}
      <rect
        x="4.5"
        y="0"
        width="2.25"
        height="5"
        rx="1"
        fill={fill}
      />
      
      {/* Right tab - inner colored part */}
      <rect
        x="11.25"
        y="0"
        width="2.25"
        height="5"
        rx="1"
        fill={fill}
      />
    </svg>
  );
};

export default CalendarCustom;
