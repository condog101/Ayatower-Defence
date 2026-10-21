import Phaser from 'phaser';
import { HEIGHT, WIDTH } from './data/balance';
import { LAYOUT_CHANGED, measure, watch } from './systems/Layout';
import { BootScene } from './scenes/Boot';
import { BriefingScene } from './scenes/Briefing';
import { GameScene } from './scenes/Game';
import { GameOverScene } from './scenes/GameOver';
import { LeaderboardScene } from './scenes/Leaderboard';
import { LevelClearScene } from './scenes/LevelClear';
import { LevelIntroScene } from './scenes/LevelIntro';
import { LoginScene } from './scenes/Login';
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
  // Lay out for this screen before the canvas exists; the canvas then always has the screen's aspect.
  measure();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#0b1a2e',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // A drag from the shop plus a stray second finger.
    input: { activePointers: 3 },
    scene: [BootScene, TitleScene, LoginScene, BriefingScene, LevelIntroScene, GameScene, LevelClearScene, GameOverScene, LeaderboardScene],
  });
  watch(game);
  // Menus simply rebuild for the new layout; the Game scene rebuilds its views around the same sim.
  game.events.on(LAYOUT_CHANGED, () => {
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key === 'Boot') continue;
      scene.events.emit(LAYOUT_CHANGED);
    }
  });
  // touchstart doesn't count as a user gesture for audio on mobile; these do.
  for (const ev of ['pointerup', 'touchend', 'keydown']) window.addEventListener(ev, () => Audio.unlock());
  if (import.meta.env.DEV) Object.assign(window, { game, Music });
}

void start();
