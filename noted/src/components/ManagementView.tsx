import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileText,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  Announcement,
  AnnouncementCategory,
  AppPage,
  PriorityLevel,
} from '../types/announcement';
import {
  ANNOUNCEMENT_CATEGORIES,
  filterAnnouncements,
  formatDisplayDate,
  getAnnouncementCompletionState,
  getDeadlineUrgency,
} from '../utils/announcementLogic';
import { AnnouncementImageFrame } from './AnnouncementImageFrame';

interface ManagementViewProps {
  announcements: Announcement[];
  selectedId: string | null;
  referenceIsoDate: string;
  onSelectId: (id: string) => void;
  onEditAnnouncement: (item: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onToggleDeadline: (announcementId: string, deadlineId: string) => void;
  onToggleAction: (announcementId: string, actionId: string) => void;
  onNavigate: (page: AppPage) => void;
}

export function ManagementView({
  announcements,
  selectedId,
  referenceIsoDate,
  onSelectId,
  onEditAnnouncement,
  onDeleteAnnouncement,
  onToggleDeadline,
  onToggleAction,
  onNavigate,
}: ManagementViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AnnouncementCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'All'>('All');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);

  const filtered = filterAnnouncements(announcements, {
    search,
    category: categoryFilter,
    statusFilter,
    priorityFilter,
  });

  const activeAnnouncement =
    filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Announcement Management
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Search, filter, inspect details, and track pending or completed requirements.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <section
        aria-label="Search and filter announcements"
        className="bg-white border border-slate-200 rounded-xl p-4 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="manage-search" className="sr-only">
              Search announcements
            </label>
            <input
              id="manage-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course, title, document, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="manage-category-select" className="sr-only">
              Filter by category
            </label>
            <select
              id="manage-category-select"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as AnnouncementCategory | 'All')
              }
              className="w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Categories</option>
              {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="manage-priority-select" className="sr-only">
              Filter by priority
            </label>
            <select
              id="manage-priority-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | 'All')}
              className="w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Segmented Task Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div
            role="group"
            aria-label="Filter by task completion status"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            {(
              [
                { id: 'all', label: 'All Notices' },
                { id: 'pending', label: 'Pending Tasks' },
                { id: 'completed', label: 'Completed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {filtered.length} of {announcements.length}
          </p>
        </div>
      </section>

      {/* Master-Detail View */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-900">
            No matching announcements found
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try clearing your search query or switching category and status filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
              setStatusFilter('all');
              setPriorityFilter('All');
            }}
            className="px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Announcement List */}
          <div
            aria-label="Filtered announcements list"
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden"
          >
            {filtered.map((item) => {
              const isSelected = activeAnnouncement?.id === item.id;
              const completion = getAnnouncementCompletionState(item);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPendingDeleteId(null);
                    onSelectId(item.id);
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      window.requestAnimationFrame(() => {
                        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      });
                    }
                  }}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`w-full text-left px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                    isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {item.title}
                    </p>
                    <span
                      className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                        completion.isFullyCompleted ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {completion.totalCount === 0
                        ? 'No tasks'
                        : completion.isFullyCompleted
                        ? 'Completed'
                        : 'Pending'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {item.shortSummary}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.priority} Priority</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {completion.completedCount}/{completion.totalCount} done
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail Inspector */}
          {activeAnnouncement && (
            <article
              ref={detailRef}
              aria-label={`Details for ${activeAnnouncement.title}`}
              className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6 scroll-mt-16"
            >
              {/* Header + Edit/Delete */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {activeAnnouncement.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        activeAnnouncement.priority === 'High'
                          ? 'text-red-700 font-medium'
                          : activeAnnouncement.priority === 'Medium'
                          ? 'text-amber-700 font-medium'
                          : 'text-slate-600'
                      }
                    >
                      {activeAnnouncement.priority} Priority
                    </span>
                    {activeAnnouncement.targetAudience && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{activeAnnouncement.targetAudience}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeAnnouncement.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditAnnouncement(activeAnnouncement)}
                    aria-label={`Edit ${activeAnnouncement.title}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors min-h-[38px]"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Edit</span>
                  </button>

                  {pendingDeleteId === activeAnnouncement.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteAnnouncement(activeAnnouncement.id);
                          setPendingDeleteId(null);
                        }}
                        className="px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors min-h-[38px]"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                        className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(activeAnnouncement.id)}
                      aria-label={`Delete ${activeAnnouncement.title}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors min-h-[38px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Summary & Source Image */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                <div className="md:col-span-7 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-500">Summary</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeAnnouncement.shortSummary}
                  </p>

                  {activeAnnouncement.importantDates.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <h3 className="text-xs font-semibold text-slate-500">
                        Important Dates
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {activeAnnouncement.importantDates.map((d) => (
                          <li
                            key={d.id}
                            className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-1.5"
                          >
                            <span className="font-medium text-slate-900">{d.label}</span>
                            <span className="font-mono tabular-nums text-slate-600">
                              {d.normalizedDate
                                ? formatDisplayDate(d.normalizedDate)
                                : d.rawText}
                              {d.time ? ` · ${d.time}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="md:col-span-5">
                  <AnnouncementImageFrame
                    imageUrl={activeAnnouncement.imageUrl}
                    alt={`Uploaded image for ${activeAnnouncement.title}`}
                    fallbackTitle={activeAnnouncement.title}
                    className="h-48"
                  />
                </div>
              </div>

              {/* Deadlines Checklist */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Deadlines ({activeAnnouncement.deadlines.length})
                </h3>
                {activeAnnouncement.deadlines.length === 0 ? (
                  <p className="text-xs text-slate-500">No deadlines attached.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {activeAnnouncement.deadlines.map((dl) => {
                      const urgency = getDeadlineUrgency(
                        dl.dueDate,
                        dl.isCompleted,
                        referenceIsoDate
                      );
                      return (
                        <li
                          key={dl.id}
                          className="flex items-start justify-between gap-3 p-3 border border-slate-200 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                onToggleDeadline(activeAnnouncement.id, dl.id)
                              }
                              aria-label={
                                dl.isCompleted
                                  ? `Mark "${dl.task}" as pending`
                                  : `Mark "${dl.task}" as completed`
                              }
                              className="mt-0.5 text-slate-400 hover:text-blue-700 shrink-0"
                            >
                              {dl.isCompleted ? (
                                <CheckCircle2
                                  className="w-4 h-4 text-emerald-600"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Circle className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                            <div>
                              <p
                                className={`text-xs font-medium ${
                                  dl.isCompleted
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-900'
                                }`}
                              >
                                {dl.task}
                              </p>
                              <p className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                                {dl.dueDate
                                  ? formatDisplayDate(dl.dueDate)
                                  : dl.rawText || 'Date unspecified'}
                                {dl.dueTime ? ` · ${dl.dueTime}` : ''}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-medium whitespace-nowrap ${
                              dl.isCompleted
                                ? 'text-emerald-700'
                                : urgency === 'Overdue'
                                ? 'text-red-700'
                                : urgency === 'Due Soon'
                                ? 'text-amber-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {dl.isCompleted ? 'Completed' : 'Pending'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Required Actions & Documents */}
              <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Required Actions ({activeAnnouncement.requiredActions.length})
                  </h3>
                  {activeAnnouncement.requiredActions.length === 0 ? (
                    <p className="text-xs text-slate-500">No required actions listed.</p>
                  ) : (
                    <ul className="space-y-2">
                      {activeAnnouncement.requiredActions.map((act) => (
                        <li key={act.id} className="flex items-start gap-2.5 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              onToggleAction(activeAnnouncement.id, act.id)
                            }
                            aria-label={
                              act.isCompleted
                                ? `Mark action "${act.text}" as pending`
                                : `Mark action "${act.text}" as completed`
                            }
                            className="mt-0.5 text-slate-400 hover:text-blue-700 shrink-0"
                          >
                            {act.isCompleted ? (
                              <CheckCircle2
                                className="w-4 h-4 text-emerald-600"
                                aria-hidden="true"
                              />
                            ) : (
                              <Circle className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                          <span
                            className={
                              act.isCompleted
                                ? 'line-through text-slate-400'
                                : 'text-slate-700'
                            }
                          >
                            {act.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Required Documents ({activeAnnouncement.requiredDocuments.length})
                  </h3>
                  {activeAnnouncement.requiredDocuments.length === 0 ? (
                    <p className="text-xs text-slate-500">No documents required.</p>
                  ) : (
                    <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-700">
                      {activeAnnouncement.requiredDocuments.map((doc) => (
                        <li key={doc}>{doc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Uncertain / Missing Info */}
              {activeAnnouncement.uncertainOrMissingInfo.length > 0 && (
                <div className="border border-amber-200 bg-amber-50/70 rounded-lg p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <h3 className="text-xs font-semibold">Missing or Unclear Details</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-800">
                    {activeAnnouncement.uncertainOrMissingInfo.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Original Extracted Text */}
              {activeAnnouncement.originalText && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500">
                    Original Extracted Text
                  </h3>
                  <pre className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3.5 whitespace-pre-wrap leading-relaxed">
                    {activeAnnouncement.originalText}
                  </pre>
                </div>
              )}
            </article>
          )}
        </div>
      )}
    </div>
  );
}
