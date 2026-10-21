// Wave-building shorthands so each level's wave table reads as one line per wave.

import type { EnemyKey, WaveDef, WaveGroup } from '../../sim/types';

/** `n` of `kind`, `gap` seconds apart, starting `delay` seconds into the wave, on `lane` (default: alternate). */
export const rush = (kind: EnemyKey, n: number, gap: number, delay = 0, lane?: number): WaveGroup =>
  lane === undefined ? { kind, n, gap, delay } : { kind, n, gap, delay, lane };

export const wave = (reward: number, ...groups: WaveGroup[]): WaveDef => ({ groups, reward });

export const boss = (reward: number, ...groups: WaveGroup[]): WaveDef => ({ groups, reward, boss: true });
