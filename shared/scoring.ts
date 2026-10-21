// Score values and the plausibility bound the Worker uses to reject forged runs.

export const KILL_POINTS = {
  boat: 100,
  boatZig: 150,
  artillery: 300,
  mine: 50,
  drone: 200,
  missile: 250,
  battery: 400,
  lowrider: 350,
  boss: 5000,
} as const;

export type KillKind = keyof typeof KILL_POINTS;

export const LEVEL_CLEAR_BONUS = 1000; // multiplied by level number
export const NO_DAMAGE_BONUS = 2000;
export const HP_BONUS_PER_POINT = 10; // remaining hull HP at level clear
export const MAX_HP = 100;

/** Bonus awarded for clearing `level` with `hp` hull left. */
export function levelClearBonus(level: number, hp: number, tookDamage: boolean): number {
  return LEVEL_CLEAR_BONUS * level + (tookDamage ? 0 : NO_DAMAGE_BONUS) + Math.max(0, hp) * HP_BONUS_PER_POINT;
}

// Generous ceiling on kill points per second of play. Real play peaks well below this.
export const MAX_KILL_POINTS_PER_SEC = 500;
// Bosses appear on every 5th level (5, 10, then endless waves 15, 20, ...).
const bossesBetween = (from: number, to: number) => Math.floor(to / 5) - Math.floor((from - 1) / 5);

/** Highest score a legitimate run from `startLevel` to `levelReached` could reach in `durationMs`. */
export function maxPlausibleScore(startLevel: number, levelReached: number, durationMs: number): number {
  const from = Math.max(1, Math.floor(startLevel));
  const to = Math.max(from, Math.floor(levelReached));
  const secs = Math.max(0, durationMs) / 1000;
  let bonuses = 0;
  for (let l = from; l <= to; l++) bonuses += levelClearBonus(l, MAX_HP, false);
  return Math.ceil(bonuses + bossesBetween(from, to) * KILL_POINTS.boss + secs * MAX_KILL_POINTS_PER_SEC);
}

/** Shortest a level could possibly take (levels are >= 60s each). */
export const MIN_LEVEL_DURATION_MS = 55_000;

export interface RunSubmission {
  score: number;
  startLevel: number; // level the run began on (1..10 campaign, 11 = endless)
  levelReached: number; // level the run ended on (or 10 on victory)
  durationMs: number;
  kills: number;
}

export function isPlausibleRun(run: RunSubmission): boolean {
  const { score, startLevel, levelReached, durationMs, kills } = run;
  if (![score, startLevel, levelReached, durationMs, kills].every((n) => Number.isInteger(n) && n >= 0)) return false;
  if (startLevel < 1 || startLevel > 11 || levelReached < startLevel || levelReached > 999) return false;
  if (durationMs > 6 * 60 * 60 * 1000) return false;
  // Reaching level N from S means clearing N-S levels, each of which has a minimum length.
  if (durationMs < (levelReached - startLevel) * MIN_LEVEL_DURATION_MS) return false;
  if (kills > (durationMs / 1000) * 10 + 10) return false;
  return score <= maxPlausibleScore(startLevel, levelReached, durationMs);
}
