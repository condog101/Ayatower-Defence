import Phaser from 'phaser';
import { DEPTH, L, PX } from '../data/balance';
import { ENEMIES } from '../data/enemies';
import type { Sim } from '../sim/sim';
import { COLORS } from '../systems/UI';
import { label } from './widgets';

/** Top strip: PATIENCE, RIALS, the wave counter with a preview of the next one, and the level name. */
export class HUD {
  private lives: Phaser.GameObjects.Text;
  private cash: Phaser.GameObjects.Text;
  private wave: Phaser.GameObjects.Text;
  private next: Phaser.GameObjects.Text;
  private shown = { lives: -1, cash: -1, wave: -1 };

  constructor(scene: Phaser.Scene, levelName: string) {
    const s = scene;
    const d = DEPTH.hud;
    const top = L.top;
    // Only the band right above the map; any extra height on tall screens shows the sea.
    s.add.rectangle(0, top.h - 36, L.W, 36, 0x0b0a08, 0.92).setOrigin(0).setDepth(d - 1);
    s.add.rectangle(0, top.h - 1, L.W, 1, 0xb88c1e).setOrigin(0).setDepth(d - 1);
    const y = top.h - 18;
    const x0 = L.map.x;
    s.add.image(x0 + 10, y, 'hud_icons', 0).setScale(PX).setDepth(d);
    this.lives = label(s, x0 + 26, y + 1, '', 10, COLORS.text);
    s.add.image(x0 + 96, y, 'hud_icons', 1).setScale(PX).setDepth(d);
    this.cash = label(s, x0 + 112, y + 1, '', 10, COLORS.gold);
    s.add.image(x0 + 206, y, 'hud_icons', 2).setScale(PX).setDepth(d);
    this.wave = label(s, x0 + 222, y + 1, '', 10, COLORS.text);
    this.next = label(s, x0 + 370, y + 1, '', 8, COLORS.dim);
    label(s, x0 + L.map.w, y + 1, levelName, 8, COLORS.gold).setOrigin(1, 0.5);
  }

  update(sim: Sim) {
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
        preview = `NEXT: ${nw.boss ? 'BOSS! ' : ''}${g.n}x ${ENEMIES[g.kind].short}${nw.groups.length > 1 ? ' +' : ''}`;
      }
      this.next.setText(preview);
    }
  }
}
