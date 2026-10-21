// Player progress, shared by the client (localStorage + sync) and the Worker (D1).
// Merging is monotonic: nothing a player has earned can regress.

export const LEVEL_COUNT = 10;

export interface Settings {
  sfx: number; // 0..1
  shake: boolean;
  music: number; // 0..1
}

export interface Progress {
  highestLevel: number; // highest level unlocked (1..LEVEL_COUNT)
  levelBest: Record<string, number>; // level number -> best score on that level
  bestRun: number; // best full-run score
  endlessUnlocked: boolean;
  endlessBest: number;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = { sfx: 0.6, shake: true, music: 0.5 };

export function emptyProgress(): Progress {
  return {
    highestLevel: 1,
    levelBest: {},
    bestRun: 0,
    endlessUnlocked: false,
    endlessBest: 0,
    settings: { ...DEFAULT_SETTINGS },
  };
}

const clampInt = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : fallback;
  return Math.min(hi, Math.max(lo, n));
};

/** Coerce untrusted input (localStorage, request bodies) into a valid Progress. */
export function sanitizeProgress(raw: unknown): Progress {
  const p = emptyProgress();
  if (!raw || typeof raw !== 'object') return p;
  const r = raw as Record<string, unknown>;
  p.highestLevel = clampInt(r.highestLevel, 1, LEVEL_COUNT, 1);
  if (r.levelBest && typeof r.levelBest === 'object') {
    for (const [k, v] of Object.entries(r.levelBest as Record<string, unknown>)) {
      const lvl = Number(k);
      if (Number.isInteger(lvl) && lvl >= 1 && lvl <= LEVEL_COUNT) {
        p.levelBest[String(lvl)] = clampInt(v, 0, 10_000_000, 0);
      }
    }
  }
  p.bestRun = clampInt(r.bestRun, 0, 100_000_000, 0);
  p.endlessUnlocked = r.endlessUnlocked === true;
  p.endlessBest = clampInt(r.endlessBest, 0, 100_000_000, 0);
  if (r.settings && typeof r.settings === 'object') {
    const s = r.settings as Record<string, unknown>;
    p.settings.sfx = typeof s.sfx === 'number' && s.sfx >= 0 && s.sfx <= 1 ? s.sfx : DEFAULT_SETTINGS.sfx;
    p.settings.shake = typeof s.shake === 'boolean' ? s.shake : DEFAULT_SETTINGS.shake;
    p.settings.music = typeof s.music === 'number' && s.music >= 0 && s.music <= 1 ? s.music : DEFAULT_SETTINGS.music;
  }
  return p;
}

/**
 * Merge two progress records with max() semantics. Settings come from `incoming`
 * (the most recent writer wins for preferences).
 */
export function mergeProgress(base: Progress, incoming: Progress): Progress {
  const levelBest: Record<string, number> = { ...base.levelBest };
  for (const [k, v] of Object.entries(incoming.levelBest)) {
    levelBest[k] = Math.max(levelBest[k] ?? 0, v);
  }
  return {
    highestLevel: Math.max(base.highestLevel, incoming.highestLevel),
    levelBest,
    bestRun: Math.max(base.bestRun, incoming.bestRun),
    endlessUnlocked: base.endlessUnlocked || incoming.endlessUnlocked,
    endlessBest: Math.max(base.endlessBest, incoming.endlessBest),
    settings: { ...incoming.settings },
  };
}
