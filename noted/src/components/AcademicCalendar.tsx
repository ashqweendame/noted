import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import type { Announcement, AnnouncementCategory } from '../types/announcement';
import { formatDisplayDate } from '../utils/announcementLogic';
import {
  deriveCalendarEventsFromAnnouncements,
  formatMonthYear,
  getCategoryIndicatorStyle,
  getMonthGridDays,
  groupCalendarEventsByDate,
  shiftMonth,
} from '../utils/calendarLogic';

interface AcademicCalendarProps {
  announcements: Announcement[];
  todayIsoDate: string;
  onViewAnnouncement: (announcementId: string) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LEGEND_CATEGORIES: AnnouncementCategory[] = [
  'Examination',
  'Enrollment',
  'Submission Deadline',
  'Academic Requirement',
  'Event / Seminar',
];

export function AcademicCalendar({
  announcements,
  todayIsoDate,
  onViewAnnouncement,
}: AcademicCalendarProps) {
  const [initialYear, initialMonth] = useMemo(() => {
    const [y, m] = todayIsoDate.split('-').map(Number);
    return [y || 2026, (m ? m - 1 : 10)];
  }, [todayIsoDate]);

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonthIndex, setViewMonthIndex] = useState<number>(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string>(todayIsoDate);

  const calendarEvents = useMemo(
    () => deriveCalendarEventsFromAnnouncements(announcements),
    [announcements]
  );

  const eventsByDate = useMemo(
    () => groupCalendarEventsByDate(calendarEvents),
    [calendarEvents]
  );

  const gridDays = useMemo(
    () => getMonthGridDays(viewYear, viewMonthIndex),
    [viewYear, viewMonthIndex]
  );

  const selectedDateEvents = eventsByDate[selectedDate] ?? [];

  const handleShiftMonth = (delta: number) => {
    const next = shiftMonth(viewYear, viewMonthIndex, delta);
    setViewYear(next.year);
    setViewMonthIndex(next.monthIndex);
  };

  const handleJumpToToday = () => {
    setViewYear(initialYear);
    setViewMonthIndex(initialMonth);
    setSelectedDate(todayIsoDate);
  };

  return (
    <section
      aria-labelledby="academic-calendar-heading"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Calendar Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2
            id="academic-calendar-heading"
            className="text-base font-semibold text-slate-900"
          >
            Academic Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {calendarEvents.length}{' '}
            {calendarEvents.length === 1 ? 'scheduled date' : 'scheduled dates'} from saved notices
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleShiftMonth(-1)}
            aria-label="Previous month"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleShiftMonth(1)}
            aria-label="Next month"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Month & Year Subheader */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">
          {formatMonthYear(viewYear, viewMonthIndex)}
        </p>
        <span className="text-xs font-mono tabular-nums text-slate-500">
          Selected: {formatDisplayDate(selectedDate)}
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-7 text-center mb-1.5">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="py-1 text-[11px] font-medium text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div
          role="grid"
          aria-label={formatMonthYear(viewYear, viewMonthIndex)}
          className="grid grid-cols-7 gap-1"
        >
          {gridDays.map((day) => {
            const dayEvents = eventsByDate[day.isoDate] ?? [];
            const isToday = day.isoDate === todayIsoDate;
            const isSelected = day.isoDate === selectedDate;
            const visibleDots = dayEvents.slice(0, 3);
            const overflowCount = dayEvents.length - visibleDots.length;

            return (
              <button
                key={day.isoDate}
                type="button"
                onClick={() => setSelectedDate(day.isoDate)}
                aria-label={`${formatDisplayDate(day.isoDate)}, ${dayEvents.length} ${
                  dayEvents.length === 1 ? 'event' : 'events'
                }`}
                aria-pressed={isSelected}
                className={`relative h-12 rounded-lg flex flex-col items-center justify-between py-1.5 px-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'bg-blue-700 text-white font-semibold'
                    : isToday
                    ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200'
                    : day.isCurrentMonth
                    ? 'text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className="font-mono tabular-nums leading-none">
                  {day.dayNumber}
                </span>

                {dayEvents.length > 0 ? (
                  <span className="flex items-center justify-center gap-0.5 h-2">
                    {visibleDots.map((ev) => {
                      const style = getCategoryIndicatorStyle(ev.category);
                      return (
                        <span
                          key={ev.id}
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : style.dotClass
                          } ${ev.isCompleted ? 'opacity-45' : ''}`}
                        />
                      );
                    })}
                    {overflowCount > 0 && (
                      <span
                        className={`text-[9px] font-mono leading-none ${
                          isSelected ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        +{overflowCount}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="h-2" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {/* Subtle Category Legend */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
          {LEGEND_CATEGORIES.map((category) => {
            const style = getCategoryIndicatorStyle(category);
            return (
              <span key={category} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full ${style.dotClass}`}
                />
                <span>{category}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events Panel */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-900">
            Schedule for {formatDisplayDate(selectedDate)}
          </h3>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {selectedDateEvents.length}{' '}
            {selectedDateEvents.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {selectedDateEvents.length === 0 ? (
          <div className="py-4 text-center">
            <CalendarIcon
              className="w-5 h-5 text-slate-400 mx-auto mb-1.5"
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-slate-700">
              No academic events scheduled on this date
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dates extracted from your saved announcements will appear here automatically.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {selectedDateEvents.map((ev) => {
              const style = getCategoryIndicatorStyle(ev.category);

              return (
                <li
                  key={ev.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold ${
                          ev.isCompleted
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {ev.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                        <span className={`inline-flex items-center gap-1 font-medium ${style.textClass}`}>
                          <span
                            aria-hidden="true"
                            className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`}
                          />
                          <span>{ev.category}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatDisplayDate(ev.date)}
                          {ev.time ? ` · ${ev.time}` : ''}
                        </span>
                      </div>
                    </div>

                    {ev.eventKind === 'deadline' && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap shrink-0 ${
                          ev.isCompleted ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {ev.isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{ev.isCompleted ? 'Completed' : 'Pending'}</span>
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-600 truncate">
                      From: {ev.announcementTitle}
                    </p>
                    <button
                      type="button"
                      onClick={() => onViewAnnouncement(ev.announcementId)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>View announcement</span>
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
