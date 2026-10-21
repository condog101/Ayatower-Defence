import Phaser from 'phaser';
import { DEPTH, HEIGHT, MAP_W, MAP_X, POPUP } from '../data/balance';
import { pickQuote, renderLine, type QuoteTag, type Who } from '../data/quotes';
import { Audio } from './Audio';
import { TOUCH } from './Device';
import { rand } from './Random';
import { COLORS, FONT } from './UI';

const BAR_H = TOUCH ? 30 : 22;
const BAR_X = MAP_X;
const BAR_W = MAP_W;
const BAR_Y = HEIGHT - BAR_H;
const TAG_W = TOUCH ? 186 : 124;
const TEXT_PX = TOUCH ? 12 : 8;
/** Scroll speed, px/s. */
const SPEED = TOUCH ? 130 : 105;

const VOICES: Record<Who, { tag: string; name: string; color: number }> = {
  don: { tag: '● THE EYE SEES', name: 'BIG DON', color: 0xc8102e },
  aya: { tag: '◆ GREY TURBAN', name: 'THE AYATOWER', color: 0x3d6b4a },
};

/**
 * Running commentary as a news ticker along the bottom of the map. Big Don's lines run under a red
 * THE EYE SEES tag, the Grey Turban's under a green one. Story beats get the slide-in card instead.
 */
export class Ticker {
  private parts: Phaser.GameObjects.GameObject[];
  private tag: Phaser.GameObjects.Rectangle;
  private tagText: Phaser.GameObjects.Text;
  private line: Phaser.GameObjects.Text;
  private busy = false;
  private pending: { who: Who; text: string }[] = [];
  private nextRandom: number;
  private lastContext = -Infinity;
  private recent: string[] = [];
  /** The latest line, for the pause screen. */
  last: { who: Who; text: string } | null = null;

  constructor(private scene: Phaser.Scene) {
    const s = scene;
    const left = BAR_X + TAG_W;
    const bg = s.add.rectangle(BAR_X, BAR_Y, BAR_W, BAR_H, 0x000000, 0.78).setOrigin(0);
    const rule = s.add.rectangle(BAR_X, BAR_Y, BAR_W, 1, 0xffd84a).setOrigin(0);
    this.tag = s.add.rectangle(BAR_X, BAR_Y + 1, TAG_W, BAR_H - 1, VOICES.don.color).setOrigin(0);
    this.tagText = s.add
      .text(BAR_X + TAG_W / 2, BAR_Y + BAR_H / 2 + 1, VOICES.don.tag, { fontFamily: FONT, fontSize: `${TEXT_PX}px`, color: COLORS.text })
      .setOrigin(0.5);
    this.line = s.add
      .text(BAR_X + BAR_W, BAR_Y + BAR_H / 2 + 1, '', { fontFamily: FONT, fontSize: `${TEXT_PX}px`, color: COLORS.text })
      .setOrigin(0, 0.5);
    const clip = s.make.graphics({}, false).fillRect(left + 6, BAR_Y, BAR_X + BAR_W - left - 6, BAR_H);
    this.line.setMask(clip.createGeometryMask());
    this.parts = [bg, rule, this.tag, this.tagText, this.line];
    for (const p of this.parts) (p as Phaser.GameObjects.Text).setDepth(DEPTH.hud + 5).setAlpha(0);
    this.nextRandom = s.time.now + rand(POPUP.minGapMs * 0.6, POPUP.maxGapMs * 0.8);
  }

  /** Run a line for this tag. Respects a cooldown unless forced; forced lines queue. */
  trigger(tag: QuoteTag, force = false, who?: Who) {
    const now = this.scene.time.now;
    if (!force && (this.busy || now - this.lastContext < POPUP.contextCooldownMs)) return;
    this.lastContext = now;
    const q = pickQuote(tag, this.recent, who);
    if (q) this.say(q.who, q.text);
  }

  /** Queue a specific line. */
  say(who: Who, text: string) {
    this.recent = [text, ...this.recent].slice(0, 16);
    if (this.busy) {
      if (this.pending.length < 2) this.pending.push({ who, text });
    } else this.start(who, text);
  }

  private start(who: Who, text: string) {
    this.busy = true;
    const v = VOICES[who];
    const rendered = renderLine(text);
    this.last = { who, text: rendered };
    this.tag.setFillStyle(v.color);
    this.tagText.setText(v.tag);
    this.line.setText(`${v.name}: ${rendered}`).setX(BAR_X + BAR_W);
    this.fade(1);
    Audio.play('blip', { volume: 0.25, pitch: who === 'don' ? 0.8 : 0.6 });
    const bleeps = (text.match(/\{[^}]*\}/g) ?? []).length;
    for (let k = 0; k < bleeps; k++) this.scene.time.delayedCall(700 + k * 400, () => Audio.play('bleep', { volume: 0.5 }));
  }

  private fade(to: number) {
    this.scene.tweens.killTweensOf(this.parts);
    this.scene.tweens.add({ targets: this.parts, alpha: to, duration: 250 });
  }

  update(dtMs: number) {
    const now = this.scene.time.now;
    if (!this.busy) {
      if (now >= this.nextRandom) {
        this.nextRandom = now + rand(POPUP.minGapMs, POPUP.maxGapMs);
        this.trigger('random', true);
      }
      return;
    }
    this.line.x -= (SPEED * dtMs) / 1000;
    if (this.line.x + this.line.width < BAR_X + TAG_W) {
      const next = this.pending.shift();
      if (next) this.start(next.who, next.text);
      else {
        this.busy = false;
        this.fade(0);
        this.nextRandom = Math.max(this.nextRandom, now + rand(POPUP.minGapMs * 0.5, POPUP.maxGapMs * 0.5));
      }
    }
  }
}
