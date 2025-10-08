"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Calendar, Cake } from "lucide-react";
import { useAuth } from "@/lib/authContext";

interface AboutMeViewProps {
  onBack: () => void;
  isPersonalProfile?: boolean;
  profileName?: string;
  profileDob?: string;
}

export default function AboutMeView({ 
  onBack, 
  isPersonalProfile = false, 
  profileName = "Me",
  profileDob 
}: AboutMeViewProps) {
  const { account } = useAuth();
  
  // Get current date
  const currentDate = new Date();
  const formattedCurrentDate = currentDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Format date of birth
  const formatDob = (dob: string | null | undefined) => {
    if (!dob) return "Not set";
    
    try {
      const date = new Date(dob);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const dob = isPersonalProfile ? account?.dob : profileDob;
  const displayName = isPersonalProfile ? "Me" : profileName;

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-0">
      {/* Header */}
      <div className="flex items-center justify-center relative w-full mb-8">
        <button
          onClick={onBack}
          className="absolute left-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 ring-brand"
          aria-label="Back"
        >
          <span className="back-btn-circle">
            <ArrowLeft size={20} className="text-gray-700" />
          </span>
        </button>
        <h2 className="text-xl font-semibold text-gray-900 text-center">
          About {displayName}
        </h2>
        <div className="w-9"></div> {/* Spacer for centering */}
      </div>

      {/* Birth Date Section */}
      <div className="flex items-center gap-4 mb-6">
        {/* Icon Circle */}
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Cake className="w-6 h-6 text-gray-600" />
        </div>
        
        {/* Information Card */}
        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-900 font-medium">Birth Date</span>
            <span className="text-gray-600">{formatDob(dob)}</span>
          </div>
        </div>
      </div>

      {/* Add Button (only for personal profile) */}
      {isPersonalProfile && (
        <div className="flex justify-center mb-6">
          <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 text-gray-900 font-medium">
              <Plus className="w-5 h-5" />
              <span>Add</span>
            </div>
          </button>
        </div>
      )}

      {/* Current Date Section */}
      <div className="flex items-center gap-4">
        {/* Icon Circle */}
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Calendar className="w-6 h-6 text-gray-600" />
        </div>
        
        {/* Information Card */}
        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-900 font-medium">Current Date</span>
            <span className="text-gray-600">{formattedCurrentDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
