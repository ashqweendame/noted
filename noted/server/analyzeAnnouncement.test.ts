import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ExtractionValidationError,
  isStrictIsoDate,
  mapGeminiUpstreamError,
  validateAndSanitizeExtraction,
  validateAnnouncementImagePayload,
} from './analyzeAnnouncement';

// Minimal valid 12+ byte headers for PNG, JPEG, WEBP
const PNG_BASE64 = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]).toString('base64');

const JPEG_BASE64 = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]).toString('base64');

test('validateAnnouncementImagePayload accepts valid PNG/JPEG signatures and rejects invalid types or spoofed bytes', () => {
  const png = validateAnnouncementImagePayload(`data:image/png;base64,${PNG_BASE64}`, 'image/png');
  assert.equal(png.mimeType, 'image/png');
  assert.ok(png.byteLength >= 12);

  const jpeg = validateAnnouncementImagePayload(JPEG_BASE64, 'image/jpeg');
  assert.equal(jpeg.mimeType, 'image/jpeg');

  assert.throws(
    () => validateAnnouncementImagePayload(PNG_BASE64, 'image/gif'),
    ExtractionValidationError
  );

  // PNG bytes pretending to be JPEG must fail signature validation
  assert.throws(
    () => validateAnnouncementImagePayload(PNG_BASE64, 'image/jpeg'),
    ExtractionValidationError
  );
});

test('isStrictIsoDate validates real calendar dates and rejects invalid days', () => {
  assert.equal(isStrictIsoDate('2026-12-14'), true);
  assert.equal(isStrictIsoDate('2026-02-29'), false); // 2026 is not a leap year
  assert.equal(isStrictIsoDate('next Friday'), false);
});

test('validateAndSanitizeExtraction enforces null/[] defaults and strips non-ISO dates into warnings', () => {
  const sanitized = validateAndSanitizeExtraction({
    announcement_title: 'CS 3101 Final Exam',
    original_text: 'Final exam on Dec 14',
    category: 'Examination',
    short_summary: 'CS 3101 final exam is scheduled on Dec 14.',
    target_audience: '  ',
    important_dates: [
      {
        label: 'Final Exam',
        raw_text: 'Dec 14',
        normalized_date: 'Dec 14',
        time: '',
      },
    ],
    deadlines: [
      {
        task: 'Verify exam permit',
        raw_text: '2026-12-11',
        due_date: '2026-12-11',
        due_time: '5:00 PM',
      },
    ],
    required_actions: ['Bring student ID', ''],
    required_documents: null,
    priority: 'High',
    uncertain_or_missing_info: [],
  });

  assert.equal(sanitized.target_audience, null);
  assert.equal(sanitized.important_dates[0].normalized_date, null);
  assert.equal(sanitized.deadlines[0].due_date, '2026-12-11');
  assert.deepEqual(sanitized.required_actions, ['Bring student ID']);
  assert.deepEqual(sanitized.required_documents, []);
  assert.ok(sanitized.uncertain_or_missing_info.length === 1);
});

test('validateAndSanitizeExtraction rejects completely empty/unreadable extractions', () => {
  assert.throws(
    () =>
      validateAndSanitizeExtraction({
        announcement_title: null,
        original_text: null,
        category: 'General Notice',
        short_summary: null,
        target_audience: null,
        important_dates: [],
        deadlines: [],
        required_actions: [],
        required_documents: [],
        priority: 'Low',
        uncertain_or_missing_info: [],
      }),
    ExtractionValidationError
  );
});

test('mapGeminiUpstreamError extracts clean messages and HTTP status codes from nested JSON errors', () => {
  const unavailable = mapGeminiUpstreamError(
    new Error(
      JSON.stringify({
        error: {
          code: 503,
          message: 'This model is currently experiencing high demand.',
          status: 'UNAVAILABLE',
        },
      })
    )
  );
  assert.equal(unavailable.statusCode, 503);
  assert.equal(unavailable.message, 'This model is currently experiencing high demand.');

  const quota = mapGeminiUpstreamError(new Error('429 RESOURCE_EXHAUSTED'));
  assert.equal(quota.statusCode, 429);
});
