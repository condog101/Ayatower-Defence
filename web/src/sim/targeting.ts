import type { Enemy, TierDef, Tower } from './types';
import { tierOf } from './tiers';

/** Can this tier shoot at this enemy at all (ignoring range)? */
export function canHit(tier: TierDef, e: Enemy): boolean {
  if (!e.alive) return false;
  if (e.def.layer === 'sea' ? !tier.hitsSea : !tier.hitsAir) return false;
  if (e.def.armoured && tier.dmgKind === 'bullet') return false;
  return e.revealed;
}

export function eligible(t: Tower, e: Enemy): boolean {
  const tier = tierOf(t);
  if (!canHit(tier, e)) return false;
  const r = tier.range * t.buff.range;
  return (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= r * r;
}

/** Higher is a better pick under the tower's targeting mode. */
function rank(t: Tower, e: Enemy): number {
  switch (t.targeting) {
    // FIRST / LAST compare distance still to sail, so they agree across lanes of different lengths.
    case 'first':
      return -e.left;
    case 'last':
      return e.left;
    case 'strong':
      // max hp, ties broken toward the front
      return e.hp * 100_000 - e.left;
    case 'close':
      return -((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
  }
}

/**
 * Up to `n` distinct targets, best first. FATWA-marked enemies always outrank unmarked ones.
 * Fewer than `n` eligible enemies returns fewer.
 */
export function pickTargets(t: Tower, enemies: Enemy[], n = 1): Enemy[] {
  const picks: { e: Enemy; score: number }[] = [];
  for (const e of enemies) {
    if (!eligible(t, e)) continue;
    const score = rank(t, e) + (e.markTicks > 0 ? 1e12 : 0);
    if (picks.length < n) {
      picks.push({ e, score });
      picks.sort((a, b) => b.score - a.score);
    } else if (score > picks[n - 1].score) {
      picks[n - 1] = { e, score };
      picks.sort((a, b) => b.score - a.score);
    }
  }
  return picks.map((p) => p.e);
}

export function pickTarget(t: Tower, enemies: Enemy[]): Enemy | null {
  return pickTargets(t, enemies, 1)[0] ?? null;
}
