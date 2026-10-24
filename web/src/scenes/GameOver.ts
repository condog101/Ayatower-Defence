import Phaser from 'phaser';
import { CX, HEIGHT, OX, PX, WIDTH } from '../data/balance';
import { pickQuote, renderLine } from '../data/quotes';
import { submitRun, syncProgress } from '../net/sync';
import { Audio } from '../systems/Audio';
import { Music } from '../systems/Music';
import { newRun, type RunState } from '../systems/Run';
import { Save } from '../systems/Save';
import { COLORS, designFrame, menu, panel, text } from '../systems/UI';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data: { run: RunState; victory: boolean }) {
    const { run, victory } = data;
    Save.update((p) => (p.bestRun = Math.max(p.bestRun, run.score)));
    void syncProgress();

    designFrame(this);
    this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'tiles', 0).setOrigin(0).setTileScale(PX).setScrollFactor(0).setAlpha(0.4);
    panel(this, OX + 140, 50, 680, 440);
    text(this, CX, 92, victory ? 'YOU SHAH-LL NOT PASS!' : 'THE EYE HAS PASSED', 24, victory ? COLORS.gold : COLORS.red);
    if (victory) {
      text(this, CX, 128, 'THE GULF HELD. MORDOR-A-LAGO SANK, AND SOUR-DON SAYS IT WAS ALWAYS A SUBMARINE.', 8, COLORS.green).setWordWrapWidth(620);
    } else {
      Audio.play('death');
    }
    // The defeat dirge carries over from the battle; a finished campaign gets the fanfare.
    if (victory) Music.play('clear', { once: true });
    const mins = Math.floor(run.playMs / 60000);
    const secs = Math.floor((run.playMs % 60000) / 1000);
    text(this, CX, 176, `FINAL SCORE  ${run.score}\n\nLEVEL ${run.level}   SHIPS SUNK ${run.kills}   PASSED ${run.leaks}   TIME ${mins}:${String(secs).padStart(2, '0')}`, 8);

    // The loser of the exchange gets the last word.
    const who = victory ? 'don' : 'aya';
    const portrait = this.add.sprite(OX + 176, 236, who, 0).setOrigin(0).setScale(1.5).setCrop(0, 0, 64, 56);
    const q = pickQuote(victory ? 'victory' : 'defeat', [], who);
    if (q) text(this, OX + 292, 244, `"${renderLine(q.text)}"`, 8, COLORS.text, 0).setOrigin(0, 0).setAlign('left').setWordWrapWidth(500);
    this.time.addEvent({ delay: 110, repeat: 24, callback: () => portrait.setFrame(Phaser.Math.Between(0, 2)) });
    this.time.delayedCall(3000, () => portrait.setFrame(victory ? 0 : 4));
    this.add.image(OX + 160, 482, 'seal').setOrigin(0, 1).setScale(1.5);

    const status = text(this, CX, 370, Save.session ? 'WRITING IT INTO THE ANNALS...' : 'SWEAR THE OATH TO BE WRITTEN INTO THE ANNALS', 8, COLORS.dim);
    if (Save.session) {
      void submitRun({
        score: run.score,
        startLevel: run.startLevel,
        levelReached: run.level,
        durationMs: Math.round(run.playMs),
        kills: run.kills,
      }).then((res) => status.setText(res ? `WRITTEN INTO THE ANNALS AT #${res.rank}` : 'THE SCRIBES DID NOT ANSWER (OFFLINE?)'));
    }

    menu(
      this,
      CX,
      410,
      [
        // Retry the level you fell on (no briefing deck again).
        ...(victory ? [] : [{ label: 'HOLD THE LINE AGAIN', action: () => this.scene.start('LevelIntro', { run: newRun(run.level), briefed: true }) }]),
        { label: 'BACK TO THE TITLE', action: () => this.scene.start('Title') },
      ],
      30,
    );
    this.cameras.main.fadeIn(300);
  }
}
