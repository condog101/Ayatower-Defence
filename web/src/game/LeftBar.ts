import Phaser from 'phaser';
import { L } from '../data/balance';
import type { Sim } from '../sim/sim';
import { byInput } from '../systems/Device';
import { rectButton, type Button } from './widgets';

export interface LeftBarActions {
  start(): void;
  speed(): void;
  auto(): void;
  pause(): void;
}

/** Left strip: START WAVE, speed, AUTO and PAUSE (the abilities sit under them, see Abilities). */
export class LeftBar {
  private startBtn: Button;
  private speedBtn: Button;
  private autoBtn: Button;

  constructor(scene: Phaser.Scene, actions: LeftBarActions) {
    const g = L.game;
    this.startBtn = rectButton(scene, g.start, '', actions.start, 10);
    this.speedBtn = rectButton(scene, g.speed, '', actions.speed, 10);
    this.autoBtn = rectButton(scene, g.auto, 'AUTO', actions.auto, 10);
    rectButton(scene, g.pause, byInput('PAUSE', 'II PAUSE'), actions.pause, 10);
  }

  update(sim: Sim, speed: number) {
    this.speedBtn.setLabel(`${'>'.repeat(speed)} ${speed}X`);
    this.autoBtn.setHighlight(sim.auto);
    const b = this.startBtn;
    if (sim.wave >= sim.totalWaves || sim.over) {
      b.setLabel(sim.phase === 'won' ? 'HELD!' : 'LAST\nWAVE').setEnabled(false);
    } else if (sim.phase === 'build') {
      b.setLabel(byInput(`START\nWAVE ${sim.wave + 1}`, `START\nWAVE ${sim.wave + 1}`)).setEnabled(true).setHighlight(true);
    } else {
      const can = sim.canStartWave();
      b.setLabel(can ? `SEND\nWAVE ${sim.wave + 1}` : `WAVE ${sim.wave}\nAT THE GATE`).setEnabled(can).setHighlight(false);
    }
  }
}
