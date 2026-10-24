import { describe, expect, it } from 'vitest';
import { emptyProgress, LEVEL_COUNT, mergeProgress, sanitizeProgress } from '../shared/progress';
import {
  isPlausibleRun,
  LEVEL_ENEMY_COUNT,
  LEVEL_MAX_PLAY_SCORE,
  LEVEL_MIN_MS,
  levelClearBonus,
  maxPlausibleScore,
  minRunMs,
} from '../shared/scoring';

describe('sanitizeProgress', () => {
  it('returns defaults for garbage', () => {
    expect(sanitizeProgress(null)).toEqual(emptyProgress());
    expect(sanitizeProgress('nope')).toEqual(emptyProgress());
    expect(sanitizeProgress([1, 2])).toEqual(emptyProgress());
  });

  it('clamps ranges and drops invalid level keys', () => {
    const p = sanitizeProgress({
      highestLevel: 99,
      levelBest: { '1': 500, '0': 10, '21': 10, abc: 5, '2': -40, '3': 1.9 },
      bestRun: -5,
      endlessUnlocked: 'yes',
      settings: { sfx: 4, shake: false },
    });
    expect(p.highestLevel).toBe(LEVEL_COUNT);
    expect(p.levelBest).toEqual({ '1': 500, '2': 0, '3': 1 });
    expect(p.bestRun).toBe(0);
    expect(p.endlessUnlocked).toBe(false);
    expect(p.settings).toEqual({ sfx: 0.6, shake: false, music: 0.5 });
  });

  it('keeps a music volume and defaults it for records saved before it existed', () => {
    expect(sanitizeProgress({ settings: { sfx: 0.2, shake: true } }).settings.music).toBe(0.5);
    expect(sanitizeProgress({ settings: { sfx: 0.2, shake: true, music: 0.8 } }).settings.music).toBe(0.8);
    expect(sanitizeProgress({ settings: { music: 7 } }).settings.music).toBe(0.5);
  });
});

describe('mergeProgress', () => {
  it('takes the max of every field and never regresses', () => {
    const a = { ...emptyProgress(), highestLevel: 5, levelBest: { '1': 900, '2': 100 }, bestRun: 4000, endlessUnlocked: true };
    const b = {
      ...emptyProgress(),
      highestLevel: 3,
      levelBest: { '1': 200, '3': 700 },
      bestRun: 9000,
      endlessBest: 12,
      settings: { sfx: 0.1, shake: false },
    };
    const m = mergeProgress(a, b);
    expect(m.highestLevel).toBe(5);
    expect(m.levelBest).toEqual({ '1': 900, '2': 100, '3': 700 });
    expect(m.bestRun).toBe(9000);
    expect(m.endlessUnlocked).toBe(true);
    expect(m.endlessBest).toBe(12);
    expect(m.settings).toEqual({ sfx: 0.1, shake: false });
  });

  it('is commutative on earned progress', () => {
    const a = { ...emptyProgress(), highestLevel: 4, levelBest: { '1': 1 } };
    const b = { ...emptyProgress(), highestLevel: 2, levelBest: { '1': 3 } };
    const { settings: _s1, ...ab } = mergeProgress(a, b);
    const { settings: _s2, ...ba } = mergeProgress(b, a);
    expect(ab).toEqual(ba);
  });
});

describe('scoring', () => {
  it('computes clear bonuses', () => {
    expect(levelClearBonus(3, 50, true)).toBe(3000 + 2500);
    expect(levelClearBonus(1, 100, false)).toBe(1000 + 5000 + 1500);
    expect(levelClearBonus(2, 250, false)).toBe(2000 + 5000 + 1500);
  });

  it('bounds scores by the levels played', () => {
    expect(maxPlausibleScore(1, 1)).toBe(LEVEL_MAX_PLAY_SCORE[0] + levelClearBonus(1, 100, false));
    expect(maxPlausibleScore(1, 3)).toBeGreaterThan(maxPlausibleScore(2, 3));
    expect(minRunMs(1, 1)).toBe(0);
    expect(minRunMs(1, 3)).toBe(LEVEL_MIN_MS[0] + LEVEL_MIN_MS[1]);
  });

  it('accepts a normal run', () => {
    expect(isPlausibleRun({ score: 6_000, startLevel: 1, levelReached: 2, durationMs: 200_000, kills: 200 })).toBe(true);
    expect(isPlausibleRun({ score: 0, startLevel: 4, levelReached: 4, durationMs: 1_000, kills: 0 })).toBe(true);
  });

  it('rejects forged runs', () => {
    const base = { score: 1000, startLevel: 1, levelReached: 2, durationMs: 120_000, kills: 10 };
    expect(isPlausibleRun({ ...base, score: 10_000_000 })).toBe(false);
    expect(isPlausibleRun({ ...base, durationMs: LEVEL_MIN_MS[0] - 1 })).toBe(false);
    expect(isPlausibleRun({ ...base, kills: LEVEL_ENEMY_COUNT[0] + LEVEL_ENEMY_COUNT[1] + 1 })).toBe(false);
    expect(isPlausibleRun({ ...base, score: -1 })).toBe(false);
    expect(isPlausibleRun({ ...base, score: 1.5 })).toBe(false);
    expect(isPlausibleRun({ ...base, startLevel: 0 })).toBe(false);
    expect(isPlausibleRun({ ...base, startLevel: 3 })).toBe(false); // levelReached < startLevel
    expect(isPlausibleRun({ ...base, startLevel: 21, levelReached: 21 })).toBe(false);
    expect(isPlausibleRun({ ...base, durationMs: 7 * 60 * 60 * 1000 })).toBe(false);
  });
});
