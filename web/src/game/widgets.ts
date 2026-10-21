import Phaser from 'phaser';
import { DEPTH, SLOP } from '../data/balance';
import { Audio } from '../systems/Audio';
import { TOUCH } from '../systems/Device';
import { COLORS, FONT, uiSize } from '../systems/UI';

export interface Button {
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  enabled: boolean;
  setEnabled(on: boolean): Button;
  setLabel(s: string): Button;
  setHighlight(on: boolean): Button;
  setVisible(on: boolean): Button;
}

/** A flat pixel button. Fires on pointerdown (snappy on touch); the hit area gets SLOP on touch. */
export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  size = 8,
  depth = DEPTH.hud,
): Button {
  const bg = scene.add.rectangle(0, 0, w, h, 0x141210, 0.95).setOrigin(0).setStrokeStyle(2, 0x8c8577);
  const text = scene.add
    .text(w / 2, h / 2 + 1, label, { fontFamily: FONT, fontSize: `${uiSize(size)}px`, color: COLORS.text, align: 'center', lineSpacing: 4 })
    .setOrigin(0.5);
  const root = scene.add.container(x, y, [bg, text]).setDepth(depth);
  const pad = TOUCH ? SLOP : 0;
  bg.setInteractive(new Phaser.Geom.Rectangle(-pad, -pad, w + 2 * pad, h + 2 * pad), Phaser.Geom.Rectangle.Contains);
  let highlight = false;
  const b: Button = {
    root,
    bg,
    label: text,
    enabled: true,
    setEnabled(on) {
      b.enabled = on;
      text.setColor(on ? (highlight ? COLORS.gold : COLORS.text) : '#5a5448');
      bg.setStrokeStyle(2, on ? (highlight ? 0xffd84a : 0x8c8577) : 0x3a362e);
      return b;
    },
    setLabel(s) {
      if (text.text !== s) text.setText(s);
      return b;
    },
    setHighlight(on) {
      highlight = on;
      return b.setEnabled(b.enabled);
    },
    setVisible(on) {
      root.setVisible(on);
      if (on) bg.setInteractive();
      else bg.disableInteractive();
      return b;
    },
  };
  bg.on('pointerover', () => b.enabled && bg.setStrokeStyle(2, 0xffd84a));
  bg.on('pointerout', () => b.setEnabled(b.enabled));
  bg.on('pointerdown', (p: Phaser.Input.Pointer) => {
    if (!b.enabled || p.rightButtonDown()) return;
    Audio.unlock();
    Audio.play('select');
    onClick();
  });
  return b;
}

/** Small left-aligned text. */
export function label(scene: Phaser.Scene, x: number, y: number, s: string, size = 8, color = COLORS.text, depth = DEPTH.hud) {
  return scene.add
    .text(x, y, s, { fontFamily: FONT, fontSize: `${uiSize(size)}px`, color, lineSpacing: 4 })
    .setOrigin(0, 0.5)
    .setDepth(depth);
}
