// PIN hashing (PBKDF2-SHA256 via WebCrypto), session tokens, and input validation.

const PBKDF2_ITERATIONS = 100_000; // Workers' maximum supported iteration count
const SALT_BYTES = 16;
const TOKEN_BYTES = 32;

export const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const enc = new TextEncoder();

export function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomBytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

export function newSalt(): string {
  return toBase64Url(randomBytes(SALT_BYTES));
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64Url(salt), iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toBase64Url(new Uint8Array(bits));
}

/** Constant-time string comparison (both inputs are fixed-length base64url hashes). */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  return timingSafeEqual(await hashPin(pin, salt), expectedHash);
}

export function newToken(): string {
  return toBase64Url(randomBytes(TOKEN_BYTES));
}

/** Tokens are stored as SHA-256 digests so a database leak doesn't leak live sessions. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return toBase64Url(new Uint8Array(digest));
}

export function bearerToken(req: Request): string | null {
  const h = req.headers.get('authorization');
  if (!h) return null;
  const m = /^Bearer\s+([A-Za-z0-9_-]{20,100})$/.exec(h.trim());
  return m ? m[1] : null;
}

/** Returns the normalised callsign, or null if invalid. */
export function normalizeCallsign(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (s.length < 3 || s.length > 16) return null;
  if (!/^[A-Za-z0-9_ ]+$/.test(s)) return null;
  if (s.includes('  ')) return null;
  return s;
}

export function isValidPin(raw: unknown): raw is string {
  return typeof raw === 'string' && /^\d{4}$/.test(raw);
}
