import { describe, expect, it } from 'vitest';
import { emptyProgress, LEVEL_COUNT, mergeProgress, sanitizeProgress } from '../shared/progress';
import {
  isPlausibleRun,
  KILL_POINTS,
  levelClearBonus,
  maxPlausibleScore,
  MIN_LEVEL_DURATION_MS,
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
      levelBest: { '1': 500, '0': 10, '11': 10, abc: 5, '2': -40, '3': 1.9 },
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
    expect(levelClearBonus(3, 50, true)).toBe(3000 + 500);
    expect(levelClearBonus(1, 100, false)).toBe(1000 + 2000 + 1000);
  });

  it('bounds scores by levels, bosses and time', () => {
    const one = maxPlausibleScore(1, 1, 60_000);
    expect(one).toBe(levelClearBonus(1, 100, false) + 60 * 500);
    // A run through level 5 includes a boss.
    expect(maxPlausibleScore(1, 5, 0)).toBeGreaterThanOrEqual(KILL_POINTS.boss);
    expect(maxPlausibleScore(6, 9, 0)).toBeLessThan(KILL_POINTS.boss + 40_000);
  });

  it('accepts a normal run', () => {
    expect(isPlausibleRun({ score: 12_000, startLevel: 1, levelReached: 3, durationMs: 200_000, kills: 60 })).toBe(true);
    expect(isPlausibleRun({ score: 3_000, startLevel: 11, levelReached: 12, durationMs: 90_000, kills: 20 })).toBe(true);
  });

  it('rejects forged runs', () => {
    const base = { score: 1000, startLevel: 1, levelReached: 2, durationMs: 120_000, kills: 10 };
    expect(isPlausibleRun({ ...base, score: 10_000_000 })).toBe(false);
    expect(isPlausibleRun({ ...base, durationMs: MIN_LEVEL_DURATION_MS - 1 })).toBe(false);
    expect(isPlausibleRun({ ...base, kills: 100_000 })).toBe(false);
    expect(isPlausibleRun({ ...base, score: -1 })).toBe(false);
    expect(isPlausibleRun({ ...base, score: 1.5 })).toBe(false);
    expect(isPlausibleRun({ ...base, startLevel: 0 })).toBe(false);
    expect(isPlausibleRun({ ...base, startLevel: 3 })).toBe(false); // levelReached < startLevel
    expect(isPlausibleRun({ ...base, startLevel: 12, levelReached: 12 })).toBe(false);
  });
});
