import Phaser from 'phaser';
import { syncProgress } from '../net/sync';
import { Audio } from '../systems/Audio';
import { Save } from '../systems/Save';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    Save.load();
    Audio.warm();
    void syncProgress();
    this.scene.start('Title');
  }
}
