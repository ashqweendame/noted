import type { IncomingMessage, ServerResponse } from 'http';
import { handleAnalyzeRequest } from '../../server/handleAnalyze.js';

interface VercelRequest extends IncomingMessage {
  body?: unknown;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

/**
 * Vercel Serverless Function for POST /api/announcements/analyze.
 * Requires a Firebase ID token (Authorization: Bearer ...) and uses
 * process.env.GEMINI_API_KEY exclusively on the server.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const result = await handleAnalyzeRequest(req.headers.authorization, req.body);
  res.status(result.status).json(result.body);
}
