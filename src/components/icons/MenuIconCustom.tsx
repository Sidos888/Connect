import React from 'react';

interface MenuIconCustomProps {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  className?: string;
  active?: boolean; // New prop to indicate selected state
}

export const MenuIconCustom: React.FC<MenuIconCustomProps> = ({
  size = 24,
  fill = "currentColor",
  stroke = "none",
  className,
  active = false
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
      {!active ? (
        /* Exact structure from MENU ICON #8.svg - Outline/Unselected */
        <>
          <rect x="0.75" y="9.75" width="6.5" height="6.5" rx="1.25" fill="white" stroke="black" strokeWidth="1.5"/>
          <rect x="9.75" y="9.75" width="6.5" height="6.5" rx="1.25" fill="white" stroke="black" strokeWidth="1.5"/>
          <rect x="9.75" y="0.75" width="6.5" height="6.5" rx="1.25" fill="white" stroke="black" strokeWidth="1.5"/>
          <rect x="0.75" y="0.75" width="6.5" height="6.5" rx="1.25" fill="white" stroke="black" strokeWidth="1.5"/>
        </>
      ) : (
        /* Exact structure from MENU ICON FILL #8.svg - Selected */
        <>
          <rect x="0.75" y="9.75" width="6.5" height="6.5" rx="1.25" fill="#FF6600" stroke="#FF6600" strokeWidth="1.5"/>
          <rect x="9.75" y="9.75" width="6.5" height="6.5" rx="1.25" fill="#FF6600" stroke="#FF6600" strokeWidth="1.5"/>
          <rect x="9.75" y="0.75" width="6.5" height="6.5" rx="1.25" fill="#FF6600" stroke="#FF6600" strokeWidth="1.5"/>
          <rect x="0.75" y="0.75" width="6.5" height="6.5" rx="1.25" fill="#FF6600" stroke="#FF6600" strokeWidth="1.5"/>
        </>
      )}
    </svg>
  );
};

export default MenuIconCustom;

