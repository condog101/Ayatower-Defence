import Phaser from 'phaser';
import { MAP_H, MAP_W, MAP_X, MAP_Y } from '../data/balance';
import { TOUCH } from '../systems/Device';

/** Finger-drag ghosts sit this far above the finger so it doesn't hide them. */
export const DRAG_LIFT = 40;
/** A press that moves further than this is a drag, not a tap. */
const DRAG_START = 12;

export interface InputHandlers {
  /** Plain press on the map (no Phaser interactive under it). */
  mapDown(x: number, y: number, right: boolean): void;
  /** Pointer moved anywhere (hover ghost / drag ghost). */
  move(x: number, y: number, dragging: boolean): void;
  /** A drag that began on a shop card was released. */
  dragEnd(x: number, y: number): void;
  /** A press on a shop card was released without dragging. */
  cardTap(): void;
}

/**
 * Pointer router. Phaser interactives (buttons, cards) win: a press over one never reaches the
 * map. A press that starts on a shop card is tracked by pointer id: past DRAG_START it becomes a
 * drag (ghost follows, release places); released early it's a tap.
 */
export class Input {
  private cardPointer: number | null = null;
  private start: [number, number] = [0, 0];
  private dragging = false;
  private lastMoveAt = 0;

  constructor(
    private scene: Phaser.Scene,
    h: InputHandlers,
  ) {
    const inp = scene.input;
    inp.mouse?.disableContextMenu();
    inp.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || p.id === this.cardPointer) return;
      if (Input.onMap(p.x, p.y)) h.mapDown(p.x, p.y, p.rightButtonDown());
    });
    inp.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.lastMoveAt = scene.time.now;
      if (this.cardPointer === p.id && !this.dragging && Math.hypot(p.x - this.start[0], p.y - this.start[1]) > DRAG_START) this.dragging = true;
      if (this.cardPointer === p.id && this.dragging) h.move(p.x, p.y - (TOUCH ? DRAG_LIFT : 0), true);
      else if (this.cardPointer === null && !TOUCH) h.move(p.x, p.y, false);
    });
    inp.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.cardPointer !== p.id) return;
      const wasDrag = this.dragging;
      this.cardPointer = null;
      this.dragging = false;
      if (wasDrag) h.dragEnd(p.x, p.y - (TOUCH ? DRAG_LIFT : 0));
      else h.cardTap();
    });
  }

  static onMap(x: number, y: number): boolean {
    return x >= MAP_X && y >= MAP_Y && x < MAP_X + MAP_W && y < MAP_Y + MAP_H;
  }

  /** A shop card was pressed with this pointer: start tracking it. */
  trackCard(p: Phaser.Input.Pointer) {
    this.cardPointer = p.id;
    this.start = [p.x, p.y];
    this.dragging = false;
  }

  /** Drop a stale card press (pointer released outside the canvas, lost touch). */
  update() {
    if (this.cardPointer === null) return;
    const p = this.scene.input.manager.pointers.find((q) => q.id === this.cardPointer);
    if (!p || !p.isDown) {
      this.cardPointer = null;
      this.dragging = false;
    }
  }

  get idleMs(): number {
    return this.scene.time.now - this.lastMoveAt;
  }
}
