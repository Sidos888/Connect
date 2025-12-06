# Image Upload Systems Assessment

## Executive Summary

This document provides a comprehensive analysis of all image upload systems currently used throughout the Connect app. The analysis reveals **10 distinct upload implementations** with significant inconsistencies in approach, data formats, error handling, and iOS WebView compatibility.

---

## Storage Buckets (Supabase)

### Current Buckets:
1. **`avatars`** - Public, no size limit, no MIME restrictions
   - Used for: User avatars, group photos
   - Path patterns: `avatars/${userId}.ext`, `group-photos/${chatId}-${timestamp}.ext`

2. **`chat-media`** - Public, 10MB limit, images + videos
   - Used for: Chat messages (photos/videos)
   - Path patterns: `${timestamp}_${random}.ext`

3. **`listing-photos`** - Public, 10MB limit, images only
   - Used for: Listing photos, moment photos, event galleries
   - Path patterns: 
     - `{userId}/{timestamp}_{i}_{random}.ext` (listings)
     - `moments/{userId}/{timestamp}-{random}.ext` (moments)
     - `galleries/{listingId}/{userId}/{timestamp}-{random}.ext` (galleries)

4. **`event-galleries`** - Public, 10MB limit, images only
   - Used for: Event gallery photos
   - Path patterns: (needs verification)

---

## Upload Systems Identified

### 1. **Chat Uploads** ✅ (WORKING)
**Files:**
- `src/app/(personal)/chat/PersonalChatPanel.tsx`
- `src/app/(personal)/chat/individual/page.tsx`

**Pattern:**
- File objects passed directly from input → upload function
- **No state storage** - files used immediately
- Uploads to: `chat-media` bucket
- Upload method: `.upload(fileName, file)` - **no options**
- Has fallback to Capacitor HTTP in individual/page.tsx

**Status:** ✅ Works on iOS (no File-in-state issue)

---

### 2. **Moments - Create** ⚠️ (RECENTLY FIXED)
**Files:**
- `src/components/profile/AddMomentForm.tsx`
- `src/app/(personal)/menu/page.tsx`

**Pattern:**
- File objects stored in **ref** (not state) - iOS fix applied
- Data URLs stored in state for preview only
- Uploads to: `listing-photos` bucket
- Path: `moments/{userId}/{timestamp}-{random}.ext`
- Upload method: `.upload(fileName, file)` - **no options**

**Status:** ⚠️ Just fixed to use refs instead of state

---

### 3. **Moments - Edit** ❌ (HAS ISSUES)
**Files:**
- `src/components/profile/EditMomentPage.tsx`

**Pattern:**
- Base64 strings stored in state
- Converts base64 → Blob → File on upload
- Uploads to: `listing-photos` bucket
- Path: `moments/{userId}/{timestamp}-{random}.ext`
- Upload method: `.upload(fileName, file, { cacheControl, upsert, contentType })`
- Has retry logic (3 attempts) with timeout

**Status:** ❌ Failing - base64 → Blob → File conversion breaks in iOS WebView

---

### 4. **Listings - Create (Initial)** ⚠️
**Files:**
- `src/app/(personal)/my-life/create/page.tsx`

**Pattern:**
- Base64 strings stored in state (`photos: string[]`)
- Converts base64 → File on upload using `dataURLtoFile()`
- Uploads to: `listing-photos` bucket
- Path: `{userId}/{timestamp}_{i}_{random}.ext`
- Upload method: `.upload(fileName, file)` - **no options**

**Status:** ⚠️ Base64 → File conversion may fail in iOS WebView

---

### 5. **Listings - Create (Details Page)** ⚠️
**Files:**
- `src/app/(personal)/my-life/create/details/page.tsx`

**Pattern:**
- Base64 strings stored in state
- Converts base64 → **Blob** (not File) on upload using `dataURLtoBlob()`
- Uploads **Blob directly** (not File)
- Uploads to: `listing-photos` bucket
- Path: `{userId}/{timestamp}_{i}_{random}.ext`
- Upload method: `.upload(fileName, blob, { cacheControl, upsert, contentType })`
- Has retry logic (3 attempts) with timeout

**Status:** ⚠️ Blob upload may fail in iOS WebView (should use File)

---

### 6. **Listings - Itinerary** ✅ (LIKELY WORKS)
**Files:**
- `src/app/(personal)/my-life/create/itinerary/page.tsx`

**Pattern:**
- File from input → compresses → uploads **immediately**
- **No state storage** - upload happens on file select
- Uploads to: `listing-photos` bucket
- Path: `{userId}/itinerary_{timestamp}_{random}.ext`
- Upload method: `.upload(fileName, compressedFile)` - **no options**

**Status:** ✅ Should work - no File-in-state, immediate upload

---

### 7. **Listings - Edit** ⚠️
**Files:**
- `src/components/listings/EditListingDetailsView.tsx`

**Pattern:**
- File from input → compresses → stores as **base64 in state**
- Uploads on save (base64 → File conversion)
- Uploads to: `listing-photos` bucket
- Path: (needs verification)
- Upload method: (needs verification)

**Status:** ⚠️ Base64 → File conversion may fail in iOS WebView

---

### 8. **Avatar Upload (AuthContext)** ⚠️
**Files:**
- `src/lib/authContext.tsx`

**Pattern:**
- File object passed to function (not stored in state)
- Uploads to: `avatars` bucket
- Path: `avatars/{userId}.ext`
- Upload method: `.upload(fileName, file, { upsert: true })`
- Has timeout (30s)

**Status:** ⚠️ Should work if File not stored in state

---

### 9. **Avatar Upload (AccountCheckModal)** ⚠️
**Files:**
- `src/components/auth/AccountCheckModal.tsx`

**Pattern:**
- File stored in formData (not React state)
- Uploads to: `avatars` bucket
- Path: `avatars/{fileName}`
- Upload method: `.upload(filePath, file, { upsert: true })`

**Status:** ⚠️ Should work if File not in React state

---

### 10. **Avatar Upload (EditProfileLanding)** ❌
**Files:**
- `src/components/settings/EditProfileLanding.tsx`

**Pattern:**
- **File stored in React state**: `const [avatarFile, setAvatarFile] = useState<File | null>(null)`
- Uploads via `uploadAvatar()` from authContext
- Uploads to: `avatars` bucket

**Status:** ❌ File stored in state - will fail on iOS WebView

---

### 11. **Group Photo Upload** ✅ (LIKELY WORKS)
**Files:**
- `src/components/chat/GroupProfileModal.tsx`

**Pattern:**
- File from input → uploads **immediately**
- **No state storage** - upload happens on file select
- Uploads to: `avatars` bucket
- Path: `group-photos/{chatId}-{timestamp}.ext`
- Upload method: `.upload(filePath, file, { cacheControl, upsert: false })`

**Status:** ✅ Should work - no File-in-state, immediate upload

---

### 12. **Event Gallery Upload** ✅ (LIKELY WORKS)
**Files:**
- `src/components/listings/EventGalleryView.tsx`

**Pattern:**
- File from input → uploads **immediately**
- **No state storage** - upload happens on file select
- Uploads to: `listing-photos` bucket
- Path: `galleries/{listingId}/{userId}/{timestamp}-{random}.ext`
- Upload method: `.upload(fileName, file)` - **no options**

**Status:** ✅ Should work - no File-in-state, immediate upload

---

## Key Issues Identified

### 1. **File Objects in React State** ❌
**Problem:** Storing File objects in React state invalidates their native file handles in iOS WebView.

**Affected Systems:**
- `EditProfileLanding.tsx` - `useState<File | null>(null)`
- `AddMomentForm.tsx` - **FIXED** (now uses ref)
- Potentially others

**Solution:** Use `useRef` instead of `useState` for File objects.

---

### 2. **Base64 → Blob/File Conversion** ⚠️
**Problem:** Converting base64 strings to Blob/File objects breaks in iOS WebView.

**Affected Systems:**
- `EditMomentPage.tsx` - base64 → Blob → File
- `my-life/create/page.tsx` - base64 → File
- `my-life/create/details/page.tsx` - base64 → Blob (uploads Blob directly)
- `EditListingDetailsView.tsx` - base64 → File (on save)

**Solution:** Store File objects directly from input (use refs), avoid base64 conversion.

---

### 3. **Inconsistent Upload Options** ⚠️
**Problem:** Some uploads use options, some don't. No clear pattern.

**Patterns Found:**
- **No options:** Chat, Moments (create), Listings (create initial), Itinerary, Event Gallery
- **With options:** EditMoment, Listing Details, Group Photo, Avatar (upsert: true)

**Options Used:**
- `cacheControl: '3600'`
- `upsert: true/false`
- `contentType: blob.type`

**Solution:** Standardize on minimal options (or none) for iOS compatibility.

---

### 4. **Inconsistent Retry Logic** ⚠️
**Problem:** Some systems have retry logic, some don't.

**Has Retry:**
- `EditMomentPage.tsx` - 3 attempts with exponential backoff
- `my-life/create/details/page.tsx` - 3 attempts with exponential backoff

**No Retry:**
- Chat uploads
- Most other systems

**Solution:** Implement consistent retry logic in universal system.

---

### 5. **Inconsistent Error Handling** ⚠️
**Problem:** Different error messages, logging, and user feedback.

**Solution:** Standardize error handling in universal system.

---

### 6. **Multiple Utility Functions** ⚠️
**Problem:** Different conversion functions scattered across files.

**Functions Found:**
- `dataURLtoBlob()` - in `my-life/create/details/page.tsx`
- `dataURLtoFile()` - in `my-life/create/page.tsx`
- `fileToDataURL()` - in `lib/imageUtils.ts`
- `compressImage()` - in `lib/imageUtils.ts` and inline in multiple files

**Solution:** Consolidate into universal utility.

---

## Data Format Patterns

### Pattern A: Direct File Upload (✅ WORKS)
- File from input → Upload immediately
- **No state storage**
- Examples: Chat, Itinerary, Group Photo, Event Gallery

### Pattern B: File in State (❌ FAILS iOS)
- File from input → Store in state → Upload later
- Examples: EditProfileLanding (needs fix)

### Pattern C: Base64 in State → Convert on Upload (⚠️ RISKY)
- File from input → Convert to base64 → Store in state → Convert to File/Blob on upload
- Examples: Listings create, EditMoment, EditListing

### Pattern D: File in Ref (✅ WORKS - RECENT FIX)
- File from input → Store in ref → Upload later
- Examples: AddMomentForm (just fixed)

---

## Upload Method Patterns

### Method 1: Simple Upload (No Options)
```typescript
await supabase.storage.from('bucket').upload(fileName, file);
```
**Used by:** Chat, Moments (create), Listings (create), Itinerary, Event Gallery

### Method 2: Upload with Options
```typescript
await supabase.storage.from('bucket').upload(fileName, file, {
  cacheControl: '3600',
  upsert: false,
  contentType: file.type
});
```
**Used by:** EditMoment, Listing Details, Group Photo

### Method 3: Upload with Upsert
```typescript
await supabase.storage.from('bucket').upload(fileName, file, { upsert: true });
```
**Used by:** Avatar uploads

### Method 4: Blob Upload (Not File)
```typescript
await supabase.storage.from('bucket').upload(fileName, blob, {
  cacheControl: '3600',
  upsert: false,
  contentType: blob.type
});
```
**Used by:** Listing Details (create) - **PROBLEMATIC**

---

## Recommendations for Universal System

### Core Requirements:
1. **File Storage:** Use `useRef` (never `useState`) for File objects
2. **Data Format:** Store File objects directly (avoid base64 conversion)
3. **Upload Method:** Simple `.upload(fileName, file)` with minimal/no options
4. **Retry Logic:** Standardized 3-attempt retry with exponential backoff
5. **Error Handling:** Consistent error messages and logging
6. **Timeout:** 30-second timeout per upload
7. **Validation:** File type, size limits before upload
8. **Compression:** Optional, configurable compression before upload

### Proposed Universal System Structure:

```typescript
// Universal Image Upload Hook
useImageUpload({
  bucket: 'listing-photos',
  pathPrefix: 'moments',
  maxSize: 10 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', ...],
  compress: true,
  retryAttempts: 3,
  onProgress?: (progress) => void,
  onSuccess?: (urls) => void,
  onError?: (error) => void
})

// Returns:
// - files: File[] (stored in ref)
// - previews: string[] (data URLs for display)
// - upload: () => Promise<string[]>
// - remove: (index) => void
// - uploading: boolean
// - progress: number
```

### Benefits:
- ✅ Single source of truth
- ✅ iOS WebView compatible (refs, no base64)
- ✅ Consistent error handling
- ✅ Retry logic built-in
- ✅ Configurable per use case
- ✅ Easy to test and maintain

---

## Summary Statistics

- **Total Upload Systems:** 12
- **Working Systems:** 5 (Chat, Itinerary, Group Photo, Event Gallery, Moments Create - after fix)
- **Problematic Systems:** 7 (various base64/state issues)
- **Storage Buckets Used:** 4 (avatars, chat-media, listing-photos, event-galleries)
- **Upload Patterns:** 4 distinct patterns
- **Utility Functions:** 4+ scattered across codebase

---

## Next Steps

1. **Create Universal Upload System** based on working patterns (Chat, Itinerary)
2. **Migrate All Systems** to use universal system
3. **Remove Duplicate Code** (utility functions, retry logic, etc.)
4. **Standardize Bucket Usage** (consider consolidating paths)
5. **Add Comprehensive Tests** for iOS WebView compatibility

---

## Files Requiring Migration

1. `src/components/profile/AddMomentForm.tsx` - ✅ Already using refs
2. `src/components/profile/EditMomentPage.tsx` - ❌ Base64 → Blob → File
3. `src/app/(personal)/my-life/create/page.tsx` - ⚠️ Base64 → File
4. `src/app/(personal)/my-life/create/details/page.tsx` - ⚠️ Base64 → Blob
5. `src/components/listings/EditListingDetailsView.tsx` - ⚠️ Base64 → File
6. `src/components/settings/EditProfileLanding.tsx` - ❌ File in state
7. `src/lib/authContext.tsx` - ⚠️ Review (should be OK)
8. `src/components/auth/AccountCheckModal.tsx` - ⚠️ Review (should be OK)

---

*Assessment completed: 2025-01-08*


