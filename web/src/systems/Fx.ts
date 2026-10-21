import Phaser from 'phaser';
import { DEPTH, PX } from '../data/balance';
import { Save } from './Save';
import { uiSize } from './UI';

/** One-shot visual effects in screen space. */
export class Fx {
  constructor(private scene: Phaser.Scene) {}

  private oneShot(key: string, x: number, y: number, depth: number, scale = PX) {
    const s = this.scene.add.sprite(x, y, key).setScale(scale).setDepth(depth);
    s.play(key);
    s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
    return s;
  }

  explosion(x: number, y: number, big = false) {
    this.oneShot(big ? 'explosion_lg' : 'explosion_sm', x, y, DEPTH.fx);
    if (big) {
      for (let i = 0; i < 3; i++) {
        this.scene.time.delayedCall(120 + i * 90, () => this.smoke(x + Phaser.Math.Between(-12, 12), y + Phaser.Math.Between(-8, 8)));
      }
    }
  }

  splash(x: number, y: number) {
    this.oneShot('splash', x, y, DEPTH.sea + 1);
  }

  smoke(x: number, y: number) {
    const s = this.oneShot('smoke', x, y, DEPTH.fx - 1);
    this.scene.tweens.add({ targets: s, y: y - 14, duration: 500 });
  }

  muzzle(x: number, y: number, angle: number) {
    const s = this.scene.add.sprite(x + Math.cos(angle) * 12, y + Math.sin(angle) * 12, 'muzzle', 0).setScale(PX).setDepth(DEPTH.projectiles + 1).setRotation(angle);
    this.scene.time.delayedCall(50, () => s.setFrame(1));
    this.scene.time.delayedCall(100, () => s.destroy());
  }

  floatText(x: number, y: number, text: string, color = '#ffe14d', size = 8) {
    const t = this.scene.add
      .text(x, y, text, { fontFamily: '"Press Start 2P"', fontSize: `${uiSize(size)}px`, color })
      .setOrigin(0.5)
      .setStroke('#000', 3)
      .setDepth(DEPTH.fx + 1);
    this.scene.tweens.add({ targets: t, y: y - 24, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  cashText(x: number, y: number, amount: number) {
    this.floatText(x, y, `+${amount}`, '#ffd84a');
  }

  /** Expanding shockwave ring: radius `r` px over `ms`. */
  ring(x: number, y: number, r: number, color = 0xffffff, ms = 400) {
    const s = this.scene.add.image(x, y, 'ring').setDepth(DEPTH.fx).setTint(color).setScale(0.5);
    this.scene.tweens.add({ targets: s, scale: (r * 2) / 24, alpha: 0, duration: ms, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
  }

  shake(intensity = 0.006, ms = 160) {
    if (Save.progress.settings.shake) this.scene.cameras.main.shake(ms, intensity);
  }

  flash(color = 0xffffff, ms = 180) {
    this.scene.cameras.main.flash(ms, (color >> 16) & 255, (color >> 8) & 255, color & 255);
  }

  tracer(x0: number, y0: number, x1: number, y1: number, color = 0xfff3a0, width = 1) {
    const g = this.scene.add.graphics().setDepth(DEPTH.projectiles);
    g.lineStyle(width, color, 1).lineBetween(x0, y0, x1, y1);
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 110, onComplete: () => g.destroy() });
  }

  /** The Fattah: a white-hot streak from the sky. */
  beam(x: number, y: number) {
    const g = this.scene.add.graphics().setDepth(DEPTH.fx);
    g.fillStyle(0xffffff, 1).fillRect(x - 2, y - 400, 4, 400);
    g.fillStyle(0xfff3a0, 0.6).fillRect(x - 5, y - 400, 10, 400);
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }
}
