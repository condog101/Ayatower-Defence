import Phaser from 'phaser';
import { DEPTH, MAP_X, MAP_Y, TOWER_PX } from '../data/balance';
import { tierOf, tierSlot } from '../sim/tiers';
import type { PathIndex, Tower, TowerDef } from '../sim/types';

/** Aimed towers in turrets.png order. */
const AIMED = ['boats', 'aa_gun', 'missile', 'sam'];

export const baseFrame = (def: TowerDef, tier: number, path: PathIndex) => def.index * 5 + tierSlot(tier, path);

/** turrets.png frame for an aimed tower at a tier on a path, pointing at `angle` (0 = east, clockwise). */
export function turretFrame(def: TowerDef, tier: number, path: PathIndex, angle: number): number {
  const dir = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
  return (AIMED.indexOf(def.key) * 5 + tierSlot(tier, path)) * 8 + dir;
}

interface View {
  base: Phaser.GameObjects.Image;
  turret: Phaser.GameObjects.Image | null;
  tier: number;
  path: PathIndex;
}

/** Tower sprites (base + 8-way turret), the selection ring and the tier pips. */
export class TowerView {
  private views = new Map<number, View>();
  private ring: Phaser.GameObjects.Graphics;
  private pips: Phaser.GameObjects.Graphics;
  selected: number | null = null;

  constructor(private scene: Phaser.Scene) {
    this.ring = scene.add.graphics().setDepth(DEPTH.ghost - 2);
    this.pips = scene.add.graphics().setDepth(DEPTH.towers + 2);
  }

  /** Base and turret images for a tower def (also used by the shop and the placement ghost). */
  static make(scene: Phaser.Scene, def: TowerDef, tier: number, path: PathIndex, x: number, y: number, depth: number, scale = TOWER_PX) {
    const base = scene.add.image(x, y, 'towers', baseFrame(def, tier, path)).setScale(scale).setDepth(depth);
    const turret = def.aimed ? scene.add.image(x, y, 'turrets', turretFrame(def, tier, path, -Math.PI / 2)).setScale(scale).setDepth(depth + 0.1) : null;
    return { base, turret };
  }

  render(towers: Tower[]) {
    const live = new Set<number>();
    this.pips.clear();
    for (const t of towers) {
      live.add(t.id);
      let v = this.views.get(t.id);
      const x = MAP_X + t.x;
      const y = MAP_Y + t.y;
      if (!v) {
        const { base, turret } = TowerView.make(this.scene, t.def, t.tier, t.path, x, y, DEPTH.towers + t.r * 0.01);
        v = { base, turret, tier: t.tier, path: t.path };
        this.views.set(t.id, v);
        this.scene.tweens.add({ targets: [base, turret].filter(Boolean), scale: { from: TOWER_PX * 1.4, to: TOWER_PX }, duration: 180, ease: 'Back.easeOut' });
      }
      if (v.tier !== t.tier || v.path !== t.path) {
        v.tier = t.tier;
        v.path = t.path;
        v.base.setFrame(baseFrame(t.def, t.tier, t.path));
      }
      v.turret?.setFrame(turretFrame(t.def, t.tier, t.path, t.angle));
      // tier pips under the tower: gold on path A, red on path B
      const pip = t.tier > 0 && t.path === 1 ? 0xe0403a : 0xffd84a;
      for (let i = 0; i <= t.tier; i++) {
        this.pips.fillStyle(0x000000, 1).fillRect(x - 8 + i * 6, y + 11, 5, 4);
        this.pips.fillStyle(pip, 1).fillRect(x - 7 + i * 6, y + 12, 3, 2);
      }
    }
    for (const [id, v] of this.views) {
      if (live.has(id)) continue;
      v.base.destroy();
      v.turret?.destroy();
      this.views.delete(id);
    }
    this.ring.clear();
    const sel = this.selected !== null ? towers.find((t) => t.id === this.selected) : undefined;
    if (sel) {
      const tier = tierOf(sel);
      TowerView.drawRange(this.ring, MAP_X + sel.x, MAP_Y + sel.y, tier.range * sel.buff.range, true);
    } else this.selected = null;
  }

  static drawRange(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, ok: boolean) {
    const c = ok ? 0xffffff : 0xff4a4a;
    g.fillStyle(c, ok ? 0.08 : 0.12).fillCircle(x, y, r);
    g.lineStyle(1, c, 0.6).strokeCircle(x, y, r);
  }

  /** Brief bounce on a tower (upgrade, sermon). */
  pulse(id: number) {
    const v = this.views.get(id);
    if (!v) return;
    this.scene.tweens.add({ targets: [v.base, v.turret].filter(Boolean), scale: { from: TOWER_PX * 1.25, to: TOWER_PX }, duration: 200 });
  }
}
