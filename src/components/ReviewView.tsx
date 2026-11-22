import { useState } from 'react';
import { AlertTriangle, Plus, Save, Trash2 } from 'lucide-react';
import type {
  AnnouncementCategory,
  AnnouncementDraft,
  PriorityLevel,
} from '../types/announcement';
import {
  ANNOUNCEMENT_CATEGORIES,
  PRIORITY_LEVELS,
  validateAnnouncementDraft,
} from '../utils/announcementLogic';
import { AnnouncementImageFrame } from './AnnouncementImageFrame';

interface ReviewViewProps {
  draft: AnnouncementDraft;
  isSaving: boolean;
  saveError: string | null;
  onChangeDraft: (updated: AnnouncementDraft) => void;
  onSave: (validatedDraft: AnnouncementDraft) => void;
  onCancel: () => void;
}

export function ReviewView({
  draft,
  isSaving,
  saveError,
  onChangeDraft,
  onSave,
  onCancel,
}: ReviewViewProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newActionText, setNewActionText] = useState('');
  const [newDocumentText, setNewDocumentText] = useState('');
  const [showOriginalText, setShowOriginalText] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAnnouncementDraft(draft);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onSave(draft);
  };

  const handleAddImportantDate = () => {
    onChangeDraft({
      ...draft,
      importantDates: [
        ...draft.importantDates,
        {
          id: `ev-${Date.now()}`,
          label: '',
          rawText: '',
          normalizedDate: null,
          time: null,
        },
      ],
    });
  };

  const handleRemoveImportantDate = (id: string) => {
    onChangeDraft({
      ...draft,
      importantDates: draft.importantDates.filter((d) => d.id !== id),
    });
  };

  const handleAddDeadline = () => {
    onChangeDraft({
      ...draft,
      deadlines: [
        ...draft.deadlines,
        {
          id: `dl-${Date.now()}`,
          task: '',
          rawText: '',
          dueDate: null,
          dueTime: null,
          isCompleted: false,
        },
      ],
    });
  };

  const handleRemoveDeadline = (id: string) => {
    onChangeDraft({
      ...draft,
      deadlines: draft.deadlines.filter((dl) => dl.id !== id),
    });
  };

  const handleAddAction = () => {
    const trimmed = newActionText.trim();
    if (!trimmed) return;
    onChangeDraft({
      ...draft,
      requiredActions: [
        ...draft.requiredActions,
        { id: `act-${Date.now()}`, text: trimmed, isCompleted: false },
      ],
    });
    setNewActionText('');
  };

  const handleRemoveAction = (id: string) => {
    onChangeDraft({
      ...draft,
      requiredActions: draft.requiredActions.filter((a) => a.id !== id),
    });
  };

  const handleAddDocument = () => {
    const trimmed = newDocumentText.trim();
    if (!trimmed) return;
    if (!draft.requiredDocuments.includes(trimmed)) {
      onChangeDraft({
        ...draft,
        requiredDocuments: [...draft.requiredDocuments, trimmed],
      });
    }
    setNewDocumentText('');
  };

  const handleRemoveDocument = (index: number) => {
    onChangeDraft({
      ...draft,
      requiredDocuments: draft.requiredDocuments.filter((_, idx) => idx !== index),
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-6xl" noValidate>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {draft.editingId ? 'Edit Saved Announcement' : 'Review Extracted Announcement'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Verify all extracted dates, deadlines, and requirements against the original image.
            Confirmed dates sync automatically to your Academic Calendar.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={isSaving}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors min-h-[40px] disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors min-h-[40px] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{isSaving ? 'Saving...' : 'Save Announcement'}</span>
          </button>
        </div>
      </div>

      {saveError && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 rounded-xl px-4 py-3 text-xs text-red-800"
        >
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Reference Image & Missing Info Warnings */}
        <aside className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Source Announcement</h2>
              {draft.imageName && (
                <span className="text-xs text-slate-500 truncate max-w-[180px]">
                  {draft.imageName}
                </span>
              )}
            </div>
            <AnnouncementImageFrame
              imageUrl={draft.imageUrl}
              alt={`Source image for ${draft.title || 'announcement'}`}
              fallbackTitle={draft.title || 'Announcement notice'}
              className="h-80 lg:h-[420px]"
            />
          </div>

          {draft.uncertainOrMissingInfo.length > 0 && (
            <div
              role="region"
              aria-label="Uncertain or missing information"
              className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2"
            >
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <h2 className="text-xs font-semibold">Uncertain or Missing Information</h2>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 leading-relaxed">
                {draft.uncertainOrMissingInfo.map((note, idx) => (
                  <li key={`${note}-${idx}`}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Right: Editable Fields */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {/* Core Details */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="review-title"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Announcement Title
              </label>
              <input
                id="review-title"
                type="text"
                value={draft.title}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, title: '' }));
                  onChangeDraft({ ...draft, title: e.target.value });
                }}
                placeholder="e.g., CS 3101 Final Examination Schedule"
                className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.title ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.title && (
                <p role="alert" className="text-xs text-red-700 mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="review-category"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Category
                </label>
                <select
                  id="review-category"
                  value={draft.category}
                  onChange={(e) =>
                    onChangeDraft({
                      ...draft,
                      category: e.target.value as AnnouncementCategory,
                    })
                  }
                  className="w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="review-priority"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Priority
                </label>
                <select
                  id="review-priority"
                  value={draft.priority}
                  onChange={(e) =>
                    onChangeDraft({
                      ...draft,
                      priority: e.target.value as PriorityLevel,
                    })
                  }
                  className="w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {PRIORITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="review-audience"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Target Audience
                </label>
                <input
                  id="review-audience"
                  type="text"
                  value={draft.targetAudience}
                  onChange={(e) =>
                    onChangeDraft({ ...draft, targetAudience: e.target.value })
                  }
                  placeholder="e.g., BSCS 3rd Year"
                  className="w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="review-summary"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Summary
              </label>
              <textarea
                id="review-summary"
                rows={3}
                value={draft.shortSummary}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, shortSummary: '' }));
                  onChangeDraft({ ...draft, shortSummary: e.target.value });
                }}
                placeholder="Concise summary of the announcement..."
                className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed ${
                  errors.shortSummary ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.shortSummary && (
                <p role="alert" className="text-xs text-red-700 mt-1">
                  {errors.shortSummary}
                </p>
              )}
            </div>
          </div>

          {/* Extracted Important Dates (Calendar Events) */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Important Dates (Synced to Calendar)
                </h2>
                <p className="text-xs text-slate-500">
                  Only entries with a confirmed date appear on the Academic Calendar
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddImportantDate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Date</span>
              </button>
            </div>

            {draft.importantDates.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">
                No schedule events listed. Click "Add Date" to add an exam, enrollment, or
                seminar date.
              </p>
            ) : (
              <div className="space-y-3">
                {draft.importantDates.map((d, idx) => (
                  <div
                    key={d.id}
                    className="p-3.5 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label
                          htmlFor={`ev-label-${d.id}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Event Label
                        </label>
                        <input
                          id={`ev-label-${d.id}`}
                          type="text"
                          value={d.label}
                          onChange={(e) => {
                            const updated = draft.importantDates.map((item) =>
                              item.id === d.id ? { ...item, label: e.target.value } : item
                            );
                            onChangeDraft({ ...draft, importantDates: updated });
                          }}
                          placeholder="e.g., CS 3101 Final Exam"
                          className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveImportantDate(d.id)}
                        aria-label={`Remove date ${d.label || idx + 1}`}
                        className="mt-5 p-2 text-slate-400 hover:text-red-700 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor={`ev-date-${d.id}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Calendar Date
                        </label>
                        <input
                          id={`ev-date-${d.id}`}
                          type="date"
                          value={d.normalizedDate ?? ''}
                          onChange={(e) => {
                            const updated = draft.importantDates.map((item) =>
                              item.id === d.id
                                ? { ...item, normalizedDate: e.target.value || null }
                                : item
                            );
                            onChangeDraft({ ...draft, importantDates: updated });
                          }}
                          className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`ev-time-${d.id}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Time
                        </label>
                        <input
                          id={`ev-time-${d.id}`}
                          type="text"
                          value={d.time ?? ''}
                          onChange={(e) => {
                            const updated = draft.importantDates.map((item) =>
                              item.id === d.id
                                ? { ...item, time: e.target.value || null }
                                : item
                            );
                            onChangeDraft({ ...draft, importantDates: updated });
                          }}
                          placeholder="e.g., 9:00 AM - 11:00 AM"
                          className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`ev-raw-${d.id}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Printed Text
                        </label>
                        <input
                          id={`ev-raw-${d.id}`}
                          type="text"
                          value={d.rawText}
                          onChange={(e) => {
                            const updated = draft.importantDates.map((item) =>
                              item.id === d.id ? { ...item, rawText: e.target.value } : item
                            );
                            onChangeDraft({ ...draft, importantDates: updated });
                          }}
                          placeholder="Exact phrase from poster"
                          className="w-full px-3 py-2 text-xs text-slate-700 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extracted Deadlines */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Extracted Deadlines</h2>
                <p className="text-xs text-slate-500">
                  Confirm due dates and cutoff times before saving
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDeadline}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Deadline</span>
              </button>
            </div>

            {draft.deadlines.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">
                No deadlines listed. Click "Add Deadline" if this announcement has a due date.
              </p>
            ) : (
              <div className="space-y-3">
                {draft.deadlines.map((dl, idx) => (
                  <div
                    key={dl.id}
                    className="p-3.5 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label
                          htmlFor={`dl-task-${dl.id}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Deadline Task
                        </label>
                        <input
                          id={`dl-task-${dl.id}`}
                          type="text"
                          value={dl.task}
                          onChange={(e) => {
                            const updated = draft.deadlines.map((item) =>
                              item.id === dl.id ? { ...item, task: e.target.value } : item
                            );
                            setErrors((prev) => ({ ...prev, [`deadline_${idx}`]: '' }));
                            onChangeDraft({ ...draft, deadlines: updated });
                          }}
                          placeholder="e.g., Submit Adviser Endorsement Form"
                          className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        {errors[`deadline_${idx}`] && (
                          <p role="alert" className="text-xs text-red-700 mt-1">
                            {errors[`deadline_${idx}`]}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDeadline(dl.id)}
                        aria-label={`Remove deadline ${dl.task || idx + 1}`}
                        className="mt-5 p-2 text-slate-400 hover:text-red-700 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor={`dl-date-${dl.id}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Due Date
                        </label>
                        <input
                          id={`dl-date-${dl.id}`}
                          type="date"
                          value={dl.dueDate ?? ''}
                          onChange={(e) => {
                            const updated = draft.deadlines.map((item) =>
                              item.id === dl.id
                                ? { ...item, dueDate: e.target.value || null }
                                : item
                            );
                            onChangeDraft({ ...draft, deadlines: updated });
                          }}
                          className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`dl-time-${dl.id}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Cutoff Time
                        </label>
                        <input
                          id={`dl-time-${dl.id}`}
                          type="text"
                          value={dl.dueTime ?? ''}
                          onChange={(e) => {
                            const updated = draft.deadlines.map((item) =>
                              item.id === dl.id
                                ? { ...item, dueTime: e.target.value || null }
                                : item
                            );
                            onChangeDraft({ ...draft, deadlines: updated });
                          }}
                          placeholder="e.g., 11:59 PM"
                          className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`dl-raw-${dl.id}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Printed Text
                        </label>
                        <input
                          id={`dl-raw-${dl.id}`}
                          type="text"
                          value={dl.rawText}
                          onChange={(e) => {
                            const updated = draft.deadlines.map((item) =>
                              item.id === dl.id ? { ...item, rawText: e.target.value } : item
                            );
                            onChangeDraft({ ...draft, deadlines: updated });
                          }}
                          placeholder="Exact phrase from poster"
                          className="w-full px-3 py-2 text-xs text-slate-700 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Required Actions */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Required Actions</h2>
            {draft.requiredActions.length > 0 && (
              <ul className="space-y-2">
                {draft.requiredActions.map((act, idx) => (
                  <li key={act.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      aria-label={`Required action ${idx + 1}`}
                      value={act.text}
                      onChange={(e) => {
                        const updated = draft.requiredActions.map((item) =>
                          item.id === act.id ? { ...item, text: e.target.value } : item
                        );
                        onChangeDraft({ ...draft, requiredActions: updated });
                      }}
                      className="flex-1 px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(act.id)}
                      aria-label={`Remove action ${act.text}`}
                      className="p-2 text-slate-400 hover:text-red-700 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                aria-label="New required action"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAction();
                  }
                }}
                placeholder="Add a required action step..."
                className="flex-1 px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={handleAddAction}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Add Action
              </button>
            </div>
          </div>

          {/* Required Documents */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Required Documents</h2>
            {draft.requiredDocuments.length > 0 && (
              <ul className="space-y-2">
                {draft.requiredDocuments.map((doc, idx) => (
                  <li key={`${doc}-${idx}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      aria-label={`Required document ${idx + 1}`}
                      value={doc}
                      onChange={(e) => {
                        const updated = draft.requiredDocuments.map((d, i) =>
                          i === idx ? e.target.value : d
                        );
                        onChangeDraft({ ...draft, requiredDocuments: updated });
                      }}
                      className="flex-1 px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(idx)}
                      aria-label={`Remove document ${doc}`}
                      className="p-2 text-slate-400 hover:text-red-700 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                aria-label="New required document"
                value={newDocumentText}
                onChange={(e) => setNewDocumentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDocument();
                  }
                }}
                placeholder="Add required document (e.g., Examination Permit)..."
                className="flex-1 px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={handleAddDocument}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Add Document
              </button>
            </div>
          </div>

          {/* Original Extracted Text Toggle */}
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowOriginalText((prev) => !prev)}
              aria-expanded={showOriginalText}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              {showOriginalText ? 'Hide Original Extracted Text' : 'View / Edit Original Extracted Text'}
            </button>
            {showOriginalText && (
              <div className="mt-3">
                <label htmlFor="review-original-text" className="sr-only">
                  Original extracted announcement text
                </label>
                <textarea
                  id="review-original-text"
                  rows={4}
                  value={draft.originalText}
                  onChange={(e) =>
                    onChangeDraft({ ...draft, originalText: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}
          </div>

          {/* Bottom Save Footer */}
          <div className="border-t border-slate-200 pt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{isSaving ? 'Saving...' : 'Save Announcement'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
