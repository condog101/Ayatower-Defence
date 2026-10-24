// Tower tiers: a shared base, then one of two upgrade paths of two steps each.

import type { PathIndex, TierDef, Tower, TowerDef } from './types';

/** The tier a tower is at: its base, or a step along the path it chose. */
export const tierOf = (t: Pick<Tower, 'def' | 'tier' | 'path'>): TierDef => (t.tier === 0 ? t.def.base : t.def.paths[t.path].tiers[t.tier - 1]);

/** Every tier a tower can reach: base, path A, path B. */
export const allTiers = (d: TowerDef): TierDef[] => [d.base, ...d.paths[0].tiers, ...d.paths[1].tiers];

/** Sprite slot for a tier on a path: 0 base, 1-2 path A, 3-4 path B. */
export const tierSlot = (tier: number, path: PathIndex): number => (tier === 0 ? 0 : 1 + path * 2 + (tier - 1));
