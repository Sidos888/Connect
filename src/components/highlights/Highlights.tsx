"use client";

import * as React from "react";
import { useState } from "react";
import AttachmentMenu from "@/components/chat/AttachmentMenu";

export default function Highlights() {
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  return (
    <div className="flex-1 px-4 pb-8 overflow-y-auto scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      <div className="space-y-4 max-w-screen-sm mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg mb-8">No highlights yet</p>
          
          {/* Reference: AttachmentMenu Demo */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-400">Future Reference: AttachmentMenu Component</p>
            
            <div className="relative">
              {/* Demo + button */}
              <button
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors border-[0.4px] border-[#E5E7EB] bg-white text-gray-600 hover:bg-gray-50 cursor-pointer"
                style={{
                  boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                }}
                title="Show Attachment Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>

              {/* AttachmentMenu Component */}
              {showAttachmentMenu && (
                <AttachmentMenu
                  onClose={() => setShowAttachmentMenu(false)}
                  onSelectFile={() => {
                    console.log('File selected');
                    setShowAttachmentMenu(false);
                  }}
                  onSelectPhotos={() => {
                    console.log('Photos selected');
                    setShowAttachmentMenu(false);
                  }}
                  onSelectContact={() => {
                    console.log('Contact selected');
                    setShowAttachmentMenu(false);
                  }}
                  onSelectEvent={() => {
                    console.log('Event selected');
                    setShowAttachmentMenu(false);
                  }}
                  onSelectAI={() => {
                    console.log('AI selected');
                    setShowAttachmentMenu(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

