import Phaser from 'phaser';
import { DEPTH, MAP_X, MAP_Y, PX } from '../data/balance';
import type { Projectile } from '../sim/types';

interface View {
  sprite: Phaser.GameObjects.Sprite;
  /** Lobbed shells: flight length, for the arc. */
  flight: number;
}

const ANIMATED = new Set(['p_rocket', 'p_missile', 'p_shahed', 'p_torpedo', 'p_mine', 'p_boat', 'p_sam']);

/** Sprites for live projectiles, reconciled by id each frame. Lobbed shells fly an arc. */
export class ProjectileView {
  private views = new Map<number, View>();

  constructor(private scene: Phaser.Scene) {}

  render(projectiles: Projectile[]) {
    const live = new Set<number>();
    for (const p of projectiles) {
      if (!p.alive || p.kind === 'hitscan') continue;
      live.add(p.id);
      let v = this.views.get(p.id);
      if (!v) {
        const depth = p.kind === 'mine' ? DEPTH.mines : p.kind === 'boat' || p.sprite === 'p_torpedo' ? DEPTH.sea - 1 : DEPTH.projectiles;
        const sprite = this.scene.add.sprite(0, 0, p.sprite, 0).setScale(PX).setDepth(depth);
        if (ANIMATED.has(p.sprite)) sprite.play({ key: p.sprite, startFrame: p.id % 2 });
        v = { sprite, flight: p.kind === 'splash' ? p.ttl : 0 };
        this.views.set(p.id, v);
        if (p.kind === 'mine') this.scene.tweens.add({ targets: sprite, scale: { from: PX * 2, to: PX }, duration: 250 });
      }
      let lift = 0;
      if (v.flight) {
        const t = 1 - p.ttl / v.flight;
        lift = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * 40;
        v.sprite.setRotation(Math.atan2(p.vy - Math.cos(Math.PI * t) * 2, p.vx));
      } else if (p.kind !== 'mine') v.sprite.setRotation(p.angle);
      v.sprite.setPosition(MAP_X + p.x, MAP_Y + p.y - lift);
    }
    for (const [id, v] of this.views) {
      if (live.has(id)) continue;
      v.sprite.destroy();
      this.views.delete(id);
    }
  }
}
