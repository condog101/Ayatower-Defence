// Canned builds: one plausible, unoptimised tower plan per level. The balance harness
// (tests/levels.test.ts, tools/balance.ts) replays them headless; every level must be won.

import { isPlaceable } from '../../web/src/sim/grid';
import { Sim } from '../../web/src/sim/sim';
import type { EnemyDef, EnemyKey, LevelDef, Targeting, Tower, TowerDef, TowerKey } from '../../web/src/sim/types';

/**
 * place: build `place` at `at`, or (no `at`) on the free spot whose range covers the most lane.
 * upgrade: a cell, or a tower kind (its lowest-tier tower, first built on ties).
 */
export type Action =
  | { wave: number; place: TowerKey; at?: [number, number]; mode?: Targeting }
  | { wave: number; upgrade: [number, number] | TowerKey };

const P = (wave: number, place: TowerKey, c?: number, r?: number, mode?: Targeting): Action =>
  ({ wave, place, at: c === undefined || r === undefined ? undefined : [c, r], mode });
const U = (wave: number, c: number | TowerKey, r?: number): Action => ({ wave, upgrade: typeof c === 'string' ? c : [c, r!] });

/** From `wave` on, one more tower of each kind per wave, each taken straight to tier 3. */
const tail = (wave: number, kinds: TowerKey[]): Action[] =>
  kinds.flatMap((k, i) => [P(wave + i, k), U(wave + i, k), U(wave + i, k)]);

/**
 * The free spot for `key`: first the lane that towers of its kind cover least (aircraft-only
 * towers prefer the air corridor; ships never use it), then the most samples of that lane in
 * range, then the most lane overall. Deterministic: ties go to the first cell in reading order.
 */
export function bestSpot(sim: Sim, key: TowerKey): [number, number] | null {
  const def = sim.towerDefs[key];
  const t0 = def.tiers[0];
  const range = t0.range;
  const air = sim.level.airLane;
  const airOnly = t0.hitsAir && !t0.hitsSea;
  let lanes = sim.lanes.map((_, i) => i);
  if (air !== undefined && sim.lanes.length > 1) lanes = airOnly ? [air] : lanes.filter((i) => i !== air);
  const covers = (x: number, y: number, r: number, lane: number) => sim.lanes[lane].spotsWithin(x, y, r).length;
  // Attack towers balance against towers that hit the same layer; support towers (radar, jammer,
  // minaret) against their own kind, so a second radar goes to the lane the first one can't see.
  const same = (t: Tower) =>
    def.role === 'support' ? t.def.key === key : t.def.role === 'attack' && (t.def.tiers[0].hitsAir === t0.hitsAir || t.def.tiers[0].hitsSea === t0.hitsSea);
  const cover = (lane: number) => sim.towers.filter(same).reduce((n, t) => n + covers(t.x, t.y, t.def.tiers[t.tier].range, lane), 0);
  const target = lanes.reduce((best, l) => (cover(l) < cover(best) ? l : best), lanes[0]);
  let best: [number, number] | null = null;
  let bestScore = 0;
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 25; c++) {
      if (!isPlaceable(sim.grid, c, r, def.placement) || sim.towerAt(c, r)) continue;
      const x = c * 32 + 16;
      const y = r * 32 + 16;
      const score = covers(x, y, range, target) * 10_000 + sim.spotsWithin(x, y, range).length;
      if (score > bestScore) {
        bestScore = score;
        best = [c, r];
      }
    }
  }
  return best;
}

export const BUILDS: Record<number, Action[]> = {
  1: [P(1, 'boats'), P(2, 'mines'), P(5, 'boats'), U(9, 'boats')],
  2: [P(1, 'boats'), P(2, 'mines'), P(7, 'martyr'), P(9, 'boats')],
  3: [P(1, 'boats'), P(1, 'aa_gun'), P(3, 'mines'), P(5, 'boats'), U(7, 'aa_gun'), P(10, 'martyr')],
  4: [
    P(1, 'boats'), P(1, 'mines'), P(2, 'aa_gun'), U(3, 'boats'), P(4, 'jammer'), P(5, 'shahed'), U(6, 'mines'),
    U(7, 'aa_gun'), P(8, 'boats'), U(11, 'boats'),
  ],
  5: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(2, 'aa_gun'), U(3, 'boats'), P(4, 'martyr'), P(5, 'missile'),
    U(6, 'mines'), U(7, 'aa_gun'), P(8, 'jammer'), U(9, 'missile'), P(10, 'shahed'), U(11, 'boats'),
    U(12, 'martyr'), P(13, 'missile'), U(14, 'shahed'), U(15, 'aa_gun'), U(16, 'mines'), U(17, 'missile'),
    P(12, 'missile'), U(12, 'missile'),
  ],
  6: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(2, 'radar'), P(3, 'aa_gun'), P(5, 'radar'), U(3, 'boats'), U(4, 'boats'),
    P(4, 'ghadir'), P(5, 'martyr'), U(6, 'boats'), P(6, 'missile'), U(7, 'mines'), U(8, 'aa_gun'),
    U(9, 'boats'), P(10, 'shahed'), U(11, 'missile'), U(12, 'ghadir'), P(13, 'jammer'), U(14, 'martyr'),
    U(15, 'radar'), U(16, 'shahed'), U(17, 'missile'),
    P(12, 'missile'), U(12, 'missile'),
  ],
  7: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(2, 'aa_gun'), P(3, 'martyr'), U(3, 'boats'), P(4, 'radar'),
    U(4, 'boats'), P(5, 'sam'), U(6, 'boats'), P(6, 'missile'), U(7, 'mines'), U(8, 'sam'), U(9, 'martyr'),
    P(10, 'shahed'), U(11, 'missile'), P(12, 'sam'), U(13, 'boats'), P(14, 'jammer'), U(15, 'radar'),
    U(16, 'sam'), U(17, 'missile'), P(18, 'missile'), U(19, 'shahed'),
    ...tail(12, ['missile', 'shahed', 'boats', 'martyr']),
  ],
  8: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(1, 'martyr'), P(2, 'aa_gun'), P(3, 'aa_gun'), U(3, 'boats'), U(3, 'boats'),
    P(4, 'missile'), P(5, 'radar'), P(5, 'sam'), P(6, 'radar'), U(6, 'boats'), U(7, 'sam'), P(8, 'minaret'), U(9, 'missile'),
    P(10, 'sam'), U(11, 'mines'), P(12, 'shahed'), U(13, 'martyr'), U(14, 'sam'), P(15, 'jammer'),
    U(16, 'boats'), U(17, 'shahed'), U(18, 'missile'), U(19, 'sam'), P(20, 'missile'), U(21, 'radar'),
    U(22, 'minaret'),
    ...tail(12, ['missile']), P(14, 'shahed'),
  ],
  9: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(1, 'martyr'), P(2, 'aa_gun'), P(3, 'aa_gun'), U(3, 'boats'), U(3, 'boats'),
    P(4, 'missile'), P(5, 'radar'), P(5, 'sam'), P(6, 'radar'), U(6, 'boats'), U(7, 'sam'), P(8, 'minaret'), U(9, 'missile'),
    P(10, 'sam'), U(11, 'mines'), P(12, 'shahed'), U(13, 'martyr'), U(14, 'sam'), P(15, 'jammer'),
    U(16, 'boats'), U(17, 'shahed'), U(18, 'missile'), U(19, 'sam'), P(20, 'missile'), U(21, 'radar'),
    U(22, 'minaret'), U(23, 'martyr'), U(24, 'shahed'),
    ...tail(10, ['missile', 'shahed', 'sam', 'boats', 'missile', 'martyr']),
  ],
  10: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(1, 'martyr'), P(2, 'aa_gun'), U(3, 'boats'), U(3, 'boats'),
    P(4, 'missile'), P(5, 'radar'), P(5, 'sam'), P(6, 'radar'), U(6, 'boats'), U(7, 'sam'), P(8, 'minaret'), U(9, 'missile'),
    P(10, 'sam'), U(11, 'mines'), P(12, 'shahed'), U(13, 'martyr'), U(14, 'sam'), P(15, 'jammer'),
    U(16, 'boats'), U(17, 'shahed'), U(18, 'missile'), U(19, 'sam'), P(20, 'missile'), U(21, 'radar'),
    U(22, 'minaret'), U(23, 'martyr'), U(24, 'shahed'), P(25, 'missile'), U(26, 'missile'), U(26, 'missile'),
    P(27, 'shahed'),
    ...tail(8, ['missile', 'shahed', 'sam', 'boats', 'missile', 'martyr', 'missile', 'shahed', 'missile', 'sam']),
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
  const placed: Tower[] = [];
  const log: string[] = [];
  // In list order: actions not yet due are passed over (later due ones may still go); the first
  // due action that can't be afforded stops the round, so the list is also a spending priority.
  const act = () => {
    for (let i = 0; i < pending.length; ) {
      const a = pending[i];
      if (a.wave > sim.wave + 1) {
        i++;
        continue;
      }
      if ('place' in a) {
        if (sim.cash < sim.towerDefs[a.place].tiers[0].cost) return;
        const at = a.at ?? bestSpot(sim, a.place);
        if (!at) throw new Error(`L${level.n}: nowhere to put ${a.place}`);
        const why = sim.canPlace(a.place, at[0], at[1]);
        if (!why.ok) throw new Error(`L${level.n}: can't place ${a.place} at ${at}: ${why.reason}`);
        const t = sim.place(a.place, at[0], at[1])!;
        placed.push(t);
        if (a.mode) sim.setTargeting(t, a.mode);
      } else {
        const kind = a.upgrade;
        const t =
          typeof kind === 'string'
            ? placed.filter((x) => x.def.key === kind && x.tier < 2).sort((x, y) => x.tier - y.tier)[0]
            : sim.towerAt(kind[0], kind[1]);
        if (!t) throw new Error(`L${level.n}: no tower to upgrade at ${a.upgrade}`);
        if (!sim.upgrade(t)) return;
      }
      pending.splice(i, 1);
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
