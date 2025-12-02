"use client";

import React, { useEffect, useState, useRef } from 'react';
import { X, Minus } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useChatService } from '@/lib/chatProvider';
import { useAuth } from '@/lib/authContext';

interface ReactionWithUser {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
  user_profile_pic?: string | null;
  created_at: string;
}

interface ReactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  reactions: Array<{
    id: string;
    emoji: string;
    user_id: string;
    created_at: string;
  }>;
  onReactionRemoved?: () => void; // Callback to refresh messages
}

export default function ReactionsModal({ isOpen, onClose, messageId, reactions, onReactionRemoved }: ReactionsModalProps) {
  const [reactionsWithUsers, setReactionsWithUsers] = useState<ReactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const chatService = useChatService();
  const { account } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Get current auth user ID
  useEffect(() => {
    const getCurrentUserId = async () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      }
    };
    if (isOpen) {
      getCurrentUserId();
    }
  }, [isOpen]);

  // Preserve scroll position when opening
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const container = document.querySelector('.chat-messages-container') as HTMLElement;
      if (container) {
        scrollPositionRef.current = container.scrollTop;
      }
    }
  }, [isOpen]);

  // Restore scroll position when closing
  useEffect(() => {
    if (!isOpen) {
      // Restore scroll position after a brief delay to ensure DOM is ready
      setTimeout(() => {
        const container = document.querySelector('.chat-messages-container') as HTMLElement;
        if (container) {
          container.scrollTop = scrollPositionRef.current;
        }
      }, 50);
    }
  }, [isOpen]);

  // Fetch user details for reactions - also refresh when reactions prop changes
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return;
    }

    if (reactions.length === 0) {
      setReactionsWithUsers([]);
      setLoading(false);
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Get unique user IDs
        const userIds = [...new Set(reactions.map(r => r.user_id))];
        
        // Fetch user details
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, name, profile_pic')
          .in('id', userIds);

        if (accounts) {
          const userMap = new Map(accounts.map(acc => [acc.id, acc]));
          
          const reactionsWithUserInfo: ReactionWithUser[] = reactions.map(reaction => {
            const user = userMap.get(reaction.user_id);
            return {
              id: reaction.id,
              emoji: reaction.emoji,
              user_id: reaction.user_id,
              user_name: user?.name || 'Unknown User',
              user_profile_pic: user?.profile_pic || null,
              created_at: reaction.created_at
            };
          });

          // Sort by created_at (oldest first)
          reactionsWithUserInfo.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          setReactionsWithUsers(reactionsWithUserInfo);
        }
      } catch (error) {
        console.error('Error fetching reaction user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [isOpen, reactions.length, reactions.map(r => r.id).join(',')]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleRemoveReaction = async (emoji: string) => {
    if (!chatService) {
      console.error('ChatService not available');
      return;
    }

    const { error } = await chatService.removeReaction(messageId, emoji);
    if (error) {
      console.error('Error removing reaction:', error);
      return;
    }

    // Remove from local state
    setReactionsWithUsers(prev => prev.filter(r => !(r.user_id === currentUserId && r.emoji === emoji)));
    
    // Notify parent to refresh messages (real-time subscription will handle it, but this ensures immediate update)
    if (onReactionRemoved) {
      onReactionRemoved();
    }
    
    // If no reactions left, close modal
    const remaining = reactionsWithUsers.filter(r => !(r.user_id === currentUserId && r.emoji === emoji));
    if (remaining.length === 0) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Group reactions by emoji
  const reactionsByEmoji = new Map<string, ReactionWithUser[]>();
  reactionsWithUsers.forEach(reaction => {
    const existing = reactionsByEmoji.get(reaction.emoji);
    if (existing) {
      existing.push(reaction);
    } else {
      reactionsByEmoji.set(reaction.emoji, [reaction]);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Dimming overlay */}
      <div
        className="fixed inset-0 transition-opacity duration-300 ease-in-out"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 1 }}
        onClick={onClose}
      />
      
      {/* Modal content - slides up from bottom */}
      <div
        ref={modalRef}
        className="bg-white w-full max-w-[680px] max-h-[80vh] overflow-hidden flex flex-col transform transition-all duration-300 ease-out relative reactions-modal"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 12px rgba(0,0,0,0.12)'
        }}
      >
        {/* Header */}
        <div className="px-4 pt-6 pb-4 relative">
          <div className="flex items-center justify-center">
            <h2 className="text-lg font-semibold text-gray-900 text-center" style={{ textAlign: 'center', width: '100%', display: 'block' }}>
              Reactions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-6 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : reactionsByEmoji.size === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">No reactions</div>
            </div>
          ) : (
            <div className="py-2">
              {Array.from(reactionsByEmoji.entries()).map(([emoji, emojiReactions]) => (
                <div key={emoji} className="mb-4">
                  {emojiReactions.map((reaction) => {
                    const isOwnReaction = reaction.user_id === currentUserId;
                    return (
                      <div
                        key={reaction.id}
                        className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors"
                      >
                        {/* Profile picture */}
                        <div className="w-10 h-10 flex-shrink-0 mr-3" style={{ position: 'relative', zIndex: 1 }}>
                          <Avatar
                            name={reaction.user_name}
                            src={reaction.user_profile_pic || undefined}
                            size={40}
                            className="w-full h-full"
                          />
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {reaction.user_name}
                          </div>
                        </div>

                        {/* Remove button (only for own reactions) */}
                        {isOwnReaction && (
                          <button
                            onClick={() => handleRemoveReaction(reaction.emoji)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors mr-2"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                        )}

                        {/* Reaction emoji pill */}
                        <div
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs flex-shrink-0"
                          style={{
                            backgroundColor: '#ffffff',
                            borderWidth: '0.4px',
                            borderColor: '#E5E7EB',
                            borderStyle: 'solid',
                            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                            borderRadius: '100px',
                            fontSize: '14px',
                            lineHeight: '1.2'
                          }}
                        >
                          <span>{reaction.emoji}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

