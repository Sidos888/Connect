# Photo Upload System Analysis

## Executive Summary

**The Problem:** Photo uploads work inconsistently across the app. Some work immediately (chat, avatars), some work with retries (listings), and some fail completely (moments).

**Root Cause:** iOS WebView has a critical limitation with `Blob` objects created from base64 data URLs, especially for files >2MB. The "Load failed" error occurs at the network layer before reaching Supabase.

**The Solution:** Standardize on a single upload pattern that works reliably across all contexts.

---

## Current Upload Implementations

### ✅ **1. Chat Photos (WORKS immediately)**
**Location:** `src/app/(personal)/chat/PersonalChatPanel.tsx:401`

```typescript
// Uses File object directly from <input type="file">
const { data, error } = await supabase.storage
  .from('chat-media')
  .upload(fileName, file);  // ← File object, no options
```

**Key Characteristics:**
- ✅ Uses `File` object directly from native file picker
- ✅ No base64 conversion
- ✅ No retry logic needed
- ✅ Simple upload call (no options)
- ✅ Works immediately on iOS WebView

---

### ✅ **2. Avatar Uploads (WORKS)**
**Location:** `src/lib/authContext.tsx:986`

```typescript
// Uses File object directly from file picker
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, file, { upsert: true });  // ← File object, minimal options
```

**Key Characteristics:**
- ✅ Uses `File` object directly from native file picker
- ✅ No base64 conversion
- ✅ Has timeout (30s) but no retry
- ✅ Minimal upload options
- ✅ Works on iOS WebView

---

### ⚠️ **3. Listing Photos (WORKS with retry)**
**Location:** `src/app/(personal)/my-life/create/details/page.tsx:318`

```typescript
// Converts base64 → Blob
const blob = dataURLtoBlob(photo);  // ← Base64 to Blob conversion
const { data, error } = await supabase.storage
  .from('listing-photos')
  .upload(fileName, blob, {  // ← Blob object
    cacheControl: '3600',
    upsert: false,
    contentType: blob.type
  });
// Has retry logic (3 attempts with exponential backoff)
```

**Key Characteristics:**
- ⚠️ Uses `Blob` object from base64 data URL
- ⚠️ Requires `dataURLtoBlob()` conversion
- ⚠️ Has retry logic (3 attempts, exponential backoff)
- ⚠️ Has timeout (30s)
- ⚠️ First attempt usually fails, succeeds on retry
- ⚠️ Works but unreliable

---

### ❌ **4. Moment Photos (FAILS even with retry)**
**Location:** `src/app/(personal)/menu/page.tsx:1535`

```typescript
// Converts base64 → Blob (EXACT SAME CODE as listing photos)
const blob = dataURLtoBlob(photoData);  // ← Base64 to Blob conversion
const { data, error } = await supabase.storage
  .from('listing-photos')
  .upload(fileName, blob, {  // ← Blob object
    cacheControl: '3600',
    upsert: false,
    contentType: blob.type
  });
// Has retry logic (3 attempts with exponential backoff)
```

**Key Characteristics:**
- ❌ Uses `Blob` object from base64 data URL
- ❌ Requires `dataURLtoBlob()` conversion
- ❌ Has retry logic (3 attempts, exponential backoff)
- ❌ Has timeout (30s)
- ❌ **FAILS on all attempts** (even though code is identical to listing photos)
- ❌ Error: "Load failed" (StorageUnknownError)

---

## The Core Issue: iOS WebView + Base64 → Blob

### Why Chat/Avatar Work:
- **Source:** Native file picker (`<input type="file">`)
- **Data Type:** `File` object (native browser API)
- **Upload:** Direct `File` → Supabase
- **Result:** ✅ Works immediately

### Why Listing/Moment Fail:
- **Source:** Camera capture (Capacitor Camera plugin)
- **Data Type:** Base64 data URL string
- **Conversion:** Base64 → `Blob` via `dataURLtoBlob()`
- **Upload:** `Blob` → Supabase
- **Result:** ❌ Fails with "Load failed" error

### The iOS WebView Bug:

iOS WebView (WKWebView) has a known limitation where:
1. `Blob` objects created from base64 data URLs via `atob()` + `Uint8Array` are not properly serialized for `fetch()` requests
2. Large files (>2MB) are especially problematic
3. The error occurs at the network layer before the request reaches Supabase
4. The error message is generic: "Load failed" (StorageUnknownError)

**Evidence:**
- Chat photos (File objects): ✅ Work
- Avatar uploads (File objects): ✅ Work
- Listing photos (Blob from base64): ⚠️ Work with retry (smaller files?)
- Moment photos (Blob from base64): ❌ Fail completely (larger files: 2.5-4MB)

---

## The Unified Solution

### Option 1: Convert Blob → File (Recommended)

Since iOS WebView handles `File` objects better than `Blob` objects, convert base64 → Blob → File:

```typescript
// Step 1: Base64 → Blob (existing function)
const blob = dataURLtoBlob(photoData);

// Step 2: Blob → File (NEW)
const file = new File([blob], fileName, { type: blob.type });

// Step 3: Upload File (like chat photos)
const { data, error } = await supabase.storage
  .from('listing-photos')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  });
```

**Pros:**
- Uses the same pattern as working uploads (chat, avatar)
- iOS WebView handles File objects natively
- Should work immediately without retries

**Cons:**
- Adds one conversion step (minimal overhead)

---

### Option 2: Use FormData (Alternative)

Wrap the Blob in FormData, which iOS WebView handles better:

```typescript
const blob = dataURLtoBlob(photoData);
const formData = new FormData();
formData.append('file', blob, fileName);

// Upload via fetch directly to Supabase storage API
const response = await fetch(`${supabaseUrl}/storage/v1/object/listing-photos/${fileName}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'multipart/form-data'
  },
  body: formData
});
```

**Pros:**
- FormData is well-supported in iOS WebView
- Bypasses Supabase JS client limitations

**Cons:**
- More complex (direct API calls)
- Requires manual auth header handling
- Loses Supabase client convenience methods

---

### Option 3: Compress Images Before Upload (Workaround)

Reduce file size to <2MB before upload:

```typescript
// Compress image before converting to Blob
const compressedDataUrl = await compressImage(photoData, {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85
});

const blob = dataURLtoBlob(compressedDataUrl);
// ... rest of upload
```

**Pros:**
- Smaller files = faster uploads
- May work around iOS WebView size limits

**Cons:**
- Quality loss
- Doesn't solve the root cause
- Still uses Blob (may still fail)

---

## Recommended Implementation

**Use Option 1: Blob → File conversion**

This matches the pattern of working uploads (chat, avatar) and should work immediately without retries.

### Unified Upload Function

Create a shared utility function:

```typescript
// src/lib/uploadUtils.ts
export async function uploadPhotoToStorage(
  photoData: string,  // Base64 data URL
  bucket: string,
  fileName: string,
  options?: {
    cacheControl?: string;
    upsert?: boolean;
  }
): Promise<{ url: string; error: null } | { url: null; error: Error }> {
  const supabase = getSupabaseClient();
  
  try {
    // Step 1: Base64 → Blob
    const blob = dataURLtoBlob(photoData);
    
    // Step 2: Blob → File (iOS WebView compatibility)
    const file = new File([blob], fileName, { type: blob.type });
    
    // Step 3: Upload File (like chat photos)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false,
        contentType: file.type
      });
    
    if (error) throw error;
    
    // Step 4: Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}
```

### Usage

```typescript
// In moment creation
const { url, error } = await uploadPhotoToStorage(
  photoData,
  'listing-photos',
  `moments/${account.id}/${timestamp}-${randomStr}.${fileExt}`
);

// In listing creation
const { url, error } = await uploadPhotoToStorage(
  photo,
  'listing-photos',
  `${account.id}/${timestamp}_${i}_${randomStr}.${fileExt}`
);
```

---

## Constraints & Limitations

### iOS WebView Constraints:
1. **Blob serialization:** Blob objects from base64 don't serialize properly for fetch()
2. **File size:** Issues worsen with files >2MB
3. **Network layer:** Errors occur before reaching Supabase
4. **Error messages:** Generic "Load failed" doesn't indicate root cause

### Supabase Constraints:
1. **File size limit:** 10MB per bucket configuration
2. **MIME types:** Must match allowed types in bucket config
3. **RLS policies:** Must allow authenticated uploads
4. **Bucket existence:** Bucket must exist and be public/accessible

### Current Backend Status:
- ✅ All buckets exist and are configured correctly
- ✅ RLS policies allow authenticated uploads
- ✅ File size limits are appropriate (10MB)
- ✅ MIME types are allowed
- ✅ **Backend is NOT the issue**

---

## Why This Is So Difficult

1. **Multiple data sources:** File picker vs camera capture produce different data types
2. **Platform differences:** iOS WebView handles File vs Blob differently than desktop browsers
3. **Silent failures:** "Load failed" doesn't indicate the root cause
4. **Inconsistent patterns:** Different parts of the app use different approaches
5. **Size-dependent:** Issues only appear with larger files (>2MB)

---

## Next Steps

1. **Implement unified upload function** (Option 1: Blob → File)
2. **Replace all base64 → Blob uploads** with the unified function
3. **Remove retry logic** (shouldn't be needed with File objects)
4. **Test on iOS** with various file sizes
5. **Monitor for any remaining issues**

---

## Files to Update

1. `src/app/(personal)/menu/page.tsx` - Moment creation
2. `src/components/profile/EditMomentPage.tsx` - Moment editing
3. `src/app/(personal)/my-life/create/details/page.tsx` - Listing creation (optional, but for consistency)

---

## Testing Checklist

- [ ] Small photo (<1MB) from camera
- [ ] Medium photo (1-2MB) from camera
- [ ] Large photo (2-4MB) from camera
- [ ] Multiple photos in one upload
- [ ] Edit moment with new photos
- [ ] Create listing with photos
- [ ] Verify no retries needed
- [ ] Verify uploads succeed on first attempt



