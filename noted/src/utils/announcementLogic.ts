import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementDraft,
  DeadlineItem,
  PriorityLevel,
} from '../types/announcement';

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  'Examination',
  'Enrollment',
  'Submission Deadline',
  'Academic Requirement',
  'Event / Seminar',
  'General Notice',
  'Other',
];

export const PRIORITY_LEVELS: PriorityLevel[] = ['High', 'Medium', 'Low'];

export interface DashboardMetrics {
  totalAnnouncements: number;
  upcomingDeadlinesCount: number;
  pendingTasksCount: number;
  completedTasksCount: number;
}

export interface FlattenedDeadline {
  deadline: DeadlineItem;
  announcementId: string;
  announcementTitle: string;
  category: AnnouncementCategory;
  priority: PriorityLevel;
}

export interface FilterCriteria {
  search: string;
  category: AnnouncementCategory | 'All';
  statusFilter: 'all' | 'pending' | 'completed';
  priorityFilter: PriorityLevel | 'All';
}

export type DeadlineUrgency =
  | 'Completed'
  | 'Overdue'
  | 'Due Soon'
  | 'Upcoming'
  | 'Date Unspecified';

export function getAnnouncementCompletionState(announcement: Announcement): {
  completedCount: number;
  totalCount: number;
  isFullyCompleted: boolean;
} {
  const deadlineDone = announcement.deadlines.filter((d) => d.isCompleted).length;
  const actionDone = announcement.requiredActions.filter((a) => a.isCompleted).length;
  const totalCount = announcement.deadlines.length + announcement.requiredActions.length;
  const completedCount = deadlineDone + actionDone;

  return {
    completedCount,
    totalCount,
    isFullyCompleted: totalCount > 0 && completedCount === totalCount,
  };
}

export function computeDashboardMetrics(announcements: Announcement[]): DashboardMetrics {
  let upcomingDeadlinesCount = 0;
  let pendingTasksCount = 0;
  let completedTasksCount = 0;

  for (const item of announcements) {
    for (const dl of item.deadlines) {
      if (dl.isCompleted) {
        completedTasksCount += 1;
      } else {
        upcomingDeadlinesCount += 1;
        pendingTasksCount += 1;
      }
    }
    for (const act of item.requiredActions) {
      if (act.isCompleted) {
        completedTasksCount += 1;
      } else {
        pendingTasksCount += 1;
      }
    }
  }

  return {
    totalAnnouncements: announcements.length,
    upcomingDeadlinesCount,
    pendingTasksCount,
    completedTasksCount,
  };
}

export function getUpcomingDeadlines(announcements: Announcement[]): FlattenedDeadline[] {
  const flattened: FlattenedDeadline[] = [];

  for (const item of announcements) {
    for (const dl of item.deadlines) {
      flattened.push({
        deadline: dl,
        announcementId: item.id,
        announcementTitle: item.title,
        category: item.category,
        priority: item.priority,
      });
    }
  }

  return flattened.sort((a, b) => {
    if (a.deadline.isCompleted !== b.deadline.isCompleted) {
      return a.deadline.isCompleted ? 1 : -1;
    }
    const dateA = a.deadline.dueDate;
    const dateB = b.deadline.dueDate;
    if (dateA && dateB) {
      return dateA.localeCompare(dateB);
    }
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;
    return a.announcementTitle.localeCompare(b.announcementTitle);
  });
}

export function filterAnnouncements(
  announcements: Announcement[],
  criteria: FilterCriteria
): Announcement[] {
  const query = criteria.search.trim().toLowerCase();

  return announcements
    .filter((item) => {
      if (criteria.category !== 'All' && item.category !== criteria.category) {
        return false;
      }

      if (criteria.priorityFilter !== 'All' && item.priority !== criteria.priorityFilter) {
        return false;
      }

      if (criteria.statusFilter !== 'all') {
        const completion = getAnnouncementCompletionState(item);
        if (criteria.statusFilter === 'completed') {
          if (!completion.isFullyCompleted) return false;
        } else if (criteria.statusFilter === 'pending') {
          if (completion.totalCount > 0 && completion.isFullyCompleted) return false;
        }
      }

      if (!query) return true;

      const haystack = [
        item.title,
        item.shortSummary,
        item.originalText ?? '',
        item.targetAudience ?? '',
        item.category,
        ...item.requiredDocuments,
        ...item.requiredActions.map((a) => a.text),
        ...item.deadlines.map((d) => `${d.task} ${d.rawText}`),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDeadlineUrgency(
  dueDate: string | null,
  isCompleted: boolean,
  referenceIsoDate: string
): DeadlineUrgency {
  if (isCompleted) return 'Completed';
  if (!dueDate) return 'Date Unspecified';

  const refTime = Date.parse(`${referenceIsoDate}T00:00:00Z`);
  const dueTime = Date.parse(`${dueDate}T00:00:00Z`);

  if (Number.isNaN(refTime) || Number.isNaN(dueTime)) {
    return 'Date Unspecified';
  }

  const diffDays = Math.round((dueTime - refTime) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Overdue';
  if (diffDays <= 7) return 'Due Soon';
  return 'Upcoming';
}

export function formatDisplayDate(isoDate: string | null): string {
  if (!isoDate) return 'Date not specified';
  const parsed = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed)) return isoDate;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(parsed));
}

export function validateAnnouncementDraft(draft: AnnouncementDraft): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft.title.trim()) {
    errors.title = 'Announcement title is required before saving.';
  }
  if (!draft.shortSummary.trim()) {
    errors.shortSummary = 'Provide a short summary for quick scanning.';
  }

  for (let i = 0; i < draft.deadlines.length; i += 1) {
    if (!draft.deadlines[i].task.trim()) {
      errors[`deadline_${i}`] = 'Each deadline needs a task description or should be removed.';
    }
  }

  return errors;
}

export function announcementToDraft(item: Announcement): AnnouncementDraft {
  return {
    editingId: item.id,
    title: item.title,
    originalText: item.originalText ?? '',
    category: item.category,
    shortSummary: item.shortSummary,
    targetAudience: item.targetAudience ?? '',
    importantDates: item.importantDates.map((d) => ({ ...d })),
    deadlines: item.deadlines.map((d) => ({ ...d })),
    requiredActions: item.requiredActions.map((a) => ({ ...a })),
    requiredDocuments: [...item.requiredDocuments],
    priority: item.priority,
    uncertainOrMissingInfo: [...item.uncertainOrMissingInfo],
    imageUrl: item.imageUrl,
    imageName: item.imageName,
  };
}
