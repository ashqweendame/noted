import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDashboardMetrics,
  filterAnnouncements,
  getAnnouncementCompletionState,
  getDeadlineUrgency,
  getUpcomingDeadlines,
  validateAnnouncementDraft,
} from './announcementLogic';
import type { Announcement, AnnouncementDraft } from '../types/announcement';

const sampleAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'CS 3101 Final Examination Schedule',
    originalText: 'CS 3101 Algorithms Dec 14 Room LB445',
    category: 'Examination',
    shortSummary: 'Final exams for CS 3101 will be held in LB445.',
    targetAudience: 'BSCS 3rd Year',
    importantDates: [],
    deadlines: [
      {
        id: 'dl-1',
        task: 'Verify exam permit',
        rawText: 'Dec 10',
        dueDate: '2026-12-10',
        dueTime: '5:00 PM',
        isCompleted: false,
      },
    ],
    requiredActions: [
      { id: 'act-1', text: 'Bring student ID', isCompleted: true },
      { id: 'act-2', text: 'Check room assignment', isCompleted: false },
    ],
    requiredDocuments: ['Exam Permit'],
    priority: 'High',
    uncertainOrMissingInfo: [],
    imageUrl: null,
    imageName: null,
    createdAt: '2026-11-20T09:00:00Z',
    updatedAt: '2026-11-20T09:00:00Z',
  },
  {
    id: 'ann-2',
    title: 'Tech Talk: Distributed Systems',
    originalText: 'Seminar in Auditorium',
    category: 'Event / Seminar',
    shortSummary: 'Guest lecture on distributed consensus.',
    targetAudience: 'All DCISM Students',
    importantDates: [],
    deadlines: [
      {
        id: 'dl-2',
        task: 'RSVP online',
        rawText: 'Nov 24, 2026',
        dueDate: '2026-11-24',
        dueTime: null,
        isCompleted: true,
      },
    ],
    requiredActions: [],
    requiredDocuments: [],
    priority: 'Low',
    uncertainOrMissingInfo: [],
    imageUrl: null,
    imageName: null,
    createdAt: '2026-11-18T09:00:00Z',
    updatedAt: '2026-11-18T09:00:00Z',
  },
];

test('computeDashboardMetrics counts announcements, pending tasks, and completed items accurately', () => {
  const metrics = computeDashboardMetrics(sampleAnnouncements);
  assert.equal(metrics.totalAnnouncements, 2);
  assert.equal(metrics.upcomingDeadlinesCount, 1);
  assert.equal(metrics.pendingTasksCount, 2);
  assert.equal(metrics.completedTasksCount, 2);
});

test('getUpcomingDeadlines puts pending deadlines before completed ones', () => {
  const deadlines = getUpcomingDeadlines(sampleAnnouncements);
  assert.equal(deadlines.length, 2);
  assert.equal(deadlines[0].deadline.id, 'dl-1');
  assert.equal(deadlines[1].deadline.id, 'dl-2');
});

test('filterAnnouncements filters by search, category, and completion status', () => {
  const byCategory = filterAnnouncements(sampleAnnouncements, {
    search: '',
    category: 'Examination',
    statusFilter: 'all',
    priorityFilter: 'All',
  });
  assert.equal(byCategory.length, 1);
  assert.equal(byCategory[0].id, 'ann-1');

  const completedOnly = filterAnnouncements(sampleAnnouncements, {
    search: '',
    category: 'All',
    statusFilter: 'completed',
    priorityFilter: 'All',
  });
  assert.equal(completedOnly.length, 1);
  assert.equal(completedOnly[0].id, 'ann-2');

  const searchResult = filterAnnouncements(sampleAnnouncements, {
    search: 'distributed',
    category: 'All',
    statusFilter: 'all',
    priorityFilter: 'All',
  });
  assert.equal(searchResult.length, 1);
  assert.equal(searchResult[0].id, 'ann-2');
});

test('getAnnouncementCompletionState calculates completion accurately', () => {
  const state1 = getAnnouncementCompletionState(sampleAnnouncements[0]);
  assert.equal(state1.completedCount, 1);
  assert.equal(state1.totalCount, 3);
  assert.equal(state1.isFullyCompleted, false);

  const state2 = getAnnouncementCompletionState(sampleAnnouncements[1]);
  assert.equal(state2.isFullyCompleted, true);
});

test('getDeadlineUrgency classifies overdue, due soon, upcoming, completed, and unspecified dates', () => {
  assert.equal(getDeadlineUrgency('2026-11-24', true, '2026-11-21'), 'Completed');
  assert.equal(getDeadlineUrgency('2026-11-19', false, '2026-11-21'), 'Overdue');
  assert.equal(getDeadlineUrgency('2026-11-25', false, '2026-11-21'), 'Due Soon');
  assert.equal(getDeadlineUrgency('2026-12-14', false, '2026-11-21'), 'Upcoming');
  assert.equal(getDeadlineUrgency(null, false, '2026-11-21'), 'Date Unspecified');
});

test('validateAnnouncementDraft flags empty title and summary', () => {
  const badDraft: AnnouncementDraft = {
    title: '   ',
    originalText: '',
    category: 'General Notice',
    shortSummary: '',
    targetAudience: '',
    importantDates: [],
    deadlines: [{ id: 'd1', task: '', rawText: '', dueDate: null, dueTime: null, isCompleted: false }],
    requiredActions: [],
    requiredDocuments: [],
    priority: 'Medium',
    uncertainOrMissingInfo: [],
    imageUrl: null,
    imageName: null,
  };
  const errors = validateAnnouncementDraft(badDraft);
  assert.ok(errors.title);
  assert.ok(errors.shortSummary);
  assert.ok(errors.deadline_0);
});
