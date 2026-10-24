#!/usr/bin/env python3
"""Approximate map checks while painting (the real ones are tests/levels.test.ts):
prime ratio (buildable cells within 110 px of a lane), closest buildable cell to a lane, lane lengths,
and lane coverage: how much of each lane aircraft fly has land in AA reach (land@90, and land@240
on SAM levels), and how much of each sea lane has shallows in mine reach (shal@90).

    python3 tools/maps/metrics.py 1 2 3
    python3 tools/maps/metrics.py --suggest 6     # also list cells that would close each gap
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from levels_src import META  # noqa: E402
from paint import COLS, LEVELS, ROWS, dense, lane_dist, lane_samples  # noqa: E402

# Kinds that are, or carry or launch, aircraft (enemies.ts layer/children/spawns).
AIR_TREE = {'reaper', 'seahawk', 'hornet', 'b2', 'f35', 'lhd', 'carrier', 'boss_yacht', 'boss_don', 'boss_af1', 'boss_resort'}
# Mirrors tests/levels.test.ts.
AIR_RUN_MAX = 128
AIR_UNCOVERED_MAX = 0.25
AIR_PIT_UNCOVERED_MAX = 0.70
SEA_RUN_MAX = 384
STEP = 8


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    t = 0 if L2 == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L2))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def coverage(rows, lane, ch, rng):
    """(uncovered share, longest uncovered run in px, [(first, last) sample index per run]) of
    `lane` against the cells holding `ch` within `rng` px."""
    pts = [(c * 32 + 16, r * 32 + 16) for r in range(1, ROWS) for c in range(COLS) if rows[r][c] == ch]
    samples = lane_samples(lane, STEP)
    bad = [not any((x - sx) ** 2 + (y - sy) ** 2 <= rng * rng for x, y in pts) for sx, sy in samples]
    runs = []
    for i, b in enumerate(bad):
        if b and (i == 0 or not bad[i - 1]):
            runs.append([i, i])
        elif b:
            runs[-1][1] = i
    longest = max(((b - a + 1) * STEP for a, b in runs), default=0)
    return sum(bad) / len(bad), longest, runs


def suggest(rows, lanes, lane, run, ch):
    """Cells 40-80 px from the lanes, off the moat ring, not yet `ch`, nearest the run's middle."""
    samples = lane_samples(lane, STEP)
    mx, my = samples[(run[0] + run[1]) // 2]
    ring = {(c + dc, r + dr) for l in lanes for c, r in dense(l) for dc in (-1, 0, 1) for dr in (-1, 0, 1)}
    out = []
    for r in range(1, ROWS):
        for c in range(COLS):
            if (c, r) in ring or rows[r][c] not in ',~#' or rows[r][c] == ch:
                continue
            if 40 <= lane_dist(lanes, c, r) <= 80:
                out.append((math.hypot(c * 32 + 16 - mx, r * 32 + 16 - my), (c, r)))
    return [cr for _, cr in sorted(out)[:6]]


def report(n, want_suggest=False):
    k, lanes, air = LEVELS[n]()
    rows = k.rows()
    polys = [[(c * 32 + 16, r * 32 + 16) for c, r in dense(l)] for l in lanes]
    spots = prime = 0
    closest = 1e9
    worst = None
    for r in range(1, 16):
        for c in range(25):
            if rows[r][c] not in '.,':
                continue
            spots += 1
            x, y = c * 32 + 16, r * 32 + 16
            d = min(seg_dist(x, y, *p[i], *p[i + 1]) for p in polys for i in range(len(p) - 1))
            if d < closest:
                closest, worst = d, (c, r)
            if d <= 110:
                prime += 1
    lens = [round(sum(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1))) for p in polys]
    flag = '' if prime / max(1, spots) <= 0.45 and closest >= 24 else '   <-- FIX'
    print(f'L{n}: spots {spots} prime {prime} ({prime / max(1, spots):.0%}) closest {closest:.0f}px at {worst} lanes {lens}{flag}')
    m = META[n]
    flies = any(f"'{kind}'" in m['waves'] for kind in AIR_TREE)
    sam = 'sam' in m['towers']
    for li, lane in enumerate(lanes):
        checks = []
        if flies and (air is None or li == air):
            if sam:
                checks.append(('land@240', '.', 240, AIR_UNCOVERED_MAX, AIR_RUN_MAX))
                checks.append(('land@90', '.', 90, AIR_PIT_UNCOVERED_MAX, None))
            else:
                checks.append(('land@90', '.', 90, AIR_UNCOVERED_MAX, AIR_RUN_MAX))
        if li != air:
            checks.append(('shal@90', ',', 90, None, SEA_RUN_MAX))
        parts = []
        for name, ch, rng, max_share, max_run in checks:
            share, longest, runs = coverage(rows, lane, ch, rng)
            fix = (max_share is not None and share > max_share) or (max_run is not None and longest > max_run)
            parts.append(f"{name} {share:.0%} run {longest}px{' <-- FIX' if fix else ''}")
            if want_suggest and fix:
                for run in runs:
                    if (run[1] - run[0] + 1) * STEP > (max_run or 0):
                        parts.append(f'\n      {name} gap {run[0] * STEP}-{(run[1] + 1) * STEP}px: try {suggest(rows, lanes, lane, run, ch)}')
        print(f'    lane {li}: ' + '  '.join(parts))


if __name__ == '__main__':
    args = sys.argv[1:]
    want_suggest = '--suggest' in args
    args = [a for a in args if a != '--suggest']
    for a in args or sorted(LEVELS):
        report(int(a), want_suggest)
