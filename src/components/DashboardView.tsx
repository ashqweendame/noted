import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  Upload,
} from 'lucide-react';
import type { Announcement, AppPage } from '../types/announcement';
import {
  computeDashboardMetrics,
  formatDisplayDate,
  getAnnouncementCompletionState,
  getDeadlineUrgency,
  getUpcomingDeadlines,
} from '../utils/announcementLogic';
import { AcademicCalendar } from './AcademicCalendar';

interface DashboardViewProps {
  announcements: Announcement[];
  referenceIsoDate: string;
  isLoadingData: boolean;
  onNavigate: (page: AppPage) => void;
  onSelectAnnouncement: (id: string) => void;
  onToggleDeadline: (announcementId: string, deadlineId: string) => void;
}

export function DashboardView({
  announcements,
  referenceIsoDate,
  isLoadingData,
  onNavigate,
  onSelectAnnouncement,
  onToggleDeadline,
}: DashboardViewProps) {
  const metrics = computeDashboardMetrics(announcements);
  const upcomingDeadlines = getUpcomingDeadlines(announcements).slice(0, 6);
  const recentAnnouncements = [...announcements]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero / Quick Action Header Strip */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Academic Announcement Overview
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Upload DCISM screenshots or flyers to extract summaries, track upcoming deadlines,
            and sync important dates with your Academic Calendar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          <span>Quick Upload Notice</span>
        </button>
      </section>

      {/* 4-Column Summary KPI Strip */}
      <section
        aria-label="Workspace summary metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Saved Announcements</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {metrics.totalAnnouncements}
          </p>
          <p className="text-xs text-slate-500 mt-1">Synced in Firestore</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Active Deadlines</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {metrics.upcomingDeadlinesCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Awaiting completion</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Pending Tasks</p>
          <p className="text-2xl font-bold text-amber-700 mt-2 font-mono tabular-nums">
            {metrics.pendingTasksCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Deadlines & action items</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Completed Items</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-mono tabular-nums">
            {metrics.completedTasksCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Checked off by you</p>
        </div>
      </section>

      {/* Main 3-Section Dashboard Layout: Upcoming Deadlines + Recent Announcements alongside Academic Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upcoming Deadlines & Recent Announcements */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming Deadlines */}
          <section
            aria-labelledby="upcoming-deadlines-heading"
            className="bg-white border border-slate-200 rounded-xl"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2
                  id="upcoming-deadlines-heading"
                  className="text-base font-semibold text-slate-900"
                >
                  Upcoming Deadlines
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sorted by due date with pending items prioritized
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('manage')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline whitespace-nowrap shrink-0 inline-flex items-center gap-1 py-1.5"
              >
                <span>Manage all</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {isLoadingData ? (
              <div className="p-6 space-y-3" aria-busy="true">
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarClock
                  className="w-8 h-8 text-slate-400 mx-auto mb-3"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-slate-900">No deadlines tracked yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Upload a DCISM notice to extract dates and populate your deadlines and calendar.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('upload')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  Upload Announcement
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcomingDeadlines.map((entry) => {
                  const urgency = getDeadlineUrgency(
                    entry.deadline.dueDate,
                    entry.deadline.isCompleted,
                    referenceIsoDate
                  );

                  const urgencyTextClass =
                    urgency === 'Overdue'
                      ? 'text-red-700 font-medium'
                      : urgency === 'Due Soon'
                      ? 'text-amber-700 font-medium'
                      : urgency === 'Completed'
                      ? 'text-emerald-700'
                      : 'text-slate-500';

                  return (
                    <li
                      key={`${entry.announcementId}-${entry.deadline.id}`}
                      className="px-6 py-4 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onToggleDeadline(entry.announcementId, entry.deadline.id)
                        }
                        aria-label={
                          entry.deadline.isCompleted
                            ? `Mark "${entry.deadline.task}" as pending`
                            : `Mark "${entry.deadline.task}" as completed`
                        }
                        className="mt-0.5 text-slate-400 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded shrink-0"
                      >
                        {entry.deadline.isCompleted ? (
                          <CheckCircle2
                            className="w-5 h-5 text-emerald-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle className="w-5 h-5" aria-hidden="true" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p
                            className={`text-sm font-medium ${
                              entry.deadline.isCompleted
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {entry.deadline.task}
                          </p>
                          <span
                            className={`text-xs font-mono tabular-nums whitespace-nowrap ${urgencyTextClass}`}
                          >
                            {entry.deadline.dueDate
                              ? formatDisplayDate(entry.deadline.dueDate)
                              : entry.deadline.rawText || 'Date unspecified'}
                            {entry.deadline.dueTime ? ` · ${entry.deadline.dueTime}` : ''}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          <button
                            type="button"
                            onClick={() => onSelectAnnouncement(entry.announcementId)}
                            className="text-slate-600 hover:text-blue-700 hover:underline text-left truncate max-w-xs"
                          >
                            {entry.announcementTitle}
                          </button>
                          <span aria-hidden="true">·</span>
                          <span>{entry.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`inline-flex items-center gap-1 ${urgencyTextClass}`}>
                            {urgency === 'Overdue' || urgency === 'Due Soon' ? (
                              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                            ) : (
                              <Clock className="w-3 h-3" aria-hidden="true" />
                            )}
                            <span>{urgency}</span>
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Recent Announcements */}
          <section
            aria-labelledby="recent-announcements-heading"
            className="bg-white border border-slate-200 rounded-xl"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2
                  id="recent-announcements-heading"
                  className="text-base font-semibold text-slate-900"
                >
                  Recent Announcements
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest verified DCISM notices saved to your workspace
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('manage')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline whitespace-nowrap shrink-0"
              >
                View directory
              </button>
            </div>

            {isLoadingData ? (
              <div className="p-6 space-y-3" aria-busy="true">
                <div className="h-14 bg-slate-100 rounded animate-pulse" />
                <div className="h-14 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No announcements saved yet. Upload an announcement image to get started.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentAnnouncements.map((item) => {
                  const completion = getAnnouncementCompletionState(item);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelectAnnouncement(item.id)}
                        className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {item.title}
                          </p>
                          <span
                            className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                              item.priority === 'High'
                                ? 'text-red-700'
                                : item.priority === 'Medium'
                                ? 'text-amber-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {item.shortSummary}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span>{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {completion.completedCount}/{completion.totalCount} tasks done
                          </span>
                          {item.uncertainOrMissingInfo.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700">Needs detail check</span>
                            </>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Right Column: Interactive Monthly Academic Calendar */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <AcademicCalendar
            announcements={announcements}
            todayIsoDate={referenceIsoDate}
            onViewAnnouncement={onSelectAnnouncement}
          />
        </div>
      </div>
    </div>
  );
}
