import { describe, expect, it } from 'vitest';
import { LEVEL_COUNT } from '../shared/progress';
import { ENEMIES } from '../web/src/data/enemies';
import { LEVELS } from '../web/src/data/levels';
import { TOWERS } from '../web/src/data/towers';
import { allTiers } from '../web/src/sim/tiers';
import { cellKind, isPlaceable, LEGEND, parseRows } from '../web/src/sim/grid';
import { denseCells, Lane } from '../web/src/sim/path';
import type { EnemyKey, LevelDef } from '../web/src/sim/types';
import { BUILDS, runBuild } from './fixtures/builds';
import { isBossWave, leadFloor, minCount } from './fixtures/wave-rules';

/** Every enemy kind a level can field: wave groups plus children and boss launches. */
function kindsIn(level: LevelDef): Set<EnemyKey> {
  const out = new Set<EnemyKey>();
  const add = (k: EnemyKey) => {
    if (out.has(k)) return;
    out.add(k);
    for (const c of ENEMIES[k].children ?? []) add(c.kind);
    if (ENEMIES[k].spawns) add(ENEMIES[k].spawns!.kind);
  };
  for (const w of level.waves) for (const g of w.groups) add(g.kind);
  return out;
}

/** hp x speed summed over everything a level sends (children included): a rough threat number. */
function threat(level: LevelDef): number {
  const walk = (k: EnemyKey): number => {
    const d = ENEMIES[k];
    let t = d.hp * d.speed;
    for (const c of d.children ?? []) t += c.n * walk(c.kind);
    if (d.spawns) t += d.spawns.max * walk(d.spawns.kind);
    return t;
  };
  return level.waves.reduce((a, w) => a + w.groups.reduce((b, g) => b + g.n * walk(g.kind), 0), 0);
}

/** Lives the canned, unoptimised build should lose per level: a real fight, not a walkover. */
const LOSS_TARGET: Record<number, [number, number]> = {
  1: [5, 15], 2: [8, 20], 3: [12, 30], 4: [12, 30], 5: [15, 45], 6: [15, 45], 7: [15, 45], 8: [15, 45], 9: [15, 45], 10: [20, 60],
  11: [20, 60], 12: [20, 60], 13: [20, 60], 14: [20, 60], 15: [25, 65], 16: [25, 65], 17: [25, 65], 18: [25, 65], 19: [25, 65], 20: [25, 65],
};

/** Lane coverage: a lane aircraft fly needs AA-capable land in reach along its length; sea lanes need shallows for the mines. */
const AIR_RUN_MAX = 128;
const AIR_UNCOVERED_MAX = 0.25;
const AIR_PIT_UNCOVERED_MAX = 0.7;
const SEA_RUN_MAX = 384;

/** Share of `lane` (by length) with no cell of `cells` within `range`, and the longest such stretch in px. */
function uncovered(lane: Lane, cells: [number, number][], range: number): { share: number; longest: number } {
  const pts = cells.map(([c, r]) => [c * 32 + 16, r * 32 + 16]);
  const r2 = range * range;
  let bad = 0;
  let run = 0;
  let longest = 0;
  for (let i = 1; i < lane.xs.length; i++) {
    const step = lane.ds[i] - lane.ds[i - 1];
    const x = (lane.xs[i] + lane.xs[i - 1]) / 2;
    const y = (lane.ys[i] + lane.ys[i - 1]) / 2;
    if (pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 <= r2)) run = 0;
    else {
      bad += step;
      run += step;
      longest = Math.max(longest, run);
    }
  }
  return { share: bad / lane.length, longest };
}

describe('levels', () => {
  it('are the twenty campaign levels, in order', () => {
    expect(LEVELS.length).toBe(LEVEL_COUNT);
    LEVELS.forEach((l, i) => expect(l.n).toBe(i + 1));
  });

  for (const level of LEVELS) {
    describe(`level ${level.n} ${level.name}`, () => {
      const grid = parseRows(level.rows);
      const lanes = level.lanes.map((l) => new Lane(l));

      it('is a 25x16 grid of legend characters with row 0 unplaceable', () => {
        expect(level.rows).toHaveLength(16);
        for (const row of level.rows) {
          expect(row).toHaveLength(25);
          for (const ch of row) expect(LEGEND[ch], `'${ch}' in ${row}`).toBeDefined();
        }
        for (let c = 0; c < 25; c++) {
          expect(isPlaceable(grid, c, 0, 'land')).toBe(false);
          expect(isPlaceable(grid, c, 0, 'shallow')).toBe(false);
        }
      });

      it('has 1-3 lanes that stay on water and match the = cells', () => {
        expect(lanes.length).toBeGreaterThanOrEqual(1);
        expect(lanes.length).toBeLessThanOrEqual(3);
        if (level.airLane !== undefined) expect(level.airLane).toBeLessThan(lanes.length);
        lanes.forEach((lane, li) => {
          for (let d = 0; d <= lane.length; d += 2) {
            const [x, y] = lane.posAt(d);
            const k = cellKind(grid, Math.floor(x / 32), Math.floor(y / 32));
            expect(['lane', 'water', 'void'], `lane ${li} d=${d} at ${x.toFixed(0)},${y.toFixed(0)} is ${k}`).toContain(k);
          }
        });
        const cells = new Set(level.lanes.flatMap((l) => denseCells(l)).map(([c, r]) => `${c},${r}`));
        for (let r = 0; r < 16; r++) {
          for (let c = 0; c < 25; c++) {
            expect(grid[r][c] === 'lane', `cell ${c},${r}`).toBe(cells.has(`${c},${r}`));
          }
        }
      });

      it('starts every lane off the map and ends it beside the Ayatower', () => {
        const ayas: [number, number][] = [];
        grid.forEach((row, r) => row.forEach((k, c) => k === 'aya' && ayas.push([c, r])));
        expect(ayas).toHaveLength(1);
        for (const l of level.lanes) {
          const [c0, r0] = l[0];
          expect(c0 < 0 || r0 < 0 || c0 >= 25 || r0 >= 16).toBe(true);
          const [ce, re] = l[l.length - 1];
          expect(Math.abs(ce - ayas[0][0]) + Math.abs(re - ayas[0][1])).toBe(1);
        }
      });

      it('keeps tower spots off the lanes, and prime spots scarce', () => {
        let spots = 0;
        let prime = 0;
        for (let r = 0; r < 16; r++) {
          for (let c = 0; c < 25; c++) {
            if (!isPlaceable(grid, c, r, 'land') && !isPlaceable(grid, c, r, 'shallow')) continue;
            spots++;
            const near = Math.min(...lanes.map((l) => l.distanceTo(c * 32 + 16, r * 32 + 16)));
            expect(near, `cell ${c},${r}`).toBeGreaterThanOrEqual(24);
            if (near <= 110) prime++;
          }
        }
        expect(spots).toBeGreaterThan(20);
        expect(prime / spots, `${prime}/${spots} spots within 110 px of a lane`).toBeLessThanOrEqual(0.45);
      });

      it('leaves every lane in reach of the towers that can hit what flies it', () => {
        const placeable = (p: 'land' | 'shallow') => {
          const out: [number, number][] = [];
          for (let r = 0; r < 16; r++) for (let c = 0; c < 25; c++) if (isPlaceable(grid, c, r, p)) out.push([c, r]);
          return out;
        };
        const land = placeable('land');
        const shallow = placeable('shallow');
        const fliesAir = [...kindsIn(level)].some((k) => ENEMIES[k].layer === 'air');
        if (fliesAir) {
          const sam = level.towers.includes('sam');
          const air = level.airLane === undefined ? lanes : [lanes[level.airLane]];
          air.forEach((lane, li) => {
            const u = uncovered(lane, land, sam ? 240 : 90);
            expect(u.share, `air lane ${li} uncovered share`).toBeLessThanOrEqual(AIR_UNCOVERED_MAX);
            expect(u.longest, `air lane ${li} longest uncovered run`).toBeLessThanOrEqual(AIR_RUN_MAX);
            if (sam) expect(uncovered(lane, land, 90).share, `air lane ${li} out of AA pit reach`).toBeLessThanOrEqual(AIR_PIT_UNCOVERED_MAX);
          });
        }
        lanes.forEach((lane, li) => {
          if (li === level.airLane) return;
          expect(uncovered(lane, shallow, 90).longest, `sea lane ${li} longest run out of mine reach`).toBeLessThanOrEqual(SEA_RUN_MAX);
        });
      });

      it('has at least 8 waves, bosses only on 5, 10, 15 and 20, and a start purse that buys a tower', () => {
        expect(level.waves.length).toBeGreaterThanOrEqual(8);
        const bossWaves = level.waves.filter((w) => w.boss || w.groups.some((g) => ENEMIES[g.kind].boss));
        if ([5, 10, 15, 20].includes(level.n)) {
          expect(bossWaves.length).toBeGreaterThan(0);
          expect(level.waves[level.waves.length - 1].boss).toBe(true);
          expect(level.bossName).toBeTruthy();
        } else expect(bossWaves).toHaveLength(0);
        for (const w of level.waves) expect(w.reward).toBeGreaterThan(0);
        const cheapest = Math.min(...level.towers.map((k) => TOWERS[k].base.cost));
        expect(level.startCash).toBeGreaterThanOrEqual(cheapest);
      });

      it('fields no token groups', () => {
        level.waves.forEach((w, i) =>
          w.groups.forEach((g) => {
            if (!ENEMIES[g.kind].boss) expect(g.n, `wave ${i + 1} ${g.kind}`).toBeGreaterThanOrEqual(minCount(level, i, g.kind));
          }),
        );
      });

      it('sends waves that grow, kind by kind', () => {
        level.waves.forEach((w, i) => {
          if (isBossWave(w)) return;
          const g = w.groups[0];
          expect(g.n, `wave ${i + 1} leads with ${g.kind}`).toBeGreaterThanOrEqual(leadFloor(level, i, g.kind));
        });
      });

      it('the canned build wins it losing a fair share of PATIENCE, and doing nothing loses it', () => {
        expect(BUILDS[level.n], 'no canned build').toBeDefined();
        const r = runBuild(level, TOWERS, ENEMIES);
        expect(r.sim.phase, r.log.join('\n')).toBe('won');
        expect(r.skipped, 'actions never afforded').toBe(0);
        const [lo, hi] = LOSS_TARGET[level.n];
        const lost = level.lives - r.sim.lives;
        expect(lost, `lost ${lost} lives\n${r.log.join('\n')}`).toBeGreaterThanOrEqual(lo);
        expect(lost, `lost ${lost} lives\n${r.log.join('\n')}`).toBeLessThanOrEqual(hi);
        const idle = runBuild(level, TOWERS, ENEMIES, []);
        expect(idle.sim.phase).toBe('lost');
        if (level.n === 1) expect(idle.sim.wave, 'idle should fall early on level 1').toBeLessThanOrEqual(3);
      });
    });
  }

  it('introduce each enemy on its intro level', () => {
    const firstSeen = new Map<EnemyKey, number>();
    for (const l of LEVELS) for (const k of kindsIn(l)) if (!firstSeen.has(k)) firstSeen.set(k, l.n);
    for (const [k, n] of firstSeen) expect(n, k).toBe(ENEMIES[k].introLevel);
  });

  it('hand out the right counter before each new threat', () => {
    for (const l of LEVELS) {
      const kinds = [...kindsIn(l)].map((k) => ENEMIES[k]);
      const has = (k: string) => l.towers.includes(k as never);
      if (kinds.some((e) => e.layer === 'air')) expect(has('aa_gun') || has('sam'), `L${l.n} air`).toBe(true);
      if (kinds.some((e) => e.armoured)) {
        const piercing = l.towers.some((k) => allTiers(TOWERS[k]).some((t) => t.dmgKind !== 'bullet' && t.damage > 0));
        expect(piercing, `L${l.n} armour`).toBe(true);
      }
      if (kinds.some((e) => e.stealth)) expect(has('radar'), `L${l.n} stealth`).toBe(true);
      if (kinds.some((e) => e.key === 'b2')) expect(has('sam') || has('aa_gun'), `L${l.n} b2`).toBe(true);
    }
  });

  it('only ever add towers, and get harder', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      for (const k of LEVELS[i - 1].towers) expect(LEVELS[i].towers, `L${i + 1} keeps ${k}`).toContain(k);
      expect(threat(LEVELS[i]), `L${i + 1} threat`).toBeGreaterThanOrEqual(threat(LEVELS[i - 1]));
    }
  });
});
