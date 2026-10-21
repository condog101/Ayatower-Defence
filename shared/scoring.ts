// Score rules and the plausibility bound the Worker uses to reject forged runs.
// The per-level tables are pasted constants so the Worker bundle stays free of game data;
// tests/waves.test.ts regenerates them from the level definitions and prints the right values on a mismatch.

import { LEVEL_COUNT } from './progress';

export const CLEAR_BONUS_PER_LEVEL = 1000; // multiplied by level number
export const LIFE_BONUS = 50; // per point of PATIENCE left
export const NO_LEAK_BONUS = 1500;
export const MAX_LIVES = 100;

/** Bonus for clearing `level` with `lives` left; `leaked` = anything got past at all. */
export function levelClearBonus(level: number, lives: number, leaked: boolean): number {
  return CLEAR_BONUS_PER_LEVEL * level + Math.max(0, Math.min(MAX_LIVES, lives)) * LIFE_BONUS + (leaked ? 0 : NO_LEAK_BONUS);
}

/** Every kill (children and boss launches at their cap included) plus every wave reward, per level. */
export const LEVEL_MAX_PLAY_SCORE = [9690, 14337, 23075, 58733, 110410, 110300, 255850, 275560, 672260, 1239170];
/** Every enemy a level can produce. */
export const LEVEL_ENEMY_COUNT = [585, 644, 963, 2166, 3019, 3188, 6879, 6721, 16424, 29368];
/** Shortest possible level: all spawn spans back to back at 3x speed, minus 10%. */
export const LEVEL_MIN_MS = [33855, 43095, 60300, 82560, 43644, 51870, 90840, 68745, 103950, 159120];

const levelsIn = (from: number, to: number): number[] => {
  const out: number[] = [];
  for (let l = Math.max(1, from); l <= Math.min(LEVEL_COUNT, to); l++) out.push(l);
  return out;
};

/** Highest score a run from `startLevel` that ended on `levelReached` could hold. */
export function maxPlausibleScore(startLevel: number, levelReached: number): number {
  return levelsIn(startLevel, levelReached).reduce(
    (a, l) => a + LEVEL_MAX_PLAY_SCORE[l - 1] + levelClearBonus(l, MAX_LIVES, false),
    0,
  );
}

/** Reaching level N from S means clearing levels S..N-1, each with a minimum length. */
export function minRunMs(startLevel: number, levelReached: number): number {
  return levelsIn(startLevel, levelReached - 1).reduce((a, l) => a + LEVEL_MIN_MS[l - 1], 0);
}

export function maxRunKills(startLevel: number, levelReached: number): number {
  return levelsIn(startLevel, levelReached).reduce((a, l) => a + LEVEL_ENEMY_COUNT[l - 1], 0);
}

export interface RunSubmission {
  score: number;
  startLevel: number; // level the run began on (1..10)
  levelReached: number; // level the run ended on (10 on victory)
  durationMs: number;
  kills: number;
}

export function isPlausibleRun(run: RunSubmission): boolean {
  const { score, startLevel, levelReached, durationMs, kills } = run;
  if (![score, startLevel, levelReached, durationMs, kills].every((n) => Number.isInteger(n) && n >= 0)) return false;
  if (startLevel < 1 || levelReached < startLevel || levelReached > LEVEL_COUNT) return false;
  if (durationMs > 6 * 60 * 60 * 1000) return false;
  if (durationMs < minRunMs(startLevel, levelReached)) return false;
  if (kills > maxRunKills(startLevel, levelReached)) return false;
  return score <= maxPlausibleScore(startLevel, levelReached);
}
