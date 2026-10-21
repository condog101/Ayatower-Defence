import Phaser from 'phaser';
import { CX, HEIGHT, OX, PX, WIDTH } from '../data/balance';
import { ENEMIES, ENEMY_KEYS } from '../data/enemies';
import { getLevel, LEVELS } from '../data/levels';
import { TOWERS } from '../data/towers';
import { TWEETS } from '../data/story';
import { TowerView } from '../game/TowerView';
import { byInput } from '../systems/Device';
import type { RunState } from '../systems/Run';
import { COLORS, designFrame, onContinue, panel, text } from '../systems/UI';

/** Level card: name, subtitle, brief, and icon rows for the new towers and new enemies. */
export class LevelIntroScene extends Phaser.Scene {
  constructor() {
    super('LevelIntro');
  }

  create(data: { run: RunState; briefed?: boolean }) {
    const run = data.run;
    const cards = TWEETS[run.level];
    if (!data.briefed && cards?.length) {
      this.scene.start('Briefing', { cards, next: 'LevelIntro', nextData: { run, briefed: true } });
      return;
    }
    const L = getLevel(run.level);
    designFrame(this);
    this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'tiles', 0).setOrigin(0).setTileScale(PX).setScrollFactor(0).setAlpha(0.5);
    panel(this, OX + 100, 50, 760, 420);
    text(this, CX, 84, `LEVEL ${L.n} OF ${Math.max(10, LEVELS.length)}`, 8, COLORS.dim);
    text(this, CX, 116, L.name, 24, COLORS.gold);
    text(this, CX, 150, `"${L.sub}"`, 8, COLORS.text);
    text(this, CX, 190, L.brief, 8, COLORS.text).setWordWrapWidth(680);

    const prev = L.n > 1 ? getLevel(L.n - 1).towers : [];
    const newTowers = L.towers.filter((k) => !prev.includes(k));
    const newEnemies = ENEMY_KEYS.filter((k) => ENEMIES[k].introLevel === L.n);
    let y = 240;
    if (newTowers.length) {
      text(this, CX, y, 'NEW DEFENCES', 8, COLORS.green);
      const sp = 150;
      const x0 = CX - ((newTowers.length - 1) * sp) / 2;
      newTowers.forEach((k, i) => {
        TowerView.make(this, TOWERS[k], 0, x0 + i * sp, y + 36, 1, PX + 1);
        text(this, x0 + i * sp, y + 72, TOWERS[k].name, 8, COLORS.text);
      });
      y += 100;
    }
    if (newEnemies.length) {
      text(this, CX, y, 'NEW ENEMIES', 8, COLORS.red);
      const sp = Math.min(170, 640 / newEnemies.length);
      const x0 = CX - ((newEnemies.length - 1) * sp) / 2;
      newEnemies.forEach((k, i) => {
        const e = ENEMIES[k];
        this.add.sprite(x0 + i * sp, y + 30, e.sprite, 0).setScale(e.big ? PX : PX + 1);
        const tags = [e.layer === 'air' ? 'AIR' : '', e.armoured ? 'ARMOUR' : '', e.stealth ? 'STEALTH' : '', e.fast ? 'FAST' : '', e.boss ? 'BOSS' : ''].filter(Boolean).join(' ');
        text(this, x0 + i * sp, y + 58, `${e.short}${tags ? `\n${tags}` : ''}`, 8, e.boss ? COLORS.red : COLORS.text);
      });
    }

    text(this, CX, 420, `PATIENCE ${L.lives}   RIALS ${L.startCash}   WAVES ${L.waves.length}   SCORE ${run.score}`, 8, COLORS.dim);
    const go = text(this, CX, 446, byInput('PRESS ANY KEY TO TAKE YOUR POST', 'TAP TO TAKE YOUR POST'), 12, COLORS.gold);
    this.tweens.add({ targets: go, alpha: 0.2, yoyo: true, repeat: -1, duration: 500 });
    this.cameras.main.fadeIn(250);
    onContinue(this, () => this.scene.start('Game', { run }), 300);
  }
}
