// D1 queries. All SQL lives here.

import { emptyProgress, sanitizeProgress, type Progress } from '../../shared/progress';

export interface PlayerRow {
  id: number;
  callsign: string;
  pin_hash: string;
  salt: string;
  progress_json: string;
  created_at: number;
  updated_at: number;
}

export interface Profile {
  callsign: string;
  progress: Progress;
  createdAt: string;
}

export interface LeaderboardEntry {
  callsign: string;
  score: number;
  startLevel: number;
  levelReached: number;
  at: string;
}

export function parseProgress(json: string): Progress {
  try {
    return sanitizeProgress(JSON.parse(json));
  } catch {
    return emptyProgress();
  }
}

export function toProfile(row: PlayerRow): Profile {
  return {
    callsign: row.callsign,
    progress: parseProgress(row.progress_json),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function getPlayerByCallsign(db: D1Database, callsign: string): Promise<PlayerRow | null> {
  return db.prepare('SELECT * FROM players WHERE callsign = ?').bind(callsign).first<PlayerRow>();
}

export function getPlayerById(db: D1Database, id: number): Promise<PlayerRow | null> {
  return db.prepare('SELECT * FROM players WHERE id = ?').bind(id).first<PlayerRow>();
}

/** Inserts a player; returns null if the callsign is taken (case-insensitive). */
export async function createPlayer(
  db: D1Database,
  callsign: string,
  pinHash: string,
  salt: string,
  now: number,
): Promise<PlayerRow | null> {
  const row = await db
    .prepare(
      `INSERT INTO players (callsign, pin_hash, salt, progress_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(callsign) DO NOTHING
       RETURNING *`,
    )
    .bind(callsign, pinHash, salt, JSON.stringify(emptyProgress()), now, now)
    .first<PlayerRow>();
  return row ?? null;
}

export async function saveProgress(db: D1Database, playerId: number, progress: Progress, now: number): Promise<void> {
  await db
    .prepare('UPDATE players SET progress_json = ?, updated_at = ? WHERE id = ?')
    .bind(JSON.stringify(progress), now, playerId)
    .run();
}

export async function createSession(db: D1Database, tokenHash: string, playerId: number, now: number): Promise<void> {
  await db
    .prepare('INSERT INTO sessions (token_hash, player_id, created_at) VALUES (?, ?, ?)')
    .bind(tokenHash, playerId, now)
    .run();
}

/** Returns the player for a live session, deleting it if expired. */
export async function getSessionPlayer(
  db: D1Database,
  tokenHash: string,
  now: number,
  ttlMs: number,
): Promise<PlayerRow | null> {
  const s = await db
    .prepare('SELECT player_id, created_at FROM sessions WHERE token_hash = ?')
    .bind(tokenHash)
    .first<{ player_id: number; created_at: number }>();
  if (!s) return null;
  if (now - s.created_at > ttlMs) {
    await deleteSession(db, tokenHash);
    return null;
  }
  return getPlayerById(db, s.player_id);
}

export async function deleteSession(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function insertRun(
  db: D1Database,
  playerId: number,
  run: { score: number; startLevel: number; levelReached: number; durationMs: number; kills: number },
  now: number,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO runs (player_id, score, start_level, level_reached, duration_ms, kills, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(playerId, run.score, run.startLevel, run.levelReached, run.durationMs, run.kills, now)
    .run();
}

/** Leaderboard rank a score would hold: 1 + number of other players whose best beats it. */
export async function rankForScore(db: D1Database, playerId: number, score: number): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS better FROM (
         SELECT player_id, MAX(score) AS best FROM runs WHERE player_id != ? GROUP BY player_id
       ) WHERE best > ?`,
    )
    .bind(playerId, score)
    .first<{ better: number }>();
  return (row?.better ?? 0) + 1;
}

/** Best run per player, highest first (earliest run wins ties). */
export async function leaderboard(db: D1Database, limit: number): Promise<LeaderboardEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT p.callsign, r.score, r.start_level, r.level_reached, r.created_at FROM (
         SELECT *, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY score DESC, created_at ASC, id ASC) AS rn
         FROM runs
       ) r JOIN players p ON p.id = r.player_id
       WHERE r.rn = 1
       ORDER BY r.score DESC, r.created_at ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all<{ callsign: string; score: number; start_level: number; level_reached: number; created_at: number }>();
  return results.map((r) => ({
    callsign: r.callsign,
    score: r.score,
    startLevel: r.start_level,
    levelReached: r.level_reached,
    at: new Date(r.created_at).toISOString(),
  }));
}

// ---- Rate limiting (fixed window counters) ----

export interface RateStatus {
  blocked: boolean;
  retryAfterSec: number;
}

export async function rateStatus(
  db: D1Database,
  key: string,
  max: number,
  windowMs: number,
  now: number,
): Promise<RateStatus> {
  const row = await db
    .prepare('SELECT count, window_start FROM login_attempts WHERE key = ?')
    .bind(key)
    .first<{ count: number; window_start: number }>();
  if (!row || now - row.window_start >= windowMs) return { blocked: false, retryAfterSec: 0 };
  if (row.count < max) return { blocked: false, retryAfterSec: 0 };
  return { blocked: true, retryAfterSec: Math.max(1, Math.ceil((row.window_start + windowMs - now) / 1000)) };
}

export async function bumpAttempt(db: D1Database, key: string, windowMs: number, now: number): Promise<void> {
  await db
    .prepare(
      `INSERT INTO login_attempts (key, count, window_start) VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN ?2 - window_start >= ?3 THEN 1 ELSE count + 1 END,
         window_start = CASE WHEN ?2 - window_start >= ?3 THEN ?2 ELSE window_start END`,
    )
    .bind(key, now, windowMs)
    .run();
}

export async function resetAttempts(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key).run();
}
