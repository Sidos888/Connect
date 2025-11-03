"use client";

import { useState, useEffect } from "react";

export default function ThreeDotLoading() {
  const [animationPhase, setAnimationPhase] = useState(0);

  // Animate the dots - similar to typing indicator but slower
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 500); // 500ms per dot
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-6 py-4 shadow-sm"
      style={{ 
        backgroundColor: '#ffffff !important', 
        color: '#111827 !important',
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
      <div className="flex items-center justify-center gap-2" style={{ height: '28px' }}>
        <div className="flex space-x-2">
          <div 
            className="w-2.5 h-2.5 bg-gray-400 rounded-full transition-all duration-300 ease-in-out" 
            style={{ 
              transform: animationPhase === 0 ? 'translateY(-6px)' : 'translateY(0)',
              opacity: animationPhase === 0 ? 1 : 0.5
            }}
          />
          <div 
            className="w-2.5 h-2.5 bg-gray-400 rounded-full transition-all duration-300 ease-in-out" 
            style={{ 
              transform: animationPhase === 1 ? 'translateY(-6px)' : 'translateY(0)',
              opacity: animationPhase === 1 ? 1 : 0.5
            }}
          />
          <div 
            className="w-2.5 h-2.5 bg-gray-400 rounded-full transition-all duration-300 ease-in-out" 
            style={{ 
              transform: animationPhase === 2 ? 'translateY(-6px)' : 'translateY(0)',
              opacity: animationPhase === 2 ? 1 : 0.5
            }}
          />
        </div>
      </div>
    </div>
  );
}
