"use client";

import { useAuth } from "@/lib/authContext";
import React from "react";
import Image from "next/image";

// Badge type definition
export type Badge = {
  id: number;
  title: string;
  date: string;
  icon: React.ReactNode;
  color: string;
};

// Get badges data - shared function
export function getBadges(account?: { createdAt?: string | null; created_at?: string | null } | null): Badge[] {
  if (!account) {
    return [
      { 
        id: 1, 
        title: 'Joined Connect', 
        date: '10 January 2025',
        icon: (
          <Image
            src="/connect-logo.png"
            alt="Connect"
            width={40}
            height={40}
            className="object-contain w-10 h-10"
            priority
          />
        ),
        color: 'bg-white'
      }
    ];
  }
  
  // Support both camelCase (profile) and snake_case (account) formats
  const createdDate = account.createdAt || account.created_at;
  const joinedDate = createdDate
    ? new Date(createdDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : '10 January 2025';
  
  return [
    { 
      id: 1, 
      title: 'Joined Connect', 
      date: joinedDate,
      icon: (
        <Image
          src="/connect-logo.png"
          alt="Connect"
          width={40}
          height={40}
          className="object-contain w-10 h-10"
          priority
        />
      ),
      color: 'bg-white' // White background for the badge
    }
  ];
}

// Badge Grid Component - shared component for both profile page and full page
export function BadgeGrid({ badges, columns = 3, onClick }: { badges: Badge[]; columns?: 2 | 3; onClick?: () => void }) {
  return (
    <div className={`grid gap-4 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {badges.map((badge) => (
        <button
          key={badge.id}
          onClick={onClick}
          className="flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
        >
          {/* Icon Circle - White badge with Connect logo */}
          <div 
            className={`w-16 h-16 ${badge.color} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
            }}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
              {badge.icon}
            </div>
          </div>
          
          {/* Title */}
          <h4 className="font-semibold text-gray-900 text-sm text-center leading-tight">
            {badge.title}
          </h4>
          
          {/* Date */}
          <span className="text-xs text-gray-500 text-center">
            {badge.date}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Badges - Unified component for Badges page
 * Used by both mobile route and web modal
 */
export default function Badges() {
  const { account } = useAuth();
  
  // Get badges data using shared function
  const badges = getBadges(account || undefined);

  return (
    <div 
      className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" 
      style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {/* Badges Grid - 3 columns like image 2 */}
      <BadgeGrid badges={badges} columns={3} />

      {/* Empty State (for when there are no badges) */}
      {badges.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-500 text-lg">You don't have any badges yet</p>
          </div>
        </div>
      )}
    </div>
  );
}


