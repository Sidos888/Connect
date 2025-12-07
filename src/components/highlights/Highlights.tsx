"use client";

export default function Highlights() {
  return (
    <div className="flex-1 px-8 pb-8 overflow-y-auto scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* Content will be added here */}
    </div>
  );
}

