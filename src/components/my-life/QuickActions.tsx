"use client";

import Button from "@/components/Button";
import { CalendarIcon, PlusIcon } from "@/components/icons";

type Props = {
  onCreate?: () => void;
  onCalendar?: () => void;
};

export default function QuickActions({ onCreate, onCalendar }: Props) {
  return (
    <div className="flex justify-center gap-6">
      {/* Calendar Button - Circular Card Design */}
      <button
        onClick={onCalendar}
        className="flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 hover:scale-105"
      >
        <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center hover:shadow-md hover:border-gray-300 transition-all duration-200">
          <CalendarIcon width={24} height={24} className="text-gray-600" />
        </div>
        <span className="text-xs font-medium text-gray-700">Calendar</span>
      </button>

      {/* Create Button - Circular Card Design */}
      <button
        onClick={onCreate}
        className="flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 hover:scale-105"
      >
        <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center hover:shadow-md hover:border-gray-300 transition-all duration-200">
          <PlusIcon width={24} height={24} className="text-gray-600" />
        </div>
        <span className="text-xs font-medium text-gray-700">Create</span>
      </button>
    </div>
  );
}


