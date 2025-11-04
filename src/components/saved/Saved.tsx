"use client";

import { Heart, MapPin, Calendar, Users, Bookmark, Star } from "lucide-react";
import Avatar from "@/components/Avatar";

/**
 * Saved - Unified component for Saved page
 * Used by both mobile route and web modal
 */
export default function Saved() {
  // Mock saved items data
  const savedEvents = [
    { id: 1, title: "Sunset Yoga Session", type: "event", location: "Bondi Beach", date: "Dec 15", attendees: 24 },
    { id: 2, title: "Coffee & Code Meetup", type: "event", location: "Sydney CBD", date: "Dec 18", attendees: 12 },
    { id: 3, title: "Beach Volleyball Tournament", type: "event", location: "Manly Beach", date: "Dec 20", attendees: 48 },
  ];

  const savedVenues = [
    { id: 1, name: "The Coffee Club", category: "Cafe", rating: 4.5 },
    { id: 2, name: "Fitness First Gym", category: "Fitness", rating: 4.8 },
  ];

  const savedPeople = [
    { id: 1, name: "Sarah Chen", bio: "Yoga instructor & wellness coach" },
    { id: 2, name: "Mike Johnson", bio: "Coffee enthusiast & developer" },
    { id: 3, name: "Emma Wilson", bio: "Beach volleyball player" },
  ];

  return (
    <div 
      className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide" 
      style={{ 
        paddingTop: '96px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {/* Saved Events Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Saved Events</h3>
        <div className="space-y-3">
          {savedEvents.map((event) => (
            <div
              key={event.id}
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
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees}</span>
                    </div>
                  </div>
                </div>
                <button className="flex-shrink-0 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Heart className="w-5 h-5 text-orange-600 fill-orange-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Venues Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Saved Venues</h3>
        <div className="space-y-3">
          {savedVenues.map((venue) => (
            <div
              key={venue.id}
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
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{venue.name}</h4>
                  <p className="text-sm text-gray-500">{venue.category}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">{venue.rating}</span>
                  </div>
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <Bookmark className="w-5 h-5 text-orange-600 fill-orange-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved People Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">Saved People</h3>
        <div className="space-y-3">
          {savedPeople.map((person) => (
            <div
              key={person.id}
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
              <div className="flex items-center gap-3">
                <Avatar
                  src={null}
                  name={person.name}
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{person.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{person.bio}</p>
                </div>
                <button className="flex-shrink-0 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

