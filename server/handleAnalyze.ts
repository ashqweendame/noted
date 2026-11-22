import {
  analyzeAnnouncementImage,
  mapGeminiUpstreamError,
} from './analyzeAnnouncement.js';
import { verifyFirebaseIdToken } from './verifyFirebaseToken.js';

export interface AnalyzeHttpResult {
  status: number;
  body: { data: unknown } | { error: string };
}

/**
 * Framework-agnostic handler shared by the Vercel Function (api/announcements/analyze.ts)
 * and the local/self-hosted Express server (server.ts).
 */
export async function handleAnalyzeRequest(
  authorizationHeader: string | undefined,
  rawBody: unknown
): Promise<AnalyzeHttpResult> {
  try {
    await verifyFirebaseIdToken(authorizationHeader);

    const body =
      rawBody && typeof rawBody === 'object'
        ? (rawBody as { imageBase64?: unknown; mimeType?: unknown })
        : {};

    const data = await analyzeAnnouncementImage(body.imageBase64, body.mimeType);
    return { status: 200, body: { data } };
  } catch (error) {
    const mapped = mapGeminiUpstreamError(error);
    return { status: mapped.statusCode, body: { error: mapped.message } };
  }
}
