import Phaser from 'phaser';
import { L, MAP_H, MAP_W, MAP_X, MAP_Y } from '../data/balance';
import { TOUCH } from '../systems/Device';

/** Finger-drag ghosts sit this far above the finger so it doesn't hide them. */
export const DRAG_LIFT = 64;
/** A press that moves further than this is a drag, not a tap. */
const DRAG_START = 12;

/**
 * Where a dragging finger is aiming. The ghost floats DRAG_LIFT above the finger, but the lift
 * shrinks smoothly to nothing as the finger reaches the bottom of the screen, so every row
 * (including the last) is reachable without leaving the canvas.
 */
export function dragAim(x: number, y: number): [number, number] {
  if (!TOUCH) return [x, y];
  const knee = MAP_Y + MAP_H - DRAG_LIFT;
  if (y <= knee) return [x, y - DRAG_LIFT];
  const t = Math.min(1, (L.H - y) / Math.max(1, L.H - knee));
  return [x, y - DRAG_LIFT * t];
}

export interface InputHandlers {
  /** Plain press on the map (no Phaser interactive under it). */
  mapDown(x: number, y: number, right: boolean): void;
  /** A press that began on the map moved (touch ability aiming). */
  mapDrag(x: number, y: number): void;
  /** A press that began on the map was released. */
  mapUp(x: number, y: number): void;
  /** Pointer moved with nothing pressed (desktop hover ghost / aim ring). */
  move(x: number, y: number): void;
  /** A drag that began on a shop card moved; (x, y) is already the aim point. */
  drag(x: number, y: number): void;
  /** A drag that began on a shop card was released; (x, y) is the aim point. */
  dragEnd(x: number, y: number): void;
}

/**
 * Pointer router. Phaser interactives (buttons, cards) win: a press over one never reaches the
 * map. Presses are tracked by pointer id: one that starts on a shop card becomes a drag past
 * DRAG_START; one that starts on the map reports drag and release (touch aiming).
 */
export class Input {
  private cardPointer: number | null = null;
  private mapPointer: number | null = null;
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
      this.lastMoveAt = scene.time.now;
      if (over.length > 0 || p.id === this.cardPointer) return;
      if (!Input.onMap(p.x, p.y)) return;
      this.mapPointer = p.id;
      h.mapDown(p.x, p.y, p.rightButtonDown());
    });
    inp.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.lastMoveAt = scene.time.now;
      if (this.cardPointer === p.id) {
        if (!this.dragging && Math.hypot(p.x - this.start[0], p.y - this.start[1]) > DRAG_START) this.dragging = true;
        if (this.dragging) h.drag(...dragAim(p.x, p.y));
      } else if (this.mapPointer === p.id && p.isDown) h.mapDrag(p.x, p.y);
      else if (!TOUCH) h.move(p.x, p.y);
    });
    inp.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.cardPointer === p.id) {
        const wasDrag = this.dragging;
        this.cardPointer = null;
        this.dragging = false;
        if (wasDrag) h.dragEnd(...dragAim(p.x, p.y));
      } else if (this.mapPointer === p.id) {
        this.mapPointer = null;
        h.mapUp(p.x, p.y);
      }
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

  /** Drop stale presses (pointer released outside the canvas, lost touch). */
  update() {
    const alive = (id: number | null) => id !== null && !!this.scene.input.manager.pointers.find((q) => q.id === id && q.isDown);
    if (this.cardPointer !== null && !alive(this.cardPointer)) {
      this.cardPointer = null;
      this.dragging = false;
    }
    if (this.mapPointer !== null && !alive(this.mapPointer)) this.mapPointer = null;
  }

  get idleMs(): number {
    return this.scene.time.now - this.lastMoveAt;
  }
}
