// A straight test strait: the lane runs along row 5, land above, shallows below.

import { TOWER_KEYS } from '../../web/src/data/towers';
import type { LevelDef, WaveDef } from '../../web/src/sim/types';

export const MINI_ROWS = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
  '.........................',
  '.........................',
  '.........................',
  '========================A',
  ',,,,,,,,,,,,,,,,,,,,,,,,,',
  ',,,,,,,,,,,,,,,,,,,,,,,,,',
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~',
];

export function mini(waves: WaveDef[] = [], over: Partial<LevelDef> = {}): LevelDef {
  return {
    n: 10,
    name: 'TEST STRAIT',
    sub: 'Unit tests',
    brief: '',
    rows: MINI_ROWS,
    lanes: [[[-1, 5], [23, 5]]],
    startCash: 100_000,
    lives: 100,
    towers: [...TOWER_KEYS],
    waves,
    seed: 7,
    ...over,
  };
}
