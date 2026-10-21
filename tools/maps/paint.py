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

    def lanes(self, lanes):
        for l in lanes:
            self.lane(l)
        return self

    def moat(self, lanes, keep='#'):
        """A one-cell margin of deep water around every lane (rock is allowed to stay)."""
        for l in lanes:
            for c, r in dense(l):
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        cc, rr = c + dc, r + dr
                        if 0 <= cc < COLS and 0 <= rr < ROWS and self.g[rr][cc] not in keep:
                            self.g[rr][cc] = '~'
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



def _seg(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    t = 0 if L2 == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L2))
    return ((px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2) ** 0.5


def lane_dist(lanes, c, r):
    x, y = c * 32 + 16, r * 32 + 16
    best = 1e9
    for l in lanes:
        p = [(cc * 32 + 16, rr * 32 + 16) for cc, rr in dense(l)]
        for i in range(len(p) - 1):
            best = min(best, _seg(x, y, *p[i], *p[i + 1]))
    return best


def thin(k, lanes, keep=(), target=0.40, min_land=14):
    """Scarce prime spots: turn buildable cells within 110 px of a lane into cliffs (and the odd
    palm) until at most `target` of all buildable cells are in range, sparing the `keep` rects."""
    def kept(c, r):
        return any(x0 <= c <= x1 and y0 <= r <= y1 for x0, y0, x1, y1 in keep)
    cells = [(c, r) for r in range(1, ROWS) for c in range(COLS) if k.g[r][c] in '.,']
    prime = [(c, r) for c, r in cells if lane_dist(lanes, c, r) <= 110]
    # thin the closest cells first, then the rest in a fixed scattered order
    # land goes before shallows (sea towers need somewhere); the marginal cells (70-110 px) go before
    # the close ones, so what's left is a few good spots; then a fixed scatter
    order = sorted(
        (cr for cr in prime if not kept(*cr)),
        key=lambda cr: (k.g[cr[1]][cr[0]] == ',', lane_dist(lanes, *cr) <= 70, (cr[0] * 7 + cr[1] * 13) % 11),
    )
    n_prime, n_all = len(prime), len(cells)
    land_left = sum(1 for c, r in prime if k.g[r][c] == '.')
    for i, (c, r) in enumerate(order):
        if n_prime / max(1, n_all) <= target:
            break
        water = k.g[r][c] == ','
        # always leave some land in range for the land towers
        if not water and land_left <= min_land:
            continue
        if not water:
            land_left -= 1
        k.g[r][c] = '~' if water else ('P' if i % 6 == 5 else '#')
        n_prime -= 1
        n_all -= 1
    return k


def clear_corners(k, lanes):
    """Rock right round a bend becomes water: the spline cuts the corner a little."""
    for l in lanes:
        for c, r in l[1:-1]:
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):
                    if 0 <= c + dc < COLS and 0 <= r + dr < ROWS and k.g[r + dr][c + dc] == '#':
                        k.g[r + dr][c + dc] = '~'
    return k


def finish(k, lanes, aya, air=None, keep=(), target=0.40):
    """Moat, lanes, the Ayatower, then thin the prime spots."""
    k.moat(lanes).lanes(lanes)
    clear_corners(k, lanes)
    k.put([aya], 'A')
    thin(k, lanes, keep, target)
    return k, lanes, air


@level(1)
def l1():
    # Jask: one lane sweeps in from the north-east, round a sandbar islet in the bay, to the tower.
    lanes = [[(25, -1), (20, 4), (14, 4), (10, 8), (10, 10), (13, 13), (21, 13)]]
    k = Canvas()
    k.rect(0, 1, 6, 15, '.').rect(0, 1, 11, 2, '.').rect(7, 11, 8, 15, '#')
    k.rect(13, 7, 17, 10, '#').rect(22, 3, 24, 11, '.').rect(0, 15, 24, 15, '.').rect(14, 15, 21, 15, '#')
    k.rect(7, 4, 8, 9, '#').rect(22, 12, 24, 15, '#')
    k.put([(1, 4), (3, 7), (5, 2), (2, 12), (4, 14), (15, 8), (23, 5), (23, 9)], 'P')
    k.put([(1, 9), (2, 9), (3, 3), (9, 1), (23, 7)], 'T')
    k.put([(4, 5)], 'M')
    k.put([(15, 1), (19, 9)], 'O')
    k, lanes, air = finish(k, lanes, (22, 13))
    k.rect(15, 3, 19, 3, ',').rect(14, 12, 20, 12, ',')
    thin(k, lanes)
    return k, lanes, air


@level(2)
def l2():
    # Sirik: the lane hugs a jagged cliff coast with two narrows; an offshore reef of shallows.
    lanes = [[(-1, 3), (6, 3), (9, 6), (15, 6), (18, 3), (21, 3), (21, 9), (17, 13), (8, 13)]]
    k = Canvas()
    k.rect(0, 5, 7, 15, '.').rect(0, 8, 13, 15, '.').rect(0, 0, 24, 1, '.')
    k.rect(10, 8, 15, 10, '.').rect(23, 0, 24, 15, '.').rect(11, 2, 14, 3, ',').rect(19, 6, 19, 8, ',')
    k.rect(8, 5, 8, 9, '#').rect(16, 8, 17, 10, '#').rect(22, 11, 24, 15, '#').rect(0, 5, 2, 7, '#')
    k.put([(2, 0), (8, 0), (15, 0), (3, 10), (6, 14), (12, 9), (24, 4), (1, 12)], 'P')
    k.put([(4, 9), (5, 9), (19, 0), (11, 0), (2, 14)], 'T')
    k.put([(4, 12)], 'M')
    k.put([(13, 4)], 'O')
    k, lanes, air = finish(k, lanes, (7, 13))
    k.rect(9, 4, 14, 4, ',').rect(9, 14, 16, 14, ',')
    k.put([(8, 6)], '~')  # the curve into the first narrows cuts this corner
    thin(k, lanes)
    return k, lanes, air


@level(3)
def l3():
    # Larak: the lane loops three-quarters round the island. Short-range towers line its rim; the
    # central plateau is out of reach of the water, a place for the long guns.
    lanes = [[(-1, 2), (19, 2), (21, 4), (21, 11), (18, 14), (6, 14), (4, 12), (4, 7)]]
    k = Canvas()
    k.rect(6, 4, 19, 12, '#').rect(7, 4, 18, 4, '.').rect(7, 12, 18, 12, '.').rect(6, 5, 6, 11, '.').rect(19, 5, 19, 11, '.')
    k.rect(9, 7, 16, 9, '.')
    k.rect(0, 4, 2, 15, '.').rect(23, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(2, 8, 2, 12, ',').rect(23, 5, 23, 10, ',')  # reefs off the west and east shores
    k.put([(8, 4), (17, 12), (1, 6), (1, 13), (24, 3), (24, 12), (12, 8)], 'P')
    k.put([(10, 7), (11, 7), (0, 9), (24, 8)], 'T')
    k.put([(15, 9)], 'M')
    k.put([(12, 0)], 'O')
    k, lanes, air = finish(k, lanes, (4, 6), keep=[(7, 4, 18, 4), (7, 12, 18, 12)])
    k.rect(3, 4, 3, 5, '#')
    return k, lanes, air


@level(4)
def l4():
    # Hormuz Island: one long switchback of diagonals across red cliffs, the runs far apart.
    lanes = [[(-1, 1), (8, 1), (12, 5), (12, 6), (6, 12), (6, 13), (14, 13), (20, 7), (20, 3), (23, 3)]]
    k = Canvas()
    k.rect(0, 3, 9, 10, '.').rect(0, 11, 4, 15, '.').rect(14, 0, 24, 2, '.').rect(13, 4, 18, 10, '.').rect(22, 4, 24, 15, '.')
    k.rect(8, 14, 21, 15, '.').rect(5, 3, 8, 5, '#').rect(15, 7, 17, 9, '#').rect(22, 10, 24, 12, '#')
    k.put([(1, 4), (3, 8), (2, 13), (16, 1), (23, 6), (23, 14), (10, 15), (18, 15)], 'P')
    k.put([(1, 6), (2, 6), (14, 5), (19, 1), (12, 15)], 'T')
    k.put([(16, 5)], 'M')
    k.rect(0, 3, 4, 3, ',').rect(8, 15, 13, 15, ',').rect(22, 4, 22, 9, ',')  # reefs
    k, lanes, air = finish(k, lanes, (24, 3))
    return k, lanes, air


@level(5)
def l5():
    # Qeshm narrows (boss): a main channel and a northern creek merge before the tower; two spits of land.
    lanes = [
        [(-1, 10), (7, 10), (10, 7), (18, 7), (22, 7)],
        [(-1, 2), (12, 2), (15, 5), (18, 5), (18, 7), (22, 7)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, ',').rect(0, 0, 24, 0, '~')
    k.rect(0, 12, 12, 15, '.').rect(3, 4, 8, 7, '.').rect(13, 9, 17, 12, '.')
    k.rect(19, 0, 24, 3, '#').rect(20, 9, 24, 15, '#')
    k.put([(1, 13), (5, 14), (9, 13), (4, 5), (15, 11)], 'P')
    k.put([(7, 14), (8, 14), (6, 6)], 'T')
    k.put([(3, 13)], 'M')
    k, lanes, air = finish(k, lanes, (23, 7))
    k.rect(23, 6, 24, 6, '#').rect(23, 8, 24, 8, '#').put([(24, 7)], '#')
    return k, lanes, air


@level(6)
def l6():
    # Bandar Abbas: one lane from the south, one from the east, through a harbour of breakwaters and shallows.
    lanes = [
        [(9, 16), (9, 10), (13, 6), (13, 4), (6, 4)],
        [(25, 10), (19, 10), (15, 6), (13, 4), (6, 4)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, ',').rect(0, 0, 24, 1, '.')
    k.rect(0, 2, 3, 15, '.').rect(19, 12, 24, 15, '.').rect(17, 2, 24, 7, '.')
    k.rect(11, 12, 16, 12, '#').rect(5, 8, 6, 14, '#').rect(15, 9, 16, 9, '#')
    k.put([(1, 0), (6, 0), (14, 0), (1, 5), (2, 11), (20, 3), (23, 13)], 'P')
    k.put([(3, 0), (4, 0), (10, 0), (11, 0), (19, 0), (0, 8), (22, 5), (21, 14)], 'T')
    k.put([(8, 0), (23, 3)], 'M')
    k, lanes, air = finish(k, lanes, (5, 4))
    k.rect(4, 3, 5, 3, '#').rect(4, 5, 5, 5, '#')
    return k, lanes, air


@level(7)
def l7():
    # Hengam: a figure-eight sea lane, and a straight air corridor across the map (aircraft fly it).
    lanes = [
        [(-1, 4), (4, 4), (8, 8), (12, 12), (16, 12), (19, 9), (19, 4), (16, 4), (12, 8), (12, 13)],
        [(-1, 1), (22, 1), (22, 14), (13, 14)],
    ]
    k = Canvas()
    k.rect(0, 6, 3, 15, '.').rect(5, 2, 9, 5, '.').rect(14, 6, 17, 10, '.').rect(21, 3, 24, 11, '#').rect(14, 14, 24, 15, '.')
    k.rect(6, 10, 9, 15, '.').rect(0, 0, 24, 0, '#')
    k.put([(1, 8), (2, 13), (7, 3), (16, 8), (8, 13), (20, 15)], 'P')
    k.put([(0, 10), (1, 10), (15, 15), (16, 15)], 'T')
    k.put([(15, 7)], 'M')
    k.rect(17, 6, 17, 10, ',').rect(9, 10, 10, 11, ',')  # reefs inside the loops
    k, lanes, air = finish(k, lanes, (12, 14), air=1)
    return k, lanes, air


@level(8)
def l8():
    # Bandar Lengeh: a pincer. One lane winds in from the west, one from the east, and they meet at
    # the tower in the middle of a long coast.
    lanes = [
        [(-1, 13), (4, 13), (4, 3), (9, 3), (11, 5), (11, 7)],
        [(25, 2), (20, 2), (20, 12), (15, 12), (13, 10), (13, 7)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.')
    k.rect(6, 5, 9, 11, '.').rect(15, 4, 18, 10, '.')
    k.rect(0, 0, 24, 0, '#').rect(0, 15, 24, 15, '#').rect(10, 9, 14, 15, '#').rect(10, 0, 14, 3, '#')
    k.rect(0, 9, 2, 11, ',').rect(22, 4, 24, 6, ',')  # reefs off both coasts
    k.put([(1, 2), (2, 6), (7, 6), (8, 10), (16, 5), (17, 9), (22, 9), (23, 13), (6, 14)], 'P')
    k.put([(1, 4), (2, 4), (16, 7), (23, 11), (7, 9)], 'T')
    k.put([(22, 12), (1, 7)], 'M')
    k, lanes, air = finish(k, lanes, (12, 7))
    k.put([(12, 6), (13, 6), (11, 8), (12, 8)], '#')  # the tower's breakwater, around the two lane ends
    k.put([(10, 3)], '~')  # the bend at the cliff foot cuts this corner
    return k, lanes, air


@level(9)
def l9():
    # The Tunbs: three islands, two lanes weaving between them and crossing once.
    lanes = [
        [(-1, 4), (6, 4), (10, 8), (14, 8), (18, 12), (21, 12), (21, 9)],
        [(-1, 12), (6, 12), (10, 8), (14, 8), (18, 4), (21, 4), (21, 7)],
    ]
    k = Canvas()
    k.rect(0, 6, 4, 10, '.').rect(9, 1, 15, 5, '.').rect(9, 11, 15, 14, '.').rect(23, 0, 24, 15, '.')
    k.rect(0, 0, 7, 1, '#').rect(0, 14, 7, 15, '#').rect(16, 0, 21, 1, '#').rect(16, 14, 21, 15, '#')
    k.put([(1, 7), (3, 9), (11, 2), (13, 4), (10, 12), (14, 13), (24, 3), (23, 12)], 'P')
    k.put([(0, 8), (12, 2), (12, 12), (24, 8)], 'T')
    k.put([(13, 3)], 'M')
    k.rect(11, 6, 13, 6, ',').rect(11, 10, 13, 10, ',')  # reefs off the middle islands
    k, lanes, air = finish(k, lanes, (21, 8))
    return k, lanes, air


@level(10)
def l10():
    # The Black Gate (boss): two short lanes through a gate of rock; very little land, maximum pressure.
    lanes = [
        [(-1, 4), (6, 4), (10, 8), (17, 8)],
        [(-1, 12), (6, 12), (10, 8), (17, 8)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, '#').rect(0, 2, 8, 14, '~').rect(9, 6, 20, 10, '~')
    k.rect(2, 7, 4, 9, '.').rect(12, 3, 16, 6, '.').rect(12, 10, 16, 13, '.').rect(21, 2, 24, 14, '.')
    k.rect(0, 0, 24, 1, '#')
    k.put([(13, 4), (15, 12), (22, 3), (23, 13)], 'P')
    k.put([(22, 8)], 'T')
    k.rect(5, 7, 6, 9, ',')  # a reef under the gate
    k, lanes, air = finish(k, lanes, (18, 8))
    k.rect(19, 7, 20, 9, '#')
    return k, lanes, air


if __name__ == '__main__':
    n = int(sys.argv[1])
    k, lanes, air = LEVELS[n]()
    print(ts(k.rows()))
    print('  lanes: [' + ', '.join('[' + ', '.join(f'[{c}, {r}]' for c, r in l) + ']' for l in lanes) + '],')
