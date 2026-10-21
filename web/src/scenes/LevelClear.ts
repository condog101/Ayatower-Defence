import Phaser from 'phaser';
import { LEVEL_COUNT } from '../../../shared/progress';
import { HEIGHT, OX, PX, WIDTH } from '../data/balance';
import { LEVELS } from '../data/levels';
import { ENDING } from '../data/story';
import { syncProgress } from '../net/sync';
import { Audio } from '../systems/Audio';
import { byInput } from '../systems/Device';
import { Save } from '../systems/Save';
import { COLORS, onContinue, panel, text } from '../systems/UI';
import type { LevelResult } from './Game';

/** Cosmetic verdict stamped on a cleared level. */
export function verdict(r: Pick<LevelResult, 'leaked' | 'livesLeft'>): string {
  if (r.leaked === 0) return 'SHAH-LL NOT PASS';
  if (r.livesLeft >= 50) return 'HELD';
  return 'SCRAPED THROUGH';
}

export class LevelClearScene extends Phaser.Scene {
  constructor() {
    super('LevelClear');
  }

  create(r: LevelResult) {
    const run = r.run;
    const lvl = run.level;
    const last = Math.min(LEVEL_COUNT, LEVELS.length);
    const finished = lvl >= last;

    Save.update((p) => {
      p.levelBest[String(lvl)] = Math.max(p.levelBest[String(lvl)] ?? 0, r.levelScore);
      p.highestLevel = Math.max(p.highestLevel, Math.min(last, lvl + 1));
    });
    void syncProgress();

    this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'tiles', 0).setOrigin(0).setTileScale(PX).setAlpha(0.5);
    panel(this, OX + 190, 70, 580, 380);
    text(this, WIDTH / 2, 110, 'THE STRAIT HOLDS', 24, COLORS.gold);
    text(this, WIDTH / 2, 140, `LEVEL ${lvl}: ${getName(lvl)}`, 8, COLORS.dim);
    const lines = [
      `SHIPS SUNK         ${String(r.killScore).padStart(7)}`,
      `WAVE BOUNTIES      ${String(r.waveScore).padStart(7)}`,
      `CLEAR BONUS        ${String(1000 * lvl).padStart(7)}`,
      `PATIENCE ${String(r.livesLeft).padStart(3)} X 50  ${String(r.livesLeft * 50).padStart(7)}`,
      `NONE PASSED        ${String(r.leaked ? 0 : 1500).padStart(7)}`,
      '',
      `LEVEL SCORE        ${String(r.levelScore).padStart(7)}`,
      `RUN TOTAL          ${String(run.score).padStart(7)}`,
    ];
    lines.forEach((l, i) =>
      this.time.delayedCall(220 * (i + 1), () => {
        text(this, WIDTH / 2 - 128, 178 + i * 24, l, 8, i >= 6 ? COLORS.gold : COLORS.text, 0).setOrigin(0, 0.5);
        if (l) Audio.play('blip');
      }),
    );
    const stamp = verdict(r);
    this.time.delayedCall(220 * (lines.length + 1), () => {
      const t = text(this, WIDTH / 2, 386, `* ${stamp} *`, 16, stamp === 'SCRAPED THROUGH' ? COLORS.red : COLORS.gold).setScale(2).setAlpha(0);
      this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
      Audio.play('upgrade');
    });
    const prompt = text(this, WIDTH / 2, 424, finished ? byInput('PRESS ANY KEY', 'TAP TO CONTINUE') : byInput('PRESS ANY KEY FOR THE NEXT LEVEL', 'TAP FOR THE NEXT LEVEL'), 8, COLORS.gold);
    this.tweens.add({ targets: prompt, alpha: 0.2, yoyo: true, repeat: -1, duration: 500 });
    this.cameras.main.fadeIn(250);
    onContinue(
      this,
      () => {
        if (finished) {
          this.scene.start('Briefing', { cards: ENDING, next: 'GameOver', nextData: { run, victory: true } });
        } else {
          run.level++;
          this.scene.start('LevelIntro', { run });
        }
      },
      1800,
    );
  }
}

function getName(n: number): string {
  return LEVELS[n - 1]?.name ?? '';
}
