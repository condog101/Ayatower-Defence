// Ayatower Defence Worker: serves the static game (ASSETS) and the /api/* JSON routes.

import { LEVEL_COUNT, mergeProgress, sanitizeProgress } from '../../shared/progress';
import { isPlausibleRun, type RunSubmission } from '../../shared/scoring';
import {
  bearerToken,
  hashPin,
  hashToken,
  isValidPin,
  newSalt,
  newToken,
  normalizeCallsign,
  SESSION_TTL_MS,
  verifyPin,
} from './auth';
import * as db from './db';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ALLOWED_ORIGIN?: string;
}

const MAX_BODY_BYTES = 8 * 1024;
const RATE_MAX = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const DEV_ORIGINS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
// Spent on unknown callsigns so login timing doesn't reveal whether a callsign exists.
const DUMMY_SALT = 'AAAAAAAAAAAAAAAAAAAAAA';

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
  }
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      ...headers,
    },
  });
}

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('origin');
  if (!origin) return {};
  const allowed = DEV_ORIGINS.has(origin) || (!!env.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN);
  if (!allowed) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '600',
    vary: 'Origin',
  };
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > MAX_BODY_BYTES) throw new HttpError(413, 'Request body too large');
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'Request body too large');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Expected a JSON object');
  return body as Record<string, unknown>;
}

function clientIp(req: Request): string {
  return req.headers.get('cf-connecting-ip') ?? 'unknown';
}

async function enforceRate(env: Env, keys: string[], now: number): Promise<void> {
  for (const key of keys) {
    const s = await db.rateStatus(env.DB, key, RATE_MAX, RATE_WINDOW_MS, now);
    if (s.blocked) {
      throw new HttpError(429, 'Too many attempts. Try again later.', { 'retry-after': String(s.retryAfterSec) });
    }
  }
}

async function requirePlayer(req: Request, env: Env, now: number): Promise<{ player: db.PlayerRow; tokenHash: string }> {
  const token = bearerToken(req);
  if (!token) throw new HttpError(401, 'Not signed in');
  const tokenHash = await hashToken(token);
  const player = await db.getSessionPlayer(env.DB, tokenHash, now, SESSION_TTL_MS);
  if (!player) throw new HttpError(401, 'Session expired');
  return { player, tokenHash };
}

function credentials(body: Record<string, unknown>): { callsign: string; pin: string } {
  const callsign = normalizeCallsign(body.callsign);
  if (!callsign) throw new HttpError(400, 'Name must be 3-16 letters, numbers, spaces or underscores');
  if (!isValidPin(body.pin)) throw new HttpError(400, 'PIN must be exactly 4 digits');
  return { callsign, pin: body.pin };
}

async function startSession(env: Env, player: db.PlayerRow, now: number): Promise<Response> {
  const token = newToken();
  await db.createSession(env.DB, await hashToken(token), player.id, now);
  return json({ token, profile: db.toProfile(player) });
}

// ---- Handlers ----

async function register(req: Request, env: Env, now: number): Promise<Response> {
  const { callsign, pin } = credentials(await readJson(req));
  const ipKey = `reg:ip:${clientIp(req)}`;
  await enforceRate(env, [ipKey], now);
  await db.bumpAttempt(env.DB, ipKey, RATE_WINDOW_MS, now);
  const salt = newSalt();
  const player = await db.createPlayer(env.DB, callsign, await hashPin(pin, salt), salt, now);
  if (!player) throw new HttpError(409, 'That name is already sworn');
  return startSession(env, player, now);
}

async function login(req: Request, env: Env, now: number): Promise<Response> {
  const { callsign, pin } = credentials(await readJson(req));
  const csKey = `login:cs:${callsign.toLowerCase()}`;
  const ipKey = `login:ip:${clientIp(req)}`;
  await enforceRate(env, [csKey, ipKey], now);
  const player = await db.getPlayerByCallsign(env.DB, callsign);
  const ok = player
    ? await verifyPin(pin, player.salt, player.pin_hash)
    : (await hashPin(pin, DUMMY_SALT), false);
  if (!player || !ok) {
    await db.bumpAttempt(env.DB, csKey, RATE_WINDOW_MS, now);
    await db.bumpAttempt(env.DB, ipKey, RATE_WINDOW_MS, now);
    throw new HttpError(401, 'Wrong name or PIN');
  }
  await db.resetAttempts(env.DB, csKey);
  return startSession(env, player, now);
}

async function me(req: Request, env: Env, now: number): Promise<Response> {
  const { player } = await requirePlayer(req, env, now);
  return json(db.toProfile(player));
}

async function putProgress(req: Request, env: Env, now: number): Promise<Response> {
  const { player } = await requirePlayer(req, env, now);
  const incoming = sanitizeProgress(await readJson(req));
  const merged = mergeProgress(db.parseProgress(player.progress_json), incoming);
  await db.saveProgress(env.DB, player.id, merged, now);
  return json({ ...db.toProfile(player), progress: merged });
}

async function postRun(req: Request, env: Env, now: number): Promise<Response> {
  const { player } = await requirePlayer(req, env, now);
  const body = await readJson(req);
  const run: RunSubmission = {
    score: body.score as number,
    startLevel: body.startLevel === undefined ? 1 : (body.startLevel as number),
    levelReached: body.levelReached as number,
    durationMs: body.durationMs as number,
    kills: body.kills as number,
  };
  if (!isPlausibleRun(run)) return json({ error: 'Run rejected', accepted: false }, 400);
  await db.insertRun(env.DB, player.id, run, now);
  const progress = db.parseProgress(player.progress_json);
  if (run.startLevel > LEVEL_COUNT) progress.endlessBest = Math.max(progress.endlessBest, run.score);
  else progress.bestRun = Math.max(progress.bestRun, run.score);
  await db.saveProgress(env.DB, player.id, progress, now);
  return json({ accepted: true, rank: await db.rankForScore(env.DB, player.id, run.score) });
}

async function getLeaderboard(req: Request, env: Env): Promise<Response> {
  const raw = Number(new URL(req.url).searchParams.get('limit') ?? '20');
  const limit = Number.isFinite(raw) ? Math.min(50, Math.max(1, Math.floor(raw))) : 20;
  return json(await db.leaderboard(env.DB, limit));
}

async function logout(req: Request, env: Env, now: number): Promise<Response> {
  const { tokenHash } = await requirePlayer(req, env, now);
  await db.deleteSession(env.DB, tokenHash);
  return json({ ok: true });
}

type Handler = (req: Request, env: Env, now: number) => Promise<Response>;

const ROUTES: Record<string, Partial<Record<string, Handler>>> = {
  '/api/register': { POST: register },
  '/api/login': { POST: login },
  '/api/logout': { POST: logout },
  '/api/me': { GET: me },
  '/api/me/progress': { PUT: putProgress },
  '/api/runs': { POST: postRun },
  '/api/leaderboard': { GET: getLeaderboard },
};

async function handleApi(req: Request, env: Env): Promise<Response> {
  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  const route = ROUTES[path];
  if (!route) return json({ error: 'Not found' }, 404);
  const handler = route[req.method];
  if (!handler) return json({ error: 'Method not allowed' }, 405, { allow: Object.keys(route).join(', ') });
  try {
    return await handler(req, env, Date.now());
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status, err.headers);
    console.error('API error', err);
    return json({ error: 'Internal error' }, 500);
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/') && url.pathname !== '/api') return env.ASSETS.fetch(req);

    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const res = await handleApi(req, env);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  },
} satisfies ExportedHandler<Env>;
