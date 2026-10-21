import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../data/balance';
import { COLORS, text } from '../systems/UI';

/** Placeholder title while the game is scaffolded. */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    text(this, WIDTH / 2, HEIGHT / 2 - 30, 'AYATOWER DEFENCE', 24, COLORS.gold);
    text(this, WIDTH / 2, HEIGHT / 2 + 20, 'YOU SHAH-LL NOT PASS!', 16, COLORS.text);
    text(this, WIDTH / 2, HEIGHT / 2 + 70, 'UNDER CONSTRUCTION', 8, COLORS.dim);
  }
}
