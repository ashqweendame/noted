import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  ActionItem,
  Announcement,
  AnnouncementCategory,
  AnnouncementDraft,
  DeadlineItem,
  ImportantDateItem,
  PriorityLevel,
} from '../types/announcement';

const VALID_CATEGORIES = new Set<AnnouncementCategory>([
  'Examination',
  'Enrollment',
  'Submission Deadline',
  'Academic Requirement',
  'Event / Seminar',
  'General Notice',
  'Other',
]);

const VALID_PRIORITIES = new Set<PriorityLevel>(['High', 'Medium', 'Low']);

function truncateString(value: string | null | undefined, max: number): string {
  const cleaned = (value ?? '').trim();
  return cleaned.length > max ? cleaned.slice(0, max) : cleaned;
}

function toIsoString(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (typeof ts === 'string' && ts.length > 0) {
    return ts;
  }
  return new Date().toISOString();
}

function sanitizeImportantDates(items: ImportantDateItem[]): ImportantDateItem[] {
  return items.slice(0, 25).map((item, idx) => ({
    id: truncateString(item.id, 64) || `date_${idx}`,
    label: truncateString(item.label, 200),
    rawText: truncateString(item.rawText, 200),
    normalizedDate: item.normalizedDate && /^\d{4}-\d{2}-\d{2}$/.test(item.normalizedDate)
      ? item.normalizedDate
      : null,
    time: item.time ? truncateString(item.time, 80) : null,
  }));
}

function sanitizeDeadlines(items: DeadlineItem[]): DeadlineItem[] {
  return items.slice(0, 25).map((item, idx) => ({
    id: truncateString(item.id, 64) || `dl_${idx}`,
    task: truncateString(item.task, 200),
    rawText: truncateString(item.rawText, 200),
    dueDate: item.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)
      ? item.dueDate
      : null,
    dueTime: item.dueTime ? truncateString(item.dueTime, 80) : null,
    isCompleted: Boolean(item.isCompleted),
  }));
}

function sanitizeActions(items: ActionItem[]): ActionItem[] {
  return items.slice(0, 30).map((item, idx) => ({
    id: truncateString(item.id, 64) || `act_${idx}`,
    text: truncateString(item.text, 240),
    isCompleted: Boolean(item.isCompleted),
  }));
}

function sanitizeStringList(items: string[], maxItems: number, maxLen: number): string[] {
  return items
    .map((s) => truncateString(s, maxLen))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}

export async function ensureUserProfile(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    const displayName = truncateString(user.displayName || user.email || 'DCISM Student', 120);
    const email = truncateString(user.email || 'student@dcism.local', 200);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        displayName,
        email,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function subscribeToAnnouncements(
  uid: string,
  onData: (announcements: Announcement[]) => void,
  onError?: (error: Error) => void
): () => void {
  const collectionPath = `users/${uid}/announcements`;
  const q = query(
    collection(db, 'users', uid, 'announcements'),
    where('ownerId', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Announcement[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const category = VALID_CATEGORIES.has(data.category as AnnouncementCategory)
          ? (data.category as AnnouncementCategory)
          : 'General Notice';
        const priority = VALID_PRIORITIES.has(data.priority as PriorityLevel)
          ? (data.priority as PriorityLevel)
          : 'Medium';

        return {
          id: docSnap.id,
          title: typeof data.title === 'string' ? data.title : 'Untitled Announcement',
          originalText:
            typeof data.originalText === 'string' && data.originalText.trim().length > 0
              ? data.originalText
              : null,
          category,
          shortSummary: typeof data.shortSummary === 'string' ? data.shortSummary : '',
          targetAudience:
            typeof data.targetAudience === 'string' && data.targetAudience.trim().length > 0
              ? data.targetAudience
              : null,
          importantDates: Array.isArray(data.importantDates) ? data.importantDates : [],
          deadlines: Array.isArray(data.deadlines) ? data.deadlines : [],
          requiredActions: Array.isArray(data.requiredActions) ? data.requiredActions : [],
          requiredDocuments: Array.isArray(data.requiredDocuments) ? data.requiredDocuments : [],
          priority,
          uncertainOrMissingInfo: Array.isArray(data.uncertainOrMissingInfo)
            ? data.uncertainOrMissingInfo
            : [],
          imageUrl:
            typeof data.imageUrl === 'string' && data.imageUrl.length > 0
              ? data.imageUrl
              : null,
          imageName:
            typeof data.imageName === 'string' && data.imageName.length > 0
              ? data.imageName
              : null,
          createdAt: toIsoString(data.createdAt),
          updatedAt: toIsoString(data.updatedAt),
        };
      });
      items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveAnnouncementToFirestore(
  uid: string,
  draft: AnnouncementDraft,
  customId?: string
): Promise<string> {
  const category = VALID_CATEGORIES.has(draft.category) ? draft.category : 'General Notice';
  const priority = VALID_PRIORITIES.has(draft.priority) ? draft.priority : 'Medium';

  const sanitizedFields = {
    title: truncateString(draft.title, 200),
    originalText: truncateString(draft.originalText, 8000),
    category,
    shortSummary: truncateString(draft.shortSummary, 1500),
    targetAudience: truncateString(draft.targetAudience, 200),
    importantDates: sanitizeImportantDates(draft.importantDates),
    deadlines: sanitizeDeadlines(draft.deadlines),
    requiredActions: sanitizeActions(draft.requiredActions),
    requiredDocuments: sanitizeStringList(draft.requiredDocuments, 25, 200),
    priority,
    uncertainOrMissingInfo: sanitizeStringList(draft.uncertainOrMissingInfo, 20, 300),
  };

  if (draft.editingId) {
    const docPath = `users/${uid}/announcements/${draft.editingId}`;
    const docRef = doc(db, 'users', uid, 'announcements', draft.editingId);
    try {
      await updateDoc(docRef, {
        ...sanitizedFields,
        updatedAt: serverTimestamp(),
      });
      return draft.editingId;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  }

  const newId =
    customId && customId.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(customId)
      ? customId
      : `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const docPath = `users/${uid}/announcements/${newId}`;
  const docRef = doc(db, 'users', uid, 'announcements', newId);

  try {
    await setDoc(docRef, {
      id: newId,
      ownerId: uid,
      ...sanitizedFields,
      imageUrl: truncateString(draft.imageUrl, 250000),
      imageName: truncateString(draft.imageName, 200),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function toggleAnnouncementTasksInFirestore(
  uid: string,
  announcementId: string,
  deadlines: DeadlineItem[],
  requiredActions: ActionItem[]
): Promise<void> {
  const docPath = `users/${uid}/announcements/${announcementId}`;
  const docRef = doc(db, 'users', uid, 'announcements', announcementId);

  try {
    await updateDoc(docRef, {
      deadlines: sanitizeDeadlines(deadlines),
      requiredActions: sanitizeActions(requiredActions),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteAnnouncementFromFirestore(
  uid: string,
  announcementId: string
): Promise<void> {
  const docPath = `users/${uid}/announcements/${announcementId}`;
  const docRef = doc(db, 'users', uid, 'announcements', announcementId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
