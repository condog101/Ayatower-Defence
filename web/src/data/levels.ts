// The ten levels, in campaign order. Phaser-free (imported by the headless sim tests).

import type { LevelDef } from '../sim/types';
import { LEVEL_01 } from './maps/level01';
import { LEVEL_02 } from './maps/level02';
import { LEVEL_03 } from './maps/level03';
import { LEVEL_04 } from './maps/level04';
import { LEVEL_05 } from './maps/level05';
import { LEVEL_06 } from './maps/level06';
import { LEVEL_07 } from './maps/level07';
import { LEVEL_08 } from './maps/level08';
import { LEVEL_09 } from './maps/level09';
import { LEVEL_10 } from './maps/level10';

export const LEVELS: LevelDef[] = [LEVEL_01, LEVEL_02, LEVEL_03, LEVEL_04, LEVEL_05, LEVEL_06, LEVEL_07, LEVEL_08, LEVEL_09, LEVEL_10];

export function getLevel(n: number): LevelDef {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, n - 1))];
}
