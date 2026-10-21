import Phaser from 'phaser';
import { CX, HEIGHT, OX, PX, WIDTH } from '../data/balance';
import { api } from '../net/api';
import { Save } from '../systems/Save';
import { COLORS, designFrame, menu, panel, text } from '../systems/UI';

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('Leaderboard');
  }

  create() {
    designFrame(this);
    this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'tiles', 0).setOrigin(0).setTileScale(PX).setScrollFactor(0).setAlpha(0.4);
    panel(this, OX + 160, 30, 640, 480);
    text(this, CX, 64, 'THE CHARTS', 24, COLORS.gold);
    const status = text(this, CX, 240, 'CONSULTING THE CHARTS...', 8, COLORS.dim);
    text(this, CX, 100, ' #  CALLSIGN          SCORE   LEVEL', 8, COLORS.dim);
    api
      .leaderboard(15)
      .then((rows) => {
        status.destroy();
        if (rows.length === 0) text(this, CX, 240, 'NO ENTRIES YET. HOLD THE STRAIT.', 8);
        rows.forEach((r, i) => {
          const mine = Save.session && r.callsign.toLowerCase() === Save.session.callsign.toLowerCase();
          const line = `${String(i + 1).padStart(2)}  ${r.callsign.padEnd(16)} ${String(r.score).padStart(7)}   ${`L${r.levelReached}`.padStart(5)}`;
          text(this, CX, 128 + i * 22, line, 8, mine ? COLORS.gold : i < 3 ? COLORS.text : '#b9c6dc');
        });
      })
      .catch(() => status.setText('THE CHARTS ARE UNAVAILABLE (OFFLINE?)'));
    menu(this, CX, 478, [{ label: 'BACK', action: () => this.scene.start('Title') }]);
    this.cameras.main.fadeIn(250);
  }
}
