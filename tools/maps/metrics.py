#!/usr/bin/env python3
"""Approximate map checks while painting (the real ones are tests/levels.test.ts):
prime ratio (buildable cells within 110 px of a lane), closest buildable cell to a lane, lane lengths.

    python3 tools/maps/metrics.py 1 2 3
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paint import LEVELS, dense  # noqa: E402


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    t = 0 if L2 == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L2))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def report(n):
    k, lanes = LEVELS[n]()[:2]
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


if __name__ == '__main__':
    for a in sys.argv[1:] or sorted(LEVELS):
        report(int(a))
