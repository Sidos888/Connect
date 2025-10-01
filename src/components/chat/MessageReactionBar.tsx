"use client";

import { useState } from "react";

interface MessageReactionBarProps {
  onReactionSelect: (reaction: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

const REACTION_OPTIONS = [
  { emoji: "❤️", label: "Love" },
  { emoji: "👍", label: "Like" },
  { emoji: "👎", label: "Dislike" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "😮", label: "Surprised" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
];

export default function MessageReactionBar({ 
  onReactionSelect, 
  onClose, 
  isVisible 
}: MessageReactionBarProps) {
  const [showMore, setShowMore] = useState(false);

  if (!isVisible) return null;

  return (
    <div>
      {/* Main reaction bar - smaller and white */}
      <div className="bg-white border border-gray-200 rounded-full px-3 py-2 flex items-center gap-2 shadow-lg">
        {/* More reactions button - smaller */}
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Reaction emojis - smaller */}
        {REACTION_OPTIONS.map((reaction, index) => (
          <button
            key={index}
            onClick={() => onReactionSelect(reaction.emoji)}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            title={reaction.label}
          >
            <span className="text-lg">{reaction.emoji}</span>
          </button>
        ))}
      </div>

      {/* Extended reactions (if showMore is true) - smaller and white */}
      {showMore && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-full px-3 py-2 flex items-center gap-2 shadow-lg z-10">
          {/* Additional reactions can be added here */}
          <button
            onClick={() => onReactionSelect("🎉")}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="Celebrate"
          >
            <span className="text-lg">🎉</span>
          </button>
          <button
            onClick={() => onReactionSelect("🔥")}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="Fire"
          >
            <span className="text-lg">🔥</span>
          </button>
          <button
            onClick={() => onReactionSelect("💯")}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="100"
          >
            <span className="text-lg">💯</span>
          </button>
        </div>
      )}
    </div>
  );
}
