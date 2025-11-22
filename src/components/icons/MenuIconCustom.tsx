import React from 'react';

interface MenuIconCustomProps {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  className?: string;
}

export const MenuIconCustom: React.FC<MenuIconCustomProps> = ({
  size = 24,
  fill = "currentColor",
  stroke = "none",
  className
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top-left square */}
      <rect
        x="0.5"
        y="0.5"
        width="7"
        height="7"
        rx="1.5"
        fill={fill}
        stroke={stroke !== "none" ? stroke : fill}
      />
      
      {/* Top-right square */}
      <rect
        x="9.5"
        y="0.5"
        width="7"
        height="7"
        rx="1.5"
        fill={fill}
        stroke={stroke !== "none" ? stroke : fill}
      />
      
      {/* Bottom-left square */}
      <rect
        x="0.5"
        y="9.5"
        width="7"
        height="7"
        rx="1.5"
        fill={fill}
        stroke={stroke !== "none" ? stroke : fill}
      />
      
      {/* Bottom-right square */}
      <rect
        x="9.5"
        y="9.5"
        width="7"
        height="7"
        rx="1.5"
        fill={fill}
        stroke={stroke !== "none" ? stroke : fill}
      />
    </svg>
  );
};

export default MenuIconCustom;

