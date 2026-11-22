import type {
  Announcement,
  AnnouncementCategory,
  PriorityLevel,
} from '../types/announcement';

export interface CalendarEvent {
  id: string;
  announcementId: string;
  announcementTitle: string;
  title: string;
  category: AnnouncementCategory;
  priority: PriorityLevel;
  eventKind: 'deadline' | 'event';
  date: string; // YYYY-MM-DD
  time: string | null;
  rawText: string;
  isCompleted: boolean;
}

export interface CalendarGridDay {
  isoDate: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}

export interface CategoryVisualStyle {
  dotClass: string;
  textClass: string;
  subtleBgClass: string;
}

export function isValidIsoCalendarDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * Derives calendar events directly from saved announcements in Firestore.
 * - Never invents dates for null/unspecified entries.
 * - Deduplicates events sharing the same announcement, date, and title.
 * - Automatically stays in sync when announcements are added, edited, toggled, or deleted.
 */
export function deriveCalendarEventsFromAnnouncements(
  announcements: Announcement[]
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const seenKeys = new Set<string>();

  for (const item of announcements) {
    // 1. Add explicit deadlines first so completion status takes precedence in dedupe
    for (const dl of item.deadlines) {
      if (!isValidIsoCalendarDate(dl.dueDate)) continue;
      const cleanTitle = dl.task.trim() || item.title;
      const dedupeKey = `${item.id}::${dl.dueDate}::${cleanTitle.toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      events.push({
        id: `${item.id}-dl-${dl.id}`,
        announcementId: item.id,
        announcementTitle: item.title,
        title: cleanTitle,
        category: item.category,
        priority: item.priority,
        eventKind: 'deadline',
        date: dl.dueDate,
        time: dl.dueTime,
        rawText: dl.rawText,
        isCompleted: dl.isCompleted,
      });
    }

    // 2. Add explicit important dates (exam schedules, advising windows, events)
    for (const d of item.importantDates) {
      if (!isValidIsoCalendarDate(d.normalizedDate)) continue;
      const cleanTitle = d.label.trim() || item.title;
      const dedupeKey = `${item.id}::${d.normalizedDate}::${cleanTitle.toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      events.push({
        id: `${item.id}-ev-${d.id}`,
        announcementId: item.id,
        announcementTitle: item.title,
        title: cleanTitle,
        category: item.category,
        priority: item.priority,
        eventKind: 'event',
        date: d.normalizedDate,
        time: d.time,
        rawText: d.rawText,
        isCompleted: false,
      });
    }
  }

  return events.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.eventKind !== b.eventKind) return a.eventKind === 'deadline' ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

export function groupCalendarEventsByDate(
  events: CalendarEvent[]
): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    if (!grouped[ev.date]) {
      grouped[ev.date] = [];
    }
    grouped[ev.date].push(ev);
  }
  return grouped;
}

export function getMonthGridDays(year: number, monthIndex: number): CalendarGridDay[] {
  const firstDayOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const startWeekday = firstDayOfMonth.getUTCDay(); // 0 = Sun
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const totalCells = startWeekday + daysInMonth > 35 ? 42 : 35;

  const startDate = new Date(Date.UTC(year, monthIndex, 1 - startWeekday));
  const days: CalendarGridDay[] = [];

  for (let i = 0; i < totalCells; i += 1) {
    const cellDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const cellYear = cellDate.getUTCFullYear();
    const cellMonth = cellDate.getUTCMonth();
    const cellDay = cellDate.getUTCDate();
    const isoDate = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;

    days.push({
      isoDate,
      dayNumber: cellDay,
      isCurrentMonth: cellYear === year && cellMonth === monthIndex,
    });
  }

  return days;
}

export function shiftMonth(
  year: number,
  monthIndex: number,
  delta: number
): { year: number; monthIndex: number } {
  const dt = new Date(Date.UTC(year, monthIndex + delta, 1));
  return {
    year: dt.getUTCFullYear(),
    monthIndex: dt.getUTCMonth(),
  };
}

export function formatMonthYear(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

export function getCategoryIndicatorStyle(
  category: AnnouncementCategory
): CategoryVisualStyle {
  switch (category) {
    case 'Examination':
      return {
        dotClass: 'bg-red-600',
        textClass: 'text-red-700',
        subtleBgClass: 'bg-red-50/70',
      };
    case 'Enrollment':
      return {
        dotClass: 'bg-blue-700',
        textClass: 'text-blue-700',
        subtleBgClass: 'bg-blue-50/70',
      };
    case 'Submission Deadline':
      return {
        dotClass: 'bg-amber-600',
        textClass: 'text-amber-700',
        subtleBgClass: 'bg-amber-50/70',
      };
    case 'Academic Requirement':
      return {
        dotClass: 'bg-teal-600',
        textClass: 'text-teal-700',
        subtleBgClass: 'bg-teal-50/70',
      };
    case 'Event / Seminar':
      return {
        dotClass: 'bg-indigo-600',
        textClass: 'text-indigo-700',
        subtleBgClass: 'bg-indigo-50/70',
      };
    default:
      return {
        dotClass: 'bg-slate-500',
        textClass: 'text-slate-700',
        subtleBgClass: 'bg-slate-100/70',
      };
  }
}
