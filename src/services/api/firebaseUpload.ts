import * as FileSystem from 'expo-file-system/legacy';
import { storage } from '../../lib/firebase';

export interface UploadableImage {
  uri: string;
  name?: string | null;
  type?: string | null;
}

function fileUriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new TypeError('Could not read the selected photo'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

async function cachedFileUri(uri: string): Promise<string> {
  const extension = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  const safeExtension = extension && /^[a-z0-9]+$/.test(extension) && extension.length <= 5 ? extension : 'jpg';
  const cachedUri = `${FileSystem.cacheDirectory}upload-${Date.now()}.${safeExtension}`;
  await FileSystem.copyAsync({ from: uri, to: cachedUri });
  return cachedUri;
}

/**
 * Upload a single image to Firebase Storage and return its public URL.
 * Uses the Storage REST API because the Firebase web SDK builds blobs from
 * ArrayBuffer, which React Native does not support.
 */
export async function uploadCommunityImageToFirebase(
  file: UploadableImage,
  folder = 'community-images'
): Promise<string> {
  try {
    const bucket = storage.app.options.storageBucket;
    if (!bucket) {
      throw new Error('Firebase storage is not configured');
    }

    const timestamp = Date.now();
    const filename = (file.name || `image-${timestamp}.jpg`).replace(/[^\w.-]+/g, '-');
    const objectPath = `${folder}/${timestamp}-${filename}`;
    const localUri = await cachedFileUri(file.uri);
    const blob = await fileUriToBlob(localUri);
    const endpoint =
      `https://firebasestorage.googleapis.com/v0/b/${bucket}/o` +
      `?uploadType=media&name=${encodeURIComponent(objectPath)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
      body: blob,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Photo upload failed (${response.status})`);
    }

    const payload = await response.json();
    const storedName = encodeURIComponent(payload.name || objectPath);
    const token = payload.downloadTokens ? `&token=${payload.downloadTokens}` : '';
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${storedName}?alt=media${token}`;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[firebaseUpload] uploadCommunityImageToFirebase error:', error);
    }
    throw new Error(error?.message || 'Failed to upload image to Firebase Storage');
  }
}
