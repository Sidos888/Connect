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
  itinerary?: any[] | null;
  userRole?: 'host' | 'participant' | 'viewer';
  isCurrentUserParticipant?: boolean; // Whether current user is registered as participant
  attendeeCount?: number | null; // Total number of attendees including host
  onLocationClick?: () => void;
  onHostClick?: () => void;
  onViewingClick?: () => void;
  onItineraryClick?: () => void;
}

export default function ListingInfoCards({
  capacity,
  capacityUnlimited = false,
  location,
  host,
  itinerary,
  userRole = 'viewer',
  isCurrentUserParticipant = false,
  attendeeCount,
  onLocationClick,
  onHostClick,
  onViewingClick,
  onItineraryClick
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
            {userRole === 'host' ? 'Me: Hosting' : (isCurrentUserParticipant ? 'Me: Attending' : 'Me: Viewing')}
          </div>
          {attendeeCount !== null && attendeeCount !== undefined ? (
            <div className="text-sm font-normal text-gray-500 truncate">
              {attendeeCount} {attendeeCount === 1 ? 'Participant' : 'Participants'} • Tap to view
            </div>
          ) : null}
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

      {/* Itinerary Section */}
      {itinerary && itinerary.length > 0 && (
        <div 
          className="bg-white rounded-xl p-4 cursor-pointer"
          onClick={onItineraryClick}
          style={cardStyle}
        >
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-900">Itinerary</h3>
            <p className="text-sm text-gray-500 mt-0.5">View</p>
          </div>
          
          <div className="space-y-2">
            {itinerary.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-white transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  borderWidth: '0.4px',
                  borderColor: '#E5E7EB',
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                  willChange: 'transform, box-shadow',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                }}
              >
                {/* Image - Small square */}
                <div
                  className="flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden"
                  style={{ width: '44px', height: '44px' }}
                >
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                
                {/* Title - Center, bold */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                </div>
                
                {/* Date/Time - Right side */}
                <div className="flex-shrink-0 text-xs font-medium text-gray-500">
                  {item.startDate && new Date(item.startDate).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

