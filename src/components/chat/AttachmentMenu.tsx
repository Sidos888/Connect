"use client";

import { useState } from "react";
import { FileText, Camera, User, Calendar, Sparkles } from "lucide-react";

interface AttachmentMenuProps {
  onClose: () => void;
  onSelectFile: () => void;
  onSelectPhotos: () => void;
  onSelectContact: () => void;
  onSelectEvent: () => void;
  onSelectAI: () => void;
}

export default function AttachmentMenu({ 
  onClose, 
  onSelectFile, 
  onSelectPhotos, 
  onSelectContact, 
  onSelectEvent, 
  onSelectAI 
}: AttachmentMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    {
      id: "photos",
      icon: <Camera size={20} className="text-gray-600" />,
      label: "Photos & Videos",
      onClick: onSelectPhotos,
    },
    {
      id: "file",
      icon: <FileText size={20} className="text-gray-600" />,
      label: "Files",
      onClick: onSelectFile,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Small card positioned above + button */}
      <div 
        className="absolute bottom-16 left-6 z-50 bg-white rounded-xl p-3 shadow-lg"
        style={{
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
        }}
      >
        {/* Menu items */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                hoveredItem === item.id 
                  ? 'bg-gray-50' 
                  : 'bg-transparent hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className="text-gray-900 font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
