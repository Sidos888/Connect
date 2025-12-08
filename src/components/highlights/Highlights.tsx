"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';

interface Highlight {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  location: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface HighlightsProps {
  userId?: string;
  onHighlightClick?: (highlight: Highlight) => void;
}

export default function Highlights({ userId, onHighlightClick }: HighlightsProps) {
  const searchParams = useSearchParams();
  const { account } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get userId from props, searchParams, or use current user
  const targetUserId = userId || searchParams?.get('userId') || account?.id;

  useEffect(() => {
    const loadHighlights = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase client not available');
        }

        const { data, error: fetchError } = await supabase
          .from('user_highlights')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setHighlights(data || []);
      } catch (err: any) {
        console.error('Error loading highlights:', err);
        setError(err.message || 'Failed to load highlights');
        setHighlights([]);
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();
  }, [targetUserId]);

  const handleHighlightClick = (highlight: Highlight) => {
    if (onHighlightClick) {
      onHighlightClick(highlight);
    } else {
      // Default: open in modal if no handler provided
      // This will be handled by parent component
      console.log('Highlight clicked:', highlight);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 px-8 pb-8 overflow-y-auto scrollbar-hide flex items-center justify-center" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        minHeight: '400px'
      }}>
        <div className="text-gray-400 text-sm">Loading highlights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-8 pb-8 overflow-y-auto scrollbar-hide flex items-center justify-center" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        minHeight: '400px'
      }}>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="flex-1 px-8 pb-8 overflow-y-auto scrollbar-hide flex items-center justify-center" style={{ 
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        minHeight: '400px'
      }}>
        <div className="text-gray-400 text-sm">No highlights yet</div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pb-8 overflow-y-auto scrollbar-hide" style={{ 
      paddingTop: 'var(--saved-content-padding-top, 104px)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* Grid of highlights */}
      <div className="grid grid-cols-4 gap-2">
        {highlights.map((highlight) => (
          <button
            key={highlight.id}
            onClick={() => handleHighlightClick(highlight)}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative transition-all duration-200 hover:opacity-90"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
            }}
          >
            {highlight.image_url ? (
              <img 
                src={highlight.image_url} 
                alt={highlight.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-xs">{highlight.title}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

