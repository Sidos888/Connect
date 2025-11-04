"use client";

import { Bell } from "lucide-react";

/**
 * Notifications - Unified component for Notifications page
 * Used by both mobile route and web modal
 */
export default function Notifications() {
  // Mock notifications data
  const notifications = [
    { id: 1, type: 'event', title: 'New event invitation', message: 'Sarah invited you to Sunset Yoga Session', time: '5m ago', unread: true },
    { id: 2, type: 'connection', title: 'New connection', message: 'Mike Johnson accepted your friend request', time: '1h ago', unread: true },
    { id: 3, type: 'update', title: 'Event update', message: 'Beach Volleyball Tournament time changed', time: '3h ago', unread: false },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* Notifications Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Recent</h3>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
              style={{
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow',
                backgroundColor: notification.unread ? 'rgba(255, 102, 0, 0.02)' : 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                  <span className="text-xs text-gray-400">{notification.time}</span>
                </div>
                {notification.unread && (
                  <div className="flex-shrink-0 w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

