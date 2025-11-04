"use client";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      {/* Connect text in top third */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <h1 className="text-4xl font-bold text-orange-600">Connect</h1>
      </div>
      
      {/* Bouncing dots card in bottom third */}
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2">
        <div 
          className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-5 py-3 shadow-sm"
          style={{ 
            backgroundColor: '#ffffff', 
            color: '#111827',
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
      </div>
    </div>
  );
}
