/**
 * Unified file upload utility with compression, retry, and error handling
 * Used by both gallery and chat upload systems
 */

import { getSupabaseClient } from './supabaseClient';
import { compressImage, CompressImageOptions, fileToDataURL } from './imageUtils';

/**
 * Convert data URL to Blob (matches chat system implementation)
 */
function dataURLtoBlob(dataurl: string): Blob {
  try {
    if (!dataurl || typeof dataurl !== 'string') {
      throw new Error('Invalid data URL: not a string');
    }
    if (!dataurl.includes(',')) {
      throw new Error('Invalid data URL format: missing comma separator');
    }
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = arr[1];
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Empty base64 data');
    }
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  } catch (error) {
    console.error('dataURLtoBlob error:', error);
    throw error;
  }
}

export interface UploadOptions {
  bucket: string;
  path: string;
  compress?: boolean;
  compressOptions?: CompressImageOptions;
  maxRetries?: number;
  maxFileSize?: number; // in bytes
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  path: string;
  url: string;
  size: number; // final file size after compression
}

/**
 * Upload a file or blob to Supabase Storage with compression, retry, and error handling
 */
export async function uploadFileWithRetry(
  file: File | Blob,
  options: UploadOptions
): Promise<UploadResult> {
  const {
    bucket,
    path,
    compress = true,
    compressOptions = {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
    },
    maxRetries = 5, // Increased from 3 to 5 for better reliability (95%+)
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    onProgress,
  } = options;

  // 1. Convert Blob to File if needed (for base64 data URLs)
  let fileObj: File;
  if (file instanceof Blob && !(file instanceof File)) {
    // Convert Blob to File for compression
    fileObj = new File([file], 'image.jpg', { type: file.type || 'image/jpeg' });
  } else {
    fileObj = file as File;
  }

  // 2. Validate file size
  if (file.size > maxFileSize) {
    const fileName = fileObj instanceof File ? fileObj.name : 'image';
    throw new Error(
      `File "${fileName}" is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`
    );
  }

  // 3. Validate file type (images only for now)
  if (!fileObj.type.startsWith('image/')) {
    const fileName = fileObj instanceof File ? fileObj.name : 'file';
    throw new Error(`File "${fileName}" is not a valid image file`);
  }

  // 4. Compress if needed
  let processedFile = fileObj;
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (compress && fileObj.type.startsWith('image/')) {
    try {
      processedFile = await compressImage(fileObj, compressOptions);
      console.log(
        `📸 Image compressed: ${Math.round(fileObj.size / 1024)}KB → ${Math.round(processedFile.size / 1024)}KB`
      );
      
      // On iOS, ensure the compressed file is properly formatted
      if (isIOS && processedFile instanceof File) {
        // Verify the compressed file is valid by checking its size
        if (processedFile.size === 0) {
          console.warn('⚠️ iOS: Compressed file has 0 size, using original');
          processedFile = fileObj;
        } else {
          // Re-create File object to ensure iOS compatibility
          try {
            const arrayBuffer = await processedFile.arrayBuffer();
            processedFile = new File([arrayBuffer], processedFile.name, { 
              type: processedFile.type || 'image/jpeg',
              lastModified: Date.now()
            });
            console.log('📱 iOS: Re-created File object from ArrayBuffer for compatibility');
          } catch (recreateError) {
            console.warn('⚠️ iOS: Failed to recreate File object, using compressed file as-is:', recreateError);
          }
        }
      }
    } catch (compressError) {
      console.warn('Failed to compress image, using original:', compressError);
      // Continue with original file if compression fails
      processedFile = fileObj;
    }
  }

  // 4. Get Supabase client
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // 5. Verify session
  console.log('🔐 Checking authentication session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Session check error:', sessionError);
    throw new Error(`Session check failed: ${sessionError.message}`);
  }
  
  if (!session) {
    console.error('❌ No active session found');
    throw new Error('No active session. Please log in again.');
  }

  console.log('✅ Session verified:', {
    userId: session.user?.id,
    expiresAt: session.expires_at,
    hasAccessToken: !!session.access_token,
    hasRefreshToken: !!session.refresh_token,
  });

  // 6. Verify bucket exists and is accessible
  console.log(`🔍 Verifying bucket "${bucket}" exists and is accessible...`);
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.warn('⚠️ Could not list buckets (non-critical):', bucketError);
    } else {
      const targetBucket = buckets?.find(b => b.id === bucket);
      if (targetBucket) {
        console.log(`✅ Bucket "${bucket}" verified:`, {
          id: targetBucket.id,
          name: targetBucket.name,
          public: targetBucket.public,
        });
      } else {
        console.warn(`⚠️ Bucket "${bucket}" not found in buckets list (upload will verify)`);
      }
    }
  } catch (bucketCheckError) {
    console.warn('⚠️ Bucket verification skipped (non-critical):', bucketCheckError);
  }

  // 6.5. Test network connectivity to Supabase Storage endpoint
  console.log(`🌐 Testing network connectivity to Supabase Storage...`);
  try {
    const storageUrl = supabase.storage.url;
    const testUrl = `${storageUrl}/object/public/${bucket}/.test`;
    console.log(`🔗 Testing connectivity to: ${testUrl.substring(0, 60)}...`);
    
    const testResponse = await fetch(testUrl, {
      method: 'HEAD',
      mode: 'no-cors', // This will always succeed, but we can check if the request is made
    });
    console.log(`✅ Network test completed (no-cors mode, always succeeds)`);
  } catch (networkTestError) {
    console.warn('⚠️ Network connectivity test failed (non-critical):', networkTestError);
  }

  // 6. Upload with retry mechanism (enhanced for 95%+ reliability)
  let retryCount = 0;
  let lastError: Error | null = null;
  
  // Small delay before first attempt to let network stabilize (iOS WebView quirk)
  if (typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  while (retryCount < maxRetries) {
    try {
      if (onProgress && retryCount === 0) {
        onProgress(25); // Starting upload
      }

      // Log upload attempt details
      console.log(`📤 Upload attempt ${retryCount + 1}/${maxRetries}:`, {
        bucket,
        path,
        fileSize: processedFile.size,
        fileType: processedFile.type,
        fileName: fileObj instanceof File ? fileObj.name : 'image',
        isFile: processedFile instanceof File,
        isBlob: processedFile instanceof Blob,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        isIOS: typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent),
      });

      // Convert File to Blob for upload (matches chat system - more reliable on iOS)
      // iOS WebView has issues uploading File objects directly, especially after compression
      // Use the same method as chat: File -> DataURL -> Blob (most reliable on iOS)
      let uploadBlob: Blob;
      
      if (processedFile instanceof File) {
        try {
          // Method 1: Try dataURL approach (matches chat system exactly)
          console.log('📦 Converting File to Blob via dataURL (chat system method)...');
          const dataUrl = await fileToDataURL(processedFile);
          uploadBlob = dataURLtoBlob(dataUrl);
          console.log(`✅ File converted to Blob via dataURL (${Math.round(uploadBlob.size / 1024)}KB, type: ${uploadBlob.type})`);
        } catch (dataUrlError) {
          console.warn('⚠️ DataURL conversion failed, trying FileReader method:', dataUrlError);
          try {
            // Method 2: Fallback to FileReader (ArrayBuffer method)
            console.log('📦 Converting File to Blob via FileReader (fallback method)...');
            const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                  resolve(reader.result);
                } else {
                  reject(new Error('FileReader did not return ArrayBuffer'));
                }
              };
              reader.onerror = () => reject(new Error('FileReader failed'));
              reader.readAsArrayBuffer(processedFile);
            });
            uploadBlob = new Blob([arrayBuffer], { type: processedFile.type || 'image/jpeg' });
            console.log(`✅ File converted to Blob via FileReader (${Math.round(uploadBlob.size / 1024)}KB, type: ${uploadBlob.type})`);
          } catch (conversionError) {
            console.warn('⚠️ Both conversion methods failed, using File directly:', conversionError);
            // Fallback: use File directly (may fail on iOS but worth trying)
            uploadBlob = processedFile;
          }
        }
      } else {
        // Already a Blob
        uploadBlob = processedFile;
      }

      // Validate blob before upload
      if (!uploadBlob || uploadBlob.size === 0) {
        throw new Error(`File is empty (size: ${uploadBlob?.size || 0} bytes)`);
      }

      // Log detailed upload information before attempting upload
      console.log(`🔍 Pre-upload diagnostics:`, {
        bucket,
        path,
        blobSize: uploadBlob.size,
        blobType: uploadBlob.type,
        isBlob: uploadBlob instanceof Blob,
        isFile: uploadBlob instanceof File,
        blobConstructor: uploadBlob.constructor.name,
        hasArrayBuffer: typeof uploadBlob.arrayBuffer === 'function',
        supabaseUrl: supabase.storage.url,
        supabaseBucket: bucket,
      });

      // Verify blob is readable and recreate if needed (iOS WebView can corrupt blobs between retries)
      try {
        const testArrayBuffer = await uploadBlob.slice(0, 1).arrayBuffer();
        console.log(`✅ Blob is readable (test slice: ${testArrayBuffer.byteLength} bytes)`);
        
        // On iOS, recreate blob from ArrayBuffer between retries for reliability
        if (retryCount > 0 && typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
          console.log('📱 iOS: Recreating blob from ArrayBuffer for retry attempt...');
          const fullArrayBuffer = await uploadBlob.arrayBuffer();
          uploadBlob = new Blob([fullArrayBuffer], { type: uploadBlob.type || 'image/jpeg' });
          console.log(`✅ Blob recreated for retry (${Math.round(uploadBlob.size / 1024)}KB)`);
        }
      } catch (blobTestError) {
        console.error(`❌ Blob is NOT readable:`, blobTestError);
        // Try to recreate blob from original file if available
        if (retryCount === 0 && processedFile instanceof File) {
          console.log('🔄 Attempting to recreate blob from original file...');
          try {
            const dataUrl = await fileToDataURL(processedFile);
            uploadBlob = dataURLtoBlob(dataUrl);
            console.log(`✅ Blob recreated from original file (${Math.round(uploadBlob.size / 1024)}KB)`);
          } catch (recreateError) {
            throw new Error(`Blob is not readable: ${blobTestError instanceof Error ? blobTestError.message : String(blobTestError)}`);
          }
        } else {
          throw new Error(`Blob is not readable: ${blobTestError instanceof Error ? blobTestError.message : String(blobTestError)}`);
        }
      }

      // Upload with timeout handling (matches chat system)
      console.log(`🚀 Starting Supabase Storage upload...`);
      const uploadStartTime = Date.now();
      
      // Try FormData approach as alternative (sometimes more reliable on iOS)
      let uploadPromise;
      try {
        // Method 1: Try direct blob upload (standard approach)
        console.log(`📤 Attempting direct blob upload...`);
        uploadPromise = supabase.storage
          .from(bucket)
          .upload(path, uploadBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: uploadBlob.type || 'image/jpeg', // CRITICAL: Include contentType (matches chat system)
          });
      } catch (uploadInitError) {
        console.warn('⚠️ Direct blob upload initialization failed, trying FormData approach:', uploadInitError);
        // Method 2: Fallback to FormData (sometimes more reliable on iOS)
        try {
          console.log(`📤 Attempting FormData upload as fallback...`);
          const formData = new FormData();
          const file = uploadBlob instanceof File 
            ? uploadBlob 
            : new File([uploadBlob], path.split('/').pop() || 'image.jpg', { type: uploadBlob.type || 'image/jpeg' });
          formData.append('file', file);
          
          // Use fetch directly with FormData
          const storageUrl = supabase.storage.url;
          const uploadUrl = `${storageUrl}/object/${bucket}/${path}`;
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            throw new Error('No active session for FormData upload');
          }
          
          uploadPromise = fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            },
            body: formData,
          }).then(async (response) => {
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }
            return { data: { path }, error: null };
          });
        } catch (formDataError) {
          console.error('❌ FormData upload also failed:', formDataError);
          throw formDataError;
        }
      }
      
      // Add timeout (45 seconds per upload - increased for better reliability)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 45 seconds')), 45000)
      );
      
      console.log(`⏱️ Upload promise created, racing with timeout...`);
      const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`⏱️ Upload promise resolved after ${uploadDuration}ms`);
      
      const { data, error } = result;
      
      if (error) {
        console.error(`❌ Upload promise returned error immediately:`, {
          errorName: error.name,
          errorMessage: error.message,
          errorStatus: (error as any).status,
          errorStatusCode: (error as any).statusCode,
        });
      } else {
        console.log(`✅ Upload promise returned data:`, {
          path: data?.path,
          hasPath: !!data?.path,
        });
      }

      if (error) {
        // Log detailed error information
        console.error(`❌ Storage upload error (attempt ${retryCount + 1}):`, {
          errorType: error.constructor?.name,
          errorName: error.name,
          errorMessage: error.message,
          errorStatus: (error as any).status,
          errorStatusCode: (error as any).statusCode,
          errorStack: error.stack,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          errorKeys: Object.keys(error),
          errorValues: Object.values(error),
          originalError: (error as any).originalError,
          context: (error as any).context,
          blobSize: uploadBlob.size,
          blobType: uploadBlob.type,
        });
        
        // Check if error is retryable (matches chat system)
        const isRetryable = error.message?.includes('network') || 
                           error.message?.includes('timeout') ||
                           error.message?.includes('Load failed') ||
                           error.name === 'StorageUnknownError';
        
        if (!isRetryable || retryCount >= maxRetries - 1) {
          throw error; // Non-retryable or max retries reached
        }
        
        // Retryable error - throw to trigger retry in catch block
        throw error;
      }

      // Success path - no error
      if (!data || !data.path) {
        throw new Error('Upload succeeded but no path returned');
      }

      if (onProgress) {
        onProgress(75); // Upload complete, getting URL
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (onProgress) {
        onProgress(100); // Complete
      }

      console.log(`✅ File uploaded successfully: ${path} (${Math.round(uploadBlob.size / 1024)}KB)`);

      return {
        path: data.path,
        url: publicUrl,
        size: uploadBlob.size,
      };
    } catch (error) {
      // Handle timeout errors separately (matches chat system)
      if (error instanceof Error && error.message?.includes('timeout')) {
        if (retryCount < maxRetries - 1) {
          retryCount++;
          // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s
          const baseDelay = 1000 * Math.pow(2, retryCount - 1);
          const jitter = Math.random() * 500; // Add random 0-500ms jitter
          const delay = baseDelay + jitter;
          const fileName = fileObj instanceof File ? fileObj.name : 'image';
          console.warn(
            `⚠️ Upload timeout, retrying in ${(delay / 1000).toFixed(1)}s... (${retryCount}/${maxRetries})`
          );
          
          // Refresh session before retry (network issues might be auth-related)
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              await supabase.auth.refreshSession();
              console.log('✅ Session refreshed before retry');
            }
          } catch (refreshError) {
            console.warn('⚠️ Session refresh failed (non-critical):', refreshError);
          }
          
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Capture detailed error information
      const errorDetails = {
        errorType: error?.constructor?.name,
        errorName: (error as any)?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        fullError: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : 'null',
        errorKeys: error ? Object.keys(error) : [],
        errorValues: error ? Object.values(error) : [],
        originalError: (error as any)?.originalError,
        context: (error as any)?.context,
        status: (error as any)?.status,
        statusCode: (error as any)?.statusCode,
      };

      console.error(`❌ Upload error caught (attempt ${retryCount + 1}):`, errorDetails);

      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount++;

      // Check if error is retryable (matches chat system logic)
      const isRetryable = lastError.message?.includes('network') || 
                         lastError.message?.includes('timeout') ||
                         lastError.message?.includes('Load failed') ||
                         lastError.name === 'StorageUnknownError';

      if (retryCount < maxRetries && isRetryable) {
        retryCount++;
        // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s
        const baseDelay = 1000 * Math.pow(2, retryCount - 1);
        const jitter = Math.random() * 500; // Add random 0-500ms jitter to prevent thundering herd
        const delay = baseDelay + jitter;
        const fileName = fileObj instanceof File ? fileObj.name : 'image';
        console.warn(
          `⚠️ Upload attempt ${retryCount} failed for "${fileName}", retrying in ${(delay / 1000).toFixed(1)}s... (${retryCount}/${maxRetries})`,
          errorDetails
        );
        
        // Refresh session before retry (network issues might be auth-related)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.auth.refreshSession();
            console.log('✅ Session refreshed before retry');
          }
        } catch (refreshError) {
          console.warn('⚠️ Session refresh failed (non-critical):', refreshError);
        }
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Final failure - include all error details
      const fileName = fileObj instanceof File ? fileObj.name : 'image';
      console.error(
        `❌ Failed to upload "${fileName}" after ${retryCount} attempts:`,
        errorDetails
      );
      
      // Create a more informative error message
      const errorMessage = errorDetails.errorMessage || 
        errorDetails.errorName || 
        'Unknown upload error';
      
      throw new Error(
        `Failed to upload "${fileName}": ${errorMessage}${errorDetails.statusCode ? ` (Status: ${errorDetails.statusCode})` : ''}`
      );
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Upload failed');
}

/**
 * Upload multiple files or blobs sequentially with progress tracking
 */
export async function uploadFilesSequentially(
  files: (File | Blob)[],
  options: Omit<UploadOptions, 'path'> & {
    generatePath: (file: File | Blob, index: number) => string;
  },
  onFileProgress?: (index: number, progress: number) => void,
  onFileComplete?: (index: number, result: UploadResult) => void,
  onFileError?: (index: number, error: Error) => void
): Promise<UploadResult[]> {
  console.log(`📦 uploadFilesSequentially: Starting upload of ${files.length} file(s)`, {
    bucket: options.bucket,
    compress: options.compress,
    maxRetries: options.maxRetries,
    maxFileSize: options.maxFileSize,
  });

  const results: UploadResult[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = options.generatePath(file, i);
    
    const fileName = file instanceof File ? file.name : `blob-${i}`;
    console.log(`📤 uploadFilesSequentially: Processing file ${i + 1}/${files.length}: ${fileName}`, {
      fileSize: file.size,
      fileType: file instanceof File ? file.type : 'blob',
      path,
    });

    try {
      if (onFileProgress) {
        onFileProgress(i, 0);
      }

      console.log(`🚀 uploadFilesSequentially: Calling uploadFileWithRetry for file ${i + 1}...`);
      const result = await uploadFileWithRetry(file, {
        ...options,
        path,
        onProgress: (progress) => {
          if (onFileProgress) {
            onFileProgress(i, progress);
          }
        },
      });
      
      console.log(`✅ uploadFilesSequentially: File ${i + 1} uploaded successfully:`, result);

      results.push(result);
      if (onFileComplete) {
        onFileComplete(i, result);
      }
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error(String(error));
      errors.push({ index: i, error: uploadError });
          if (onFileError) {
        onFileError(i, uploadError);
      }
    }
  }

  if (errors.length > 0 && errors.length === files.length) {
    // All files failed
    const fileNames = files.map((f, idx) => 
      f instanceof File ? f.name : `image-${idx + 1}`
    );
    throw new Error(
      `All ${files.length} file(s) failed to upload:\n${errors.map((e) => `  - ${fileNames[e.index]}: ${e.error.message}`).join('\n')}`
    );
  }

  if (errors.length > 0) {
    // Some files failed
    const fileNames = files.map((f, idx) => 
      f instanceof File ? f.name : `image-${idx + 1}`
    );
    console.warn(
      `${errors.length} of ${files.length} file(s) failed to upload:`,
      errors.map((e) => `${fileNames[e.index]}: ${e.error.message}`)
    );
  }

  return results;
}
