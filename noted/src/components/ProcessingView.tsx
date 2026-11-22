import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import type { AnnouncementDraft } from '../types/announcement';
import { formatDisplayDate } from '../utils/announcementLogic';
import { AnnouncementImageFrame } from './AnnouncementImageFrame';

interface ProcessingViewProps {
  imageUrl: string | null;
  imageName: string;
  stageIndex: number;
  isComplete: boolean;
  analysisError: string | null;
  extractedDraft: AnnouncementDraft | null;
  onRetry: () => void;
  onManualFallback: () => void;
  onProceedToReview: () => void;
  onCancel: () => void;
}

const PROCESSING_STEPS = [
  'Uploading announcement image to Gemini analyzer',
  'Reading visible text and layout structure',
  'Extracting explicit dates, deadlines, and required documents',
  'Categorizing notice and checking for ambiguous details',
];

export function ProcessingView({
  imageUrl,
  imageName,
  stageIndex,
  isComplete,
  analysisError,
  extractedDraft,
  onRetry,
  onManualFallback,
  onProceedToReview,
  onCancel,
}: ProcessingViewProps) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Announcement Processing
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {analysisError
              ? 'Gemini could not complete image extraction. Review the error below.'
              : isComplete
              ? 'Gemini extraction complete. Inspect the preview below and proceed to review before saving.'
              : 'Analyzing the announcement image with Gemini to extract dates, deadlines, and actions.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="self-start sm:self-auto px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Status & Source Thumbnail */}
        <section
          aria-label="Processing status"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            {analysisError ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" aria-hidden="true" />
            ) : isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <Loader2
                className="w-5 h-5 text-blue-700 animate-spin shrink-0"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {analysisError
                  ? 'Extraction Interrupted'
                  : isComplete
                  ? 'Analysis Complete'
                  : 'Processing Announcement Image'}
              </p>
              <p className="text-xs text-slate-500 truncate">{imageName}</p>
            </div>
          </div>

          <ol className="space-y-3 border-t border-slate-100 pt-4">
            {PROCESSING_STEPS.map((label, idx) => {
              const stepDone = !analysisError && (isComplete || idx < stageIndex);
              const stepActive = !analysisError && !isComplete && idx === stageIndex;

              return (
                <li key={label} className="flex items-start gap-3 text-xs">
                  <span className="mt-0.5 shrink-0">
                    {stepDone ? (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-600"
                        aria-hidden="true"
                      />
                    ) : stepActive ? (
                      <Loader2
                        className="w-4 h-4 text-blue-700 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="block w-4 h-4 rounded-full border border-slate-300"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span
                    className={
                      stepDone
                        ? 'text-slate-900 font-medium'
                        : stepActive
                        ? 'text-blue-700 font-medium'
                        : 'text-slate-400'
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          <AnnouncementImageFrame
            imageUrl={imageUrl}
            alt={`Uploaded announcement ${imageName}`}
            fallbackTitle={imageName}
            className="h-52"
          />
        </section>

        {/* Right: Extracted Information Preview or Explicit Error State */}
        <section
          aria-label="Extracted announcement information"
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Extracted Announcement Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Draft preview — nothing is saved to Firestore or the Calendar until you confirm
              </p>
            </div>
            {isComplete && !analysisError && (
              <span className="text-xs font-medium text-emerald-700 whitespace-nowrap">
                Ready for review
              </span>
            )}
          </div>

          {analysisError ? (
            <div role="alert" className="space-y-4 py-2">
              <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-1.5 text-xs text-red-900">
                <p className="font-semibold">AI Extraction Failed</p>
                <p className="text-red-800 leading-relaxed">{analysisError}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Retry Analysis</span>
                </button>
                <button
                  type="button"
                  onClick={onManualFallback}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Enter Details Manually in Review
                </button>
              </div>
            </div>
          ) : !isComplete || !extractedDraft ? (
            <div className="space-y-4 py-2" aria-busy="true">
              <div className="h-5 bg-slate-100 rounded w-3/4 animate-pulse" />
              <div className="h-16 bg-slate-100 rounded w-full animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-slate-100 rounded animate-pulse" />
                <div className="h-12 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="h-20 bg-slate-100 rounded w-full animate-pulse" />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-slate-500">Detected Title</p>
                <p className="text-base font-semibold text-slate-900 mt-1">
                  {extractedDraft.title || 'Untitled Announcement'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {extractedDraft.category}
                  <span aria-hidden="true"> · </span>
                  Priority: {extractedDraft.priority}
                  {extractedDraft.targetAudience ? (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span>{extractedDraft.targetAudience}</span>
                    </>
                  ) : null}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-500">Summary</p>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                  {extractedDraft.shortSummary || 'No summary extracted.'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Important Dates & Deadlines (
                    {extractedDraft.importantDates.length + extractedDraft.deadlines.length})
                  </p>
                  {extractedDraft.deadlines.length === 0 &&
                  extractedDraft.importantDates.length === 0 ? (
                    <p className="text-xs text-slate-500">No explicit dates detected.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-slate-700">
                      {extractedDraft.deadlines.map((dl) => (
                        <li key={dl.id}>
                          <p className="font-medium text-slate-900">{dl.task}</p>
                          <p className="font-mono tabular-nums text-slate-500 mt-0.5">
                            {dl.dueDate ? formatDisplayDate(dl.dueDate) : dl.rawText || 'Date unspecified'}
                            {dl.dueTime ? ` · ${dl.dueTime}` : ''}
                          </p>
                        </li>
                      ))}
                      {extractedDraft.importantDates.map((d) => (
                        <li key={d.id}>
                          <p className="font-medium text-slate-900">{d.label}</p>
                          <p className="font-mono tabular-nums text-slate-500 mt-0.5">
                            {d.normalizedDate ? formatDisplayDate(d.normalizedDate) : d.rawText}
                            {d.time ? ` · ${d.time}` : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Required Documents ({extractedDraft.requiredDocuments.length})
                  </p>
                  {extractedDraft.requiredDocuments.length === 0 ? (
                    <p className="text-xs text-slate-500">No specific documents listed.</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                      {extractedDraft.requiredDocuments.map((doc) => (
                        <li key={doc}>{doc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {extractedDraft.uncertainOrMissingInfo.length > 0 && (
                <div className="border border-amber-200 bg-amber-50/70 rounded-lg p-3.5 text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">Flagged for Student Review</p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                    {extractedDraft.uncertainOrMissingInfo.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onProceedToReview}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <span>Review & Edit Details</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
