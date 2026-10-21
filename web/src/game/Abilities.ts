import Phaser from 'phaser';
import { DEPTH, L, PX } from '../data/balance';
import type { Rect } from '../layout/compute';
import { ABILITIES } from '../sim/abilities';
import type { Sim } from '../sim/sim';
import type { AbilityKey } from '../sim/types';
import { byInput } from '../systems/Device';
import { COLORS } from '../systems/UI';
import { label, rectButton, type Button } from './widgets';

const KEYS: AbilityKey[] = ['staff', 'fatwa'];
const ICON: Record<AbilityKey, number> = { staff: 13, fatwa: 14 };
const SHORT: Record<AbilityKey, string> = { staff: 'STAFF', fatwa: 'FATWA' };

/** The two hero ability buttons (left strip) with a cooldown sweep and a READY bounce. */
export class Abilities {
  private buttons: Record<AbilityKey, Button>;
  private rects: Record<AbilityKey, Rect>;
  private sweep: Phaser.GameObjects.Graphics;
  private wasReady: Record<AbilityKey, boolean> = { staff: true, fatwa: true };
  armed: AbilityKey | null = null;

  constructor(
    private scene: Phaser.Scene,
    private sim: Sim,
    onArm: (k: AbilityKey) => void,
  ) {
    const s = scene;
    this.sweep = s.add.graphics().setDepth(DEPTH.hud + 2);
    this.rects = { staff: L.game.staff, fatwa: L.game.fatwa };
    const make = (k: AbilityKey, i: number) => {
      const r = this.rects[k];
      const b = rectButton(s, r, '', () => onArm(k), 8);
      b.root.add(s.add.image(26, r.h / 2, 'hud_icons', ICON[k]).setScale(PX + 1));
      b.root.add(label(s, 48, r.h / 2, SHORT[k], 10, COLORS.text, 0));
      b.root.add(label(s, r.w - 14, 10, byInput(String(i + 1), ''), 8, COLORS.dim, 0));
      if (sim.level.n < ABILITIES[k].unlockLevel) {
        b.setEnabled(false);
        b.root.list.forEach((o) => o !== b.bg && (o as Phaser.GameObjects.Image).setAlpha(0.25));
        b.root.add(label(s, 48, r.h / 2, `LEVEL ${ABILITIES[k].unlockLevel}`, 8, COLORS.gold, 0).setStroke('#000', 3));
      }
      return b;
    };
    this.buttons = { staff: make('staff', 0), fatwa: make('fatwa', 1) };
  }

  ready(k: AbilityKey): boolean {
    return this.sim.level.n >= ABILITIES[k].unlockLevel && this.sim.abilityCooldown(k) === 0;
  }

  update() {
    this.sweep.clear();
    for (const k of KEYS) {
      if (this.sim.level.n < ABILITIES[k].unlockLevel) continue;
      const b = this.buttons[k];
      const r = this.rects[k];
      const cd = this.sim.abilityCooldown(k);
      const ready = cd === 0;
      b.setEnabled(ready);
      b.setHighlight(this.armed === k);
      if (!ready) {
        const frac = cd / ABILITIES[k].cooldown;
        this.sweep.fillStyle(0x000000, 0.6).fillRect(r.x + 2, r.y + 2 + (r.h - 4) * (1 - frac), r.w - 4, (r.h - 4) * frac);
      }
      if (ready && !this.wasReady[k]) {
        this.scene.tweens.add({ targets: b.label, scale: { from: 1.4, to: 1 }, duration: 250 });
        b.bg.setFillStyle(0x3a2e10, 1);
        this.scene.time.delayedCall(400, () => b.bg.setFillStyle(0x141210, 0.95));
      }
      this.wasReady[k] = ready;
    }
  }
}
