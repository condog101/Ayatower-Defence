// Canned builds: one plausible, unoptimised tower plan per level. The balance harness
// (tests/levels.test.ts, tools/balance.ts) replays them headless; every level must be won.

import { Sim } from '../../web/src/sim/sim';
import type { EnemyDef, EnemyKey, LevelDef, Targeting, TowerDef, TowerKey } from '../../web/src/sim/types';

export type Action =
  | { wave: number; place: TowerKey; at: [number, number]; mode?: Targeting }
  | { wave: number; upgrade: [number, number] };

const P = (wave: number, place: TowerKey, c: number, r: number, mode?: Targeting): Action => ({ wave, place, at: [c, r], mode });
const U = (wave: number, c: number, r: number): Action => ({ wave, upgrade: [c, r] });

export const BUILDS: Record<number, Action[]> = {
  1: [
    P(1, 'boats', 8, 4),
    P(1, 'mines', 10, 3),
    P(2, 'boats', 12, 9),
    U(3, 8, 4),
    P(4, 'mines', 6, 11),
    P(5, 'boats', 18, 10),
    U(6, 12, 9),
    U(7, 8, 4),
    U(8, 12, 9),
    U(9, 18, 10),
  ],
};

export interface BuildResult {
  sim: Sim;
  /** Actions never executed (couldn't afford or invalid). */
  skipped: number;
  log: string[];
}

/** Replay a level's canned build (or `actions`) with AUTO on until the level is won or lost. */
export function runBuild(
  level: LevelDef,
  towers: Record<TowerKey, TowerDef>,
  enemies: Record<EnemyKey, EnemyDef>,
  actions: Action[] = BUILDS[level.n] ?? [],
  maxTicks = 60 * 60 * 40,
): BuildResult {
  const sim = new Sim(level, towers, enemies);
  const pending = [...actions];
  const log: string[] = [];
  const act = () => {
    while (pending.length && pending[0].wave <= sim.wave + 1) {
      const a = pending[0];
      if ('place' in a) {
        const why = sim.canPlace(a.place, a.at[0], a.at[1]);
        if (!why.ok && why.reason !== 'cash') throw new Error(`L${level.n}: can't place ${a.place} at ${a.at}: ${why.reason}`);
        const t = sim.place(a.place, a.at[0], a.at[1]);
        if (!t) return;
        if (a.mode) sim.setTargeting(t, a.mode);
      } else {
        const t = sim.towerAt(a.upgrade[0], a.upgrade[1]);
        if (!t) throw new Error(`L${level.n}: no tower to upgrade at ${a.upgrade}`);
        if (!sim.upgrade(t)) return;
      }
      pending.shift();
    }
  };
  let lastLives = sim.lives;
  let wave = 0;
  while (!sim.over && sim.tick < maxTicks) {
    if (sim.tick % 30 === 0) act();
    if (sim.phase === 'build') sim.startWave();
    for (const ev of sim.step()) {
      if (ev.t === 'waveStart') wave = ev.wave;
      if (ev.t === 'waveEnd') {
        log.push(`wave ${ev.wave} done: lives ${sim.lives} (-${lastLives - sim.lives}) cash ${sim.cash}`);
        lastLives = sim.lives;
      }
    }
  }
  void wave;
  return { sim, skipped: pending.length, log };
}
