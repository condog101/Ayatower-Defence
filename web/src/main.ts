import Phaser from 'phaser';
import { HEIGHT, WIDTH } from './data/balance';
import { BootScene } from './scenes/Boot';
import { TitleScene } from './scenes/Title';
import { Audio } from './systems/Audio';
import { Music } from './systems/Music';

async function start() {
  // Text is rendered to canvas, so the pixel font must be ready before the first frame.
  try {
    await document.fonts.load('16px "Press Start 2P"');
  } catch {
    // fall back to the browser's monospace
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#0b1a2e',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 3 },
    scene: [BootScene, TitleScene],
  });
  // touchstart doesn't count as a user gesture for audio on mobile; these do.
  for (const ev of ['pointerup', 'touchend', 'keydown']) window.addEventListener(ev, () => Audio.unlock());
  if (import.meta.env.DEV) Object.assign(window, { game, Music });
}

void start();
