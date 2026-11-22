import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';
import { compressImageForFirestore } from './imageUtils';

function sanitizeFileName(fileName: string | null): string {
  const base = (fileName || 'announcement.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.slice(0, 120) || 'announcement.jpg';
}

/**
 * Uploads the announcement image to Firebase Storage under the authenticated student's folder.
 * Falls back to a compressed thumbnail if Storage rules or bucket are not yet enabled.
 */
export async function uploadAnnouncementImageToStorage(
  uid: string,
  announcementId: string,
  imageUrl: string | null,
  imageName: string | null
): Promise<string> {
  if (!imageUrl) return '';

  // Keep static sample paths directly if not a data URL
  if (!imageUrl.startsWith('data:')) {
    return imageUrl.slice(0, 250000);
  }

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const safeName = sanitizeFileName(imageName);
    const storagePath = `users/${uid}/announcements/${announcementId}/${safeName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.warn(
      'Firebase Storage upload unavailable, falling back to compact Firestore thumbnail:',
      error
    );
    return compressImageForFirestore(imageUrl);
  }
}

/**
 * Deletes an announcement image from Firebase Storage if the stored URL points to Firebase Storage.
 */
export async function deleteAnnouncementImageFromStorage(
  imageUrl: string | null
): Promise<void> {
  if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
    return;
  }

  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Could not delete Storage object (may already be removed):', error);
  }
}
