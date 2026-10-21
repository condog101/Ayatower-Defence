import { TILE } from './const';

const SAMPLES_PER_SEGMENT = 8;

/** Fill in every cell between consecutive waypoints (straight or 45 degree runs). */
export function denseCells(waypoints: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < waypoints.length; i++) {
    const [c, r] = waypoints[i];
    if (i === 0) {
      out.push([c, r]);
      continue;
    }
    const [pc, pr] = waypoints[i - 1];
    const dc = Math.sign(c - pc);
    const dr = Math.sign(r - pr);
    const steps = Math.max(Math.abs(c - pc), Math.abs(r - pr));
    if (dc !== 0 && dr !== 0 && Math.abs(c - pc) !== Math.abs(r - pr)) {
      throw new Error(`lane segment ${pc},${pr} -> ${c},${r} is neither straight nor 45 degrees`);
    }
    for (let s = 1; s <= steps; s++) out.push([pc + dc * s, pr + dr * s]);
  }
  return out;
}

/**
 * The sea lane: a Catmull-Rom spline through the centres of every lane cell, sampled into a
 * cumulative arc-length table so enemies can be keyed by distance `d`.
 */
export class Lane {
  readonly xs: number[] = [];
  readonly ys: number[] = [];
  /** Cumulative length at each sample. */
  readonly ds: number[] = [];
  readonly length: number;
  readonly cells: [number, number][];

  constructor(waypoints: [number, number][]) {
    this.cells = denseCells(waypoints);
    const pts = this.cells.map(([c, r]) => [c * TILE + TILE / 2, r * TILE + TILE / 2]);
    // Endpoints duplicated so the curve starts and ends on the first and last centres.
    const p = [pts[0], ...pts, pts[pts.length - 1]];
    for (let i = 1; i < p.length - 2; i++) {
      const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
      for (let s = 0; s < SAMPLES_PER_SEGMENT; s++) {
        const t = s / SAMPLES_PER_SEGMENT;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (a: number, b: number, c: number, d: number) =>
          0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        this.xs.push(f(p0[0], p1[0], p2[0], p3[0]));
        this.ys.push(f(p0[1], p1[1], p2[1], p3[1]));
      }
    }
    const last = pts[pts.length - 1];
    this.xs.push(last[0]);
    this.ys.push(last[1]);
    let acc = 0;
    this.ds.push(0);
    for (let i = 1; i < this.xs.length; i++) {
      acc += Math.hypot(this.xs[i] - this.xs[i - 1], this.ys[i] - this.ys[i - 1]);
      this.ds.push(acc);
    }
    this.length = acc;
  }

  /** Index of the sample segment containing distance d. */
  private seg(d: number): number {
    const ds = this.ds;
    if (d <= 0) return 0;
    if (d >= this.length) return ds.length - 2;
    let lo = 0;
    let hi = ds.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ds[mid] <= d) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  posAt(d: number): [number, number] {
    const i = this.seg(d);
    const span = this.ds[i + 1] - this.ds[i] || 1;
    const t = Math.min(1, Math.max(0, (d - this.ds[i]) / span));
    return [this.xs[i] + (this.xs[i + 1] - this.xs[i]) * t, this.ys[i] + (this.ys[i + 1] - this.ys[i]) * t];
  }

  angleAt(d: number): number {
    const i = this.seg(d);
    return Math.atan2(this.ys[i + 1] - this.ys[i], this.xs[i + 1] - this.xs[i]);
  }

  /** Unit normal (left of travel). */
  normalAt(d: number): [number, number] {
    const a = this.angleAt(d);
    return [Math.sin(a), -Math.cos(a)];
  }

  /** Lane distance of the sample nearest (x, y). */
  nearestD(x: number, y: number): number {
    let best = 0;
    let bestD2 = Infinity;
    for (let i = 0; i < this.xs.length; i++) {
      const d2 = (this.xs[i] - x) ** 2 + (this.ys[i] - y) ** 2;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = i;
      }
    }
    return this.ds[best];
  }

  /** Distance from (x, y) to the nearest lane sample. */
  distanceTo(x: number, y: number): number {
    const [px, py] = this.posAt(this.nearestD(x, y));
    return Math.hypot(px - x, py - y);
  }

  /** Lane distances (sample points) within `range` of (x, y). */
  spotsWithin(x: number, y: number, range: number): number[] {
    const out: number[] = [];
    const r2 = range * range;
    for (let i = 0; i < this.xs.length; i++) {
      if ((this.xs[i] - x) ** 2 + (this.ys[i] - y) ** 2 <= r2) out.push(this.ds[i]);
    }
    return out;
  }
}
