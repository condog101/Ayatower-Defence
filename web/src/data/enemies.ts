// The US Navy (and friends), as Sauron's host. Fictional satire: stats are game numbers, not real
// capabilities. Phaser-free (imported by the headless sim tests).

import { sec } from '../sim/const';
import type { EnemyDef, EnemyKey } from '../sim/types';

export const ENEMIES: Record<EnemyKey, EnemyDef> = {
  rhib: { key: 'rhib', name: 'RHIB', short: 'RHIB', layer: 'sea', hp: 1, speed: 1.2, leak: 1, cash: 2, score: 10, radius: 6, introLevel: 1, sprite: 'rhib' },
  patrol: {
    key: 'patrol', name: 'MK VI PATROL BOAT', short: 'PATROL', layer: 'sea', hp: 3, speed: 1.1, leak: 2, cash: 4, score: 25, radius: 8,
    children: [{ kind: 'rhib', n: 1 }], introLevel: 1, sprite: 'patrol',
  },
  cyclone: {
    key: 'cyclone', name: 'CYCLONE PATROL SHIP', short: 'CYCLONE', layer: 'sea', hp: 6, speed: 1.0, leak: 3, cash: 6, score: 50, radius: 10,
    children: [{ kind: 'patrol', n: 2 }], introLevel: 2, sprite: 'cyclone',
  },
  lcs: {
    key: 'lcs', name: 'LITTORAL COMBAT SHIP', short: 'LCS', layer: 'sea', hp: 10, speed: 1.6, leak: 4, cash: 8, score: 80, radius: 12, fast: true,
    children: [{ kind: 'cyclone', n: 2 }], introLevel: 4, sprite: 'lcs',
  },
  frigate: {
    key: 'frigate', name: 'CONSTELLATION FRIGATE', short: 'FRIGATE', layer: 'sea', hp: 18, speed: 1.1, leak: 5, cash: 10, score: 120, radius: 14,
    children: [{ kind: 'lcs', n: 2 }], introLevel: 5, sprite: 'frigate',
  },
  burke: {
    key: 'burke', name: 'ARLEIGH BURKE DESTROYER', short: 'BURKE', layer: 'sea', hp: 30, speed: 0.9, leak: 8, cash: 12, score: 200, radius: 16, armoured: true,
    children: [{ kind: 'frigate', n: 2 }], introLevel: 5, sprite: 'burke',
  },
  sub: { key: 'sub', name: 'VIRGINIA SUBMARINE', short: 'SUB', layer: 'sea', hp: 24, speed: 1.0, leak: 8, cash: 16, score: 200, radius: 12, stealth: true, introLevel: 6, sprite: 'sub' },
  tico: {
    key: 'tico', name: 'TICONDEROGA CRUISER', short: 'CRUISER', layer: 'sea', hp: 60, speed: 0.8, leak: 12, cash: 16, score: 350, radius: 18, armoured: true,
    children: [{ kind: 'burke', n: 2 }], introLevel: 8, sprite: 'tico',
  },
  lhd: {
    key: 'lhd', name: 'WASP ASSAULT SHIP', short: 'LHD', layer: 'sea', hp: 250, speed: 0.6, leak: 20, cash: 40, score: 800, radius: 24, armoured: true, big: true,
    children: [{ kind: 'frigate', n: 4 }, { kind: 'seahawk', n: 2 }], introLevel: 9, sprite: 'lhd',
  },
  carrier: {
    key: 'carrier', name: 'NIMITZ CARRIER', short: 'CARRIER', layer: 'sea', hp: 700, speed: 0.5, leak: 40, cash: 80, score: 1500, radius: 32, armoured: true, big: true,
    children: [{ kind: 'burke', n: 4 }, { kind: 'hornet', n: 4 }], introLevel: 10, sprite: 'carrier',
  },
  reaper: { key: 'reaper', name: 'MQ-9 REAPER', short: 'REAPER', layer: 'air', hp: 3, speed: 1.3, leak: 2, cash: 6, score: 30, radius: 8, introLevel: 3, sprite: 'reaper' },
  seahawk: { key: 'seahawk', name: 'MH-60 SEAHAWK', short: 'SEAHAWK', layer: 'air', hp: 8, speed: 1.0, leak: 3, cash: 8, score: 60, radius: 8, introLevel: 6, sprite: 'seahawk' },
  hornet: { key: 'hornet', name: 'F/A-18 SUPER HORNET', short: 'HORNET', layer: 'air', hp: 6, speed: 2.0, leak: 4, cash: 8, score: 60, radius: 8, fast: true, introLevel: 7, sprite: 'hornet' },
  b2: {
    key: 'b2', name: 'B-2 SPIRIT', short: 'B-2', layer: 'air', hp: 40, speed: 1.2, leak: 10, cash: 30, score: 300, radius: 12, stealth: true,
    children: [{ kind: 'hornet', n: 2 }], introLevel: 8, sprite: 'b2',
  },
  boss_yacht: {
    key: 'boss_yacht', name: '"MAR-A-LAGO" GOLDEN YACHT', short: 'YACHT', layer: 'sea', hp: 1200, speed: 0.45, leak: 100, cash: 300, score: 5000, radius: 24,
    armoured: true, boss: true, big: true,
    children: [{ kind: 'burke', n: 3 }, { kind: 'lcs', n: 3 }],
    spawns: { kind: 'reaper', everyTicks: sec(8), max: 16 },
    introLevel: 5, sprite: 'boss_yacht',
  },
  boss_don: {
    key: 'boss_don', name: '"USS BIG DON" GOLDEN SUPERCARRIER', short: 'BIG DON', layer: 'sea', hp: 4000, speed: 0.4, leak: 999, cash: 800, score: 10000, radius: 40,
    armoured: true, boss: true, big: true,
    children: [{ kind: 'carrier', n: 2 }],
    spawns: { kind: 'hornet', everyTicks: sec(5), max: 30 },
    introLevel: 10, sprite: 'boss_don',
  },
};

export const ENEMY_KEYS = Object.keys(ENEMIES) as EnemyKey[];
