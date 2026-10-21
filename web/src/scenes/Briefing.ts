import Phaser from 'phaser';
import { CX, HEIGHT, OX, PX, WIDTH } from '../data/balance';
import { renderLine, type Who } from '../data/quotes';
import type { InputText, Tweet } from '../data/story';
import { Audio } from '../systems/Audio';
import { byInput, TOUCH } from '../systems/Device';
import { COLORS, designFrame, FONT, onContinue, panel, text } from '../systems/UI';

// Set in create() from the current layout.
let PANEL_X = 0;
let LEFT = 0;
const PANEL_Y = 80;
const PANEL_W = 700;
const PANEL_H = 372;

export interface BriefingData {
  cards: Tweet[];
  next: string;
  nextData: object;
}

const PROFILE: Record<Who, { key: string; name: string; handle: string; color: string }> = {
  don: { key: 'don', name: 'BIG DON', handle: '@BigDon · DECREE · 3:12 AM', color: COLORS.gold },
  aya: { key: 'aya', name: 'THE AYATOWER', handle: '@GreyTurban · after evening prayers', color: COLORS.green },
};

const resolve = (t: InputText) => (typeof t === 'string' ? t : byInput(t.desktop, t.touch));

/** The posts between levels: a deck of cards, one tap or key per card, then on to `next`. */
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
    PANEL_X = OX + 130;
    LEFT = PANEL_X + 24;
    designFrame(this);
    this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'tiles', 0).setOrigin(0).setTileScale(PX).setScrollFactor(0).setAlpha(0.5);
    panel(this, PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
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
    const tw = cards[i];
    const prof = PROFILE[tw.who];
    const c = this.card;
    c.removeAll(true);

    c.add(this.add.sprite(LEFT, PANEL_Y + 20, prof.key, tw.who === 'don' ? 0 : 0).setOrigin(0).setScale(1.5).setCrop(0, 0, 64, 56));
    c.add(text(this, LEFT + 112, PANEL_Y + 44, prof.name, 16, prof.color, 0).setOrigin(0, 0.5));
    c.add(text(this, LEFT + 112, PANEL_Y + 72, prof.handle, 8, COLORS.dim, 0).setOrigin(0, 0.5));

    const raw = resolve(tw.text);
    const body = this.add
      .text(LEFT, PANEL_Y + 116, renderLine(raw), {
        fontFamily: FONT,
        fontSize: TOUCH ? '14px' : '10px',
        color: COLORS.text,
        lineSpacing: 6,
        wordWrap: { width: PANEL_W - 48 },
      })
      .setOrigin(0);
    c.add(body);

    const y = body.y + body.height + 16;
    if (tw.reply) {
      const rp = PROFILE[tw.reply.who];
      c.add(this.add.rectangle(LEFT, y - 6, PANEL_W - 48, 1, 0x5a6d8c).setOrigin(0));
      c.add(this.add.sprite(LEFT, y, rp.key, 0).setOrigin(0).setCrop(0, 0, 64, 56));
      c.add(text(this, LEFT + 76, y + 8, rp.name, 8, rp.color, 0).setOrigin(0, 0.5));
      c.add(
        this.add
          .text(LEFT + 76, y + 22, renderLine(tw.reply.text), {
            fontFamily: FONT,
            fontSize: TOUCH ? '12px' : '8px',
            color: COLORS.text,
            lineSpacing: 6,
            wordWrap: { width: PANEL_W - 140 },
          })
          .setOrigin(0),
      );
    }

    const footY = PANEL_Y + PANEL_H - 22;
    if (tw.stats) c.add(text(this, LEFT, footY, tw.stats, 8, COLORS.dim, 0).setOrigin(0, 0.5));
    c.add(text(this, PANEL_X + PANEL_W - 24, footY, `${i + 1}/${cards.length}`, 8, COLORS.dim, 0).setOrigin(1, 0.5));

    Audio.play('incoming');
    const bleeps = (raw.match(/\{[^}]*\}/g) ?? []).length;
    for (let k = 0; k < bleeps; k++) this.time.delayedCall(300 + k * 260, () => Audio.play('bleep', { volume: 0.6 }));
    onContinue(this, () => this.show(i + 1), 250);
  }
}
