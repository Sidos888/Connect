"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, Users } from 'lucide-react';
import { getDeviceCornerRadius } from '@/lib/deviceCornerRadius';
import { useAuth } from '@/lib/authContext';
import { useChatService } from '@/lib/chatProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Avatar from '@/components/Avatar';
import { SearchIcon } from '@/components/icons';
import type { Contact } from '@/lib/chat/newMessageFlow';

interface NewChatSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contactId: string) => void;
  onShowAddMembers?: () => void;
  hideBackdrop?: boolean;
  hideContainer?: boolean;
}

export default function NewChatSlideModal({
  isOpen,
  onClose,
  onSelectContact,
  onShowAddMembers,
  hideBackdrop = false,
  hideContainer = false,
}: NewChatSlideModalProps) {
  const { account } = useAuth();
  const chatService = useChatService();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<number>(45);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
      if (account?.id && chatService) {
        loadContacts();
      }
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
  }, [isOpen, account?.id, chatService]);

  // Detect device corner radius on mount
  useEffect(() => {
    getDeviceCornerRadius().then(radius => {
      setCornerRadius(radius);
    });
  }, []);

  // Load contacts
  const loadContacts = async () => {
    if (!account?.id) {
      setLoading(false);
      return;
    }

    // Don't load if chatService isn't ready yet
    if (!chatService) {
      setLoading(true);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (!user) {
        setError("Please log in to see your contacts");
        return;
      }
      
      if (!chatService) {
        setError("Chat service not available");
        return;
      }

      const { contacts: contactsList, error: contactsError } =
        await chatService.getContacts(user.id);

      if (contactsError) {
        console.error("Error loading contacts:", contactsError);
        setError("Failed to load contacts");
        return;
      }

      const contactsListFormatted: Contact[] = contactsList.map(
        (contact) => ({
          id: contact.id,
          name: contact.name,
          profile_pic: contact.profile_pic,
          type: "person" as const,
        })
      );

      setContacts(contactsListFormatted);
    } catch (err) {
      console.error("Error loading contacts:", err);
      setError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  // Reset search query when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Hide bottom nav and prevent body scrolling when modal is open
  useEffect(() => {
    if (!shouldRender || hideContainer) return;

    const hideBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
        (bottomNav as HTMLElement).style.visibility = 'hidden';
        (bottomNav as HTMLElement).style.opacity = '0';
        (bottomNav as HTMLElement).style.transform = 'translateY(100%)';
      }
      document.body.style.paddingBottom = '0';
    };

    const showBottomNav = () => {
      const bottomNav = document.querySelector('[data-testid="mobile-bottom-nav"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
        (bottomNav as HTMLElement).style.visibility = '';
        (bottomNav as HTMLElement).style.opacity = '';
        (bottomNav as HTMLElement).style.transform = '';
      }
      document.body.style.paddingBottom = '';
    };

    // Prevent background scrolling
    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;

    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    html.style.overflow = 'hidden';
    
    hideBottomNav();

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      html.style.overflow = previousHtmlOverflow;
      showBottomNav();
    };
  }, [shouldRender, hideContainer]);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.connectId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  if (!shouldRender && !hideContainer) return null;

  const handleClose = () => {
    if (!hideContainer) {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      onClose();
    }
  };

  const content = (
    <div className="h-full flex flex-col">
      {/* Header - Matching create listing page positioning exactly */}
      <div className="px-4" style={{ 
        paddingTop: 'max(env(safe-area-inset-top), 70px)',
        paddingBottom: '16px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Inner container matching PageHeader structure */}
        <div className="relative w-full" style={{ 
          width: '100%', 
          minHeight: '44px',
          pointerEvents: 'auto'
        }}>
          {/* Right: X Button */}
          <div className="absolute right-0 flex items-center gap-3" style={{ 
            top: '0', 
            height: '44px' 
          }}>
            <button
              onClick={handleClose}
              className="flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                borderWidth: '0.4px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                willChange: 'transform, box-shadow'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }}
            >
              <X size={18} className="text-gray-900" strokeWidth={2.5} />
            </button>
          </div>
          
          {/* Center: Title */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ 
            top: '0', 
            height: '44px', 
            justifyContent: 'center' 
          }}>
            <h2 className="font-semibold text-gray-900 text-center" style={{ 
              fontSize: '22px',
              lineHeight: '28px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              New Chat
            </h2>
          </div>
        </div>
      </div>

        {/* Search Bar */}
        <div className="flex-shrink-0" style={{ padding: '24px 16px 16px 16px' }}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full focus:outline-none"
              style={{
                borderRadius: "100px",
                height: "46.5px",
                background: "rgba(255, 255, 255, 0.9)",
                borderWidth: "0.4px",
                borderColor: "#E5E7EB",
                borderStyle: "solid",
                boxShadow:
                  "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)",
                willChange: "transform, box-shadow",
                paddingLeft: "48px",
                paddingRight: "24px",
                fontSize: "16px",
                WebkitAppearance: "none",
                WebkitTapHighlightColor: "transparent",
                color: "#111827",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)";
              }}
            />
            <div
              className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none"
              style={{ width: "48px" }}
            >
              <SearchIcon
                size={20}
                className="text-gray-900"
                style={{ strokeWidth: 2.5 }}
              />
            </div>
          </div>
        </div>

        {/* New Group Card */}
        <div className="flex-shrink-0" style={{ padding: '0 16px 24px 16px' }}>
          <button
            onClick={() => {
              if (onShowAddMembers) {
                onShowAddMembers();
              }
            }}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-3 text-left transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
            style={{
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              minHeight: '72px',
              cursor: 'pointer',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
            }}
          >
            {/* Group Icon */}
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '40px', height: '40px' }}>
              <Users size={20} className="text-gray-900" />
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-gray-900">
                New Group
              </div>
            </div>
          </button>
        </div>

        {/* Contacts List */}
        <div className="flex-1 flex flex-col overflow-y-auto" style={{ padding: '0 16px 24px 16px' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500">Loading contacts...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500">
                {searchQuery ? "No contacts found" : "No contacts yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onSelectContact(contact.id)}
                  className="w-full bg-white rounded-xl p-4 flex items-center gap-3 text-left transition-all duration-200 hover:-translate-y-[1px] focus:outline-none"
                  style={{
                    borderWidth: '0.4px',
                    borderColor: '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
                    minHeight: '72px',
                    cursor: 'pointer',
                    willChange: 'transform, box-shadow'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
                  }}
                >
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <Avatar
                      src={contact.profile_pic}
                      name={contact.name}
                      size={40}
                    />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">
                      {contact.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
    </div>
  );

  if (hideBackdrop && hideContainer) {
    return content;
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden"
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      {!hideBackdrop && (
        <div 
          className="absolute inset-0 transition-opacity duration-300 ease-out"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            opacity: isVisible ? 1 : 0
          }}
          onClick={handleClose}
        />
      )}
      
      {/* Modal - Almost Full Page */}
      <div 
        className="relative bg-white overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: '100%',
          height: '92vh',
          height: '92dvh',
          marginTop: '20px',
          marginBottom: '0px',
          borderTopLeftRadius: `${cornerRadius}px`,
          borderTopRightRadius: `${cornerRadius}px`,
          borderBottomLeftRadius: `${cornerRadius}px`,
          borderBottomRightRadius: `${cornerRadius}px`,
          borderWidth: '0.4px',
          borderColor: '#E5E7EB',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {content}
      </div>
    </div>
  );
}
