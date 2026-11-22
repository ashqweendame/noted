import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { Upload, X } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementDraft,
  AppPage,
  PriorityLevel,
  UploadedImageState,
} from './types/announcement';
import {
  announcementToDraft,
  computeDashboardMetrics,
} from './utils/announcementLogic';
import {
  deleteAnnouncementFromFirestore,
  ensureUserProfile,
  saveAnnouncementToFirestore,
  subscribeToAnnouncements,
  toggleAnnouncementTasksInFirestore,
} from './utils/firestoreAnnouncements';
import { imageSrcToPayload } from './utils/imageUtils';
import {
  deleteAnnouncementImageFromStorage,
  uploadAnnouncementImageToStorage,
} from './utils/storageUpload';
import { AuthGate } from './components/AuthGate';
import { SidebarNav } from './components/SidebarNav';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { ProcessingView } from './components/ProcessingView';
import { ReviewView } from './components/ReviewView';
import { ManagementView } from './components/ManagementView';

interface GeminiApiResponse {
  data?: {
    announcement_title: string | null;
    original_text: string | null;
    category: AnnouncementCategory;
    short_summary: string | null;
    target_audience: string | null;
    important_dates: {
      label: string;
      raw_text: string;
      normalized_date: string | null;
      time: string | null;
    }[];
    deadlines: {
      task: string;
      raw_text: string;
      due_date: string | null;
      due_time: string | null;
    }[];
    required_actions: string[];
    required_documents: string[];
    priority: PriorityLevel;
    uncertain_or_missing_info: string[];
  };
  error?: string;
}

const PAGE_LABELS: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  upload: 'Upload Announcement',
  processing: 'AI Processing',
  review: 'Announcement Review',
  manage: 'Announcement Management',
};

// Vercel Functions run up to 60s (see vercel.json); leave room for one server-side retry
const ANALYSIS_TIMEOUT_MS = 50000;

function getTodayIsoDate(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function formatReadableError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as {
      error?: string;
      operationType?: string;
      path?: string;
    };
    if (parsed && typeof parsed.error === 'string') {
      const context = parsed.operationType ? ` (${parsed.operationType})` : '';
      return `${parsed.error}${context}`;
    }
  } catch {
    // Use raw message directly
  }
  return raw;
}

function createEmptyManualDraft(image: UploadedImageState): AnnouncementDraft {
  return {
    title: '',
    originalText: '',
    category: 'General Notice',
    shortSummary: '',
    targetAudience: '',
    importantDates: [],
    deadlines: [],
    requiredActions: [],
    requiredDocuments: [],
    priority: 'Medium',
    uncertainOrMissingInfo: [
      'Entered manually — please verify all dates, deadlines, and requirements against the uploaded image.',
    ],
    imageUrl: image.imageUrl,
    imageName: image.imageName,
  };
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);

  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [selectedManagementId, setSelectedManagementId] = useState<string | null>(null);

  // Upload -> Gemini Processing -> Review state
  const [selectedImage, setSelectedImage] = useState<UploadedImageState | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<AnnouncementDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const todayIsoDate = useMemo(() => getTodayIsoDate(), []);

  // Re-throw Firestore listener errors to ErrorBoundary cleanly
  if (firestoreError) {
    throw firestoreError;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await ensureUserProfile(firebaseUser);
          setUser(firebaseUser);
          setAuthError(null);
        } catch (err) {
          setAuthError(
            formatReadableError(err, 'Unable to initialize student profile.')
          );
          setUser(null);
        }
      } else {
        setUser(null);
        setAnnouncements([]);
        setIsLoadingData(false);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    setIsLoadingData(true);
    setFirestoreError(null);

    const unsubscribe = subscribeToAnnouncements(
      user.uid,
      (items) => {
        setAnnouncements(items);
        setSelectedManagementId((prev) =>
          prev && items.some((a) => a.id === prev) ? prev : items[0]?.id ?? null
        );
        setIsLoadingData(false);
      },
      (err) => {
        setIsLoadingData(false);
        setFirestoreError(err);
      }
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const runGeminiExtraction = useCallback(async (image: UploadedImageState) => {
    setProcessingStage(0);
    setProcessingComplete(false);
    setAnalysisError(null);
    setReviewDraft(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      const { imageBase64, mimeType } = await imageSrcToPayload(image.imageUrl);
      setProcessingStage(1);

      // The API only accepts signed-in students; send a fresh Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Your session expired. Please sign in again.');
      }

      const res = await fetch('/api/announcements/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ imageBase64, mimeType }),
        signal: controller.signal,
      });

      setProcessingStage(2);
      const rawText = await res.text();
      let body: GeminiApiResponse = {};
      if (rawText) {
        try {
          body = JSON.parse(rawText) as GeminiApiResponse;
        } catch {
          body = {
            error:
              res.status === 413
                ? 'Image is too large to upload. Please use a smaller or compressed screenshot.'
                : `Server returned an unexpected response (${res.status}).`,
          };
        }
      }

      if (!res.ok || !body.data) {
        throw new Error(
          body.error || 'Gemini failed to extract announcement details from this image.'
        );
      }

      setProcessingStage(3);
      const extracted = body.data;
      const nowStamp = Date.now();

      const draft: AnnouncementDraft = {
        title: extracted.announcement_title ?? '',
        originalText: extracted.original_text ?? '',
        category: extracted.category,
        shortSummary: extracted.short_summary ?? '',
        targetAudience: extracted.target_audience ?? '',
        importantDates: extracted.important_dates.map((d, idx) => ({
          id: `ev_${nowStamp}_${idx}`,
          label: d.label,
          rawText: d.raw_text,
          normalizedDate: d.normalized_date,
          time: d.time,
        })),
        deadlines: extracted.deadlines.map((dl, idx) => ({
          id: `dl_${nowStamp}_${idx}`,
          task: dl.task,
          rawText: dl.raw_text,
          dueDate: dl.due_date,
          dueTime: dl.due_time,
          isCompleted: false,
        })),
        requiredActions: extracted.required_actions.map((text, idx) => ({
          id: `act_${nowStamp}_${idx}`,
          text,
          isCompleted: false,
        })),
        requiredDocuments: extracted.required_documents,
        priority: extracted.priority,
        uncertainOrMissingInfo: extracted.uncertain_or_missing_info,
        imageUrl: image.imageUrl,
        imageName: image.imageName,
      };

      setReviewDraft(draft);
      setProcessingComplete(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setAnalysisError(
          'AI analysis timed out. Please retry or try uploading a smaller screenshot.'
        );
      } else {
        setAnalysisError(
          formatReadableError(
            error,
            'An unexpected error occurred during AI processing.'
          )
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  // Upload progress animation -> start real Gemini processing
  useEffect(() => {
    if (uploadProgress === null) return;
    if (uploadProgress < 100) {
      const timer = window.setTimeout(() => {
        setUploadProgress((prev) => (prev === null ? null : Math.min(100, prev + 25)));
      }, 75);
      return () => window.clearTimeout(timer);
    }

    const doneTimer = window.setTimeout(() => {
      if (selectedImage) {
        setUploadProgress(null);
        setCurrentPage('processing');
        void runGeminiExtraction(selectedImage);
      }
    }, 120);
    return () => window.clearTimeout(doneTimer);
  }, [uploadProgress, selectedImage, runGeminiExtraction]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Google Sign-In did not complete.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setCurrentPage('dashboard');
    setSelectedImage(null);
    setReviewDraft(null);
  };

  const handleNavigate = (page: AppPage) => {
    setUploadProgress(null);
    setSaveError(null);
    setActionError(null);
    setCurrentPage(page);
  };

  const handleSelectAnnouncement = (id: string) => {
    setSelectedManagementId(id);
    setCurrentPage('manage');
  };

  const handleToggleDeadline = async (announcementId: string, deadlineId: string) => {
    if (!user) return;
    const target = announcements.find((a) => a.id === announcementId);
    if (!target) return;

    const updatedDeadlines = target.deadlines.map((dl) =>
      dl.id === deadlineId ? { ...dl, isCompleted: !dl.isCompleted } : dl
    );

    setActionError(null);
    try {
      await toggleAnnouncementTasksInFirestore(
        user.uid,
        announcementId,
        updatedDeadlines,
        target.requiredActions
      );
    } catch (error) {
      setActionError(
        formatReadableError(error, 'Could not update deadline status in Firestore.')
      );
    }
  };

  const handleToggleAction = async (announcementId: string, actionId: string) => {
    if (!user) return;
    const target = announcements.find((a) => a.id === announcementId);
    if (!target) return;

    const updatedActions = target.requiredActions.map((act) =>
      act.id === actionId ? { ...act, isCompleted: !act.isCompleted } : act
    );

    setActionError(null);
    try {
      await toggleAnnouncementTasksInFirestore(
        user.uid,
        announcementId,
        target.deadlines,
        updatedActions
      );
    } catch (error) {
      setActionError(
        formatReadableError(error, 'Could not update action status in Firestore.')
      );
    }
  };

  const handleSaveDraft = async (validatedDraft: AnnouncementDraft) => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      let savedId: string;

      if (validatedDraft.editingId) {
        savedId = await saveAnnouncementToFirestore(user.uid, validatedDraft);
      } else {
        const newId = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const storedImageUrl = await uploadAnnouncementImageToStorage(
          user.uid,
          newId,
          validatedDraft.imageUrl,
          validatedDraft.imageName
        );
        savedId = await saveAnnouncementToFirestore(
          user.uid,
          {
            ...validatedDraft,
            imageUrl: storedImageUrl || null,
          },
          newId
        );
      }

      setSelectedManagementId(savedId);
      setSelectedImage(null);
      setReviewDraft(null);
      setCurrentPage('manage');
    } catch (error) {
      setSaveError(
        formatReadableError(error, 'Could not save announcement to Firestore.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAnnouncement = (item: Announcement) => {
    setSaveError(null);
    setActionError(null);
    setReviewDraft(announcementToDraft(item));
    setCurrentPage('review');
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!user) return;
    const target = announcements.find((a) => a.id === id);
    setActionError(null);
    try {
      await deleteAnnouncementFromFirestore(user.uid, id);
      if (target?.imageUrl) {
        await deleteAnnouncementImageFromStorage(target.imageUrl);
      }
    } catch (error) {
      setActionError(
        formatReadableError(error, 'Could not delete announcement from Firestore.')
      );
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-sm text-slate-600">Loading Noted workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthGate
        onSignIn={handleSignIn}
        isSigningIn={isSigningIn}
        authError={authError}
      />
    );
  }

  const metrics = computeDashboardMetrics(announcements);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      <SidebarNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        totalAnnouncements={announcements.length}
        pendingTasksCount={metrics.pendingTasksCount}
        studentName={user.displayName || 'DCISM Student'}
        studentEmail={user.email || ''}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop Top Header (Breadcrumb + Single Primary CTA) */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between gap-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
            <span>Noted</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-900">{PAGE_LABELS[currentPage]}</span>
          </div>

          {currentPage !== 'upload' && (
            <button
              type="button"
              onClick={() => handleNavigate('upload')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Upload Announcement</span>
            </button>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {actionError && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between gap-3 border border-red-200 bg-red-50 rounded-xl px-4 py-3 text-xs text-red-800"
            >
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                aria-label="Dismiss error"
                className="p-1 text-red-700 hover:text-red-900 rounded"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {currentPage === 'dashboard' && (
            <DashboardView
              announcements={announcements}
              referenceIsoDate={todayIsoDate}
              isLoadingData={isLoadingData}
              onNavigate={handleNavigate}
              onSelectAnnouncement={handleSelectAnnouncement}
              onToggleDeadline={handleToggleDeadline}
            />
          )}

          {currentPage === 'upload' && (
            <UploadView
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
              onStartProcessing={() => {
                if (selectedImage) setUploadProgress(25);
              }}
              uploadProgress={uploadProgress}
              onCancel={() => handleNavigate('dashboard')}
            />
          )}

          {currentPage === 'processing' && selectedImage && (
            <ProcessingView
              imageUrl={selectedImage.imageUrl}
              imageName={selectedImage.imageName}
              stageIndex={processingStage}
              isComplete={processingComplete}
              analysisError={analysisError}
              extractedDraft={reviewDraft}
              onRetry={() => void runGeminiExtraction(selectedImage)}
              onManualFallback={() => {
                setReviewDraft(createEmptyManualDraft(selectedImage));
                setAnalysisError(null);
                setCurrentPage('review');
              }}
              onProceedToReview={() => setCurrentPage('review')}
              onCancel={() => {
                setSelectedImage(null);
                setReviewDraft(null);
                setAnalysisError(null);
                handleNavigate('upload');
              }}
            />
          )}

          {currentPage === 'review' && reviewDraft && (
            <ReviewView
              draft={reviewDraft}
              isSaving={isSaving}
              saveError={saveError}
              onChangeDraft={setReviewDraft}
              onSave={handleSaveDraft}
              onCancel={() => {
                const wasEditing = Boolean(reviewDraft.editingId);
                setReviewDraft(null);
                setSelectedImage(null);
                setSaveError(null);
                handleNavigate(wasEditing ? 'manage' : 'dashboard');
              }}
            />
          )}

          {currentPage === 'manage' && (
            <ManagementView
              announcements={announcements}
              selectedId={selectedManagementId}
              referenceIsoDate={todayIsoDate}
              onSelectId={setSelectedManagementId}
              onEditAnnouncement={handleEditAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onToggleDeadline={handleToggleDeadline}
              onToggleAction={handleToggleAction}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>
    </div>
  );
}
