# Listing Photos Implementation

## Overview
Implemented photo upload functionality for listings with Supabase Storage integration. Photos are stored locally during creation and uploaded to Supabase Storage when the listing is saved.

## Features Implemented

### 1. Multi-Photo Support
- Users can add up to 12 photos per listing
- Photos are stored as base64 data URLs in state during creation
- Photos are persisted in sessionStorage for navigation

### 2. Photo Display Logic
- **1-3 photos**: Display the first photo as the main image
- **4+ photos**: Display a 2x2 grid showing the first 4 photos
- Photo count indicator shows total number of photos

### 3. Photo Gallery Page
- Clicking the photo count pill navigates to `/my-life/create/photos`
- Displays all photos in a 4-column grid
- Back button returns to create listing page

### 4. Supabase Storage Integration
- Photos are uploaded to `listing-photos` bucket when listing is saved
- Storage bucket setup SQL: `sql/setup-listing-photos-storage.sql`
- Photos are organized by user ID: `{account_id}/{timestamp}_{index}_{random}.{ext}`

### 5. Upload Flow
1. User selects photos (stored as base64 in state)
2. Photos displayed in UI
3. When "Done" button is clicked:
   - Photos are converted from base64 to File objects
   - Uploaded to Supabase Storage
   - Public URLs are generated
   - TODO: Save listing to database with photo URLs

## Files Modified

1. **src/app/(personal)/my-life/create/page.tsx**
   - Added multi-photo state management
   - Added photo upload logic
   - Added save handler with Supabase Storage upload
   - Updated photo display logic (single vs grid)

2. **src/app/(personal)/my-life/create/photos/page.tsx** (NEW)
   - Photo gallery page with 4-column grid
   - Loads photos from sessionStorage

3. **sql/setup-listing-photos-storage.sql** (NEW)
   - Creates `listing-photos` storage bucket
   - Sets up RLS policies for upload/view/update/delete

## Next Steps

1. **Run Storage Setup SQL**
   - Execute `sql/setup-listing-photos-storage.sql` in Supabase SQL Editor
   - This creates the bucket and policies

2. **Create Listings Table** (if not exists)
   - Need to create/update listings table with photo URLs column
   - Example: `photo_urls TEXT[]` or separate `listing_photos` table

3. **Complete Save Logic**
   - Update `handleSaveListing` to insert listing into database
   - Store photo URLs in database

## Storage Bucket Details

- **Bucket ID**: `listing-photos`
- **Public**: Yes (for easy access)
- **File Size Limit**: 10MB
- **Allowed MIME Types**: image/jpeg, image/jpg, image/png, image/gif, image/webp
- **Path Format**: `{account_id}/{timestamp}_{index}_{random}.{ext}`

## Usage

1. User adds photos using the + button
2. Photos are displayed in the card (single or grid)
3. Photo count is shown in the pill button
4. Clicking the pill opens the photo gallery
5. Clicking "Done" uploads photos and saves listing






