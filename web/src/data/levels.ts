// The twenty levels, in campaign order (Act I: the Strait, 1-10; Act II: the Gulf, 11-20). Phaser-free (imported by the headless sim tests).

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
import { LEVEL_11 } from './maps/level11';
import { LEVEL_12 } from './maps/level12';
import { LEVEL_13 } from './maps/level13';
import { LEVEL_14 } from './maps/level14';
import { LEVEL_15 } from './maps/level15';
import { LEVEL_16 } from './maps/level16';
import { LEVEL_17 } from './maps/level17';
import { LEVEL_18 } from './maps/level18';
import { LEVEL_19 } from './maps/level19';
import { LEVEL_20 } from './maps/level20';

export const LEVELS: LevelDef[] = [
  LEVEL_01, LEVEL_02, LEVEL_03, LEVEL_04, LEVEL_05, LEVEL_06, LEVEL_07, LEVEL_08, LEVEL_09, LEVEL_10,
  LEVEL_11, LEVEL_12, LEVEL_13, LEVEL_14, LEVEL_15, LEVEL_16, LEVEL_17, LEVEL_18, LEVEL_19, LEVEL_20,
];

export function getLevel(n: number): LevelDef {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, n - 1))];
}
