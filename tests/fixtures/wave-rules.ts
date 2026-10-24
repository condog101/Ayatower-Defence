// Wave-size rules shared by tests/levels.test.ts and tools/tune.ts: no token groups, and each kind
// leads its waves in numbers that never fall far below the biggest it has led before.

import { ENEMIES } from '../../web/src/data/enemies';
import type { EnemyKey, LevelDef, WaveDef } from '../../web/src/sim/types';

/** Smallest group of each kind worth sending. */
export const MIN_N: Record<EnemyKey, number> = {
  rhib: 6, patrol: 6, cyclone: 6, reaper: 6, lcs: 4, hornet: 4, seahawk: 4, frigate: 3, sub: 3,
  burke: 2, b2: 2, tico: 2, lhd: 2, carrier: 2, zumwalt: 2, lcac: 4, f35: 4, ohio: 2,
  boss_yacht: 1, boss_don: 1, boss_af1: 1, boss_resort: 1,
};

/** A wave's lead group is at least this share of the most of its kind that led an earlier wave. */
export const LEAD_FLOOR = 0.6;

const isBoss = (k: EnemyKey) => !!ENEMIES[k].boss;
export const isBossWave = (w: WaveDef) => !!w.boss || w.groups.some((g) => isBoss(g.kind));

/** MIN_N, except a kind's first wave on its intro level may be a teaser of half that. */
export function minCount(level: LevelDef, waveIdx: number, kind: EnemyKey): number {
  const min = MIN_N[kind];
  if (ENEMIES[kind].introLevel === level.n && level.waves.findIndex((w) => w.groups.some((g) => g.kind === kind)) === waveIdx) {
    return Math.ceil(min / 2);
  }
  return min;
}

/** The floor on the lead group of a non-boss wave, from earlier non-boss waves led by the same kind. */
export function leadFloor(level: LevelDef, waveIdx: number, kind: EnemyKey): number {
  let most = 0;
  for (let i = 0; i < waveIdx; i++) {
    const w = level.waves[i];
    if (!isBossWave(w) && w.groups[0].kind === kind) most = Math.max(most, w.groups[0].n);
  }
  return Math.ceil(LEAD_FLOOR * most);
}

/** The fewest a group may hold. Bosses are exempt; a boss wave's escorts obey MIN_N only. */
export function floorN(level: LevelDef, waveIdx: number, groupIdx: number): number {
  const w = level.waves[waveIdx];
  const g = w.groups[groupIdx];
  if (isBoss(g.kind)) return g.n;
  const lead = groupIdx === 0 && !isBossWave(w) ? leadFloor(level, waveIdx, g.kind) : 0;
  return Math.max(minCount(level, waveIdx, g.kind), lead);
}

/** PATIENCE one of `kind` costs if it and everything it splits into leaks. */
export function livesAtStake(kind: EnemyKey): number {
  const d = ENEMIES[kind];
  return d.leak + (d.children ?? []).reduce((a, c) => a + c.n * livesAtStake(c.kind), 0);
}

/** hp x speed summed over a wave (children and boss launches included), as in tests/levels.test.ts threat(). */
export function waveThreat(w: WaveDef): number {
  const walk = (k: EnemyKey): number => {
    const d = ENEMIES[k];
    let t = d.hp * d.speed;
    for (const c of d.children ?? []) t += c.n * walk(c.kind);
    if (d.spawns) t += d.spawns.max * walk(d.spawns.kind);
    return t;
  };
  return w.groups.reduce((a, g) => a + g.n * walk(g.kind), 0);
}
