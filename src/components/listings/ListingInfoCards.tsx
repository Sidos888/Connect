"use client";

import { Users, MapPin } from 'lucide-react';
import Avatar from '@/components/Avatar';

interface ListingInfoCardsProps {
  capacity?: number | null;
  capacityUnlimited?: boolean;
  location?: string | null;
  host?: {
    id: string;
    name: string;
    profile_pic?: string | null;
  } | null;
  userRole?: 'host' | 'participant' | 'viewer';
  onLocationClick?: () => void;
  onHostClick?: () => void;
  onViewingClick?: () => void;
}

export default function ListingInfoCards({
  capacity,
  capacityUnlimited = false,
  location,
  host,
  userRole = 'viewer',
  onLocationClick,
  onHostClick,
  onViewingClick
}: ListingInfoCardsProps) {
  const cardStyle = {
    borderWidth: '0.4px' as const,
    borderColor: '#E5E7EB',
    borderStyle: 'solid' as const,
    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
    minHeight: '72px',
  };

  return (
    <div className="space-y-3">
      {/* Me: Viewing/Host Card */}
      <div 
        className="bg-white rounded-xl p-4 flex items-center gap-3"
        onClick={onViewingClick}
        role={onViewingClick ? "button" : undefined}
        tabIndex={onViewingClick ? 0 : undefined}
        style={{ ...cardStyle, cursor: onViewingClick ? 'pointer' : 'default' }}
      >
        <div className="flex-shrink-0">
          <Users size={20} className="text-gray-900" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-gray-900 mb-1 truncate">
            {userRole === 'host' ? 'Me: Hosting' : 'Me: Viewing'}
          </div>
          <div className="text-sm font-normal text-gray-500 truncate">
            {capacityUnlimited ? 'Unlimited' : (capacity ? `${capacity}` : 'Unlimited')} attendees • Tap to view more
          </div>
        </div>
      </div>

      {/* Event Location Card - only show if location exists */}
      {location && location.trim() && (
        <div 
          className="bg-white rounded-xl p-4 flex items-center gap-3"
          onClick={onLocationClick}
          role={onLocationClick ? "button" : undefined}
          tabIndex={onLocationClick ? 0 : undefined}
          style={{ ...cardStyle, cursor: onLocationClick ? 'pointer' : 'default' }}
        >
          <div className="flex-shrink-0">
            <MapPin size={20} className="text-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900 mb-1 truncate">
              {location}
            </div>
            <div className="text-sm font-normal text-gray-500 truncate">
              Tap to view maps
            </div>
          </div>
        </div>
      )}

      {/* Host Card */}
      {host && (
        <div 
          className="bg-white rounded-xl p-4 flex items-center gap-3"
          onClick={onHostClick}
          role={onHostClick ? "button" : undefined}
          tabIndex={onHostClick ? 0 : undefined}
          style={{ ...cardStyle, cursor: onHostClick ? 'pointer' : 'default' }}
        >
          <div className="flex-shrink-0">
            <Avatar
              src={host.profile_pic || undefined}
              name={host.name}
              size={40}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900 mb-1 truncate">
              {host.name}
            </div>
            <div className="text-sm font-normal text-gray-500 truncate">
              Host • Tap to view profile
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

