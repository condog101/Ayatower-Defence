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

    def around(self, wps, ch, dist=1):
        """Paint `ch` on every cell within `dist` (Chebyshev) of the lane."""
        cells = set(dense(wps))
        for c, r in cells:
            for dr in range(-dist, dist + 1):
                for dc in range(-dist, dist + 1):
                    if 0 <= c + dc < COLS and 0 <= r + dr < ROWS:
                        self.g[r + dr][c + dc] = ch
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



@level(2)
def l2():
    # Sirik coast: a U-bend round a long peninsula.
    lane = [(-1, 3), (21, 3), (21, 12), (3, 12)]
    k = Canvas()
    k.rect(0, 0, 24, 1, '.').rect(0, 2, 20, 2, ',')
    k.rect(0, 6, 18, 9, '.').rect(1, 5, 19, 5, ',').rect(1, 10, 19, 10, ',').rect(19, 6, 19, 9, ',')
    k.rect(23, 0, 24, 15, '.').rect(22, 2, 22, 13, ',')
    k.rect(0, 14, 24, 15, '.').rect(2, 13, 21, 13, ',')
    k.rect(0, 11, 1, 13, '#').rect(0, 12, 2, 12, '#')
    k.put([(2, 12)], 'A')
    k.put([(2, 0), (9, 1), (16, 0), (3, 7), (11, 8), (17, 6), (24, 5), (23, 10), (5, 15), (14, 14)], 'P')
    k.put([(5, 0), (6, 0), (12, 0), (7, 7), (8, 7), (14, 9), (24, 12), (20, 15)], 'T')
    k.put([(10, 7), (23, 2)], 'M')
    k.put([(10, 11), (14, 4)], 'O')
    return k.lane(lane), lane


@level(3)
def l3():
    # Larak: the lane wraps three sides of the island and lands on its west shore.
    lane = [(-1, 2), (20, 2), (20, 13), (4, 13), (4, 6), (6, 6)]
    k = Canvas()
    k.rect(0, 0, 24, 0, '#').rect(0, 1, 18, 1, ',')
    k.rect(7, 4, 17, 11, '.').rect(6, 3, 18, 3, ',').rect(6, 12, 18, 12, ',').rect(18, 4, 18, 11, ',').rect(6, 7, 6, 11, ',')
    k.rect(22, 0, 24, 15, '.').rect(21, 1, 21, 14, ',')
    k.rect(0, 15, 24, 15, '.').rect(3, 14, 20, 14, ',')
    k.rect(0, 4, 2, 15, '.').rect(3, 5, 3, 12, ',')
    k.put([(7, 6)], 'A')
    k.rect(7, 5, 8, 5, '#').put([(7, 7)], '#')
    k.put([(10, 5), (15, 8), (12, 10), (23, 3), (24, 9), (1, 6), (1, 12), (8, 15)], 'P')
    k.put([(13, 5), (14, 5), (9, 9), (23, 12), (0, 9), (16, 15)], 'T')
    k.put([(11, 7), (23, 6)], 'M')
    k.put([(12, 1), (10, 14)], 'O')
    return k.lane(lane), lane


@level(4)
def l4():
    # Hormuz Island: a long switchback across red soil.
    lane = [(-1, 2), (22, 2), (22, 6), (2, 6), (2, 10), (22, 10), (22, 14), (3, 14)]
    k = Canvas()
    k.rect(0, 0, 24, 0, '#')
    k.rect(0, 3, 20, 5, '.').rect(0, 3, 20, 3, ',').rect(4, 5, 20, 5, ',')
    k.rect(4, 7, 24, 9, '.').rect(4, 7, 20, 7, ',').rect(4, 9, 24, 9, ',')
    k.rect(0, 11, 20, 13, '.').rect(0, 11, 20, 11, ',').rect(4, 13, 20, 13, ',')
    k.rect(24, 1, 24, 15, '.').rect(23, 3, 23, 13, ',').rect(0, 15, 24, 15, '.')
    k.rect(0, 7, 1, 9, '.').rect(0, 13, 2, 14, '#')
    k.put([(2, 14)], 'A')
    k.put([(3, 4), (9, 4), (17, 4), (6, 8), (14, 8), (20, 8), (2, 12), (11, 12), (18, 12), (6, 15), (16, 15)], 'P')
    k.put([(5, 4), (6, 4), (12, 8), (13, 8), (8, 12), (9, 12), (24, 6)], 'T')
    k.put([(14, 4), (16, 12)], 'M')
    k.put([(8, 1), (16, 1)], 'O')
    return k.lane(lane), lane


@level(5)
def l5():
    # Qeshm narrows: mostly shallows, a few spits of land, deep water only in the channel.
    lane = [(-1, 7), (7, 7), (7, 3), (16, 3), (16, 11), (23, 11)]
    k = Canvas()
    k.rect(0, 0, 24, 15, ',').rect(0, 0, 24, 0, '~')
    k.rect(0, 2, 3, 4, '.').rect(10, 5, 13, 8, '.').rect(19, 2, 24, 7, '.').rect(0, 10, 11, 13, '.').rect(0, 15, 24, 15, '.')
    k.rect(18, 13, 24, 14, '.').rect(10, 0, 13, 1, '.')
    k.around(lane, '~').lane(lane)
    k.rect(24, 10, 24, 12, '#').put([(24, 11)], 'A')
    k.put([(1, 3), (11, 6), (21, 4), (3, 12), (9, 12), (22, 15), (12, 0)], 'P')
    k.put([(20, 6), (6, 12), (7, 12), (14, 15)], 'T')
    k.put([(23, 3)], 'M')
    k.put([(2, 9), (21, 9)], 'O')
    return k, lane


@level(6)
def l6():
    # Bandar Abbas harbour: the fleet comes up from the south, threads the piers, docks at the Ayatower.
    lane = [(12, 16), (12, 11), (4, 11), (4, 4), (18, 4), (18, 8), (21, 8)]
    k = Canvas()
    k.rect(0, 0, 24, 1, '.').rect(0, 2, 24, 2, ',')
    k.rect(6, 6, 16, 9, ',').rect(7, 6, 7, 9, '.').rect(10, 6, 10, 9, '.').rect(13, 6, 13, 9, '.').rect(16, 6, 16, 9, '.')
    k.rect(0, 3, 2, 15, '.').rect(3, 3, 3, 14, ',')
    k.rect(14, 13, 24, 15, '.').rect(14, 12, 24, 12, ',').rect(20, 3, 24, 7, '.').rect(20, 9, 24, 11, '.').rect(19, 3, 19, 7, ',')
    k.rect(5, 13, 10, 15, ',').rect(5, 14, 9, 15, '.')
    k.rect(22, 8, 24, 8, '#').put([(22, 8)], 'A')
    k.put([(1, 0), (8, 1), (15, 0), (1, 6), (1, 12), (22, 5), (23, 14), (16, 14)], 'P')
    k.put([(3, 0), (4, 0), (5, 1), (11, 0), (12, 0), (19, 1), (20, 0), (0, 9), (21, 10), (18, 14)], 'T')
    k.put([(9, 0), (23, 4)], 'M')
    k.put([(22, 1)], '.')
    return k.lane(lane), lane


@level(7)
def l7():
    # Hengam shoals: the lane loops round the island and crosses itself.
    lane = [(-1, 4), (16, 4), (16, 11), (8, 11), (8, 1), (20, 1), (20, 13), (22, 13)]
    k = Canvas()
    k.rect(0, 0, 24, 15, ',')
    k.rect(9, 5, 15, 10, '.').rect(0, 6, 6, 15, '.').rect(18, 3, 18, 15, '~').rect(22, 2, 24, 11, '.')
    k.rect(10, 13, 18, 15, '.').rect(0, 0, 6, 2, '.')
    k.rect(0, 3, 24, 5, '~').rect(7, 0, 24, 2, '~').rect(7, 0, 9, 15, '~').rect(15, 3, 21, 12, '~')
    k.rect(9, 5, 15, 10, '.').rect(22, 3, 24, 11, '.')
    k.lane(lane)
    k.rect(9, 12, 18, 12, ',').rect(19, 14, 21, 15, ',').rect(23, 12, 24, 15, '#').put([(23, 13)], 'A')
    k.put([(10, 6), (14, 9), (1, 8), (4, 13), (23, 4), (12, 14), (1, 0)], 'P')
    k.put([(12, 6), (13, 6), (2, 10), (3, 10), (24, 8), (16, 14)], 'T')
    k.put([(11, 9), (4, 0)], 'M')
    k.put([(4, 2)], 'O')
    return k, lane


@level(8)
def l8():
    # Bandar Lengeh: out along the coast and back again past the same sandbar.
    lane = [(-1, 5), (22, 5), (22, 9), (1, 9)]
    k = Canvas()
    k.rect(0, 0, 24, 2, '.').rect(0, 3, 24, 3, ',')
    k.rect(0, 6, 20, 8, '.').rect(0, 6, 20, 6, ',').rect(0, 8, 20, 8, ',').rect(20, 7, 20, 7, ',')
    k.rect(24, 3, 24, 15, '.').rect(23, 4, 23, 12, ',')
    k.rect(0, 11, 24, 15, '.').rect(0, 11, 22, 11, ',').rect(0, 10, 0, 10, '#')
    k.rect(0, 8, 0, 10, '#').put([(0, 9)], 'A')
    k.put([(2, 0), (7, 1), (13, 0), (19, 1), (3, 7), (10, 7), (17, 7), (4, 13), (11, 14), (18, 13), (24, 6)], 'P')
    k.put([(4, 0), (5, 0), (16, 0), (6, 7), (14, 7), (7, 13), (8, 13), (15, 13), (21, 14)], 'T')
    k.put([(10, 1), (12, 13)], 'M')
    return k.lane(lane), lane


@level(9)
def l9():
    # The Tunbs: the lane winds round two islands.
    lane = [(-1, 8), (5, 8), (5, 2), (12, 2), (12, 13), (19, 13), (19, 4), (23, 4)]
    k = Canvas()
    k.rect(0, 0, 24, 15, '~')
    k.rect(7, 4, 10, 11, '.').rect(6, 3, 11, 3, ',').rect(6, 12, 11, 12, ',').rect(6, 4, 6, 11, ',').rect(11, 4, 11, 11, ',')
    k.rect(14, 6, 17, 11, '.').rect(13, 5, 18, 5, ',').rect(13, 12, 18, 12, ',').rect(13, 6, 13, 11, ',').rect(18, 6, 18, 11, ',')
    k.rect(0, 10, 3, 15, '.').rect(0, 0, 3, 6, '.').rect(4, 10, 4, 14, ',').rect(4, 0, 4, 6, ',')
    k.rect(21, 6, 24, 15, '.').rect(20, 6, 20, 14, ',').rect(14, 0, 24, 1, '.').rect(13, 2, 24, 2, ',')
    k.rect(6, 15, 19, 15, '.').rect(6, 14, 10, 14, ',')
    k.rect(24, 3, 24, 5, '#').put([(24, 4)], 'A')
    k.put([(8, 5), (9, 10), (15, 7), (16, 10), (1, 12), (2, 2), (22, 9), (23, 13), (16, 0), (8, 15)], 'P')
    k.put([(8, 8), (15, 9), (0, 14), (1, 1), (22, 12), (20, 0), (12, 15)], 'T')
    k.put([(9, 6), (23, 7)], 'M')
    return k.lane(lane), lane


@level(10)
def l10():
    # The Black Gate of Hormuz: a short lane through a wall of rock and solid ground.
    lane = [(-1, 7), (8, 7), (8, 11), (16, 11), (16, 6), (22, 6)]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.')
    k.rect(0, 6, 9, 8, '~').rect(7, 6, 9, 12, '~').rect(7, 10, 17, 12, '~').rect(15, 5, 17, 12, '~').rect(15, 5, 22, 7, '~')
    k.rect(0, 5, 6, 5, ',').rect(0, 9, 6, 9, ',').rect(10, 9, 14, 9, ',').rect(6, 13, 18, 13, ',').rect(18, 8, 22, 8, ',').rect(10, 4, 14, 4, ',')
    k.lane(lane)
    k.rect(0, 0, 24, 0, '#').rect(0, 1, 3, 4, '#').rect(0, 10, 3, 15, '#').rect(23, 4, 24, 8, '#').put([(23, 6)], 'A')
    k.put([(6, 2), (12, 1), (20, 2), (5, 12), (12, 15), (21, 12)], 'P')
    k.put([(9, 2), (10, 2), (19, 14), (20, 14)], 'T')
    k.put([(15, 1)], 'M')
    return k, lane


if __name__ == '__main__':
    n = int(sys.argv[1])
    k, lane = LEVELS[n]()
    print(ts(k.rows()))
    print('  lane: [' + ', '.join(f'[{c}, {r}]' for c, r in lane) + '],')
