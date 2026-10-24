import Phaser from 'phaser';
import { DEPTH, MAP_X, MAP_Y, PX } from '../data/balance';
import type { Enemy } from '../sim/types';

/** Aircraft fly this far above their lane position; their shadow sits on the water. */
const AIR_LIFT = 14;
const SHADOW_DX = 6;
const SHADOW_DY = 10;

interface View {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Sprite | null;
  stars: Phaser.GameObjects.Sprite | null;
  key: string;
  anim: string;
  seen: boolean;
}

/**
 * Sprites for every live enemy, reconciled by id each frame (pooled per sheet). Health bars for
 * damaged ships share one Graphics. Unrevealed stealth is ghosted; slowed ships tint cyan,
 * frozen ones white with stars, FATWA marks red.
 */
export class EnemyView {
  private views = new Map<number, View>();
  private pool = new Map<string, Phaser.GameObjects.Sprite[]>();
  private bars: Phaser.GameObjects.Graphics;
  private bossBar: Phaser.GameObjects.Graphics;

  constructor(private scene: Phaser.Scene) {
    this.bars = scene.add.graphics().setDepth(DEPTH.fx - 2);
    this.bossBar = scene.add.graphics().setDepth(DEPTH.hud - 1);
  }

  private take(key: string): Phaser.GameObjects.Sprite {
    const list = this.pool.get(key);
    const s = list?.pop();
    if (s) return s.setActive(true).setVisible(true).setAlpha(1).clearTint();
    return this.scene.add.sprite(0, 0, key, 0).setScale(PX);
  }

  private give(s: Phaser.GameObjects.Sprite) {
    s.stop();
    s.setActive(false).setVisible(false);
    const key = s.texture.key;
    if (!this.pool.has(key)) this.pool.set(key, []);
    this.pool.get(key)!.push(s);
  }

  /** Screen position of an enemy (aircraft drawn lifted). */
  static screen(e: Enemy): [number, number] {
    return [MAP_X + e.x, MAP_Y + e.y - (e.def.layer === 'air' ? AIR_LIFT : 0)];
  }

  has(id: number): boolean {
    return this.views.has(id);
  }

  render(enemies: Enemy[]) {
    const live = new Set<number>();
    this.bars.clear();
    this.bossBar.clear();
    let boss: Enemy | null = null;
    for (const e of enemies) {
      if (!e.alive) continue;
      live.add(e.id);
      let v = this.views.get(e.id);
      const air = e.def.layer === 'air';
      if (!v) {
        const sprite = this.take(e.def.sprite).setDepth(air ? DEPTH.air : DEPTH.sea);
        const shadow = air ? this.take(e.def.sprite).setDepth(DEPTH.shadow).setTint(0x000000).setAlpha(0.3) : null;
        v = { sprite, shadow, stars: null, key: e.def.sprite, anim: '', seen: true };
        this.views.set(e.id, v);
      }
      const [x, y] = EnemyView.screen(e);
      const anim = e.def.sub ? `${e.def.sprite}_${e.revealed ? 'up' : 'down'}` : e.def.sprite;
      if (v.anim !== anim) {
        v.sprite.play({ key: anim, startFrame: e.id % 2 });
        v.anim = anim;
      }
      v.sprite.setPosition(x, y).setRotation(e.angle);
      v.shadow?.setPosition(MAP_X + e.x + SHADOW_DX, MAP_Y + e.y + SHADOW_DY).setRotation(e.angle).setFrame(v.sprite.frame.name);
      const ghost = e.def.stealth && !e.revealed;
      v.sprite.setAlpha(ghost ? (e.def.sub ? 0.55 : 0.3) : 1);
      if (e.markTicks > 0) v.sprite.setTint(0xff6060);
      else if (e.stunTicks > 0) v.sprite.setTint(0xffffff, 0xffffff, 0xb0e0ff, 0xb0e0ff);
      else if (e.slowTicks > 0) v.sprite.setTint(0x9ff0ff);
      else v.sprite.clearTint();
      if (e.stunTicks > 0) {
        if (!v.stars) v.stars = this.scene.add.sprite(x, y, 'stun', 0).setScale(PX).setDepth(DEPTH.fx - 1).play('stun');
        v.stars.setPosition(x, y - e.def.radius - 6);
      } else if (v.stars) {
        v.stars.destroy();
        v.stars = null;
      }
      if (e.def.boss) boss = e;
      else if (e.hp < e.maxHp && !ghost) {
        const w = Math.max(14, Math.min(40, e.def.radius * 2));
        const bx = x - w / 2;
        const by = y - e.def.radius - 7;
        this.bars.fillStyle(0x000000, 0.8).fillRect(bx - 1, by - 1, w + 2, 5);
        this.bars.fillStyle(e.def.armoured ? 0xffd84a : 0x6dff8f, 1).fillRect(bx, by, Math.max(1, (w * e.hp) / e.maxHp), 3);
      }
    }
    for (const [id, v] of this.views) {
      if (live.has(id)) continue;
      this.give(v.sprite);
      if (v.shadow) this.give(v.shadow);
      v.stars?.destroy();
      this.views.delete(id);
    }
    if (boss) this.drawBossBar(boss);
  }

  private drawBossBar(e: Enemy) {
    const w = 360;
    const x = MAP_X + 220;
    const y = MAP_Y + 8;
    this.bossBar.fillStyle(0x000000, 0.85).fillRect(x - 2, y - 2, w + 4, 12);
    this.bossBar.fillStyle(0x3a2a10, 1).fillRect(x, y, w, 8);
    this.bossBar.fillStyle(0xffd84a, 1).fillRect(x, y, Math.max(1, (w * e.hp) / e.maxHp), 8);
    this.bossBar.lineStyle(1, 0xc8102e, 1).strokeRect(x - 2, y - 2, w + 4, 12);
  }

  destroy() {
    this.bars.destroy();
    this.bossBar.destroy();
  }
}
