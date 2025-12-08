# Chat Upload Retry Logic Implementation Plan

## Time Estimate: **30-45 minutes**

---

## Scope of Work

### Files to Modify:

1. **`src/app/(personal)/chat/individual/page.tsx`** (Main - ~30 min)
   - Function: `uploadFileToStorage()` (lines 587-771)
   - 3 upload paths need retry logic:
     - Capacitor HTTP upload (iOS/Android)
     - Supabase JS fallback
     - Web Supabase JS

2. **`src/app/(personal)/chat/PersonalChatPanel.tsx`** (Optional - ~10 min)
   - Function: `handleFileUpload()` (lines 372-467)
   - Appears to be legacy code (not used in new flow)
   - Can skip if confirmed unused

3. **`src/app/(personal)/chat/group-details/settings/edit/page.tsx`** (Optional - ~5 min)
   - Function: `uploadGroupPhoto()` (line 114)
   - Group photo upload only
   - Lower priority

---

## Implementation Details

### Main Function: `uploadFileToStorage()`

**Current Structure:**
```
uploadFileToStorage()
├── Capacitor path (iOS/Android)
│   ├── Try Capacitor HTTP
│   └── Fallback to Supabase JS (on error)
└── Web path
    └── Supabase JS upload
```

**After Adding Retry:**
```
uploadFileToStorage()
├── Capacitor path (iOS/Android)
│   ├── Try Capacitor HTTP (with retry loop)
│   └── Fallback to Supabase JS (with retry loop)
└── Web path
    └── Supabase JS upload (with retry loop)
```

---

## Code Changes Required

### Pattern to Copy from Create Listing:

```typescript
// Retry logic pattern (from create/details/page.tsx)
let uploadData;
let uploadError;
const maxRetries = 3;
let retryCount = 0;

while (retryCount < maxRetries) {
  try {
    const uploadPromise = supabase.storage
      .from('chat-media')
      .upload(fileName, file, { ... });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout')), 30000)
    );
    
    const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
    uploadData = result.data;
    uploadError = result.error;
    
    if (!uploadError) {
      break; // ✅ Success
    }
    
    // Retry on network errors
    if (retryCount < maxRetries - 1 && (
      uploadError.message?.includes('network') || 
      uploadError.message?.includes('Load failed')
    )) {
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      continue; // 🔄 Retry
    }
    
    break;
  } catch (timeoutError) {
    if (retryCount < maxRetries - 1) {
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      continue;
    }
    uploadError = timeoutError as any;
    break;
  }
}
```

---

## Potential Issues & Solutions

### Issue 1: **Capacitor HTTP Retry Complexity** ⚠️

**Problem:**
- Capacitor HTTP uses different API (not Supabase JS)
- Retry logic needs to handle Capacitor HTTP errors differently
- Fallback path adds complexity

**Solution:**
- Wrap Capacitor HTTP in retry loop
- If Capacitor fails after retries, fall back to Supabase JS (with retry)
- Same pattern as create listing (simpler - just Blob upload)

**Complexity:** ⭐ Low - Straightforward pattern

---

### Issue 2: **Multiple Upload Paths** ⚠️

**Problem:**
- 3 different upload paths:
  1. Capacitor HTTP (iOS/Android)
  2. Supabase JS fallback
  3. Web Supabase JS

**Solution:**
- Add retry logic to each path independently
- Each path can have its own retry loop
- Consistent error handling across all paths

**Complexity:** ⭐ Low - Just copy pattern 3 times

---

### Issue 3: **File Object Validity** ✅ Not an Issue

**Potential Concern:**
- File objects stored in memory
- Will they remain valid during retries?

**Analysis:**
- ✅ Files are uploaded immediately (no state storage)
- ✅ File objects remain valid during retry loop
- ✅ No state management issues

**Solution:** No changes needed - files are fresh from input

---

### Issue 4: **User Experience During Retries** ⚠️

**Problem:**
- User sees loading card while upload retries
- Multiple retries = longer wait time

**Current State:**
- Already shows loading card (optimistic message)
- User experience is already handled

**Solution:** 
- ✅ No changes needed - loading card already shows
- Retry logic is transparent to user

---

### Issue 5: **Error Messages** ⚠️

**Problem:**
- Error messages need to be clear
- Should show after all retries exhausted

**Current State:**
- Error messages already exist
- Just need to preserve them after retry loop

**Solution:**
- ✅ No changes needed - error handling already exists
- Just add retry before throwing error

---

### Issue 6: **Timeout Handling** ⚠️

**Problem:**
- 30-second timeout per attempt
- With 3 retries = up to 90 seconds total

**Analysis:**
- ✅ This is acceptable (better than failing immediately)
- ✅ Create listing uses same timeout
- ✅ User already sees loading card

**Solution:** Use same 30-second timeout as create listing

---

### Issue 7: **Concurrent Uploads** ✅ Not an Issue

**Problem:**
- Multiple files upload simultaneously
- Could retry logic interfere?

**Analysis:**
- ✅ Each file has independent retry loop
- ✅ No shared state between uploads
- ✅ Already handles concurrent uploads

**Solution:** No changes needed - each upload is independent

---

## Implementation Steps

### Step 1: Add Retry to Supabase JS Upload (Web Path) - 10 min
- Lines 703-720 in `individual/page.tsx`
- Copy pattern from create listing
- Wrap existing upload in retry loop

### Step 2: Add Retry to Supabase JS Fallback - 10 min
- Lines 688-698 in `individual/page.tsx`
- Same pattern as Step 1
- Handles fallback from Capacitor HTTP

### Step 3: Add Retry to Capacitor HTTP - 10 min
- Lines 661-682 in `individual/page.tsx`
- Wrap Capacitor HTTP call in retry loop
- Handle Capacitor-specific errors

### Step 4: Test - 5-10 min
- Test on iOS (main use case)
- Verify retry logs appear
- Confirm success after retries

---

## Risk Assessment

### Low Risk ✅
- ✅ Pattern already proven (create listing works)
- ✅ No state management changes
- ✅ No UI changes needed
- ✅ Backward compatible (only adds retry, doesn't change behavior)

### Medium Risk ⚠️
- ⚠️ Capacitor HTTP retry (different API)
  - **Mitigation:** Same retry pattern, just different API call
- ⚠️ Testing on iOS (need to verify)
  - **Mitigation:** Create listing already works, same pattern

### High Risk ❌
- None identified

---

## Testing Checklist

- [ ] Test single image upload (iOS)
- [ ] Test multiple image upload (iOS)
- [ ] Test upload with network issues (iOS)
- [ ] Test timeout scenario (iOS)
- [ ] Verify retry logs appear
- [ ] Verify success after retries
- [ ] Verify error after all retries fail
- [ ] Test web upload (if applicable)

---

## Time Breakdown

| Task | Time | Notes |
|------|------|-------|
| Add retry to Web Supabase JS | 10 min | Straightforward copy |
| Add retry to Supabase JS fallback | 10 min | Same pattern |
| Add retry to Capacitor HTTP | 10 min | Slightly different API |
| Test on iOS | 10 min | Verify it works |
| **Total** | **40 min** | Conservative estimate |

**Realistic:** 30-45 minutes total

---

## Potential Complications

### 1. **Capacitor HTTP API Differences** ⚠️

**Issue:** Capacitor HTTP uses different error format

**Solution:**
- Check `response.status` for errors
- Wrap in try-catch for network errors
- Same retry pattern applies

**Impact:** Low - just need to handle error format

---

### 2. **Base64 Conversion in Capacitor Path** ⚠️

**Issue:** Capacitor HTTP converts to base64 (lines 655-657)

**Analysis:**
- Conversion happens once before upload
- Base64 string is valid for retries
- No issue with multiple retries

**Impact:** None - conversion is fine

---

### 3. **File Object Reuse** ✅

**Issue:** Using same File object for multiple retries

**Analysis:**
- ✅ File objects are valid for multiple reads
- ✅ Create listing uses same pattern
- ✅ No issues expected

**Impact:** None

---

## Conclusion

### Time Estimate: **30-45 minutes**

**Reasons:**
- ✅ Straightforward copy of working pattern
- ✅ Only 3 upload paths to modify
- ✅ No complex changes needed
- ✅ Pattern already proven to work

### Risk Level: **Low**

**Reasons:**
- ✅ Pattern already working (create listing)
- ✅ No breaking changes
- ✅ Backward compatible
- ✅ No state management complexity

### Confidence: **High**

**Reasons:**
- ✅ Create listing proves pattern works
- ✅ Same network errors
- ✅ Same retry logic
- ✅ Low complexity

---

*Plan created: 2025-01-08*



