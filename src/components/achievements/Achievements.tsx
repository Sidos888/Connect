"use client";

import { Trophy } from "lucide-react";

/**
 * Achievements - Unified component for Achievements page
 * Used by both mobile route and web modal
 */
export default function Achievements() {
  // Mock achievements data
  const achievements = [
    { id: 1, title: 'Early Adopter', description: 'Joined Connect in the first month', date: 'Nov 2024', icon: '🎯', color: 'from-blue-400 to-blue-600' },
    { id: 2, title: 'Social Butterfly', description: 'Connected with 10 people', date: 'Nov 2024', icon: '🦋', color: 'from-purple-400 to-purple-600' },
    { id: 3, title: 'Event Master', description: 'Created your first event', date: 'Nov 2024', icon: '🎉', color: 'from-green-400 to-green-600' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* Achievements Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Your Achievements</h3>
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
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
                <div className={`w-12 h-12 bg-gradient-to-br ${achievement.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl">{achievement.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                  <p className="text-sm text-gray-600 mb-1">{achievement.description}</p>
                  <span className="text-xs text-gray-400">{achievement.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State (for when there are no achievements) */}
      {achievements.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-500 text-lg">You don't have any achievements yet</p>
          </div>
        </div>
      )}
    </div>
  );
}

