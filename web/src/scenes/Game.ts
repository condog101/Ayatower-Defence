import Phaser from 'phaser';
import { levelClearBonus } from '../../../shared/scoring';
import { DEPTH, HEIGHT, MAP_H, MAP_W, MAP_X, MAP_Y, OX, SIDE_X, WIDTH } from '../data/balance';
import { ENEMIES } from '../data/enemies';
import { getLevel } from '../data/levels';
import { TOWERS } from '../data/towers';
import { Abilities, ABILITY_Y } from '../game/Abilities';
import { Dialogue } from '../game/Dialogue';
import { EnemyView } from '../game/EnemyView';
import { HUD } from '../game/HUD';
import { Input } from '../game/Input';
import { MapView } from '../game/MapView';
import { Placement } from '../game/Placement';
import { ProjectileView } from '../game/ProjectileView';
import { SHOP_BOTTOM, Shop } from '../game/Shop';
import { TowerPanel } from '../game/TowerPanel';
import { TowerView } from '../game/TowerView';
import { button, type Button } from '../game/widgets';
import { FATWA, STAFF } from '../sim/abilities';
import { Sim } from '../sim/sim';
import type { AbilityKey, LevelDef, SimEvent, Tower, TowerKey } from '../sim/types';
import { Audio, type Sfx } from '../systems/Audio';
import { byInput, TOUCH } from '../systems/Device';
import { Fx } from '../systems/Fx';
import { Music } from '../systems/Music';
import { Popups, SPEAKERS, type Shown } from '../systems/Popups';
import type { RunState } from '../systems/Run';
import { Ticker } from '../systems/Ticker';
import { COLORS, FONT, menu, text } from '../systems/UI';

export interface LevelResult {
  run: RunState;
  levelScore: number;
  killScore: number;
  waveScore: number;
  clearBonus: number;
  livesLeft: number;
  leaked: number;
  towersBuilt: number;
  wavesCleared: number;
}

const TICK_MS = 1000 / 60;
/** At most this many sim ticks per rendered frame (3x speed on a slow frame). */
const MAX_TICKS_PER_FRAME = 12;

const SHOT_SFX: Record<string, Sfx> = {
  p_bullet: 'shoot',
  p_rocket: 'rocket',
  p_missile: 'missile',
  p_shahed: 'rocket',
  p_torpedo: 'torpedo',
  p_mine: 'mine',
  p_boat: 'torpedo',
  p_sam: 'missile',
};

export class GameScene extends Phaser.Scene {
  private run!: RunState;
  private level!: LevelDef;
  private sim!: Sim;
  private map!: MapView;
  private enemyView!: EnemyView;
  private towerView!: TowerView;
  private projView!: ProjectileView;
  private fx!: Fx;
  private hud!: HUD;
  private shop!: Shop;
  private panel!: TowerPanel;
  private abilities!: Abilities;
  private placement!: Placement;
  private input_!: Input;
  private popups!: Popups;
  private ticker!: Ticker;
  private dialogue!: Dialogue;
  private startBtn!: Button;
  private info!: Phaser.GameObjects.Text;
  private aim!: Phaser.GameObjects.Graphics;
  private speed = 1;
  private acc = 0;
  private paused = false;
  private ended = false;
  private pauseUi: Phaser.GameObjects.Container | null = null;
  private pauseMenu: { destroy(): void } | null = null;
  private story: Phaser.GameObjects.Container | null = null;
  private lastStory: Shown | null = null;
  private shift!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('Game');
  }

  init(data: { run: RunState }) {
    this.run = data.run;
    this.level = getLevel(this.run.level);
    this.sim = new Sim(this.level, TOWERS, ENEMIES);
    this.speed = 1;
    this.acc = 0;
    this.paused = false;
    this.ended = false;
    this.pauseUi = null;
    this.pauseMenu = null;
    this.story = null;
    this.lastStory = null;
  }

  create() {
    const sim = this.sim;
    this.map = new MapView(this, sim.grid, sim.lane.cells);
    this.projView = new ProjectileView(this);
    this.towerView = new TowerView(this);
    this.enemyView = new EnemyView(this);
    this.fx = new Fx(this);
    this.aim = this.add.graphics().setDepth(DEPTH.ghost);
    this.hud = new HUD(this, { speed: () => this.cycleSpeed(), auto: () => this.toggleAuto(), pause: () => this.togglePause() });
    this.shop = new Shop(this, sim, { down: (k, p) => this.cardDown(k, p) });
    this.panel = new TowerPanel(this, sim, {
      upgrade: (t) => this.upgrade(t),
      sell: (t) => this.sell(t),
      target: (t) => this.retarget(t),
      close: () => this.deselect(),
    });
    this.abilities = new Abilities(this, sim, (k) => this.arm(k));
    this.placement = new Placement(this, sim, () => this.commit(), () => this.cancelPlacement());
    this.startBtn = button(this, SIDE_X + 3, SHOP_BOTTOM + 4, 154, 36, '', () => this.startWave(), 8);
    this.info = this.add
      .text(SIDE_X + 6, ABILITY_Y + 58, '', { fontFamily: FONT, fontSize: '8px', color: COLORS.dim, lineSpacing: 3, wordWrap: { width: 150 } })
      .setOrigin(0)
      .setDepth(DEPTH.hud);
    this.input_ = new Input(this, {
      mapDown: (x, y, right) => this.mapDown(x, y, right),
      move: (x, y, dragging) => this.pointerMove(x, y, dragging),
      dragEnd: (x, y) => this.dragEnd(x, y),
      cardTap: () => undefined,
    });
    this.popups = new Popups(this);
    this.ticker = new Ticker(this);
    this.dialogue = new Dialogue(this, sim, this.run, this.ticker, { story: (aya, don) => this.storyMoment(aya, don) });
    this.dialogue.start();
    this.keys();

    // Touch only: a backgrounded phone comes back to the pause screen.
    const onHidden = () => {
      if (TOUCH && !this.paused && !this.ended) this.togglePause();
    };
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden));

    Music.play('game');
    this.cameras.main.fadeIn(400);
    const banner = text(this, MAP_X + MAP_W / 2, MAP_Y + MAP_H / 2 - 40, `LEVEL ${this.level.n}\n${this.level.name}`, 16, COLORS.gold).setDepth(DEPTH.hud);
    this.tweens.add({ targets: banner, alpha: 0, delay: 1600, duration: 600, onComplete: () => banner.destroy() });
    this.setInfo();
  }

  private keys() {
    const kb = this.input.keyboard!;
    this.shift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    kb.on('keydown', (e: KeyboardEvent) => {
      if (this.ended || e.repeat) return;
      if (this.story) return;
      if (this.paused) {
        if (e.code === 'Escape' || e.code === 'KeyP') this.togglePause();
        else if (e.code === 'KeyQ') this.quitToTitle();
        return;
      }
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.startWave();
          break;
        case 'KeyF':
          this.cycleSpeed();
          break;
        case 'KeyA':
          this.toggleAuto();
          break;
        case 'KeyP':
          this.togglePause();
          break;
        case 'Escape':
          if (this.placement.active) this.cancelPlacement();
          else if (this.abilities.armed) this.disarm();
          else if (this.panel.tower) this.deselect();
          else this.togglePause();
          break;
        case 'Digit1':
          this.arm('staff');
          break;
        case 'Digit2':
          this.arm('fatwa');
          break;
        case 'KeyU':
          if (this.panel.tower) this.upgrade(this.panel.tower);
          break;
        case 'KeyX':
          if (this.panel.tower) this.sell(this.panel.tower);
          break;
        case 'KeyT':
          if (this.panel.tower) this.retarget(this.panel.tower);
          break;
      }
    });
  }

  // ---- Controls ----

  private startWave() {
    if (this.sim.startWave()) Audio.unlock();
  }

  private cycleSpeed() {
    this.speed = (this.speed % 3) + 1;
    if (this.speed === 3) this.dialogue.speed3();
  }

  private toggleAuto() {
    this.sim.setAuto(!this.sim.auto);
    if (this.sim.auto && this.sim.phase === 'build' && this.sim.wave === 0) this.sim.startWave();
  }

  private cardDown(key: TowerKey, p: Phaser.Input.Pointer) {
    if (this.paused || this.ended) return;
    this.disarm();
    this.deselect();
    if (this.placement.key === key && !TOUCH) {
      this.cancelPlacement();
      return;
    }
    this.placement.begin(key, TOUCH ? 'tap' : 'hover');
    this.input_.trackCard(p);
    this.map.showPlacement(TOWERS[key], (c, r) => !!this.sim.towerAt(c, r));
    this.shop.selected = key;
    this.shop.showTip(key);
    this.setInfo();
  }

  private pointerMove(x: number, y: number, dragging: boolean) {
    if (this.placement.active) {
      if (dragging && this.placement.mode !== 'drag') this.placement.mode = 'drag';
      if (dragging || this.placement.mode === 'hover') this.placement.moveTo(x, y);
    }
    this.drawAim(x, y);
  }

  private dragEnd(x: number, y: number) {
    if (!this.placement.active) return;
    this.placement.moveTo(x, y);
    if (this.placement.valid()) this.commit(false);
    else this.cancelPlacement();
  }

  private mapDown(x: number, y: number, right: boolean) {
    if (this.paused || this.ended) return;
    if (right) {
      if (this.placement.active) this.cancelPlacement();
      else if (this.abilities.armed) this.disarm();
      else this.deselect();
      return;
    }
    if (this.abilities.armed) {
      const k = this.abilities.armed;
      if (this.sim.ability(k, x - MAP_X, y - MAP_Y)) this.disarm();
      else if (k === 'fatwa') this.fx.floatText(x, y - 10, 'NO TARGET', COLORS.red);
      return;
    }
    if (this.placement.active) {
      if (this.placement.mode === 'drag') return;
      this.placement.moveTo(x, y);
      if (this.placement.mode === 'hover') {
        if (this.placement.valid()) this.commit(this.shift.isDown);
        else Audio.play('blip', { pitch: 0.5 });
      }
      return;
    }
    const cell = Placement.cellAt(x, y);
    const t = cell ? this.sim.towerAt(cell[0], cell[1]) : undefined;
    if (t) this.select(t);
    else this.deselect();
  }

  private commit(keep = false) {
    const cell = this.placement.cell;
    const key = this.placement.key;
    if (!cell || !key) return;
    const t = this.sim.place(key, cell[0], cell[1]);
    if (!t) return;
    if (keep && this.sim.cash >= TOWERS[key].tiers[0].cost) {
      this.map.showPlacement(TOWERS[key], (c, r) => !!this.sim.towerAt(c, r));
      return;
    }
    this.cancelPlacement();
  }

  private cancelPlacement() {
    this.placement.end();
    this.map.showPlacement(null, () => false);
    this.shop.selected = null;
    this.shop.showTip(null);
    this.setInfo();
  }

  private select(t: Tower) {
    this.cancelPlacement();
    this.towerView.selected = t.id;
    this.panel.show(t);
    this.shop.setVisible(false);
    this.setInfo();
  }

  private deselect() {
    if (!this.panel.tower) return;
    this.towerView.selected = null;
    this.panel.show(null);
    this.shop.setVisible(true);
    this.setInfo();
  }

  private upgrade(t: Tower) {
    if (!this.sim.upgrade(t)) return;
    this.panel.show(t);
  }

  private sell(t: Tower) {
    if (this.sim.sell(t)) this.deselect();
  }

  private retarget(t: Tower) {
    this.sim.setTargeting(t);
    this.panel.refresh();
  }

  private arm(k: AbilityKey) {
    if (this.paused || this.ended) return;
    if (this.abilities.armed === k) {
      this.disarm();
      return;
    }
    if (!this.abilities.ready(k)) return;
    this.cancelPlacement();
    this.deselect();
    this.abilities.armed = k;
    this.setInfo();
  }

  private disarm() {
    if (!this.abilities.armed) return;
    this.abilities.armed = null;
    this.aim.clear();
    this.setInfo();
  }

  private drawAim(x: number, y: number) {
    this.aim.clear();
    const k = this.abilities.armed;
    if (!k || TOUCH || !Input.onMap(x, y)) return;
    const r = k === 'staff' ? STAFF.radius : FATWA.pick;
    const c = k === 'staff' ? 0xffffff : 0xff4a4a;
    this.aim.fillStyle(c, 0.08).fillCircle(x, y, r);
    this.aim.lineStyle(2, c, 0.7).strokeCircle(x, y, r);
  }

  private setInfo() {
    let s: string;
    if (this.abilities?.armed === 'staff') s = byInput('CLICK THE MAP: STAFF SLAM STUNS ALL NEARBY', 'TAP THE MAP: STAFF SLAM STUNS ALL NEARBY');
    else if (this.abilities?.armed === 'fatwa') s = byInput('CLICK A SHIP TO ISSUE THE FATWA', 'TAP A SHIP TO ISSUE THE FATWA');
    else if (this.placement?.active)
      s = this.placement.mode === 'tap' ? 'TAP A HATCHED SPOT, THEN PLACE' : 'CLICK A HATCHED SPOT. SHIFT KEEPS PLACING. ESC CANCELS';
    else if (this.panel?.tower) s = byInput('U UPGRADE  X SELL  T TARGET', 'UPGRADE, SELL OR RETARGET');
    else if (this.sim.wave === 0) s = byInput('BUILD, THEN SPACE TO START THE FIRST WAVE', 'BUILD, THEN START THE FIRST WAVE');
    else s = byInput('F SPEED  A AUTO  1/2 ABILITIES', 'DRAG A CARD ONTO THE MAP TO BUILD');
    this.info?.setText(s);
  }

  // ---- Sim events ----

  private handle(ev: SimEvent) {
    const fx = this.fx;
    switch (ev.t) {
      case 'shoot': {
        const t = this.sim.towerById(ev.tower);
        const sx = MAP_X + ev.x;
        const sy = MAP_Y + ev.y;
        const tx = MAP_X + ev.tx;
        const ty = MAP_Y + ev.ty;
        if (ev.kind === 'hitscan') {
          if (t?.def.key === 'missile') {
            fx.beam(tx, ty);
            fx.explosion(tx, ty, true);
            Audio.play('missile');
          } else {
            fx.tracer(sx, sy, tx, ty, 0xfff3a0);
            Audio.play('flak', { volume: 0.5, minGapMs: 60 });
          }
        } else {
          if (ev.kind === 'shot' && t?.def.key === 'boats') fx.muzzle(sx, sy, Math.atan2(ty - sy, tx - sx));
          Audio.play(SHOT_SFX[ev.sprite] ?? 'shoot', { volume: 0.6, minGapMs: 50 });
        }
        break;
      }
      case 'splash': {
        const x = MAP_X + ev.x;
        const y = MAP_Y + ev.y;
        if (ev.kind === 'mine' || ev.kind === 'torpedo') {
          fx.splash(x, y);
          fx.explosion(x, y, ev.r >= 24);
          Audio.play('boatBoom', { volume: 0.7, minGapMs: 80 });
        } else {
          fx.explosion(x, y, ev.r >= 40);
          if (ev.water) fx.splash(x, y);
          Audio.play('boom', { volume: 0.6, minGapMs: 60 });
        }
        if (ev.r >= 40) fx.shake(0.003, 100);
        break;
      }
      case 'die': {
        const x = MAP_X + ev.x;
        const y = MAP_Y + ev.y - (ev.layer === 'air' ? 14 : 0);
        fx.explosion(x, y, ev.big);
        if (ev.layer === 'sea' && ev.big) fx.splash(x, y);
        if (ev.cash > 0) fx.cashText(x, y - 8, ev.cash);
        Audio.play(ev.big ? 'boatBoom' : 'boom', { volume: ev.big ? 1 : 0.5, minGapMs: 40 });
        if (ev.big) fx.shake(0.008, 260);
        break;
      }
      case 'leak':
        Audio.play('leak');
        this.map.ayaFrame(3);
        fx.shake(0.004, 120);
        fx.floatText(this.map.aya.x, this.map.aya.y - 50, `-${ENEMIES[ev.key].leak}`, COLORS.red, 12);
        break;
      case 'waveStart':
        Audio.play('waveStart');
        this.setInfo();
        break;
      case 'waveEnd':
        Audio.play('waveEnd');
        fx.cashText(OX + 130, MAP_Y + 18, ev.reward);
        break;
      case 'tower':
        Audio.play(ev.op === 'place' ? 'place' : ev.op === 'upgrade' ? 'upgrade' : 'sell');
        if (ev.op === 'upgrade') this.towerView.pulse(ev.id);
        break;
      case 'jam': {
        const t = this.sim.towerById(ev.tower);
        if (t) fx.ring(MAP_X + t.x, MAP_Y + t.y, t.def.tiers[t.tier].range, 0x9ff0ff, 600);
        Audio.play('freeze');
        break;
      }
      case 'income': {
        const t = this.sim.towerById(ev.tower);
        if (t) {
          fx.cashText(MAP_X + t.x, MAP_Y + t.y - 20, ev.amount);
          this.towerView.pulse(t.id);
        }
        Audio.play('cash');
        break;
      }
      case 'ability': {
        const x = MAP_X + ev.x;
        const y = MAP_Y + ev.y;
        if (ev.key === 'staff') {
          fx.ring(x, y, STAFF.radius, 0xffffff, 500);
          fx.ring(x, y, STAFF.radius * 0.6, 0xfff3a0, 350);
          fx.flash(0xffffff, 160);
          fx.shake(0.012, 300);
          this.map.ayaFrame(2, 700);
          Audio.play('slam');
          const t = text(this, x, y - 30, 'YOU SHAH-LL NOT PASS!', 12, COLORS.gold).setDepth(DEPTH.fx + 3);
          this.tweens.add({ targets: t, y: y - 60, alpha: 0, delay: 600, duration: 700, onComplete: () => t.destroy() });
        } else {
          fx.ring(x, y, 40, 0xff4a4a, 400);
          Audio.play('missile');
          fx.floatText(x, y - 24, 'FATWA!', COLORS.red, 12);
        }
        break;
      }
      case 'bossSpawn':
        break;
      case 'spawn': {
        const e = this.sim.enemyById(ev.id);
        if (e?.def.boss) {
          Audio.play('bossIntro');
          Music.play('boss');
          const t = text(this, MAP_X + MAP_W / 2, MAP_Y + 80, this.level.bossName ?? e.def.name, 16, COLORS.red).setDepth(DEPTH.hud);
          this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 600, onComplete: () => t.destroy() });
        }
        break;
      }
      case 'won':
        this.levelWon();
        break;
      case 'lost':
        this.levelLost();
        break;
      default:
        break;
    }
    this.dialogue.handle(ev);
  }

  private levelWon() {
    if (this.ended) return;
    this.ended = true;
    const sim = this.sim;
    const bonus = levelClearBonus(this.level.n, sim.lives, sim.leaks > 0);
    this.run.score += sim.score + bonus;
    this.run.kills += sim.kills;
    this.run.leaks += sim.leaks;
    Audio.play('clear');
    this.ticker.trigger('clear', true);
    const result: LevelResult = {
      run: this.run,
      levelScore: sim.score + bonus,
      killScore: sim.killScore,
      waveScore: sim.waveScore,
      clearBonus: bonus,
      livesLeft: sim.lives,
      leaked: sim.leaks,
      towersBuilt: sim.towersBuilt,
      wavesCleared: sim.wave,
    };
    const t = text(this, MAP_X + MAP_W / 2, MAP_Y + MAP_H / 2, 'THE STRAIT HOLDS', 24, COLORS.gold).setDepth(DEPTH.popup);
    t.setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.time.delayedCall(2600, () => {
      Music.play('title');
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(450, () => this.scene.start('LevelClear', result));
    });
  }

  private levelLost() {
    if (this.ended) return;
    this.ended = true;
    const sim = this.sim;
    this.run.score += sim.score;
    this.run.kills += sim.kills;
    this.run.leaks += sim.leaks;
    Audio.play('death');
    this.ticker.trigger('defeat', true);
    this.map.ayaFrame(3, 3000);
    this.fx.shake(0.015, 600);
    const t = text(this, MAP_X + MAP_W / 2, MAP_Y + MAP_H / 2, 'THE EYE HAS PASSED', 24, COLORS.red).setDepth(DEPTH.popup);
    t.setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 500 });
    this.time.delayedCall(2800, () => {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(450, () => this.scene.start('GameOver', { run: this.run, victory: false }));
    });
  }

  // ---- Story, pause ----

  private storyMoment(aya: string, don: string) {
    if (TOUCH) {
      const render = (s: string) => s.replace(/\{([^}]*)\}/g, (_, w: string) => '*'.repeat(w.length));
      this.openStory([
        { speaker: SPEAKERS.aya, frame: 0, text: render(aya) },
        { speaker: SPEAKERS.don, frame: 0, text: render(don) },
      ]);
    } else this.popups.say('aya', aya, don);
  }

  /** Stop (or restart) the world: tweens, animations, timers, music level. Sim stepping stops separately. */
  private freeze(on: boolean) {
    if (on) {
      this.tweens.pauseAll();
      this.anims.pauseAll();
      this.time.paused = true;
    } else {
      this.tweens.resumeAll();
      this.anims.resumeAll();
      this.time.paused = false;
    }
    Music.duck(on);
    this.popups.setHidden(on);
  }

  private togglePause() {
    if (this.ended || this.story) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.freeze(true);
      const bg = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.65).setOrigin(0);
      const last = this.lastStory ?? this.popups.lastLine ?? (this.ticker.last ? { speaker: SPEAKERS[this.ticker.last.who], frame: 0, text: this.ticker.last.text } : null);
      const t = text(this, WIDTH / 2, last ? 140 : HEIGHT / 2 - 20, 'THE STRAIT WAITS', 24, COLORS.gold);
      this.pauseUi = this.add.container(0, 0, [bg, t]).setDepth(DEPTH.popup + 10);
      if (last) {
        this.pauseUi.add(text(this, WIDTH / 2, 190, `LAST FROM ${last.speaker.name}`, 8, last.speaker.color));
        this.pauseUi.add(text(this, WIDTH / 2, 210, last.text, TOUCH ? 12 : 8, COLORS.text).setOrigin(0.5, 0).setWordWrapWidth(700));
      }
      const y = last ? 330 : HEIGHT / 2 + 24;
      if (TOUCH) {
        this.pauseMenu = menu(
          this,
          WIDTH / 2,
          y + 10,
          [
            { label: 'RESUME', action: () => this.paused && this.togglePause() },
            { label: 'RETREAT TO THE TITLE', action: () => this.quitToTitle() },
          ],
          40,
          DEPTH.popup + 11,
        );
      } else {
        this.pauseUi.add(text(this, WIDTH / 2, y, 'ESC / P RESUME   Q RETREAT TO THE TITLE', 8, COLORS.dim));
      }
    } else {
      this.freeze(false);
      this.pauseUi?.destroy();
      this.pauseUi = null;
      this.pauseMenu?.destroy();
      this.pauseMenu = null;
    }
  }

  /** Touch: freeze the game and show a story moment big; a tap (after a beat) carries on. */
  private openStory(lines: Shown[]) {
    if (this.story) return;
    this.freeze(true);
    this.lastStory = lines[0];
    const left = OX + 60;
    const items: Phaser.GameObjects.GameObject[] = [this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.88).setOrigin(0)];
    lines.forEach((l, i) => {
      const y = 48 + i * 200;
      items.push(
        this.add.sprite(left, y, l.speaker.key, l.frame).setOrigin(0).setScale(2).setCrop(0, 0, 64, 56),
        text(this, left + 152, y + 14, l.speaker.banner, 12, l.speaker.color, 0).setOrigin(0, 0.5),
        text(this, left + 152, y + 36, l.text, 14, COLORS.text, 0).setOrigin(0).setAlign('left').setWordWrapWidth(WIDTH - 2 * left - 152).setLineSpacing(8),
      );
    });
    const hint = text(this, WIDTH / 2, HEIGHT - 36, 'TAP TO CARRY ON', 12, COLORS.gold);
    this.tweens.add({ targets: hint, alpha: 0.3, yoyo: true, repeat: -1, duration: 500 });
    items.push(hint);
    this.story = this.add.container(0, 0, items).setDepth(DEPTH.popup + 20);
    Audio.play('incoming');
    const bleeps = lines.reduce((n, l) => n + (l.text.match(/\*+/g) ?? []).length, 0);
    for (let k = 0; k < bleeps; k++) setTimeout(() => Audio.play('bleep', { volume: 0.6 }), 300 + k * 260);
    // The game clock is frozen, so time the tap guard on the wall clock.
    const openedAt = performance.now();
    const onTap = () => {
      if (performance.now() - openedAt < 600) return;
      this.input.off('pointerdown', onTap);
      this.closeStory();
    };
    this.input.on('pointerdown', onTap);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.off('pointerdown', onTap));
  }

  private closeStory() {
    if (!this.story) return;
    this.tweens.killTweensOf(this.story.list);
    this.story.destroy();
    this.story = null;
    this.freeze(false);
  }

  private quitToTitle() {
    if (!this.paused) return;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.anims.resumeAll();
    Music.duck(false);
    this.scene.start('Title');
  }

  // ---- Frame ----

  update(_time: number, deltaMs: number) {
    this.input_.update();
    if (this.story || this.paused) return;
    const dt = Math.min(deltaMs, 50);
    if (!this.ended) {
      this.run.playMs += dt;
      this.acc += dt * this.speed;
      let n = 0;
      while (this.acc >= TICK_MS && n < MAX_TICKS_PER_FRAME && !this.sim.over) {
        this.acc -= TICK_MS;
        n++;
        for (const ev of this.sim.step()) this.handle(ev);
      }
      if (n >= MAX_TICKS_PER_FRAME) this.acc = 0;
    }
    this.map.update(dt);
    this.enemyView.render(this.sim.enemies);
    this.towerView.render(this.sim.towers);
    this.projView.render(this.sim.projectiles);
    this.hud.update(this.sim, this.speed);
    this.shop.update();
    this.abilities.update();
    if (this.panel.tower) this.panel.refresh();
    this.updateStartButton();
    this.ticker.update(dt);
    this.popups.update(dt);
    this.dialogue.idle(this.input_.idleMs);
  }

  private updateStartButton() {
    const sim = this.sim;
    if (sim.wave >= sim.totalWaves || sim.over) {
      this.startBtn.setLabel(sim.phase === 'won' ? 'HELD!' : 'LAST WAVE').setEnabled(false);
    } else if (sim.phase === 'build') {
      this.startBtn.setLabel(byInput(`START WAVE ${sim.wave + 1}\n[SPACE]`, `START WAVE ${sim.wave + 1}`)).setEnabled(true).setHighlight(true);
    } else {
      const can = sim.canStartWave();
      this.startBtn.setLabel(can ? `SEND WAVE ${sim.wave + 1} EARLY` : `WAVE ${sim.wave} INCOMING`).setEnabled(can).setHighlight(false);
    }
  }
}
