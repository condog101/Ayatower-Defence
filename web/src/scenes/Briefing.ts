import Phaser from 'phaser';
import { CX, HEIGHT, OX, PX, WIDTH } from '../data/balance';
import { renderLine, type Who } from '../data/quotes';
import type { InputText, Missive } from '../data/story';
import { Audio } from '../systems/Audio';
import { byInput, TOUCH } from '../systems/Device';
import { COLORS, designFrame, FONT, onContinue, panel, text } from '../systems/UI';

const PANEL_Y = 80;
const PANEL_W = 700;
const PANEL_H = 372;

export interface BriefingData {
  cards: Missive[];
  next: string;
  nextData: object;
}

/** Don's missives are visions in the palantir (dark glass, light text); the Ayatower's are scrolls (parchment, dark ink). */
const LOOK: Record<Who, { frame: 'palantir' | 'scroll'; name: string; title: string; ink: string; dim: string; accent: string; replyRule: number }> = {
  don: { frame: 'palantir', name: 'SOUR-DON THE ORANGE', title: 'A VISION IN THE STONE', ink: COLORS.text, dim: '#9aa4c0', accent: COLORS.red, replyRule: 0x5a6d8c },
  aya: { frame: 'scroll', name: 'THE AYATOWER', title: 'A SEALED SCROLL', ink: '#2a1d10', dim: '#6b5434', accent: '#7a2a18', replyRule: 0x8a6a3a },
};

const resolve = (t: InputText) => (typeof t === 'string' ? t : byInput(t.desktop, t.touch));

/** The missives between levels: one tap or key per card, then on to `next`. */
export class BriefingScene extends Phaser.Scene {
  private data_!: BriefingData;
  private card!: Phaser.GameObjects.Container;

  constructor() {
    super('Briefing');
  }

  init(data: BriefingData) {
    this.data_ = data;
  }

  create() {
    designFrame(this);
    this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'tiles', 0).setOrigin(0).setTileScale(PX).setScrollFactor(0).setAlpha(0.5);
    const go = text(this, CX, PANEL_Y + PANEL_H + 34, byInput('PRESS ANY KEY', 'TAP'), 16, COLORS.gold);
    this.tweens.add({ targets: go, alpha: 0.2, yoyo: true, repeat: -1, duration: 500 });
    this.card = this.add.container(0, 0);
    this.cameras.main.fadeIn(250);
    this.show(0);
  }

  private show(i: number) {
    const { cards, next, nextData } = this.data_;
    if (i >= cards.length) {
      this.scene.start(next, nextData);
      return;
    }
    const m = cards[i];
    const look = LOOK[m.who];
    const dark = m.who === 'don';
    const x0 = OX + 130;
    const left = x0 + 28;
    const c = this.card;
    c.removeAll(true);
    c.add(panel(this, x0, PANEL_Y, PANEL_W, PANEL_H, look.frame));
    // Ink on parchment needs no outline; light text on the dark stone keeps one.
    const t = (x: number, y: number, s: string, size: number, color: string) =>
      text(this, x, y, s, size, color, 0).setOrigin(0, 0.5).setStroke('#000', dark ? Math.max(2, size / 4) : 0);

    // Header: the sender's portrait (Don's with the Eye glowing behind it), name and the card's kind.
    if (dark) {
      const glow = this.add.circle(left + 48, PANEL_Y + 62, 46, 0xc8102e, 0.35);
      this.tweens.add({ targets: glow, alpha: 0.1, scale: 1.08, yoyo: true, repeat: -1, duration: 700 });
      c.add(glow);
    }
    c.add(this.add.sprite(left, PANEL_Y + 22, m.who, 0).setOrigin(0).setScale(1.5).setCrop(0, 0, 64, 56));
    c.add(t(left + 112, PANEL_Y + 46, look.name, 16, dark ? COLORS.gold : look.ink));
    c.add(t(left + 112, PANEL_Y + 74, look.title, 8, look.accent));

    const raw = resolve(m.text);
    const body = this.add
      .text(left, PANEL_Y + 116, renderLine(raw), {
        fontFamily: FONT,
        fontSize: TOUCH ? '14px' : '10px',
        color: look.ink,
        lineSpacing: 6,
        wordWrap: { width: PANEL_W - 56 },
      })
      .setOrigin(0);
    c.add(body);

    const y = body.y + body.height + 16;
    if (m.reply) {
      c.add(this.add.rectangle(left, y - 6, PANEL_W - 56, 1, look.replyRule).setOrigin(0));
      c.add(this.add.sprite(left, y, m.reply.who, 0).setOrigin(0).setCrop(0, 0, 64, 56));
      c.add(t(left + 76, y + 8, LOOK[m.reply.who].name, 8, look.accent));
      c.add(
        this.add
          .text(left + 76, y + 22, renderLine(m.reply.text), {
            fontFamily: FONT,
            fontSize: TOUCH ? '12px' : '8px',
            color: look.ink,
            lineSpacing: 6,
            wordWrap: { width: PANEL_W - 150 },
          })
          .setOrigin(0),
      );
    }

    const footY = PANEL_Y + PANEL_H - 26;
    if (!dark) c.add(this.add.image(x0 + PANEL_W - 70, footY - 6, 'seal').setScale(1.25));
    if (m.seal) c.add(t(left, footY, m.seal, 8, look.dim));
    c.add(t(x0 + PANEL_W - (dark ? 28 : 120), footY, `${i + 1}/${cards.length}`, 8, look.dim).setOrigin(1, 0.5));

    Audio.play('vision');
    const bleeps = (raw.match(/\{[^}]*\}/g) ?? []).length;
    for (let k = 0; k < bleeps; k++) this.time.delayedCall(300 + k * 260, () => Audio.play('bleep', { volume: 0.6 }));
    onContinue(this, () => this.show(i + 1), 250);
  }
}
