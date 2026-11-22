# Deploying Noted to Vercel

## 1. Before you push
```bash
npm install
npm run lint     # typecheck
npm test         # unit tests
npm run build    # production build -> dist/
```

## 2. Create the Vercel project
1. Push the repo to GitHub, then import it at https://vercel.com/new.
2. Framework preset: **Vite** (already pinned in `vercel.json`). Build command `npm run build`, output `dist`.
3. Node.js version: 24.x (set by `engines` in `package.json`; Firebase SDK 13 needs Node 24.12+).

## 3. Environment variables (Project Settings -> Environment Variables)
| Name | Value | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | your Gemini API key | server only, never `VITE_`-prefixed |
| `FIREBASE_API_KEY` | the `apiKey` in `firebase-applet-config.json` | used by the API to verify the student's sign-in token |

Add both to Production, Preview, and Development, then redeploy.

If the Firebase key is restricted in Google Cloud Console, either allow the Identity Toolkit API for it
and remove HTTP-referrer restrictions (server calls carry no referrer), or create a separate server key
with only "Identity Toolkit API" enabled and use that for `FIREBASE_API_KEY`.

## 4. Firebase console
- **Authentication -> Settings -> Authorized domains**: add `your-app.vercel.app` (and any custom domain). Without this, Google sign-in fails in production.
- Deploy the security rules (uses `firebase.json`, which targets the named Firestore database):
  ```bash
  npx firebase-tools login
  npx firebase-tools deploy --only firestore,storage
  ```
- Make sure Firebase Storage is enabled (Blaze plan may be required for new buckets). If it isn't,
  the app falls back to a compressed thumbnail stored in Firestore.

## 5. Verify
- `https://your-app.vercel.app/api/health` should return `"geminiConfigured": true` and `"authConfigured": true`.
- Sign in, upload a sample notice, review, and save.

## Troubleshooting
| Symptom | Cause |
| --- | --- |
| `401` "sign in again" on analyze | Not signed in / expired token; sign out and in |
| `503` "FIREBASE_API_KEY is not configured" | Env var missing on Vercel; add and redeploy |
| `503` "GEMINI_API_KEY is not configured" | Env var missing on Vercel; add and redeploy |
| `auth/unauthorized-domain` on sign-in | Vercel domain not in Firebase Authorized domains |
| `413` | Image too large; client downsizes above ~2.8 MB, Vercel request cap is 4.5 MB |
| Blank page on refresh of a deep link | Rewrites missing; keep `vercel.json` as provided |

## Self-hosting (optional)
```bash
npm run build
npm start     # Express serves dist/ and /api on PORT (default 3000)
```
