import Phaser from 'phaser';
import { DEPTH, MAP_W, MAP_X, MAP_Y, POPUP, WIDTH } from '../data/balance';
import { isBleeped, renderLine, type Who } from '../data/quotes';
import { Audio } from './Audio';
import { rand } from './Random';
import { COLORS, FONT, panel, text } from './UI';

// Desktop only: on touch, story moments freeze the game and show full-screen instead (Game.openStory).
const W = 440;
const H = 156;

/** Who is on the line: portrait sheet (frames 0 rest, 1-2 talk, 3 blink, 4 wrath for Don, wizardry for the Ayatower) and banner. */
export interface Speaker {
  who: Who;
  name: string;
  key: string;
  banner: string;
  color: string;
}

export const SPEAKERS: Record<Who, Speaker> = {
  don: { who: 'don', name: 'SOUR-DON', key: 'don', banner: '◉ A VISION IN THE STONE', color: COLORS.red },
  aya: { who: 'aya', name: 'THE AYATOWER', key: 'aya', banner: '◆ THE GREY TURBAN SPEAKS', color: COLORS.green },
};

/** A line as it was presented: who said it, the frame they rest on, the rendered text. */
export interface Shown {
  speaker: Speaker;
  frame: number;
  text: string;
}

/** A portrait card slides in and types out a line; the other side can answer after it. */
export class Popups {
  private root: Phaser.GameObjects.Container;
  private portrait: Phaser.GameObjects.Sprite;
  private body: Phaser.GameObjects.Text;
  private banner: Phaser.GameObjects.Text;
  private busy = false;
  private typing = false;
  private full = '';
  private shown = 0;
  private typeAcc = 0;
  private mouthAcc = 0;
  private blinkAt = 0;
  private restFrame = 0;
  private speaker: Speaker = SPEAKERS.aya;
  private hideTimer: Phaser.Time.TimerEvent | null = null;
  private onDone: (() => void) | null = null;
  private last: Shown | null = null;
  private replyTimer: Phaser.Time.TimerEvent | null = null;

  /** Where the card rests: the top-right corner of the map (read from the current layout). */
  private restX: number;

  constructor(private scene: Phaser.Scene) {
    const s = scene;
    this.restX = MAP_X + MAP_W - W - 8;
    this.root = s.add.container(WIDTH + 10, MAP_Y + 8).setDepth(DEPTH.popup);
    this.root.add(panel(s, 0, 0, W, H));
    this.banner = text(s, 14, 18, '', 8, COLORS.red, 0).setOrigin(0, 0.5);
    this.root.add(this.banner);
    this.root.add(s.add.rectangle(14, 30, 132, 116, 0x000000).setOrigin(0));
    this.portrait = s.add.sprite(16, 32, 'aya', 0).setOrigin(0).setScale(2);
    this.portrait.setCrop(0, 0, 64, 56);
    this.root.add(this.portrait);
    this.body = s.add
      .text(158, 34, '', { fontFamily: FONT, fontSize: '8px', color: COLORS.text, lineSpacing: 6, wordWrap: { width: W - 172 } })
      .setOrigin(0);
    this.root.add(this.body);
  }

  /** `who` takes the line, cutting off whatever is showing; the other side answers with `reply` after a beat. */
  say(who: Who, line: string, reply?: string, replyDelayMs = 2500, fired = false) {
    this.cutOff();
    this.replyTimer?.remove();
    this.replyTimer = null;
    this.present(renderLine(line), SPEAKERS[who], fired ? 4 : 0);
    if (reply) {
      const other: Who = who === 'aya' ? 'don' : 'aya';
      this.onDone = () => {
        this.replyTimer = this.scene.time.delayedCall(replyDelayMs, () => {
          this.replyTimer = null;
          this.say(other, reply);
        });
      };
    }
  }

  private cutOff() {
    this.hideTimer?.remove();
    this.scene.tweens.killTweensOf([this.root, this.banner]);
    this.banner.setAlpha(1);
  }

  get lastLine(): Shown | null {
    return this.last;
  }

  setHidden(on: boolean) {
    this.root.setVisible(!on);
  }

  private present(fullText: string, speaker: Speaker, restFrame: number) {
    this.busy = true;
    this.onDone = null;
    this.speaker = speaker;
    this.full = fullText;
    this.restFrame = restFrame;
    this.last = { speaker, frame: restFrame, text: fullText };
    this.portrait.setTexture(speaker.key, restFrame);
    this.banner.setText(speaker.banner).setColor(speaker.color);
    this.shown = 0;
    this.typeAcc = 0;
    this.body.setText('');
    this.typing = true;
    Audio.play('vision');
    this.scene.tweens.add({ targets: this.root, x: this.restX, duration: 350, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: this.banner, alpha: 0.3, yoyo: true, repeat: 5, duration: 180 });
  }

  private hide() {
    this.hideTimer = null;
    this.scene.tweens.add({
      targets: this.root,
      x: WIDTH + 10,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => (this.busy = false),
    });
  }

  update(dtMs: number) {
    const now = this.scene.time.now;
    if (!this.busy) return;
    if (this.typing) {
      const msPerChar = POPUP.typeMs / Math.max(40, this.full.length);
      this.typeAcc += dtMs;
      while (this.typeAcc >= msPerChar && this.shown < this.full.length) {
        this.typeAcc -= msPerChar;
        this.shown++;
        if (isBleeped(this.full, this.shown - 1)) Audio.play('bleep', { volume: 0.6, minGapMs: 200 });
        else if (this.shown % 3 === 0) Audio.play('blip', { volume: 0.25, pitch: (this.speaker.who === 'don' ? 0.7 : 0.5) + Math.random() * 0.3, minGapMs: 20 });
      }
      this.body.setText(this.full.slice(0, this.shown));
      this.mouthAcc += dtMs;
      if (this.mouthAcc > 90) {
        this.mouthAcc = 0;
        const ch = this.full[this.shown - 1] ?? ' ';
        this.portrait.setFrame(/[\s.,!?]/.test(ch) ? this.restFrame : Phaser.Math.Between(1, 2));
      }
      if (this.shown >= this.full.length) {
        this.typing = false;
        this.portrait.setFrame(this.restFrame);
        this.hideTimer = this.scene.time.delayedCall(POPUP.holdMs, () => this.hide());
        const done = this.onDone;
        this.onDone = null;
        done?.();
      }
    } else if (this.restFrame === 0 && now > this.blinkAt) {
      this.blinkAt = now + rand(1500, 3000);
      this.portrait.setFrame(3);
      this.scene.time.delayedCall(120, () => this.portrait.setFrame(this.restFrame));
    }
  }
}
