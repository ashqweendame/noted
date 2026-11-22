# Noted

AI-powered personal academic announcement organizer for DCISM students. Students upload screenshots or photos of academic announcements, extract structured schedules and requirements via Google Gemini (`@google/genai`), review and edit every extracted field before saving, store announcement records in **Firebase Firestore** and images in **Firebase Storage**, and track everything across a unified Dashboard, Upcoming Deadlines list, and interactive Academic Calendar.

> Deploying? See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the Vercel + Firebase checklist.

---

## Architecture Overview

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite (`src/`).
- **Backend / Serverless API**:
  - **Vercel Serverless Functions** (`api/announcements/analyze.ts`, `api/health.ts`).
  - **Express Dev & Node Server** (`server.ts`) mounting the exact same handler alongside Vite HMR/static assets on port `3000`.
  - **Shared request handler** (`server/handleAnalyze.ts`): verifies the student's Firebase ID token (`server/verifyFirebaseToken.ts`), then runs the Gemini pipeline.
  - **Gemini pipeline** (`server/analyzeAnnouncement.ts`): image signature + size validation, strict anti-hallucination system instructions, structured `responseSchema` extraction using `gemini-4-hydrogen`, and JSON sanitization.
- **Database, Auth & Media**:
  - **Firebase Authentication**: Google Sign-In (`email_verified == true` enforced by security rules).
  - **Firebase Firestore**: real-time `onSnapshot` sync for per-student announcements (`users/{uid}/announcements/{announcementId}`).
  - **Firebase Storage**: uploaded images at `users/{uid}/announcements/{announcementId}/{filename}` (compressed thumbnail fallback if Storage is not active).

---

## Prerequisites

- **Node.js 24+** (Firebase SDK 13 requires 24.12+) and **npm 10+**
- A **Google Gemini API key** (`GEMINI_API_KEY`)
- A **Firebase project** with Authentication (Google provider), Firestore, and Storage enabled

---

## Local Development

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY="your-real-gemini-api-key"
FIREBASE_API_KEY="the apiKey value from firebase-applet-config.json"
PORT="3000"
APP_URL="http://localhost:3000"
```

> **Security note**: `GEMINI_API_KEY` is read only on the server. Never prefix it with `VITE_` or reference it in `src/`.

Public Firebase client settings live in `firebase-applet-config.json`. Replace them with your own project's values if deploying outside this workspace.

```bash
npm run dev      # app + API at http://localhost:3000
npm run lint     # typecheck
npm test         # unit tests
npm run build    # production build -> dist/
npm start        # serve dist/ + API from Express (production mode)
```

Sample notice images referenced by the "Try with Sample" buttons live in `src/assets/images/`. If they are missing, the app falls back to a placeholder tile.

---

## API

### `GET /api/health`

```json
{ "status": "ok", "service": "noted-api", "geminiConfigured": true, "authConfigured": true }
```

### `POST /api/announcements/analyze`

Headers: `Authorization: Bearer <Firebase ID token>` and `Content-Type: application/json`.

```json
{ "imageBase64": "<base64-or-data-url>", "mimeType": "image/png" }
```

The client (`src/utils/imageUtils.ts`) downsizes images above ~2.8 MB to stay under Vercel's 4.5 MB request limit. Response: `{ "data": ExtractedAnnouncement }` or `{ "error": "..." }`.

| HTTP Status | Meaning |
| --- | --- |
| `400` | Missing image, unsupported MIME type, or corrupted/spoofed image bytes |
| `401` | Missing, invalid, or expired Firebase sign-in token |
| `403` | Account email not verified, or Gemini key rejected |
| `413` | Decoded image exceeds the 4 MB limit |
| `422` | Image is unreadable or yielded no usable announcement content |
| `429` | Upstream Gemini quota or rate limit exceeded |
| `503` | `GEMINI_API_KEY` or `FIREBASE_API_KEY` missing on the server |

---

## Firebase Security Rules

- `firestore.rules`: requires `request.auth != null`, `request.auth.uid == userId`, `email_verified == true`, strict schema validation, and size limits.
- `storage.rules`: restricts `users/{userId}/announcements/{announcementId}/{fileName}` to the verified owner, `image/*` MIME types, and files under 10 MB.

Deploy both (uses `firebase.json`, which targets the named Firestore database):

```bash
npx firebase-tools deploy --only firestore,storage
```

---

## Deploying to Vercel

Follow [DEPLOYMENT.md](./DEPLOYMENT.md). In short: import the repo (Vite preset), set `GEMINI_API_KEY` and `FIREBASE_API_KEY`, add your Vercel domain to Firebase Authentication -> Authorized domains, deploy the rules, and check `/api/health`.
