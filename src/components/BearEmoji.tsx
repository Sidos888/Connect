"use client";

export default function BearEmoji({ size = "4xl" }: { size?: string }) {
  const svgSize = size === "6xl" ? 64 : 36;
  
  return (
    <div className="flex justify-center" role="img" aria-label="bear">
      <svg 
        width={svgSize} 
        height={svgSize} 
        viewBox="0 0 64 64" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Bear face */}
        <circle cx="32" cy="35" r="18" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
        
        {/* Bear ears */}
        <circle cx="20" cy="22" r="8" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
        <circle cx="44" cy="22" r="8" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
        <circle cx="20" cy="22" r="5" fill="#D2691E"/>
        <circle cx="44" cy="22" r="5" fill="#D2691E"/>
        
        {/* Bear snout */}
        <ellipse cx="32" cy="40" rx="8" ry="6" fill="#D2691E"/>
        
        {/* Bear nose */}
        <ellipse cx="32" cy="37" rx="3" ry="2" fill="#000"/>
        
        {/* Bear eyes */}
        <circle cx="27" cy="30" r="3" fill="#000"/>
        <circle cx="37" cy="30" r="3" fill="#000"/>
        <circle cx="28" cy="29" r="1" fill="#FFF"/>
        <circle cx="38" cy="29" r="1" fill="#FFF"/>
        
        {/* Bear mouth */}
        <path d="M 32 42 Q 28 45 25 43" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M 32 42 Q 36 45 39 43" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
