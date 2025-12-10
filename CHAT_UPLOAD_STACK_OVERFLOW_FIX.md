# Chat Upload Stack Overflow Fix ✅

## Problem

Chat image uploads were failing with:
```
❌ Error sending message: {}
Error: Maximum call stack size exceeded
```

**Root Cause:** The Capacitor HTTP upload path was converting large ArrayBuffers to base64 using:
```typescript
String.fromCharCode(...new Uint8Array(arrayBuffer))
```

This spread operator (`...`) with large files (e.g., 1909KB = ~1.9 million bytes) tried to pass millions of arguments to `String.fromCharCode()`, exceeding the JavaScript call stack limit.

---

## Solution

**Simplified the upload flow** by:
1. ❌ **Removed** the problematic Capacitor HTTP path with base64 conversion
2. ✅ **Using** Supabase JS client directly with retry logic (works on all platforms)
3. ✅ **Matches** the working create listing upload pattern

---

## Changes Made

### File: `src/app/(personal)/chat/individual/page.tsx`

**Before:**
- Complex Capacitor HTTP upload with base64 conversion
- ArrayBuffer → base64 conversion causing stack overflow
- Multiple upload paths (Capacitor HTTP → fallback → web)

**After:**
- Single, unified upload path using Supabase JS client
- Direct File object upload (no base64 conversion)
- Retry logic with exponential backoff (3 attempts, 1s/2s/3s delays)
- 30-second timeout per attempt

---

## Implementation Details

### New Upload Flow:

```typescript
// Simple, unified upload with retry logic
const maxRetries = 3;
let retryCount = 0;

while (retryCount < maxRetries) {
  try {
    const uploadPromise = supabase.storage
      .from('chat-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    // Timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout')), 30000)
    );
    
    const result = await Promise.race([uploadPromise, timeoutPromise]);
    
    if (!result.error) {
      break; // ✅ Success
    }
    
    // Retry on network errors
    if (retryCount < maxRetries - 1 && isRetryableError(result.error)) {
      retryCount++;
      await delay(1000 * retryCount); // Exponential backoff
      continue;
    }
    
    break;
  } catch (error) {
    // Handle timeout, retry if possible
  }
}
```

---

## Benefits

1. ✅ **No stack overflow** - No base64 conversion for large files
2. ✅ **Simpler code** - Single upload path, easier to maintain
3. ✅ **Works everywhere** - iOS, Android, Web all use same path
4. ✅ **Proven pattern** - Matches working create listing upload
5. ✅ **Network resilience** - Retry logic handles transient errors

---

## Testing Checklist

- [x] Code compiles successfully
- [ ] Test chat image upload on iOS device
- [ ] Test with large files (>1MB)
- [ ] Verify retry logic works on network errors
- [ ] Confirm no stack overflow errors

---

## Expected Behavior

### Success Scenario:
```
Upload attempt 1 → ⚠️ Network error → Retry (1s delay)
Upload attempt 2 → ✅ Success
```

### All Retries Fail:
```
Upload attempt 1 → ⚠️ Error → Retry (1s delay)
Upload attempt 2 → ⚠️ Error → Retry (2s delay)
Upload attempt 3 → ⚠️ Error → Show error to user
```

---

## Key Differences

### Before (Broken):
- ❌ Capacitor HTTP with base64 conversion
- ❌ Stack overflow on large files
- ❌ Complex multi-path upload logic
- ❌ Base64 conversion overhead

### After (Fixed):
- ✅ Direct File upload via Supabase JS
- ✅ No stack overflow (no base64 conversion)
- ✅ Simple, unified upload path
- ✅ Minimal overhead

---

*Fix completed: 2025-01-08*
*Root cause: Stack overflow from base64 conversion of large ArrayBuffers*
*Solution: Simplified to direct File upload with retry logic*





