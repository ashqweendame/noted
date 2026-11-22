import type { IncomingMessage, ServerResponse } from 'http';

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

export default function handler(_req: IncomingMessage, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'ok',
    service: 'noted-api',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    authConfigured: Boolean(process.env.FIREBASE_API_KEY),
  });
}
