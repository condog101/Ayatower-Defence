import Phaser from 'phaser';
import { DEPTH, PX, SIDE_X } from '../data/balance';
import { ABILITIES } from '../sim/abilities';
import type { Sim } from '../sim/sim';
import type { AbilityKey } from '../sim/types';
import { byInput } from '../systems/Device';
import { COLORS } from '../systems/UI';
import { button, label, type Button } from './widgets';

const KEYS: AbilityKey[] = ['staff', 'fatwa'];
const ICON: Record<AbilityKey, number> = { staff: 13, fatwa: 14 };
const SHORT: Record<AbilityKey, string> = { staff: 'STAFF', fatwa: 'FATWA' };
const W = 75;
const H = 52;
export const ABILITY_Y = 430;

/** The two hero ability buttons with a cooldown sweep and a READY flash. */
export class Abilities {
  private buttons: Record<AbilityKey, Button>;
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
    const make = (k: AbilityKey, i: number) => {
      const x = SIDE_X + 3 + i * (W + 4);
      const b = button(s, x, ABILITY_Y, W, H, '', () => onArm(k), 8);
      b.root.add(s.add.image(W / 2, 20, 'hud_icons', ICON[k]).setScale(PX + 1));
      b.root.add(label(s, 4, H - 8, SHORT[k], 8, COLORS.text, 0));
      b.root.add(label(s, W - 12, 8, byInput(String(i + 1), ''), 8, COLORS.dim, 0));
      if (sim.level.n < ABILITIES[k].unlockLevel) {
        b.setEnabled(false);
        b.root.add(label(s, W / 2 - 10, 20, `L${ABILITIES[k].unlockLevel}`, 8, COLORS.dim, 0));
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
    KEYS.forEach((k, i) => {
      if (this.sim.level.n < ABILITIES[k].unlockLevel) return;
      const b = this.buttons[k];
      const cd = this.sim.abilityCooldown(k);
      const ready = cd === 0;
      b.setEnabled(ready);
      b.setHighlight(this.armed === k);
      if (!ready) {
        const frac = cd / ABILITIES[k].cooldown;
        const x = SIDE_X + 3 + i * (W + 4);
        this.sweep.fillStyle(0x000000, 0.6).fillRect(x + 2, ABILITY_Y + 2 + (H - 4) * (1 - frac), W - 4, (H - 4) * frac);
      }
      if (ready && !this.wasReady[k]) {
        this.scene.tweens.add({ targets: b.root, scale: { from: 1.15, to: 1 }, duration: 250, ease: 'Back.easeOut' });
      }
      this.wasReady[k] = ready;
    });
  }
}
