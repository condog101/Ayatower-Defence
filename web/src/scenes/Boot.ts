import Phaser from 'phaser';
import { WIDTH } from '../data/balance';
import { syncProgress } from '../net/sync';
import { Audio } from '../systems/Audio';
import { Save } from '../systems/Save';
import { COLORS, text } from '../systems/UI';

/**
 * [key, frameWidth, frameHeight] for every generated sheet in public/assets/sprites.
 * The contract with tools/sprites/test_gen.py EXPECTED and sheets/__init__.py SHEETS: change all three together.
 */
const SHEETS: [string, number, number][] = [
  ['tiles', 16, 16],
  ['decor', 16, 16],
  ['towers', 16, 16],
  ['turrets', 16, 16],
  ['ayatower', 32, 32],
  ['rhib', 12, 6],
  ['patrol', 16, 8],
  ['cyclone', 20, 8],
  ['lcs', 24, 10],
  ['frigate', 28, 10],
  ['burke', 32, 10],
  ['sub', 24, 8],
  ['tico', 36, 12],
  ['lhd', 48, 16],
  ['carrier', 64, 20],
  ['boss_yacht', 48, 14],
  ['boss_don', 80, 24],
  ['reaper', 16, 12],
  ['seahawk', 16, 12],
  ['hornet', 16, 12],
  ['b2', 24, 12],
  ['p_bullet', 4, 4],
  ['p_rocket', 6, 3],
  ['p_missile', 8, 3],
  ['p_shahed', 8, 6],
  ['p_torpedo', 8, 3],
  ['p_mine', 6, 6],
  ['p_boat', 10, 5],
  ['p_sam', 8, 3],
  ['muzzle', 6, 6],
  ['explosion_sm', 16, 16],
  ['explosion_lg', 32, 32],
  ['splash', 16, 16],
  ['smoke', 8, 8],
  ['stun', 8, 8],
  ['jam', 16, 16],
  ['ring', 24, 24],
  ['coin', 8, 8],
  ['don', 64, 64],
  ['aya', 64, 64],
  ['title_logo', 288, 96],
  ['advisory', 48, 32],
  ['hud_icons', 12, 12],
  ['ui_panel', 48, 48],
];

const SHIPS = ['rhib', 'patrol', 'cyclone', 'lcs', 'frigate', 'burke', 'tico', 'lhd', 'carrier', 'boss_yacht', 'boss_don', 'reaper', 'seahawk', 'hornet', 'b2'];
const MISSILES = ['p_rocket', 'p_missile', 'p_shahed', 'p_torpedo', 'p_boat', 'p_sam'];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const cx = WIDTH / 2;
    const bar = this.add.rectangle(cx - 150, 290, 0, 8, 0xffd84a).setOrigin(0, 0.5);
    this.add.rectangle(cx, 290, 304, 12).setStrokeStyle(2, 0xb88c1e);
    text(this, cx, 250, 'LOADING', 16, COLORS.text);
    this.load.on('progress', (v: number) => (bar.width = 300 * v));
    // Sprite URLs don't change between builds, so stamp them with the build id to bust caches.
    const v = `?v=${import.meta.env.VITE_BUILD_ID ?? ''}`;
    for (const [key, w, h] of SHEETS) {
      this.load.spritesheet(key, `assets/sprites/${key}.png${v}`, { frameWidth: w, frameHeight: h });
    }
  }

  create() {
    const a = this.anims;
    const strip = (key: string, start: number, end: number, frameRate: number, repeat = -1, anim = key) =>
      a.create({ key: anim, frames: a.generateFrameNumbers(key, { start, end }), frameRate, repeat });
    for (const k of SHIPS) strip(k, 0, 1, 5);
    strip('sub', 0, 1, 5, -1, 'sub_up');
    strip('sub', 2, 3, 3, -1, 'sub_down');
    for (const k of MISSILES) strip(k, 0, 1, 12);
    strip('p_mine', 0, 1, 2);
    strip('explosion_sm', 0, 5, 16, 0);
    strip('explosion_lg', 0, 5, 12, 0);
    strip('splash', 0, 3, 12, 0);
    strip('smoke', 0, 3, 6, 0);
    strip('stun', 0, 1, 6);
    strip('jam', 0, 1, 6);

    Save.load();
    Audio.warm();
    void syncProgress();
    this.scene.start('Title');
  }
}
