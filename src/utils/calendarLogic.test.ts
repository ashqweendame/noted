import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveCalendarEventsFromAnnouncements,
  formatMonthYear,
  getMonthGridDays,
  groupCalendarEventsByDate,
  isValidIsoCalendarDate,
  shiftMonth,
} from './calendarLogic';
import type { Announcement } from '../types/announcement';

const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'CS 3101 Final Examination',
    originalText: null,
    category: 'Examination',
    shortSummary: 'Final exam in LB445.',
    targetAudience: 'BSCS 3',
    importantDates: [
      {
        id: 'd-1',
        label: 'CS 3101 Final Exam',
        rawText: 'Dec 14, 2026',
        normalizedDate: '2026-12-14',
        time: '9:00 AM',
      },
      {
        id: 'd-missing',
        label: 'Clarification meeting',
        rawText: 'Next Friday',
        normalizedDate: null,
        time: null,
      },
    ],
    deadlines: [
      {
        id: 'dl-1',
        task: 'CS 3101 Final Exam',
        rawText: 'Dec 14, 2026',
        dueDate: '2026-12-14',
        dueTime: '9:00 AM',
        isCompleted: false,
      },
      {
        id: 'dl-2',
        task: 'Submit exam permit',
        rawText: 'Dec 11, 2026',
        dueDate: '2026-12-11',
        dueTime: '5:00 PM',
        isCompleted: true,
      },
    ],
    requiredActions: [],
    requiredDocuments: [],
    priority: 'High',
    uncertainOrMissingInfo: [],
    imageUrl: null,
    imageName: null,
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
  },
];

test('isValidIsoCalendarDate accepts real YYYY-MM-DD dates and rejects invalid or null values', () => {
  assert.equal(isValidIsoCalendarDate('2026-11-21'), true);
  assert.equal(isValidIsoCalendarDate('2026-02-30'), false);
  assert.equal(isValidIsoCalendarDate('Dec 14'), false);
  assert.equal(isValidIsoCalendarDate(null), false);
});

test('deriveCalendarEventsFromAnnouncements omits null dates and deduplicates identical announcement date+title pairs', () => {
  const events = deriveCalendarEventsFromAnnouncements(mockAnnouncements);
  assert.equal(events.length, 2);
  assert.equal(events[0].date, '2026-12-11');
  assert.equal(events[0].isCompleted, true);
  assert.equal(events[1].date, '2026-12-14');
  assert.equal(events[1].eventKind, 'deadline');
});

test('deriveCalendarEventsFromAnnouncements reflects announcement edits and deletions immediately', () => {
  const edited = [
    {
      ...mockAnnouncements[0],
      deadlines: [
        {
          ...mockAnnouncements[0].deadlines[0],
          dueDate: '2026-12-15',
        },
      ],
      importantDates: [],
    },
  ];
  const editedEvents = deriveCalendarEventsFromAnnouncements(edited);
  assert.equal(editedEvents.length, 1);
  assert.equal(editedEvents[0].date, '2026-12-15');

  const deletedEvents = deriveCalendarEventsFromAnnouncements([]);
  assert.equal(deletedEvents.length, 0);
});

test('groupCalendarEventsByDate groups events under their ISO date key', () => {
  const events = deriveCalendarEventsFromAnnouncements(mockAnnouncements);
  const grouped = groupCalendarEventsByDate(events);
  assert.equal(grouped['2026-12-11']?.length, 1);
  assert.equal(grouped['2026-12-14']?.length, 1);
  assert.equal(grouped['2026-11-21'], undefined);
});

test('getMonthGridDays and shiftMonth handle month rollovers cleanly', () => {
  const novGrid = getMonthGridDays(2026, 10); // Nov 2026 (0-indexed)
  assert.equal(novGrid.length, 35);
  assert.equal(novGrid[0].isoDate, '2026-11-01');
  assert.equal(novGrid[0].isCurrentMonth, true);

  const next = shiftMonth(2026, 11, 1); // Dec -> Jan 2027
  assert.equal(next.year, 2027);
  assert.equal(next.monthIndex, 0);
  assert.equal(formatMonthYear(next.year, next.monthIndex), 'January 2027');
});
