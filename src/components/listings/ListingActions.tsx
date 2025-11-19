"use client";

import { Edit, Trash2, Ticket, Share2, Bookmark, Users } from 'lucide-react';
import { Listing } from '@/lib/listingsService';

type UserRole = 'host' | 'participant' | 'viewer';

interface ListingActionsProps {
  listing: Listing;
  currentUserId: string | null;
  userRole: UserRole;
  onEdit?: () => void;
  onDelete?: () => void;
  onRegister?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onViewRegistrations?: () => void;
}

export default function ListingActions({
  listing,
  currentUserId,
  userRole,
  onEdit,
  onDelete,
  onRegister,
  onShare,
  onSave,
  onViewRegistrations
}: ListingActionsProps) {
  // Don't show actions if no user
  if (!currentUserId) return null;

  const buttonBaseClasses = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98]";
  
  const primaryButtonClasses = `${buttonBaseClasses} bg-orange-500 text-white hover:bg-orange-600`;
  const secondaryButtonClasses = `${buttonBaseClasses} bg-white text-gray-900 border border-gray-200 hover:bg-gray-50`;

  // Host actions
  if (userRole === 'host') {
    return (
      <div className="space-y-3 mt-6">
        {/* Primary action: Edit */}
        {onEdit && (
          <button
            onClick={onEdit}
            className={`${primaryButtonClasses} w-full`}
            style={{
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <Edit size={20} />
            <span>Edit Listing</span>
          </button>
        )}

        {/* Secondary actions row */}
        <div className="grid grid-cols-2 gap-3">
          {onViewRegistrations && (
            <button
              onClick={onViewRegistrations}
              className={secondaryButtonClasses}
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <Users size={18} />
              <span className="text-sm">Registrations</span>
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className={secondaryButtonClasses}
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <Share2 size={18} />
              <span className="text-sm">Share</span>
            </button>
          )}
        </div>

        {/* Delete action (danger) */}
        {onDelete && (
          <button
            onClick={onDelete}
            className={`${buttonBaseClasses} w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200`}
            style={{
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <Trash2 size={18} />
            <span>Delete Listing</span>
          </button>
        )}
      </div>
    );
  }

  // Participant actions
  if (userRole === 'participant') {
    return (
      <div className="space-y-3 mt-6">
        {/* Primary action: Register/Tickets */}
        {onRegister && (
          <button
            onClick={onRegister}
            className={`${primaryButtonClasses} w-full`}
            style={{
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <Ticket size={20} />
            <span>Get Tickets</span>
          </button>
        )}

        {/* Secondary actions row */}
        <div className="grid grid-cols-2 gap-3">
          {onShare && (
            <button
              onClick={onShare}
              className={secondaryButtonClasses}
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <Share2 size={18} />
              <span className="text-sm">Share</span>
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              className={secondaryButtonClasses}
              style={{
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              }}
            >
              <Bookmark size={18} />
              <span className="text-sm">Save</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Viewer actions (not host, not participant)
  return (
    <div className="space-y-3 mt-6">
      {/* Primary action: Register */}
      {onRegister && (
        <button
          onClick={onRegister}
          className={`${primaryButtonClasses} w-full`}
          style={{
            boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          }}
        >
          <Ticket size={20} />
          <span>Register</span>
        </button>
      )}

      {/* Secondary actions row */}
      <div className="grid grid-cols-2 gap-3">
        {onShare && (
          <button
            onClick={onShare}
            className={secondaryButtonClasses}
            style={{
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <Share2 size={18} />
            <span className="text-sm">Share</span>
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            className={secondaryButtonClasses}
            style={{
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
            }}
          >
            <Bookmark size={18} />
            <span className="text-sm">Save</span>
          </button>
        )}
      </div>
    </div>
  );
}

