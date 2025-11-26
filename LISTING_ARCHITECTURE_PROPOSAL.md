# Listing Page Architecture Proposal

## Current State
- **Preview Page** (`/my-life/create/preview`): Shows listing preview during creation flow
- **Listing Detail Page** (`/my-life/listing/[id]`): Shows actual listing (currently missing action buttons)

## Recommended Architecture: **Shared Components + Separate Pages**

### Why This Approach?

✅ **Scalability**: Each page can evolve independently
✅ **Maintainability**: Shared UI components reduce duplication
✅ **Flexibility**: Easy to add different features to each page
✅ **Clear Separation**: Preview (creation) vs Detail (viewing) have different purposes

### Structure

```
src/
├── components/
│   └── listings/
│       ├── ListingCard.tsx (already exists)
│       ├── ListingPhotoCollage.tsx (shared)
│       ├── ListingHeader.tsx (shared - title, date, summary)
│       ├── ListingInfoCards.tsx (shared - viewing, location, host)
│       └── ListingActions.tsx (role-based action buttons)
│
├── app/(personal)/my-life/
│   ├── create/
│   │   └── preview/
│   │       └── page.tsx (uses shared components, no actions)
│   └── listing/
│       └── [id]/
│           └── ListingDetailPageClient.tsx (uses shared components + actions)
```

### Implementation Plan

1. **Extract Shared Components**
   - `ListingPhotoCollage` - photo display logic
   - `ListingHeader` - title, date, summary
   - `ListingInfoCards` - viewing card, location card, host card

2. **Create Role-Based Actions Component**
   - `ListingActions` - shows different buttons based on:
     - **Host**: Edit, Delete, View Registrations
     - **Participant**: Register/Tickets, Share, Save
     - **Viewer**: Share, Save

3. **Update Pages**
   - Preview page: Use shared components, no actions
   - Detail page: Use shared components + `ListingActions`

### Benefits

- **DRY**: No code duplication for UI elements
- **Flexible**: Easy to add new action buttons or modify existing ones
- **Testable**: Each component can be tested independently
- **Future-proof**: Can easily add features like:
  - Comments section (detail page only)
  - Related listings (detail page only)
  - Edit mode (detail page only)
  - Registration flow (detail page only)

### Example Usage

```tsx
// Preview Page
<>
  <ListingPhotoCollage photos={photos} />
  <ListingHeader title={title} date={date} summary={summary} />
  <ListingInfoCards capacity={capacity} location={location} host={account} />
  {/* No actions - this is preview */}
</>

// Detail Page
<>
  <ListingPhotoCollage photos={listing.photo_urls} />
  <ListingHeader title={listing.title} date={listing.start_date} summary={listing.summary} />
  <ListingInfoCards capacity={listing.capacity} location={listing.location} host={hostAccount} />
  <ListingActions 
    listing={listing} 
    currentUser={account}
    userRole={getUserRole(listing, account)} // 'host' | 'participant' | 'viewer'
  />
</>
```





