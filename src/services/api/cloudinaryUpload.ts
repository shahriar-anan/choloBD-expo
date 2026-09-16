export interface UploadableImage {
  uri: string;
  name?: string | null;
  type?: string | null;
}

/**
 * Upload a single image to Cloudinary and return its secure URL.
 * Uploads are stored in the `cholo-bd/community/` folder with a timestamp-based filename.
 *
 * NOTE ON TRANSFORMATIONS:
 * Cloudinary's unsigned upload endpoint does NOT allow a `transformation`
 * parameter in the upload request — only a fixed allowlist of params is
 * accepted (upload_preset, folder, public_id, tags, context, etc). Sending
 * `transformation` causes a 400: "Transformation parameter is not allowed
 * when using unsigned upload."
 *
 * There are two correct ways to get mobile-optimized delivery with unsigned
 * uploads:
 *   1. (Recommended) Configure an "Incoming Transformation" on the upload
 *      preset itself, in the Cloudinary dashboard under
 *      Settings > Upload > Upload presets > (your preset) > Incoming Transformation.
 *      This applies the transformation at upload time, same as before.
 *   2. Apply the transformation at delivery time by rewriting the returned
 *      secure_url to inject transformation segments into the path. This is
 *      what `buildOptimizedUrl` below does, so callers get an optimized URL
 *      back without any dashboard configuration required.
 */
export async function uploadCommunityImageToCloudinary(file: UploadableImage): Promise<string> {
  try {
    // Cloudinary configuration from environment variables
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const uploadUrl = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL;

    if (!cloudName || !uploadPreset || !uploadUrl) {
      throw new Error(
        'Cloudinary configuration is missing. Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME, EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET, and EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL'
      );
    }

    // Generate a unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name?.split('.').pop() || 'jpg';
    const filename = `community-${timestamp}.${extension}`;

    // Prepare form data for Cloudinary unsigned upload
    const formData = new FormData();

    // Required: upload preset for unsigned upload
    formData.append('upload_preset', uploadPreset);

    // Optional: folder organization
    formData.append('folder', 'cholo-bd/community');

    // Optional: public_id (filename without extension)
    formData.append('public_id', filename.replace(/\.[^/.]+$/, ''));

    // `transformation` intentionally NOT included here — see note above.
    // It is not part of the allowed unsigned-upload parameter list and
    // will cause a 400 error if sent.

    // Optional: tags for organization
    formData.append('tags', 'community,cholo-bd,mobile');

    // Add the file
    // React Native requires a specific format for file uploads
    const fileObj = {
      uri: file.uri,
      name: filename,
      type: file.type || 'image/jpeg',
    };

    formData.append('file', fileObj as any);

    // Upload to Cloudinary with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Cloudinary upload failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();

    // Cloudinary returns secure_url for HTTPS delivery
    const rawSecureUrl = data.secure_url || data.url;

    if (!rawSecureUrl) {
      throw new Error('Cloudinary upload succeeded but no URL was returned');
    }

    // Apply mobile-optimized delivery transformation at the URL level
    // (f_auto: auto format, q_auto: auto quality, w_1200/h_1200: max
    // dimensions, c_limit: only downscale, never upscale).
    const secureUrl = buildOptimizedUrl(rawSecureUrl, 'f_auto,q_auto,w_1200,h_1200,c_limit');

    if (__DEV__) {
      console.log('[cloudinaryUpload] Upload successful:', {
        publicId: data.public_id,
        url: secureUrl,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
      });
    }

    return secureUrl;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[cloudinaryUpload] uploadCommunityImageToCloudinary error:', error);
    }
    // Provide more specific error messages
    if (error.name === 'AbortError') {
      throw new Error('Upload timed out. Please check your connection and try again.');
    }
    if (error.message?.includes('Network request failed')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error(error?.message || 'Failed to upload image to Cloudinary');
  }
}

/**
 * Insert a transformation string into a Cloudinary delivery URL.
 * Cloudinary URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v12345/folder/name.jpg
 * Transformations go right after `/upload/`:
 *   https://res.cloudinary.com/<cloud>/image/upload/<transformation>/v12345/folder/name.jpg
 */
function buildOptimizedUrl(secureUrl: string, transformation: string): string {
  const marker = '/upload/';
  const idx = secureUrl.indexOf(marker);
  if (idx === -1) {
    // Not a standard delivery URL shape — return as-is rather than risk
    // producing a broken URL.
    return secureUrl;
  }
  const insertAt = idx + marker.length;
  return `${secureUrl.slice(0, insertAt)}${transformation}/${secureUrl.slice(insertAt)}`;
}

/**
 * Delete an image from Cloudinary (optional - for future use)
 * Requires signed upload or admin API - not implemented for unsigned uploads
 */
export async function deleteCommunityImageFromCloudinary(publicId: string): Promise<boolean> {
  // Note: Deleting requires signed requests or Admin API
  // This would need backend implementation with Cloudinary API secret
  if (__DEV__) {
    console.warn('[cloudinaryUpload] deleteCommunityImageFromCloudinary not implemented for unsigned uploads');
  }
  return false;
}
/**
 * Generic Cloudinary upload used by personal tours / builders.
 */
export async function cloudinaryUpload(
  uri: string,
  _folder?: string
): Promise<{ secure_url: string; url: string }> {
  const url = await uploadCommunityImageToCloudinary({ uri });
  return { secure_url: url, url };
}
