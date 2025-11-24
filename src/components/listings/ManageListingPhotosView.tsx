"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { MobilePage, PageHeader, PageContent } from "@/components/layout/PageSystem";
import PhotoViewer from "@/components/listings/PhotoViewer";
import { Listing } from '@/lib/listingsService';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

interface ManageListingPhotosViewProps {
  listingId: string;
  listing: Listing | null;
  onBack: () => void;
}

export default function ManageListingPhotosView({ listingId, listing, onBack }: ManageListingPhotosViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [draggedCardSize, setDraggedCardSize] = useState<{ width: number; height: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Client-side mount check to avoid hydration errors
  useEffect(() => {
    console.log('📸 ManageListingPhotosView: Component mounting', { listingId, photosCount: listing?.photo_urls?.length || 0 });
    setIsMounted(true);
  }, []);
  
  // Use refs for immediate position updates to avoid React state lag
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ index: number; x: number; y: number; offsetX: number; offsetY: number; originalLeft: number; originalTop: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load photos from listing - only on initial mount or when listing changes
  useEffect(() => {
    if (listing?.photo_urls) {
      const listingPhotos = listing.photo_urls;
      // Only update if photos actually changed to prevent infinite loops
      if (JSON.stringify(listingPhotos) !== JSON.stringify(photos)) {
        console.log('📸 ManageListingPhotosView: Loading photos from listing', { count: listingPhotos.length });
        setPhotos(listingPhotos);
      }
    }
  }, [listing?.photo_urls]); // Only depend on photo_urls, not entire listing object

  // Store pending photo changes in a separate cache key (not the main listing cache)
  // This allows EditListingDetailsView to detect changes without updating the listing immediately
  // Changes will only be saved when the orange tick is clicked
  const hasInitializedRef = useRef(false);
  const originalPhotosRef = useRef<string[]>([]);
  
  useEffect(() => {
    if (!listingId) return;
    
    // On initial load, store original photos and mark as initialized
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      originalPhotosRef.current = [...(listing?.photo_urls || [])];
      console.log('📸 ManageListingPhotosView: Initialized, photos loaded from listing', { photosCount: photos.length });
      return;
    }
    
    // Check if photos have changed from original
    const photosChanged = JSON.stringify(photos) !== JSON.stringify(originalPhotosRef.current);
    
    if (photosChanged) {
      console.log('📸 ManageListingPhotosView: Photos changed, storing pending changes', { photosCount: photos.length });
      // Store pending changes in a separate cache key (not the main listing cache)
      queryClient.setQueryData(['listing-photo-changes', listingId], photos);
    } else {
      // If photos match original, clear any pending changes
      queryClient.removeQueries({ queryKey: ['listing-photo-changes', listingId] });
    }
  }, [photos, listingId, queryClient, listing?.photo_urls]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handlePhotoClick = (index: number) => {
    // Only open viewer if we're not dragging
    if (!isDraggingRef.current && draggedIndex === null) {
      setSelectedPhotoIndex(index);
    }
  };

  const handleClosePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  const handleRemovePhoto = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  // Calculate which index a photo should be at based on drag position
  const getTargetIndexFromPosition = (clientX: number, clientY: number): number => {
    if (!containerRef.current) return -1;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - containerRect.left;
    const relativeY = clientY - containerRect.top;
    const cardWidth = (containerRect.width - (3 * 16)) / 4;
    const cardHeight = cardWidth; // aspect-square
    const gap = 16;
    const cellWidth = cardWidth + gap;
    
    // Calculate which column we're in (0-3)
    let column = Math.floor(relativeX / cellWidth);
    
    // If we're in the gap area between cells, check which cell center we're closer to
    const cellStart = column * cellWidth;
    const cellCenter = cellStart + cardWidth / 2;
    const nextCellCenter = (column + 1) * cellWidth + cardWidth / 2;
    
    // If we're past the current cell's center, we might be in the next cell
    if (relativeX > cellCenter && column < 3) {
      // Check if we're closer to the next cell's center
      if (Math.abs(relativeX - nextCellCenter) < Math.abs(relativeX - cellCenter)) {
        column = column + 1;
      }
    }
    
    // Clamp column to valid range
    column = Math.max(0, Math.min(3, column));
    
    // Calculate which row we're in
    const row = Math.max(0, Math.floor(relativeY / (cardHeight + gap)));
    
    // Calculate target index: row * 4 + column
    const targetIndex = row * 4 + column;
    
    // Constrain to valid photo indices
    return Math.min(Math.max(targetIndex, 0), photos.length - 1);
  };

  // Touch-based drag and drop for mobile
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const cardElement = cardRefs.current[index];
    if (!cardElement) return;
    
    const cardRect = cardElement.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    touchStartRef.current = {
      index,
      x: touch.clientX,
      y: touch.clientY,
      offsetX: touch.clientX - cardRect.left,
      offsetY: touch.clientY - cardRect.top,
      originalLeft: cardRect.left - containerRect.left,
      originalTop: cardRect.top - containerRect.top
    };
    
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    if (!touchStartRef.current || touchStartRef.current.index !== index) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Start dragging immediately if moved more than 2px
    if ((deltaX > 2 || deltaY > 2) && !isDraggingRef.current) {
      isDraggingRef.current = true;
      setDraggedIndex(index);
      e.preventDefault(); // Prevent scrolling
    }

    // If dragging, update position and target index
    if (isDraggingRef.current && touchStartRef.current && containerRef.current) {
      e.preventDefault();
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const cardWidth = (containerRect.width - (3 * 16)) / 4;
      const gap = 16;
      
      // Calculate raw position from touch (use actual touch position, not constrained)
      const rawX = touch.clientX - touchStartRef.current.offsetX;
      const rawY = touch.clientY - touchStartRef.current.offsetY;
      
      // Store the raw position for smooth movement
      const newPosition = { 
        x: rawX, 
        y: rawY
      };
      
      // Update ref immediately for smooth rendering (no React state lag)
      dragPositionRef.current = newPosition;
      
      // Use requestAnimationFrame to batch state updates for smoother performance
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(() => {
          setDragPosition(dragPositionRef.current);
          animationFrameRef.current = null;
        });
      }
      
      // Update target index based on card center position (not touch point)
      const cardCenterX = rawX + (cardWidth / 2);
      const cardCenterY = rawY + (cardWidth / 2);
      const newTargetIndex = getTargetIndexFromPosition(cardCenterX, cardCenterY);
      
      // Allow targetIndex to be set to any valid index, including the original position
      if (newTargetIndex >= 0 && newTargetIndex < photos.length && newTargetIndex !== targetIndex) {
        setTargetIndex(newTargetIndex);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, dropIndex: number) => {
    if (!touchStartRef.current) {
      return;
    }

    const startIndex = touchStartRef.current.index;
    const wasDragging = isDraggingRef.current;
    const finalPosition = dragPosition || {
      x: e.changedTouches[0].clientX - (touchStartRef.current.offsetX || 0),
      y: e.changedTouches[0].clientY - (touchStartRef.current.offsetY || 0)
    };

    // Reset drag state
    isDraggingRef.current = false;
    touchStartRef.current = null;
    setDragPosition(null);
    setDraggedCardSize(null);
    dragPositionRef.current = null;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Only process as drag if we were actually dragging
    if (wasDragging) {
      // Use targetIndex if available (most accurate - tracked during drag)
      // Otherwise calculate from final position using card center
      let finalTargetIndex: number;
      if (targetIndex !== null) {
        finalTargetIndex = targetIndex;
      } else {
        // Fallback: calculate from final position using card center
        const cardWidth = draggedCardSize?.width || 0;
        const cardCenterX = finalPosition.x + (cardWidth / 2);
        const cardCenterY = finalPosition.y + (cardWidth / 2);
        finalTargetIndex = getTargetIndexFromPosition(cardCenterX, cardCenterY);
      }
      
      const finalDropIndex = finalTargetIndex >= 0 ? finalTargetIndex : dropIndex;
      
      if (startIndex !== finalDropIndex) {
        const newPhotos = [...photos];
        const draggedPhoto = newPhotos[startIndex];
        
        // Remove the dragged photo first
        newPhotos.splice(startIndex, 1);
        
        // Calculate the correct insertion index after removal
        let adjustedDropIndex: number;
        if (startIndex < finalDropIndex) {
          // Dragging right: whitespace is at finalDropIndex, insert there
          adjustedDropIndex = finalDropIndex;
        } else {
          // Dragging left: whitespace is at finalDropIndex, insert there
          adjustedDropIndex = finalDropIndex;
        }
        
        // Ensure adjustedDropIndex is within bounds
        adjustedDropIndex = Math.max(0, Math.min(adjustedDropIndex, newPhotos.length));
        
        newPhotos.splice(adjustedDropIndex, 0, draggedPhoto);
        
        setPhotos(newPhotos);
      }

      setDraggedIndex(null);
      setTargetIndex(null);
    } else {
      // If not dragging, treat as click after a short delay
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      dragTimeoutRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          handlePhotoClick(dropIndex);
        }
      }, 100);
    }
  };

  // Desktop drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!containerRef.current) return;
    
    const cardElement = cardRefs.current[index];
    if (!cardElement) return;
    
    const cardRect = cardElement.getBoundingClientRect();
    setDraggedIndex(index);
    setDraggedCardSize({ width: cardRect.width, height: cardRect.height });
    
    // Set drag image to empty to use custom drag preview
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setTargetIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const draggedPhoto = newPhotos[draggedIndex];
    
    // Remove the dragged photo
    newPhotos.splice(draggedIndex, 1);
    
    // Calculate the correct insertion index after removal
    let adjustedDropIndex = dropIndex;
    
    // Ensure adjustedDropIndex is within bounds
    adjustedDropIndex = Math.max(0, Math.min(adjustedDropIndex, newPhotos.length));
    
    newPhotos.splice(adjustedDropIndex, 0, draggedPhoto);

    setPhotos(newPhotos);
    setDraggedIndex(null);
    setTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragPosition(null);
    setTargetIndex(null);
    setDraggedCardSize(null);
    dragPositionRef.current = null;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Calculate the visual position of each photo during drag
  const getPhotoTransform = (index: number) => {
    if (draggedIndex === null || !dragPosition || !containerRef.current || !touchStartRef.current) {
      return { x: 0, y: 0 };
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const cardWidth = (containerRect.width - (3 * 16)) / 4;
    const cardHeight = cardWidth; // aspect-square
    const gap = 16;
    const currentTargetIndex = targetIndex !== null 
      ? targetIndex 
      : getTargetIndexFromPosition(
          dragPosition.x + touchStartRef.current.offsetX,
          dragPosition.y + touchStartRef.current.offsetY
        );
    
    if (index === draggedIndex) {
      // Dragged photo uses fixed positioning - return 0 for transform
      return { x: 0, y: 0 };
    }

    // Other photos shift to make space
    let newIndex = index;
    if (draggedIndex < currentTargetIndex) {
      // Dragging right/down - shift photos left/up
      if (index > draggedIndex && index <= currentTargetIndex) {
        newIndex = index - 1;
      }
    } else if (draggedIndex > currentTargetIndex) {
      // Dragging left/up - shift photos right/down
      if (index >= currentTargetIndex && index < draggedIndex) {
        newIndex = index + 1;
      }
    }

    // Calculate original position (row and column) in the grid
    const originalRow = Math.floor(index / 4);
    const originalCol = index % 4;
    
    // Calculate new position (row and column) after shift
    const newRow = Math.floor(newIndex / 4);
    const newCol = newIndex % 4;
    
    // Calculate the transform needed to move from original to new position
    const deltaCol = newCol - originalCol;
    const deltaRow = newRow - originalRow;
    
    const deltaX = deltaCol * (cardWidth + gap);
    const deltaY = deltaRow * (cardHeight + gap);
    
    return { x: deltaX, y: deltaY };
  };

  // Don't render MobilePage until mounted to avoid hydration errors
  if (!isMounted) {
    console.log('📸 ManageListingPhotosView: Not mounted yet, showing loading');
    return (
      <div className="px-4 pb-8 text-center text-gray-500" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
        <p>Loading photos...</p>
      </div>
    );
  }
  
  console.log('📸 ManageListingPhotosView: Rendering with', { photosCount: photos.length, isMounted });
  
  return (
    <>
      <div className="lg:hidden" style={{ '--saved-content-padding-top': '180px' } as React.CSSProperties}>
        <MobilePage>
          <PageHeader
            title="Listing Photos"
            subtitle={<span className="text-xs font-medium text-gray-900">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>}
            backButton
            onBack={() => {
              console.log('📸 ManageListingPhotosView: Back button clicked');
              onBack();
            }}
          />

          <PageContent>
            <div className="px-4 pb-8" style={{ paddingTop: 'var(--saved-content-padding-top, 180px)' }}>
              {/* Photo Grid - 4 columns */}
              <div ref={containerRef} className="grid grid-cols-4 gap-4 relative overflow-visible">
                {photos.map((photo, index) => {
                  const isDragged = draggedIndex === index;
                  const transform = getPhotoTransform(index);
                  
                  // For dragged card, use raw drag position relative to container
                  const containerRect = containerRef.current?.getBoundingClientRect();
                  let draggedTransformX = 0;
                  let draggedTransformY = 0;
                  
                  // Use ref for immediate position (no React state lag) or fallback to state
                  const currentDragPosition = dragPositionRef.current || dragPosition;
                  
                  if (isDragged && currentDragPosition && containerRect && touchStartRef.current) {
                    // Calculate the original grid position of this card
                    const cardWidth = (containerRect.width - (3 * 16)) / 4;
                    const cardHeight = cardWidth;
                    const gap = 16;
                    const originalRow = Math.floor(index / 4);
                    const originalCol = index % 4;
                    const originalGridX = originalCol * (cardWidth + gap);
                    const originalGridY = originalRow * (cardHeight + gap);
                    
                    // Transform is simply: current drag position - original grid position
                    draggedTransformX = currentDragPosition.x - containerRect.left - originalGridX;
                    draggedTransformY = currentDragPosition.y - containerRect.top - originalGridY;
                  }
                  
                  return (
                    <div
                      key={index}
                      ref={(el) => { cardRefs.current[index] = el; }}
                      data-photo-index={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={(e) => handleTouchMove(e, index)}
                      onTouchEnd={(e) => handleTouchEnd(e, index)}
                      className={`relative aspect-square overflow-hidden rounded-xl cursor-move ${
                        isDragged ? 'z-50' : ''
                      }`}
                      style={{
                        touchAction: 'none',
                        backgroundColor: 'transparent',
                        transform: isDragged
                          ? `translate(${draggedTransformX}px, ${draggedTransformY}px)`
                          : `translate(${transform.x}px, ${transform.y}px)`,
                        transition: isDragged ? 'none' : 'transform 0.2s ease-out',
                        position: 'relative',
                        zIndex: isDragged ? 100 : 1,
                        willChange: isDragged ? 'transform' : 'auto',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                      }}
                    >
                      <button
                        onClick={() => handlePhotoClick(index)}
                        className="w-full h-full rounded-xl overflow-hidden bg-transparent p-0"
                        style={{
                          pointerEvents: isDragged ? 'none' : 'auto',
                          border: 'none',
                          background: 'transparent',
                          borderWidth: '0.4px',
                          borderColor: '#E5E7EB',
                          borderStyle: 'solid'
                        }}
                      >
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover pointer-events-none"
                          draggable={false}
                          style={{
                            backgroundColor: 'transparent',
                            display: 'block',
                            width: '100%',
                            height: '100%'
                          }}
                        />
                      </button>

                      {/* Remove button */}
                      {!isDragged && (
                        <button
                          onClick={(e) => handleRemovePhoto(index, e)}
                          onTouchEnd={(e) => handleRemovePhoto(index, e)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black bg-opacity-70 flex items-center justify-center hover:bg-opacity-90 active:bg-opacity-90 transition-all z-10"
                          style={{
                            touchAction: 'manipulation'
                          }}
                          aria-label="Remove photo"
                        >
                          <X size={14} className="text-white" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </PageContent>
        </MobilePage>
      </div>

      {/* PhotoViewer */}
      {selectedPhotoIndex !== null && (
        <PhotoViewer
          isOpen={selectedPhotoIndex !== null}
          photos={photos}
          initialIndex={selectedPhotoIndex}
          onClose={handleClosePhotoViewer}
        />
      )}
    </>
  );
}

