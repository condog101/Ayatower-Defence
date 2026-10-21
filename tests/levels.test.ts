import { describe, expect, it } from 'vitest';
import { LEVEL_COUNT } from '../shared/progress';
import { ENEMIES } from '../web/src/data/enemies';
import { LEVELS } from '../web/src/data/levels';
import { TOWERS } from '../web/src/data/towers';
import { cellKind, isPlaceable, LEGEND, parseRows } from '../web/src/sim/grid';
import { denseCells, Lane } from '../web/src/sim/path';
import type { EnemyKey, LevelDef } from '../web/src/sim/types';
import { BUILDS, runBuild } from './fixtures/builds';

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

describe('levels', () => {
  it('are numbered in order up to the campaign length', () => {
    expect(LEVELS.length).toBeLessThanOrEqual(LEVEL_COUNT);
    LEVELS.forEach((l, i) => expect(l.n).toBe(i + 1));
  });

  for (const level of LEVELS) {
    describe(`level ${level.n} ${level.name}`, () => {
      const grid = parseRows(level.rows);
      const lane = new Lane(level.lane);

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

      it('has a lane that stays on water and matches the = cells', () => {
        for (let d = 0; d <= lane.length; d += 2) {
          const [x, y] = lane.posAt(d);
          const k = cellKind(grid, Math.floor(x / 32), Math.floor(y / 32));
          expect(['lane', 'water', 'void'], `d=${d} at ${x.toFixed(0)},${y.toFixed(0)} is ${k}`).toContain(k);
        }
        const cells = new Set(denseCells(level.lane).map(([c, r]) => `${c},${r}`));
        for (let r = 0; r < 16; r++) {
          for (let c = 0; c < 25; c++) {
            const onLane = cells.has(`${c},${r}`);
            expect(grid[r][c] === 'lane', `cell ${c},${r}`).toBe(onLane);
          }
        }
      });

      it('starts off the map and ends beside the Ayatower', () => {
        const [c0, r0] = level.lane[0];
        expect(c0 < 0 || r0 < 0 || c0 >= 25 || r0 >= 16).toBe(true);
        const ayas: [number, number][] = [];
        grid.forEach((row, r) => row.forEach((k, c) => k === 'aya' && ayas.push([c, r])));
        expect(ayas).toHaveLength(1);
        const [ce, re] = level.lane[level.lane.length - 1];
        expect(Math.abs(ce - ayas[0][0]) + Math.abs(re - ayas[0][1])).toBe(1);
      });

      it('keeps every tower spot off the lane itself', () => {
        let spots = 0;
        for (let r = 0; r < 16; r++) {
          for (let c = 0; c < 25; c++) {
            if (!isPlaceable(grid, c, r, 'land') && !isPlaceable(grid, c, r, 'shallow')) continue;
            spots++;
            expect(lane.distanceTo(c * 32 + 16, r * 32 + 16), `cell ${c},${r}`).toBeGreaterThanOrEqual(24);
          }
        }
        expect(spots).toBeGreaterThan(20);
      });

      it('has at least 8 waves, bosses only on 5 and 10, and a start purse that buys a tower', () => {
        expect(level.waves.length).toBeGreaterThanOrEqual(8);
        const bossWaves = level.waves.filter((w) => w.boss || w.groups.some((g) => ENEMIES[g.kind].boss));
        if (level.n === 5 || level.n === 10) {
          expect(bossWaves.length).toBeGreaterThan(0);
          expect(level.waves[level.waves.length - 1].boss).toBe(true);
          expect(level.bossName).toBeTruthy();
        } else expect(bossWaves).toHaveLength(0);
        for (const w of level.waves) expect(w.reward).toBeGreaterThan(0);
        const cheapest = Math.min(...level.towers.map((k) => TOWERS[k].tiers[0].cost));
        expect(level.startCash).toBeGreaterThanOrEqual(cheapest);
      });

      it('the canned build wins it, and doing nothing loses it', () => {
        expect(BUILDS[level.n], 'no canned build').toBeDefined();
        const r = runBuild(level, TOWERS, ENEMIES);
        expect(r.sim.phase, r.log.join('\n')).toBe('won');
        expect(r.skipped, 'actions never afforded').toBe(0);
        const idle = runBuild(level, TOWERS, ENEMIES, []);
        expect(idle.sim.phase).toBe('lost');
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
        const piercing = l.towers.some((k) => TOWERS[k].tiers.some((t) => t.dmgKind !== 'bullet' && t.damage > 0));
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
