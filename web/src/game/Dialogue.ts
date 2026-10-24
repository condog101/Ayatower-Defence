import Phaser from 'phaser';
import { ENEMIES } from '../data/enemies';
import type { QuoteTag } from '../data/quotes';
import { BEATS, type Beat } from '../data/story';
import type { Sim } from '../sim/sim';
import type { SimEvent } from '../sim/types';
import type { RunState } from '../systems/Run';
import type { Ticker } from '../systems/Ticker';

export interface StoryOut {
  /** A story beat: the Grey Turban speaks and Sour-don answers (card on desktop, freeze on touch). */
  story(aya: string, don: string): void;
}

/**
 * Turns sim events into commentary. Running chatter goes to the ticker; one-off teaching lines
 * (first aircraft, first armour, first stealth, first build of each tower) fire once per run and
 * are remembered in RunState.said; story beats go to the card.
 */
export class Dialogue {
  private beats: Beat[];
  private bossSaid = false;
  private idleSaid = false;

  constructor(
    private scene: Phaser.Scene,
    private sim: Sim,
    private run: RunState,
    private ticker: Ticker,
    private out: StoryOut,
  ) {
    this.beats = BEATS.filter((b) => b.level === sim.level.n);
  }

  private once(key: string, tag: QuoteTag, force = true): boolean {
    if (this.run.said.includes(key)) return false;
    this.run.said.push(key);
    this.ticker.trigger(tag, force);
    return true;
  }

  private beat(at: Beat['at']): boolean {
    const b = this.beats.find((x) => x.at === at);
    if (!b) return false;
    this.beats = this.beats.filter((x) => x !== b);
    this.out.story(b.aya, b.don);
    return true;
  }

  start() {
    this.scene.time.delayedCall(900, () => this.ticker.trigger('start', true));
  }

  handle(ev: SimEvent) {
    switch (ev.t) {
      case 'waveStart':
        this.idleSaid = false;
        if (!this.beat(`wave:${ev.wave}`)) this.ticker.trigger('waveStart');
        break;
      case 'spawn': {
        const e = this.sim.enemyById(ev.id);
        if (!e) break;
        if (e.def.boss && !this.bossSaid) {
          this.bossSaid = true;
          if (!this.beat('boss')) this.ticker.trigger('bossIntro', true);
        } else if (e.def.stealth) this.once('firstStealth', 'firstStealth');
        else if (e.def.layer === 'air') this.once('firstAir', 'firstAir');
        else if (e.def.armoured) this.once('firstArmoured', 'firstArmoured');
        break;
      }
      case 'die':
        if (ENEMIES[ev.key].boss) this.ticker.trigger('bossDead', true);
        break;
      case 'leak':
        this.ticker.trigger('leak');
        break;
      case 'lowLives':
        this.ticker.trigger('lowLives', true);
        break;
      case 'tower':
        if (ev.op === 'place') this.once(`tower:${ev.key}`, `tower:${ev.key}`);
        break;
      case 'ability':
        this.ticker.trigger(ev.key, true);
        break;
    }
  }

  speed3() {
    this.once('speed3', 'speed3', false);
  }

  /** Nobody has touched anything for a while between waves. */
  idle(ms: number) {
    if (!this.idleSaid && this.sim.phase === 'build' && this.sim.wave > 0 && ms > 25_000) {
      this.idleSaid = true;
      this.ticker.trigger('idle', true);
    }
  }
}
