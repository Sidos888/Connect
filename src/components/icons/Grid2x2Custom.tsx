import React from 'react';

interface Grid2x2CustomProps {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  className?: string;
}

export const Grid2x2Custom: React.FC<Grid2x2CustomProps> = ({
  size = 24,
  fill = "currentColor",
  stroke = "none",
  className
}) => {
  // Calculate dimensions for 4 squares in a 2x2 grid
  const containerSize = size;
  const gap = size * 0.15; // 15% gap between squares
  const squareSize = (containerSize - gap) / 2;
  const borderRadius = squareSize * 0.25; // 25% border radius for rounded corners
  
  return (
    <svg
      width={containerSize}
      height={containerSize}
      viewBox={`0 0 ${containerSize} ${containerSize}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top-left square */}
      <rect
        x="0"
        y="0"
        width={squareSize}
        height={squareSize}
        rx={borderRadius}
        fill={fill}
        stroke={stroke}
      />
      {/* Top-right square */}
      <rect
        x={squareSize + gap}
        y="0"
        width={squareSize}
        height={squareSize}
        rx={borderRadius}
        fill={fill}
        stroke={stroke}
      />
      {/* Bottom-left square */}
      <rect
        x="0"
        y={squareSize + gap}
        width={squareSize}
        height={squareSize}
        rx={borderRadius}
        fill={fill}
        stroke={stroke}
      />
      {/* Bottom-right square */}
      <rect
        x={squareSize + gap}
        y={squareSize + gap}
        width={squareSize}
        height={squareSize}
        rx={borderRadius}
        fill={fill}
        stroke={stroke}
      />
    </svg>
  );
};

export default Grid2x2Custom;

