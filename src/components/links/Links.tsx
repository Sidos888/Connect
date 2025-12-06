"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { LinksService, UserLink } from "@/lib/linksService";
import LinkCard from "./LinkCard";

/**
 * Links - Component for displaying user links
 * Used by both mobile route and web modal
 * @param userId - Optional userId to load links for. If not provided, loads links for current user.
 */
export default function Links({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Use provided userId or fall back to current user's id
  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const loadLinks = async () => {
      const linksService = new LinksService();
      const { links: userLinks, error } = await linksService.getUserLinks(targetUserId);
      
      if (error) {
        console.error('Error loading links:', error);
      } else {
        setLinks(userLinks);
      }
      
      setLoading(false);
    };

    loadLinks();
  }, [targetUserId]);

  const handleCopy = async (handle: string) => {
    try {
      await navigator.clipboard.writeText(handle);
      // TODO: Show toast notification
      console.log('Copied to clipboard:', handle);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div 
        className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" 
        style={{ 
          paddingTop: 'var(--saved-content-padding-top, 104px)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 scrollbar-hide" 
      style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <div className="space-y-4 max-w-screen-sm mx-auto">
        {links.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500 text-sm">No links yet</p>
          </div>
        ) : (
          links.map((link) => (
            <LinkCard
              key={link.id}
              id={link.id}
              type={link.type}
              handle={link.handle || undefined}
              url={link.url || undefined}
              onCopy={handleCopy}
            />
          ))
        )}
      </div>
    </div>
  );
}

