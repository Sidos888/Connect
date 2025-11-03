"use client";

export default function ThreeDotLoadingBounce() {
  return (
    <div 
      className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-5 py-3 shadow-sm"
      style={{ 
        backgroundColor: '#ffffff !important', 
        color: '#111827 !important',
        borderWidth: '0.4px',
        borderColor: '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
      }}
    >
      <div className="flex items-center justify-center gap-2" style={{ height: '24px' }}>
        <div className="flex space-x-2">
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }}
          />
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }}
          />
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
