// The ten levels, in campaign order. Phaser-free (imported by the headless sim tests).

import type { LevelDef } from '../sim/types';
import { LEVEL_01 } from './maps/level01';

export const LEVELS: LevelDef[] = [LEVEL_01];

export function getLevel(n: number): LevelDef {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, n - 1))];
}
