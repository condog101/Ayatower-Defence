import Phaser from 'phaser';
import { DEPTH, HUD_H, OX, PX, WIDTH } from '../data/balance';
import { ENEMIES } from '../data/enemies';
import type { Sim } from '../sim/sim';
import { COLORS } from '../systems/UI';
import { button, label, type Button } from './widgets';

export interface HudActions {
  speed(): void;
  auto(): void;
  pause(): void;
}

/** Top strip: PATIENCE, RIALS, wave counter with a preview of the next one, speed / AUTO / pause. */
export class HUD {
  private lives: Phaser.GameObjects.Text;
  private cash: Phaser.GameObjects.Text;
  private wave: Phaser.GameObjects.Text;
  private next: Phaser.GameObjects.Text;
  private speedBtn: Button;
  private autoBtn: Button;
  private shown = { lives: -1, cash: -1, wave: -1, next: '' };

  constructor(scene: Phaser.Scene, actions: HudActions) {
    const s = scene;
    const d = DEPTH.hud;
    s.add.rectangle(0, 0, WIDTH, HUD_H, 0x0b0a08, 0.92).setOrigin(0).setDepth(d - 1);
    s.add.rectangle(0, HUD_H - 1, WIDTH, 1, 0xb88c1e).setOrigin(0).setDepth(d - 1);
    const y = HUD_H / 2;
    s.add.image(OX + 16, y, 'hud_icons', 0).setScale(PX).setDepth(d);
    this.lives = label(s, OX + 32, y + 1, '', 8, COLORS.text);
    s.add.image(OX + 96, y, 'hud_icons', 1).setScale(PX).setDepth(d);
    this.cash = label(s, OX + 112, y + 1, '', 8, COLORS.gold);
    s.add.image(OX + 196, y, 'hud_icons', 2).setScale(PX).setDepth(d);
    this.wave = label(s, OX + 212, y + 1, '', 8, COLORS.text);
    this.next = label(s, OX + 334, y + 1, '', 8, COLORS.dim);
    this.speedBtn = button(s, OX + 806, 3, 56, 22, '1X', actions.speed, 8);
    this.autoBtn = button(s, OX + 866, 3, 52, 22, 'AUTO', actions.auto, 8);
    button(s, OX + 922, 3, 34, 22, 'II', actions.pause, 8);
  }

  update(sim: Sim, speed: number) {
    if (sim.lives !== this.shown.lives) {
      this.shown.lives = sim.lives;
      this.lives.setText(String(sim.lives)).setColor(sim.lives <= sim.level.lives * 0.25 ? COLORS.red : COLORS.text);
    }
    if (sim.cash !== this.shown.cash) {
      this.shown.cash = sim.cash;
      this.cash.setText(String(sim.cash));
    }
    if (sim.wave !== this.shown.wave) {
      this.shown.wave = sim.wave;
      this.wave.setText(`WAVE ${sim.wave}/${sim.totalWaves}`);
      const nw = sim.nextWave();
      let preview = '';
      if (nw) {
        // the biggest group by count, plus a "+" if there's more
        const g = [...nw.groups].sort((a, b) => b.n - a.n)[0];
        const name = ENEMIES[g.kind].short;
        preview = `NEXT: ${nw.boss ? 'BOSS! ' : ''}${g.n}x ${name}${nw.groups.length > 1 ? ' +' : ''}`;
      }
      this.next.setText(preview);
    }
    this.speedBtn.setLabel(`${'>'.repeat(speed)} ${speed}X`);
    this.autoBtn.setHighlight(sim.auto);
  }
}
