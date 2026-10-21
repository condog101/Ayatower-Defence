#!/usr/bin/env python3
"""Tiny map painter used to author web/src/data/maps/levelNN.ts rows.

Each level is painted onto a 25x16 canvas of '~' with rectangles and points, then the lane cells
(from the same waypoints as LevelDef.lane) are stamped as '='. Prints the rows as a TS array.

    python3 tools/maps/paint.py 1
"""
import sys

COLS, ROWS = 25, 16


def dense(wps):
    out = [tuple(wps[0])]
    for (pc, pr), (c, r) in zip(wps, wps[1:]):
        dc = (c > pc) - (c < pc)
        dr = (r > pr) - (r < pr)
        for s in range(1, max(abs(c - pc), abs(r - pr)) + 1):
            out.append((pc + dc * s, pr + dr * s))
    return out


class Canvas:
    def __init__(self):
        self.g = [['~'] * COLS for _ in range(ROWS)]

    def rect(self, c0, r0, c1, r1, ch):
        for r in range(max(0, r0), min(ROWS - 1, r1) + 1):
            for c in range(max(0, c0), min(COLS - 1, c1) + 1):
                self.g[r][c] = ch
        return self

    def put(self, pts, ch):
        for c, r in pts:
            if 0 <= c < COLS and 0 <= r < ROWS:
                self.g[r][c] = ch
        return self

    def lane(self, wps):
        for c, r in dense(wps):
            if 0 <= c < COLS and 0 <= r < ROWS:
                self.g[r][c] = '='
        return self

    def rows(self):
        return [''.join(r) for r in self.g]


def ts(rows):
    return '  rows: [\n' + ''.join(f"    '{r}',\n" for r in rows) + '  ],'


LEVELS = {}


def level(n):
    def deco(f):
        LEVELS[n] = f
        return f
    return deco


@level(1)
def l1():
    lane = [(-1, 2), (20, 2), (20, 7), (4, 7), (4, 12), (21, 12)]
    k = Canvas()
    k.rect(0, 4, 17, 5, '.').rect(0, 3, 17, 3, ',').rect(2, 6, 17, 6, ',')
    k.rect(6, 9, 23, 10, '.').rect(7, 8, 18, 8, ',').rect(6, 11, 20, 11, ',')
    k.rect(22, 3, 24, 11, '.').rect(22, 2, 24, 2, ',')
    k.rect(0, 14, 24, 15, '.').rect(0, 13, 21, 13, ',')
    k.rect(0, 8, 2, 12, '.').rect(3, 8, 3, 12, ',')
    k.rect(22, 12, 24, 13, '#')
    k.put([(22, 12)], 'A')
    k.put([(1, 4), (12, 5), (16, 4), (8, 10), (23, 5), (3, 15), (10, 15), (19, 15)], 'P')
    k.put([(5, 4), (6, 4), (14, 9), (15, 9), (1, 9), (23, 8)], 'T')
    k.put([(10, 4), (20, 10)], 'M')
    k.put([(10, 0), (22, 0)], 'O')
    k.put([(0, 0), (1, 0), (24, 15)], '#')
    return k.lane(lane), lane


if __name__ == '__main__':
    n = int(sys.argv[1])
    k, lane = LEVELS[n]()
    print(ts(k.rows()))
    print('  lane: [' + ', '.join(f'[{c}, {r}]' for c, r in lane) + '],')
