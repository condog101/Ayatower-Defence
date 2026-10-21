import Phaser from 'phaser';
import { LEVEL_COUNT } from '../../../shared/progress';
import { HEIGHT, PX, WIDTH } from '../data/balance';
import { LEVELS } from '../data/levels';
import { api } from '../net/api';
import { Audio } from '../systems/Audio';
import { byInput, TOUCH } from '../systems/Device';
import { Music } from '../systems/Music';
import { newRun } from '../systems/Run';
import { Save } from '../systems/Save';
import { COLORS, menu, panel, text } from '../systems/UI';

type View = 'main' | 'levels' | 'settings' | 'credits';

const SEA_Y = 300;
const MENU_X = WIDTH - 250;

export class TitleScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private currentMenu: { destroy(): void } | null = null;
  private water!: Phaser.GameObjects.TileSprite;
  private fleet: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super('Title');
  }

  create(data: { view?: View }) {
    this.cameras.main.setBackgroundColor('#0b0a08');
    // Dusk sky over the Strait: the logo top-left, the fleet sailing past, the menu on the right.
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a0f2e, 0x1a0f2e, 0x7a3c2e, 0x7a3c2e, 1).fillRect(0, 0, WIDTH, SEA_Y);
    this.water = this.add.tileSprite(0, SEA_Y, WIDTH, HEIGHT - SEA_Y, 'tiles', 0).setOrigin(0).setTileScale(PX);
    this.add.rectangle(0, SEA_Y, WIDTH, 2, 0xb88c1e).setOrigin(0);
    this.fleet = [];
    const ships: [string, number, number][] = [['carrier', 360, 0.5], ['burke', 400, 0.7], ['frigate', 430, 0.8], ['rhib', 460, 1.1]];
    ships.forEach(([key, y, sp], i) => {
      const s = this.add.sprite(-120 - i * 160, y, key, 0).setScale(PX).play(key);
      this.tweens.add({ targets: s, x: WIDTH + 200, duration: 30000 / sp, repeat: -1, delay: i * 1500 });
      this.fleet.push(s);
    });
    this.add.image(24, 16, 'title_logo').setOrigin(0).setScale(1.5);
    this.add.sprite(36, 196, 'aya', 4).setOrigin(0).setScale(1.25).setCrop(0, 0, 64, 56);
    this.add.sprite(136, 196, 'don', 2).setOrigin(0).setScale(1.25).setCrop(0, 0, 64, 56);
    text(this, 76, 280, 'THE GREY TURBAN', 8, COLORS.gold);
    text(this, 176, 280, 'VS BIG DON', 8, COLORS.red);
    this.add.image(WIDTH - 20, HEIGHT - 20, 'advisory').setOrigin(1).setScale(2);
    this.layer = this.add.container(0, 0);
    this.cameras.main.fadeIn(300);
    Music.play('title');
    this.show(data?.view ?? 'main');
  }

  update(_t: number, dt: number) {
    this.water.tilePositionX += dt * 0.01;
  }

  private clear() {
    this.currentMenu?.destroy();
    this.currentMenu = null;
    this.layer.removeAll(true);
  }

  private show(view: View) {
    this.clear();
    const p = Save.progress;
    const who = Save.session ? `GUARD: ${Save.session.callsign}` : 'NOT IN THE GUARD (PROGRESS SAVED ON THIS DEVICE)';
    this.layer.add(text(this, WIDTH / 2, HEIGHT - 12, who, 8, COLORS.dim));
    if (view === 'main') {
      const cont = p.highestLevel;
      this.layer.add(panel(this, MENU_X - 130, 20, 360, 280));
      this.currentMenu = menu(this, MENU_X + 50, 56, [
        { label: cont > 1 ? `CONTINUE - LEVEL ${cont}` : 'DEFEND THE STRAIT', action: () => this.start(cont) },
        { label: 'THE STRAIT', action: () => this.show('levels') },
        { label: 'THE CHARTS', action: () => this.scene.start('Leaderboard') },
        { label: Save.session ? 'LEAVE THE GUARD' : 'JOIN THE GUARD', action: () => this.auth() },
        { label: 'WAR COUNCIL', action: () => this.show('settings') },
        { label: 'SCROLLS', action: () => this.show('credits') },
      ], 36);
      this.layer.add(
        text(
          this,
          MENU_X + 50,
          274,
          byInput('CLICK A CARD, CLICK THE MAP. SPACE STARTS A WAVE.', 'DRAG A CARD ONTO THE MAP.'),
          8,
          COLORS.dim,
        ),
      );
    } else if (view === 'levels') {
      this.layer.add(panel(this, WIDTH / 2 - 330, 40, 660, 440));
      this.layer.add(text(this, WIDTH / 2, 66, 'THE STRAIT', 16, COLORS.gold));
      const items = LEVELS.map((l) => {
        const best = p.levelBest[String(l.n)];
        const unlocked = l.n <= p.highestLevel;
        return {
          label: `${String(l.n).padStart(2, '0')} ${l.name.padEnd(26, ' ')} ${unlocked ? (best ? String(best).padStart(6, ' ') : '     -') : 'LOCKED'}`,
          action: () => this.start(l.n),
          enabled: unlocked,
        };
      });
      items.push({ label: 'BACK', action: () => this.show('main'), enabled: true });
      this.currentMenu = menu(this, WIDTH / 2, 104, items, 32);
    } else if (view === 'settings') {
      const s = p.settings;
      const vol = Math.round(s.sfx * 10);
      const mus = Math.round(s.music * 10);
      const bar = (n: number) => `< ${'#'.repeat(n).padEnd(10, '.')} >`;
      this.layer.add(panel(this, WIDTH / 2 - 320, 150, 640, 230));
      this.layer.add(text(this, WIDTH / 2, 176, 'WAR COUNCIL', 16, COLORS.gold));
      this.currentMenu = menu(this, WIDTH / 2, 220, [
        { label: `SFX VOLUME    ${bar(vol)}`, action: () => this.setVolume((vol + 2) % 12) },
        { label: `MUSIC VOLUME  ${bar(mus)}`, action: () => this.setMusicVolume((mus + 2) % 12) },
        { label: `SCREEN SHAKE  ${s.shake ? 'ON' : 'OFF'}`, action: () => this.toggleShake() },
        { label: 'BACK', action: () => this.show('main') },
      ]);
      this.layer.add(text(this, WIDTH / 2, 350, byInput('ENTER/CLICK TO CHANGE', 'TAP TO CHANGE'), 8, COLORS.dim));
    } else {
      this.layer.add(panel(this, WIDTH / 2 - 320, 60, 640, 400));
      this.layer.add(
        text(
          this,
          WIDTH / 2,
          230,
          'AYATOWER DEFENCE: YOU SHAH-LL NOT PASS!\n\nA GAME BY CONNOR\nCODE: CLAUDE   ART: GENERATED + LIBRESPRITE\nFONT: PRESS START 2P (OFL)   SFX + MUSIC: ZZFX\n\nBIG DON IS A PARODY OF DONALD TRUMP.\nTHE GREY TURBAN IS A CARICATURE OF AN AYATOLLAH.\nEVERY LINE IS FICTIONAL SATIRE, NOT A REAL QUOTE.\nTHE SHIPS, PLANES AND WEAPONS ARE LOOSELY BASED ON\nREAL ONES; THEIR NUMBERS ARE GAME NUMBERS.\nNO WIZARDS WERE HARMED. SOME WERE MILDLY INCONVENIENCED.',
          8,
          COLORS.text,
        ),
      );
      this.currentMenu = menu(this, WIDTH / 2, 420, [{ label: 'BACK', action: () => this.show('main') }]);
    }
  }

  private setVolume(step: number) {
    const v = Math.min(10, step) / 10;
    Save.update((p) => (p.settings.sfx = v));
    Audio.setVolume(v);
    Audio.play('select');
    this.show('settings');
  }

  private setMusicVolume(step: number) {
    const v = Math.min(10, step) / 10;
    Save.update((p) => (p.settings.music = v));
    Music.setVolume(v);
    Audio.play('select');
    this.show('settings');
  }

  private toggleShake() {
    Save.update((p) => (p.settings.shake = !p.settings.shake));
    this.show('settings');
  }

  private auth() {
    if (Save.session) {
      void api.logout().catch(() => undefined);
      Save.setSession(null);
      this.show('main');
    } else {
      this.scene.start('Login');
    }
  }

  private start(level: number) {
    Audio.unlock();
    if (TOUCH) this.goFullscreen();
    const lvl = Math.min(level, LEVEL_COUNT, LEVELS.length);
    this.cameras.main.fadeOut(250);
    this.time.delayedCall(260, () => this.scene.start('LevelIntro', { run: newRun(lvl) }));
  }

  /** Android goes fullscreen in landscape; iOS has no API and skips it. */
  private goFullscreen() {
    const scale = this.scale;
    if (!document.fullscreenEnabled || scale.isFullscreen) return;
    // The menu activates on touchstart, which doesn't grant user activation; the finger lifting does.
    window.addEventListener(
      'pointerup',
      () => {
        try {
          scale.startFullscreen();
          const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
          void orientation.lock?.('landscape').catch(() => undefined);
        } catch {
          // stay windowed
        }
      },
      { once: true },
    );
  }
}
