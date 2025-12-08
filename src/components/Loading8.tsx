"use client";

export default function Loading8() {
  return (
    <>
      <style>{`
        @keyframes loading8-wave {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
      <div className="flex items-center justify-center">
        <div className="flex space-x-2">
          <div 
            className="w-3 h-3 bg-black rounded-full"
            style={{
              animation: 'loading8-wave 1.4s ease-in-out infinite',
              animationDelay: '0s'
            }}
          />
          <div 
            className="w-3 h-3 bg-black rounded-full"
            style={{
              animation: 'loading8-wave 1.4s ease-in-out infinite',
              animationDelay: '0.2s'
            }}
          />
          <div 
            className="w-3 h-3 bg-black rounded-full"
            style={{
              animation: 'loading8-wave 1.4s ease-in-out infinite',
              animationDelay: '0.4s'
            }}
          />
        </div>
      </div>
    </>
  );
}

