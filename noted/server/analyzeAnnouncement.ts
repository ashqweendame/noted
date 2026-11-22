import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

/**
 * Structured announcement payload returned by Gemini and validated by the backend
 * before being sent to the React Announcement Review screen.
 */
export interface AnalyzedAnnouncementPayload {
  announcement_title: string | null;
  original_text: string | null;
  category:
    | 'Examination'
    | 'Enrollment'
    | 'Submission Deadline'
    | 'Academic Requirement'
    | 'Event / Seminar'
    | 'General Notice'
    | 'Other';
  short_summary: string | null;
  target_audience: string | null;
  important_dates: {
    label: string;
    raw_text: string;
    normalized_date: string | null;
    time: string | null;
  }[];
  deadlines: {
    task: string;
    raw_text: string;
    due_date: string | null;
    due_time: string | null;
  }[];
  required_actions: string[];
  required_documents: string[];
  priority: 'High' | 'Medium' | 'Low';
  uncertain_or_missing_info: string[];
}

export class ExtractionValidationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ExtractionValidationError';
    this.statusCode = statusCode;
  }
}

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

// Keep decoded payload <= 4 MB to stay safely within Vercel Serverless Function limits
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Noted system instructions enforcing literal visual extraction
 * and preventing Gemini from inventing missing dates, years, or actions.
 */
export const CAMPUSSIGNAL_SYSTEM_INSTRUCTION = `You are Noted's academic announcement extraction engine for DCISM (Department of Computer and Information Sciences and Mathematics) students.

Your sole task is to analyze the uploaded image of an academic announcement and extract ONLY information that is explicitly visible and readable in the image.

STRICT EXTRACTION & ANTI-HALLUCINATION RULES:
1. Extract only facts directly stated or clearly depicted in the image. Do NOT guess, assume, extrapolate, or use outside knowledge about DCISM, university calendars, or typical schedules.
2. If a single-value field (such as announcement_title, original_text, short_summary, target_audience, or specific date/time fields) is missing, illegible, or not stated in the image, return null. Never use placeholder strings like "N/A", "None", or "Not specified".
3. If a list field (important_dates, deadlines, required_actions, required_documents, uncertain_or_missing_info) has no items present in the image, return an empty array [].
4. Do NOT invent missing date components. For example, if an image says "Dec 14" without a year, keep raw_text as "Dec 14" and set normalized_date or due_date to null, then add a clear note in uncertain_or_missing_info explaining that the year is missing.
5. Do NOT resolve relative dates (e.g., "tomorrow", "next Monday", "this Friday") into calendar dates unless the announcement's posting/reference date is explicitly printed in the image. Keep the exact phrase in raw_text, set normalized_date/due_date to null, and flag it in uncertain_or_missing_info.
6. Transcribe original_text as accurately as possible from the image. If parts of the image are blurry, cropped, or obscured, transcribe only the readable parts and report the unreadable sections in uncertain_or_missing_info.
7. Write short_summary in 1 to 3 concise sentences summarizing ONLY what the announcement states.
8. For category, choose the single best match from the allowed enum values based strictly on the image content.
9. For priority, assign:
   - "High" ONLY if the announcement explicitly involves an examination, enrollment/registration cutoff, urgent deadline, mandatory clearance/requirement, or uses explicit urgency wording.
   - "Medium" for standard academic deadlines, scheduled departmental activities, or non-urgent requirements.
   - "Low" for informational notices, optional seminars/events, or announcements with no required action.
10. Populate uncertain_or_missing_info whenever text is cut off, low-resolution, ambiguous (e.g., missing year, missing venue, unclear deadline time, conflicting dates), or when critical context needed to act on the announcement is absent.
11. Return valid JSON matching the provided responseSchema and nothing else.`;

const ALLOWED_CATEGORIES = new Set([
  'Examination',
  'Enrollment',
  'Submission Deadline',
  'Academic Requirement',
  'Event / Seminar',
  'General Notice',
  'Other',
]);

const ALLOWED_PRIORITIES = new Set(['High', 'Medium', 'Low']);

/**
 * Verifies magic header bytes so non-image payloads claiming an image MIME type are rejected.
 */
function matchesImageSignature(bytes: Buffer, mimeType: string): boolean {
  if (bytes.length < 12) return false;

  if (mimeType === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }

  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === 'image/webp') {
    return (
      bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  return false;
}

/**
 * Validates the uploaded image format, base64 encoding, magic signature, and byte size.
 */
export function validateAnnouncementImagePayload(
  rawBase64: unknown,
  mimeType: unknown
): { cleanBase64: string; mimeType: string; byteLength: number } {
  if (typeof mimeType !== 'string' || !ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new ExtractionValidationError(
      'Unsupported image format. Please upload a PNG, JPEG, or WEBP image.',
      400
    );
  }

  if (typeof rawBase64 !== 'string' || rawBase64.trim().length === 0) {
    throw new ExtractionValidationError('No image data was provided.', 400);
  }

  const cleanBase64 = rawBase64
    .trim()
    .replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

  if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    throw new ExtractionValidationError('Uploaded image encoding is invalid.', 400);
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length === 0) {
    throw new ExtractionValidationError('Uploaded image file is empty.', 400);
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ExtractionValidationError(
      'Uploaded image exceeds the 4 MB processing limit. Please upload a smaller or compressed screenshot.',
      413
    );
  }

  if (!matchesImageSignature(buffer, mimeType)) {
    throw new ExtractionValidationError(
      'The file contents do not match a valid PNG, JPEG, or WEBP image.',
      400
    );
  }

  return {
    cleanBase64,
    mimeType,
    byteLength: buffer.length,
  };
}

/**
 * Checks whether a string is a real YYYY-MM-DD calendar date.
 */
export function isStrictIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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
 * Builds the @google/genai responseSchema matching CampusSignal's structured output contract.
 */
export function getAnnouncementExtractionSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      announcement_title: { type: Type.STRING, nullable: true },
      original_text: { type: Type.STRING, nullable: true },
      category: {
        type: Type.STRING,
        enum: [
          'Examination',
          'Enrollment',
          'Submission Deadline',
          'Academic Requirement',
          'Event / Seminar',
          'General Notice',
          'Other',
        ],
      },
      short_summary: { type: Type.STRING, nullable: true },
      target_audience: { type: Type.STRING, nullable: true },
      important_dates: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            raw_text: { type: Type.STRING },
            normalized_date: { type: Type.STRING, nullable: true },
            time: { type: Type.STRING, nullable: true },
          },
          required: ['label', 'raw_text', 'normalized_date', 'time'],
        },
      },
      deadlines: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            task: { type: Type.STRING },
            raw_text: { type: Type.STRING },
            due_date: { type: Type.STRING, nullable: true },
            due_time: { type: Type.STRING, nullable: true },
          },
          required: ['task', 'raw_text', 'due_date', 'due_time'],
        },
      },
      required_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
      required_documents: { type: Type.ARRAY, items: { type: Type.STRING } },
      priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
      uncertain_or_missing_info: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      'announcement_title',
      'original_text',
      'category',
      'short_summary',
      'target_audience',
      'important_dates',
      'deadlines',
      'required_actions',
      'required_documents',
      'priority',
      'uncertain_or_missing_info',
    ],
  };
}

/**
 * Validates and normalizes the JSON returned by Gemini so incomplete or malformed
 * fields cannot corrupt Firestore records or invent calendar dates.
 */
export function validateAndSanitizeExtraction(
  raw: unknown
): AnalyzedAnnouncementPayload {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ExtractionValidationError(
      'AI response was not a structured JSON object.',
      502
    );
  }

  const record = raw as Partial<AnalyzedAnnouncementPayload>;

  const warnings = Array.isArray(record.uncertain_or_missing_info)
    ? record.uncertain_or_missing_info.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      )
    : [];

  const important_dates = Array.isArray(record.important_dates)
    ? record.important_dates
        .filter((item) => item && typeof item.label === 'string' && item.label.trim().length > 0)
        .map((item) => {
          const validIso = isStrictIsoDate(item.normalized_date) ? item.normalized_date : null;
          if (item.normalized_date && !validIso) {
            warnings.push(
              `Date for "${item.label}" could not be verified as a complete YYYY-MM-DD calendar date.`
            );
          }
          return {
            label: item.label.trim(),
            raw_text: typeof item.raw_text === 'string' ? item.raw_text.trim() : '',
            normalized_date: validIso,
            time: typeof item.time === 'string' && item.time.trim() ? item.time.trim() : null,
          };
        })
    : [];

  const deadlines = Array.isArray(record.deadlines)
    ? record.deadlines
        .filter((item) => item && typeof item.task === 'string' && item.task.trim().length > 0)
        .map((item) => {
          const validIso = isStrictIsoDate(item.due_date) ? item.due_date : null;
          if (item.due_date && !validIso) {
            warnings.push(
              `Deadline date for "${item.task}" could not be verified as a complete YYYY-MM-DD calendar date.`
            );
          }
          return {
            task: item.task.trim(),
            raw_text: typeof item.raw_text === 'string' ? item.raw_text.trim() : '',
            due_date: validIso,
            due_time:
              typeof item.due_time === 'string' && item.due_time.trim()
                ? item.due_time.trim()
                : null,
          };
        })
    : [];

  const cleanTitle =
    typeof record.announcement_title === 'string' && record.announcement_title.trim()
      ? record.announcement_title.trim()
      : null;
  const cleanOriginalText =
    typeof record.original_text === 'string' && record.original_text.trim()
      ? record.original_text.trim()
      : null;
  const cleanSummary =
    typeof record.short_summary === 'string' && record.short_summary.trim()
      ? record.short_summary.trim()
      : null;

  // Reject completely empty/unreadable extractions so the student receives an explicit error
  if (!cleanTitle && !cleanOriginalText && !cleanSummary) {
    throw new ExtractionValidationError(
      'No readable academic announcement text was detected in this image. Please upload a clearer screenshot.',
      422
    );
  }

  return {
    announcement_title: cleanTitle,
    original_text: cleanOriginalText,
    category: ALLOWED_CATEGORIES.has(String(record.category))
      ? (record.category as AnalyzedAnnouncementPayload['category'])
      : 'General Notice',
    short_summary: cleanSummary,
    target_audience:
      typeof record.target_audience === 'string' && record.target_audience.trim()
        ? record.target_audience.trim()
        : null,
    important_dates,
    deadlines,
    required_actions: Array.isArray(record.required_actions)
      ? record.required_actions.filter(
          (s): s is string => typeof s === 'string' && s.trim().length > 0
        )
      : [],
    required_documents: Array.isArray(record.required_documents)
      ? record.required_documents.filter(
          (s): s is string => typeof s === 'string' && s.trim().length > 0
        )
      : [],
    priority: ALLOWED_PRIORITIES.has(String(record.priority))
      ? (record.priority as AnalyzedAnnouncementPayload['priority'])
      : 'Medium',
    uncertain_or_missing_info: Array.from(new Set(warnings)),
  };
}

/**
 * Instantiates the server-side Gemini SDK client using process.env.GEMINI_API_KEY.
 */
function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ExtractionValidationError(
      'GEMINI_API_KEY is not configured on the server. Set it in your environment variables.',
      503
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Maps raw @google/genai SDK errors (which may embed nested JSON payloads)
 * into clean ExtractionValidationError messages and accurate HTTP status codes.
 */
export function mapGeminiUpstreamError(error: unknown): ExtractionValidationError {
  if (error instanceof ExtractionValidationError) {
    return error;
  }

  const raw =
    error instanceof Error ? error.message : 'Failed to analyze announcement image.';
  let cleanMessage = raw;
  let parsedCode: number | undefined;
  let parsedStatus: string | undefined;

  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: number; message?: string; status?: string };
      code?: number;
      message?: string;
      status?: string;
    };
    const inner = parsed.error ?? parsed;
    if (typeof inner.message === 'string' && inner.message.trim()) {
      cleanMessage = inner.message.trim();
    }
    if (typeof inner.code === 'number') {
      parsedCode = inner.code;
    }
    if (typeof inner.status === 'string') {
      parsedStatus = inner.status;
    }
  } catch {
    // Keep original error string if it is not JSON
  }

  const upper = `${raw} ${parsedStatus ?? ''}`.toUpperCase();
  let status = 500;
  if (parsedCode === 429 || upper.includes('RESOURCE_EXHAUSTED') || upper.includes('429')) {
    status = 429;
  } else if (parsedCode === 503 || upper.includes('UNAVAILABLE') || upper.includes('503')) {
    status = 503;
  } else if (
    parsedCode === 403 ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('API_KEY_INVALID')
  ) {
    status = 403;
  } else if (parsedCode === 400 || upper.includes('INVALID_ARGUMENT')) {
    status = 400;
  }

  return new ExtractionValidationError(cleanMessage, status);
}

/**
 * End-to-end backend extraction pipeline:
 * validates image bytes -> calls Gemini 4 Hydrogen with structured JSON schema -> sanitizes output.
 */
export async function analyzeAnnouncementImage(
  rawBase64: unknown,
  rawMimeType: unknown
): Promise<AnalyzedAnnouncementPayload> {
  const { cleanBase64, mimeType } = validateAnnouncementImagePayload(
    rawBase64,
    rawMimeType
  );

  const ai = createGeminiClient();

  const callGemini = () =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: 'Analyze this academic announcement image and extract the structured JSON fields. Only include explicitly visible dates.',
          },
        ],
      },
      config: {
        systemInstruction: CAMPUSSIGNAL_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: getAnnouncementExtractionSchema(),
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        seed: 42,
      },
    });

  let response;
  try {
    response = await callGemini();
  } catch (firstErr) {
    const mapped = mapGeminiUpstreamError(firstErr);
    if (mapped.statusCode === 503) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      try {
        response = await callGemini();
      } catch (retryErr) {
        throw mapGeminiUpstreamError(retryErr);
      }
    } else {
      throw mapped;
    }
  }

  if (!response.text) {
    throw new ExtractionValidationError(
      'Gemini returned an empty response for this announcement image.',
      502
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text);
  } catch {
    throw new ExtractionValidationError(
      'Gemini returned malformed JSON that could not be parsed.',
      502
    );
  }

  return validateAndSanitizeExtraction(parsed);
}
