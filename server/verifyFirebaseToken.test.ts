import test from 'node:test';
import assert from 'node:assert/strict';
import { ExtractionValidationError } from './analyzeAnnouncement';
import { verifyFirebaseIdToken } from './verifyFirebaseToken';

const originalFetch = globalThis.fetch;
const originalKey = process.env.FIREBASE_API_KEY;

function restore() {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.FIREBASE_API_KEY;
  else process.env.FIREBASE_API_KEY = originalKey;
}

test('verifyFirebaseIdToken returns 503 when FIREBASE_API_KEY is missing', async () => {
  delete process.env.FIREBASE_API_KEY;
  await assert.rejects(
    () => verifyFirebaseIdToken('Bearer abc'),
    (err) => err instanceof ExtractionValidationError && err.statusCode === 503
  );
  restore();
});

test('verifyFirebaseIdToken returns 401 when the bearer token is missing', async () => {
  process.env.FIREBASE_API_KEY = 'test-key';
  await assert.rejects(
    () => verifyFirebaseIdToken(undefined),
    (err) => err instanceof ExtractionValidationError && err.statusCode === 401
  );
  restore();
});

test('verifyFirebaseIdToken accepts verified users and rejects unverified or invalid tokens', async () => {
  process.env.FIREBASE_API_KEY = 'test-key';

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ users: [{ localId: 'uid1', email: 'a@b.c', emailVerified: true }] }),
      { status: 200 }
    )) as typeof fetch;
  const ok = await verifyFirebaseIdToken('Bearer good-token');
  assert.deepEqual(ok, { uid: 'uid1', email: 'a@b.c' });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ users: [{ localId: 'uid2', emailVerified: false }] }),
      { status: 200 }
    )) as typeof fetch;
  await assert.rejects(
    () => verifyFirebaseIdToken('Bearer unverified'),
    (err) => err instanceof ExtractionValidationError && err.statusCode === 403
  );

  globalThis.fetch = (async () => new Response('{}', { status: 400 })) as typeof fetch;
  await assert.rejects(
    () => verifyFirebaseIdToken('Bearer bad'),
    (err) => err instanceof ExtractionValidationError && err.statusCode === 401
  );

  restore();
});
