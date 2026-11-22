import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { handleAnalyzeRequest } from './server/handleAnalyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProduction =
    process.env.NODE_ENV === 'production' || process.argv.includes('--production');

  // Base64 screenshots are validated to <= 4 MB decoded; 10 MB leaves headroom for JSON overhead
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'noted-api',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      authConfigured: Boolean(process.env.FIREBASE_API_KEY),
    });
  });

  app.post('/api/announcements/analyze', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const result = await handleAnalyzeRequest(req.headers.authorization, req.body);
    res.status(result.status).json(result.body);
  });

  // Unknown API routes must return JSON, never the SPA shell
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  // Keep body-parser failures (oversized / malformed JSON) as JSON the client can read
  const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const status =
      typeof err?.status === 'number' && err.status >= 400 && err.status < 600
        ? err.status
        : 500;
    res.status(status).json({
      error:
        err?.type === 'entity.too.large'
          ? 'Uploaded image is too large. Please upload a smaller or compressed screenshot.'
          : status === 400
          ? 'Request body was not valid JSON.'
          : 'Unexpected server error.',
    });
  };
  app.use(jsonErrorHandler);

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    // Express 4 catch-all (the "/{*splat}" syntax only exists in Express 5)
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Noted server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Noted server:', err);
  process.exit(1);
});
