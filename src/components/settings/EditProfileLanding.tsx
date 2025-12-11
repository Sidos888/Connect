"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/authContext";
import { formatNameForDisplay } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import { PageHeader } from "@/components/layout/PageSystem";
import { Check, Mail, Phone, Instagram, MessageCircle, Globe, Camera, Twitter, Facebook, Linkedin, MoreHorizontal, GraduationCap, Briefcase, Heart, Home, Sparkles, Calendar, UserCheck, Cake } from "lucide-react";
import { LinksService, UserLink } from "@/lib/linksService";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function EditProfileLanding({
  name,
  avatarUrl,
  onBack,
  onOpenLinks,
  onOpenPersonalDetails,
  onOpenTimeline,
  onOpenHighlights,
  backIcon = 'arrow'
}: {
  name?: string;
  avatarUrl?: string;
  onBack: () => void;
  onOpenLinks: () => void;
  onOpenPersonalDetails: () => void;
  onOpenTimeline: () => void;
  onOpenHighlights: () => void;
  backIcon?: 'arrow' | 'close';
}) {
  const { account, updateProfile, uploadAvatar } = useAuth();
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Links state
  const [links, setLinks] = useState<UserLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  
  // Timeline/Moments state
  const [momentsCount, setMomentsCount] = useState(0);
  const [momentsCategories, setMomentsCategories] = useState<string[]>([]);
  const [momentsLoading, setMomentsLoading] = useState(true);
  
  // Highlights state
  const [highlights, setHighlights] = useState<any[]>([]);
  const [highlightsCount, setHighlightsCount] = useState(0);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  
  // Icon mapping for timeline categories (same as ProfilePage)
  const categoryIcons: Record<string, React.ReactNode> = {
    'education': <GraduationCap size={16} className="text-gray-900" strokeWidth={2.5} />,
    'career': <Briefcase size={16} className="text-gray-900" strokeWidth={2.5} />,
    'relationships': <Heart size={16} className="text-gray-900" strokeWidth={2.5} />,
    'life-changes': <Home size={16} className="text-gray-900" strokeWidth={2.5} />,
    'experiences': <Sparkles size={16} className="text-gray-900" strokeWidth={2.5} />,
  };
  
  // Default timeline components icons
  const defaultTimelineIcons: Record<string, React.ReactNode> = {
    'today': <Calendar size={16} className="text-gray-900" strokeWidth={2.5} />,
    'born': <Cake size={16} className="text-gray-900" strokeWidth={2.5} />,
    'joined-connect': <UserCheck size={16} className="text-gray-900" strokeWidth={2.5} />,
  };
  
  // Change detection
  const [hasChanges, setHasChanges] = useState(false);
  
  // Floating label states
  const [nameFocused, setNameFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);
  
  const nameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Icon mapping for link types (same as LinkCard)
  const linkIcons: Record<string, React.ReactNode> = {
    'email': <Mail size={16} className="text-gray-900" strokeWidth={2.5} />,
    'phone': <Phone size={16} className="text-gray-900" strokeWidth={2.5} />,
    'instagram': <Instagram size={16} className="text-gray-900" strokeWidth={2.5} />,
    'whatsapp': <MessageCircle size={16} className="text-gray-900" strokeWidth={2.5} />,
    'website': <Globe size={16} className="text-gray-900" strokeWidth={2.5} />,
    'snapchat': <Camera size={16} className="text-gray-900" strokeWidth={2.5} />,
    'x': <Twitter size={16} className="text-gray-900" strokeWidth={2.5} />,
    'facebook': <Facebook size={16} className="text-gray-900" strokeWidth={2.5} />,
    'linkedin': <Linkedin size={16} className="text-gray-900" strokeWidth={2.5} />,
    'other': <MoreHorizontal size={16} className="text-gray-900" strokeWidth={2.5} />,
  };
  
  // Load initial data
  useEffect(() => {
    if (account) {
      setFullName(account.name || "");
      setBio(account.bio || "");
      setPreviewUrl(account.profile_pic || "");
    }
  }, [account]);
  
  // Load user links
  useEffect(() => {
    const loadLinks = async () => {
      if (!account?.id) {
        setLinksLoading(false);
        return;
      }
      
      setLinksLoading(true);
      const linksService = new LinksService();
      const { links: userLinks, error } = await linksService.getUserLinks(account.id);
      
      if (error) {
        console.error('Error loading links:', error);
      } else {
        setLinks(userLinks);
      }
      
      setLinksLoading(false);
    };
    
    loadLinks();
  }, [account?.id]);
  
  // Load user moments/timeline
  useEffect(() => {
    const loadMoments = async () => {
      if (!account?.id) {
        setMomentsLoading(false);
        return;
      }
      
      setMomentsLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setMomentsLoading(false);
          return;
        }
        
        const { data, error, count } = await supabase
          .from('user_moments')
          .select('category', { count: 'exact' })
          .eq('user_id', account.id);
        
        if (error) {
          console.error('Error loading moments:', error);
        } else {
          // Calculate total count including default components
          let totalCount = count || 0;
          
          // Always count "today"
          totalCount += 1;
          
          // Count "born" if DOB exists
          if (account.dob) {
            totalCount += 1;
          }
          
          // Count "joined-connect" if account has createdAt
          if (account.created_at) {
            totalCount += 1;
          }
          
          setMomentsCount(totalCount);
          
          // Get unique categories from moments (for icons)
          const uniqueCategories = Array.from(new Set((data || []).map(m => m.category).filter(Boolean)));
          
          // Add default timeline components to the list for icon display
          const defaultComponents: string[] = [];
          defaultComponents.push('today'); // Always show today
          if (account.dob) {
            defaultComponents.push('born');
          }
          if (account.created_at) {
            defaultComponents.push('joined-connect');
          }
          
          // Combine default components with categories (defaults first, then categories)
          setMomentsCategories([...defaultComponents, ...uniqueCategories]);
        }
      } catch (error) {
        console.error('Error in loadMoments:', error);
      }
      
      setMomentsLoading(false);
    };
    
    loadMoments();
  }, [account?.id, account?.dob, account?.created_at]);
  
  // Load user highlights
  useEffect(() => {
    const loadHighlights = async () => {
      if (!account?.id) {
        setHighlightsLoading(false);
        return;
      }
      
      setHighlightsLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setHighlightsLoading(false);
          return;
        }
        
        const { data, error, count } = await supabase
          .from('user_highlights')
          .select('id, image_url, photo_urls', { count: 'exact' })
          .eq('user_id', account.id)
          .order('created_at', { ascending: false })
          .limit(5); // Only need first 5 for preview
        
        if (error) {
          console.error('Error loading highlights:', error);
        } else {
          // Set total count
          if (count !== null) {
            setHighlightsCount(count);
          }
          
          // Process highlights to get first image for each
          const processedHighlights = (data || []).map((highlight: any) => {
            // Get first photo - prefer photo_urls array, fallback to image_url
            const photos = highlight.photo_urls && Array.isArray(highlight.photo_urls) && highlight.photo_urls.length > 0
              ? highlight.photo_urls
              : highlight.image_url
                ? [highlight.image_url]
                : [];
            
            return {
              id: highlight.id,
              firstImage: photos[0] || null
            };
          });
          
          setHighlights(processedHighlights);
        }
      } catch (error) {
        console.error('Error in loadHighlights:', error);
      }
      
      setHighlightsLoading(false);
    };
    
    loadHighlights();
  }, [account?.id]);
  
  // Detect changes
  useEffect(() => {
    const nameChanged = fullName.trim() !== (account?.name || "");
    const bioChanged = bio !== (account?.bio || "");
    const photoChanged = !!avatarFile;
    
    setHasChanges(nameChanged || bioChanged || photoChanged);
  }, [fullName, bio, avatarFile, account]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!account?.id || !hasChanges) return;
    
    setLoading(true);
    try {
      // Upload avatar if changed
      let finalAvatarUrl = previewUrl;
      if (avatarFile && uploadAvatar) {
        const { url, error: uploadError } = await uploadAvatar(avatarFile);
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          alert('Failed to upload profile picture');
          setLoading(false);
          return;
        }
        finalAvatarUrl = url || previewUrl;
      }

      // Update profile (always private)
      const { error } = await updateProfile({
        name: formatNameForDisplay(fullName.trim()),
        bio: bio.trim(),
        profile_pic: finalAvatarUrl,
        profile_visibility: 'private',
      });

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
      } else {
        // Reset change detection
        setAvatarFile(null);
        setHasChanges(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  return (
    <div 
      className="bg-white lg:rounded-3xl w-full lg:max-w-[680px] lg:w-[680px] h-full lg:h-[620px] overflow-hidden flex flex-col lg:shadow-2xl transform transition-all duration-300 ease-out scale-100 relative"
      style={{ '--saved-content-padding-top': isMobile ? '140px' : '104px' } as React.CSSProperties}
          >
      <PageHeader
        title="Edit Profile"
        backButton
        backIcon={backIcon}
        onBack={onBack}
        actions={hasChanges ? [
          {
            icon: (
              <div 
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: '#FF6B35',
                  boxShadow: '0 2px 8px rgba(255, 107, 53, 0.25), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Check size={20} strokeWidth={2.5} className="text-white" />
              </div>
            ),
            onClick: handleSave,
            label: "Save changes"
          }
        ] : undefined}
      />

      {/* Content */}
      <div className="flex-1 px-4 lg:px-8 overflow-y-auto scrollbar-hide" style={{
        paddingTop: 'var(--saved-content-padding-top, 104px)',
        paddingBottom: '32px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-md mx-auto" style={{ padding: '2px' }}>
        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3">
            <Avatar 
              src={previewUrl || undefined} 
              name={fullName || 'User'} 
              size={96} 
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-gray-900"
          >
            Edit
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* General Section */}
        <h3 className="text-base font-semibold text-gray-900 mb-4">General</h3>

        {/* Name Input Card */}
        <div className="mb-4" style={{ padding: '2px' }}>
          <div
            className="relative bg-white rounded-2xl transition-all duration-200"
            style={{ 
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              transform: nameFocused ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: nameFocused 
                ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              if (!nameFocused) {
                e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!nameFocused) {
                e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
          >
            <label
              htmlFor="fullName"
              className="absolute left-4 transition-all duration-200 pointer-events-none"
              style={{
                top: nameFocused || fullName ? '10px' : '50%',
                transform: nameFocused || fullName ? 'translateY(0)' : 'translateY(-50%)',
                fontSize: nameFocused || fullName ? '11px' : '17px',
                color: '#9CA3AF',
                fontWeight: nameFocused || fullName ? 500 : 400,
              }}
            >
              Name
            </label>
            <input
              ref={nameRef}
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              className="w-full bg-transparent border-none outline-none px-4 text-gray-900"
              style={{
                paddingTop: fullName ? '28px' : '14px',
                paddingBottom: fullName ? '10px' : '14px',
                fontSize: '17px',
                height: '56px',
              }}
              autoCapitalize="words"
            />
          </div>
            </div>

        {/* Bio TextArea Card */}
        <div className="mb-4" style={{ padding: '2px' }}>
          <div
            className="relative bg-white rounded-2xl transition-all duration-200"
            style={{ 
              borderWidth: '0.4px',
              borderColor: '#E5E7EB',
              borderStyle: 'solid',
              transform: bioFocused ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: bioFocused 
                ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)'
                : '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)',
              willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
              if (!bioFocused) {
                e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(100, 100, 100, 0.3), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!bioFocused) {
                e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)';
              }
            }}
          >
            <label
              htmlFor="bio"
              className="absolute left-4 transition-all duration-200 pointer-events-none"
              style={{
                top: bioFocused || bio ? '10px' : '50%',
                transform: bioFocused || bio ? 'translateY(0)' : 'translateY(-50%)',
                fontSize: bioFocused || bio ? '11px' : '17px',
                color: '#9CA3AF',
                fontWeight: bioFocused || bio ? 500 : 400,
              }}
            >
              Bio
            </label>
            <textarea
              ref={bioRef}
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setBioFocused(true)}
              onBlur={() => setBioFocused(false)}
              rows={3}
              className="w-full bg-transparent border-none outline-none px-4 text-gray-900 resize-none edit-profile-bio"
              style={{
                paddingTop: bio ? '28px' : '14px',
                paddingBottom: '10px',
                fontSize: '17px',
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Separator Line */}
        <div className="h-[0.4px] bg-gray-300 mb-8" style={{ marginTop: '32px' }} />

        {/* Links Section */}
        <div
          onClick={onOpenLinks}
          className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] px-5 py-4 mb-3 flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
            style={{ 
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">Links</span>
            <span className="text-sm text-gray-500">{links.length}</span>
          </div>
          <div className="flex gap-1.5">
            {linksLoading ? (
              <div className="w-6 h-6 rounded border-[0.4px] border-gray-300 bg-gray-100 animate-pulse" />
            ) : links.length === 0 ? (
              <div className="w-6 h-6 rounded border-[0.4px] border-gray-300 bg-gray-50" />
            ) : (
              links.slice(0, 4).map((link) => (
                <div
                  key={link.id}
                  className="w-6 h-6 rounded flex items-center justify-center bg-white border-[0.4px] border-gray-300 flex-shrink-0"
                  style={{
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.15), inset 0 0 1px rgba(27, 27, 27, 0.1)'
                  }}
                >
                  {linkIcons[link.type] || linkIcons['other']}
                </div>
              ))
            )}
            {links.length > 4 && (
              <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 border-[0.4px] border-gray-300 text-xs text-gray-600 font-medium">
                +{links.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Timeline Section */}
        <div
          onClick={onOpenTimeline}
          className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] px-5 py-4 mb-3 flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
          style={{
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">Timeline</span>
            <span className="text-sm text-gray-500">{momentsCount}</span>
          </div>
          <div className="flex gap-1.5">
            {momentsLoading ? (
              <div className="w-6 h-6 rounded border-[0.4px] border-gray-300 bg-gray-100 animate-pulse" />
            ) : momentsCategories.length === 0 ? (
              <div className="w-6 h-6 rounded border-[0.4px] border-gray-300 bg-gray-50" />
            ) : (
              momentsCategories.slice(0, 5).map((item, index) => {
                // Check if it's a default timeline component or a category
                const isDefault = defaultTimelineIcons[item] !== undefined;
                const icon = isDefault 
                  ? defaultTimelineIcons[item]
                  : (categoryIcons[item] || <MoreHorizontal size={16} className="text-gray-900" strokeWidth={2.5} />);
                
                return (
                  <div
                    key={`${item}-${index}`}
                    className="w-6 h-6 rounded flex items-center justify-center bg-white border-[0.4px] border-gray-300 flex-shrink-0"
                    style={{
                      boxShadow: '0 0 1px rgba(100, 100, 100, 0.15), inset 0 0 1px rgba(27, 27, 27, 0.1)'
                    }}
                  >
                    {icon}
                  </div>
                );
              })
            )}
            {momentsCategories.length > 5 && (
              <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 border-[0.4px] border-gray-300 text-xs text-gray-600 font-medium">
                +{momentsCategories.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* Highlights Section */}
        <div
          onClick={onOpenHighlights}
          className="bg-white rounded-2xl border-[0.4px] border-[#E5E7EB] px-5 py-4 mb-3 flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
          style={{
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">Highlights</span>
            <span className="text-sm text-gray-500">{highlightsCount}</span>
          </div>
          <div className="flex gap-1.5">
            {highlightsLoading ? (
              <div className="w-6 h-6 rounded border-[0.4px] border-gray-300 bg-gray-100 animate-pulse" />
            ) : highlights.length === 0 ? (
              <div className="w-6 h-6 rounded border-[0.4px] border-gray-300 bg-gray-50" />
            ) : (
              highlights.slice(0, 5).map((highlight) => (
                <div
                  key={highlight.id}
                  className="w-6 h-6 rounded overflow-hidden bg-white border-[0.4px] border-gray-300 flex-shrink-0"
                  style={{
                    boxShadow: '0 0 1px rgba(100, 100, 100, 0.15), inset 0 0 1px rgba(27, 27, 27, 0.1)'
                  }}
                >
                  {highlight.firstImage ? (
                    <img
                      src={highlight.firstImage}
                      alt="Highlight"
                      className="w-full h-full object-cover"
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
              ))
            )}
            {highlightsCount > 5 && highlights.length >= 5 && (
              <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 border-[0.4px] border-gray-300 text-xs text-gray-600 font-medium">
                +{highlightsCount - 5}
              </div>
            )}
          </div>
            </div>
        </div>
      </div>

      {/* Bottom Blur */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: 'none' }}>
        <div className="absolute bottom-0 left-0 right-0" style={{
          height: '80px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0) 100%)'
        }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '20px', backdropFilter: 'blur(0.5px)', WebkitBackdropFilter: 'blur(0.5px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '20px', height: '20px', backdropFilter: 'blur(0.3px)', WebkitBackdropFilter: 'blur(0.3px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '40px', height: '20px', backdropFilter: 'blur(0.15px)', WebkitBackdropFilter: 'blur(0.15px)' }} />
        <div className="absolute left-0 right-0" style={{ bottom: '60px', height: '20px', backdropFilter: 'blur(0.05px)', WebkitBackdropFilter: 'blur(0.05px)' }} />
      </div>

    </div>
  );
}
