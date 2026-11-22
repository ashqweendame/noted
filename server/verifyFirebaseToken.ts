import { ExtractionValidationError } from './analyzeAnnouncement.js';

export interface VerifiedStudent {
  uid: string;
  email: string | null;
}

/**
 * Verifies a Firebase Auth ID token without needing a service account by asking
 * Google's Identity Toolkit REST endpoint to look the user up. Requires the Firebase
 * Web API key (the same public key found in firebase-applet-config.json) in
 * process.env.FIREBASE_API_KEY.
 *
 * This keeps /api/announcements/analyze from being an open proxy to your Gemini quota.
 */
export async function verifyFirebaseIdToken(
  authorizationHeader: string | undefined
): Promise<VerifiedStudent> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    throw new ExtractionValidationError(
      'FIREBASE_API_KEY is not configured on the server. Set it in your environment variables.',
      503
    );
  }

  const match = /^Bearer\s+(\S+)$/i.exec(authorizationHeader ?? '');
  if (!match) {
    throw new ExtractionValidationError(
      'Please sign in again before analyzing an announcement.',
      401
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: match[1] }),
        signal: AbortSignal.timeout(8000),
      }
    );
  } catch {
    throw new ExtractionValidationError(
      'Could not verify your session right now. Please try again.',
      502
    );
  }

  if (!response.ok) {
    throw new ExtractionValidationError(
      'Your session is invalid or expired. Please sign in again.',
      401
    );
  }

  const data = (await response.json()) as {
    users?: { localId?: string; email?: string; emailVerified?: boolean }[];
  };
  const user = data.users?.[0];

  if (!user?.localId || user.emailVerified !== true) {
    throw new ExtractionValidationError(
      'A verified Google account is required to use Noted.',
      403
    );
  }

  return { uid: user.localId, email: user.email ?? null };
}
