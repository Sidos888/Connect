"use client";

import { Camera } from "lucide-react";

/**
 * Memories - Unified component for Memories page
 * Used by both mobile route and web modal
 */
export default function Memories() {
  // Mock memories data
  const memories = [
    { id: 1, title: 'Summer Beach Trip', description: 'Amazing sunset at Bondi Beach', date: 'Aug 2024', image: null },
    { id: 2, title: 'Coffee & Friends', description: 'Great meetup at The Coffee Club', date: 'Sep 2024', image: null },
    { id: 3, title: 'Weekend Hike', description: 'Conquered the Blue Mountains trail', date: 'Oct 2024', image: null },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* Memories Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Your Memories</h3>
        <div className="space-y-3">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{memory.title}</h4>
                  <p className="text-sm text-gray-600 mb-1">{memory.description}</p>
                  <span className="text-xs text-gray-400">{memory.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

