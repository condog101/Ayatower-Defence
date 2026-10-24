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


def lane_samples(lane, step=8):
    """Points every `step` px along the polyline through the lane's dense cell centres (the spline in
    web/src/sim/path.ts strays only a few px from it, inside the PROTECT margins)."""
    p = [(c * 32 + 16, r * 32 + 16) for c, r in dense(lane)]
    out = [p[0]]
    carry = 0.0
    for (ax, ay), (bx, by) in zip(p, p[1:]):
        L = ((bx - ax) ** 2 + (by - ay) ** 2) ** 0.5
        d = step - carry
        while d <= L:
            out.append((ax + (bx - ax) * d / L, ay + (by - ay) * d / L))
            d += step
        carry = L - (d - step)
    return out


# Reach a protected cell must keep on its lane: the AA pit's tier-1 90 px less the 10 px lateral
# drift of aircraft (sim/enemies.ts LATERAL); mines' tier-1 90 px for the shallows.
AA_PROTECT = 80
MINE_PROTECT = 90


def thin(k, lanes, keep=(), target=0.40, min_land=14, air=None):
    """Scarce prime spots: turn buildable cells within 110 px of a lane into cliffs (and the odd
    palm) until at most `target` of all buildable cells are in range, sparing the `keep` rects and
    any cell that is the last one covering some stretch of lane: land for the lanes aircraft fly
    (all of them, or just `air`), shallows for the sea lanes (all but `air`).

    Hand-placed cover goes in after finish(), then thin() again. Straight runs: two rows/cols off
    the lane (64 px). Diagonals: a knight's move (+-2, +-1) on the outer side (68 px). Never one of
    the eight neighbours of a lane cell (45 px, 22.6 px at a bend where the spline cuts the corner),
    never row 0."""
    def kept(c, r):
        return any(x0 <= c <= x1 and y0 <= r <= y1 for x0, y0, x1, y1 in keep)
    cells = [(c, r) for r in range(1, ROWS) for c in range(COLS) if k.g[r][c] in '.,']
    prime = [(c, r) for c, r in cells if lane_dist(lanes, c, r) <= 110]
    air_lanes = list(range(len(lanes))) if air is None else [air]
    sea_lanes = [i for i in range(len(lanes)) if i != air]
    samples = {i: lane_samples(l) for i, l in enumerate(lanes)}
    covers = {}
    count = {}
    for c, r in prime:
        land = k.g[r][c] == '.'
        x, y = c * 32 + 16, r * 32 + 16
        rng, ls = (AA_PROTECT, air_lanes) if land else (MINE_PROTECT, sea_lanes)
        cov = [(land, li, si) for li in ls for si, (sx, sy) in enumerate(samples[li]) if (sx - x) ** 2 + (sy - y) ** 2 <= rng * rng]
        covers[(c, r)] = cov
        for key in cov:
            count[key] = count.get(key, 0) + 1
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
        # never strip the last cover off a stretch of lane
        if any(count[key] <= 1 for key in covers[(c, r)]):
            continue
        for key in covers[(c, r)]:
            count[key] -= 1
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
    thin(k, lanes, keep, target, air=air)
    return k, lanes, air


def flank(k, lanes, ch, step=6, src='.#P'):
    """Every `step` cells along each lane, the cells beside it on both sides become `ch` if they are
    one of `src` and clear of every lane's ring: two off a straight run (64 px), a knight's move off
    a diagonal (68 px)."""
    ring = {(c + dc, r + dr) for l in lanes for c, r in dense(l) for dc in (-1, 0, 1) for dr in (-1, 0, 1)}
    for l in lanes:
        cells = dense(l)
        for i in range(step // 2, len(cells) - 1, step):
            (c0, r0), (c1, r1) = cells[i], cells[i + 1]
            dc, dr = c1 - c0, r1 - r0
            for s_ in (1, -1):
                if dc and dr:
                    nc, nr = c0 - 2 * dr * s_, r0 + dc * s_
                else:
                    nc, nr = c0 - dr * 2 * s_, r0 + dc * 2 * s_
                if 0 <= nc < COLS and 1 <= nr < ROWS and (nc, nr) not in ring and k.g[nr][nc] in src:
                    k.g[nr][nc] = ch
    return k


def reefs(k, lanes, step=6):
    """Shallows beside the lanes, so the mines can reach every stretch."""
    return flank(k, lanes, ',', step)


def islets(k, lanes, step=3):
    """Little islands beside the lanes in open water, so the AA pits can reach every stretch."""
    return flank(k, lanes, '.', step, src='~,')


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
    # sandbars round the bay, so the piers reach the whole sweep
    k.put([(15, 6), (17, 6), (19, 6), (11, 4), (10, 5), (12, 9), (8, 9), (13, 10), (9, 12), (14, 11), (16, 11), (18, 11),
           (15, 15), (18, 15), (21, 15)], '.')
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
    k.rect(8, 6, 17, 10, '.')
    k.rect(0, 4, 2, 15, '.').rect(23, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(2, 8, 2, 12, ',').rect(23, 5, 23, 10, ',')  # reefs off the west and east shores
    k.put([(8, 4), (17, 12), (1, 6), (1, 13), (24, 3), (24, 12), (12, 8)], 'P')
    k.put([(10, 7), (11, 7), (0, 9), (24, 8)], 'T')
    k.put([(15, 9)], 'M')
    k.put([(12, 0)], 'O')
    rims = [(7, 4, 18, 4), (7, 12, 18, 12)]
    k, lanes, air = finish(k, lanes, (4, 6), keep=rims)
    k.rect(3, 4, 3, 5, '#')
    # breakwaters and reefs so the AA pits and mines can reach every stretch of the loop
    k.put([(1, 4), (4, 4), (23, 4), (23, 8), (23, 12), (17, 12), (6, 7), (6, 11)], '.')
    k.put([(8, 15), (12, 15), (16, 15), (21, 14), (3, 3), (8, 3), (13, 3)], ',')
    thin(k, lanes, rims, air=air)
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
    # land beside the entry run and the switchbacks, reefs off the diagonals
    k.put([(2, 3), (5, 3), (7, 3), (12, 9), (10, 11), (12, 11), (17, 13), (19, 11)], '.')
    k.put([(11, 1), (12, 2), (13, 3), (11, 10), (18, 12), (20, 10)], ',')
    thin(k, lanes, air=air)
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
    # sandbanks along the northern creek, where the reapers fly
    k.put([(1, 4), (11, 4), (12, 5), (16, 3), (18, 3), (20, 5), (22, 5), (20, 9), (12, 9)], '.')
    thin(k, lanes, air=air)
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
    # a spit beside the south lane and a sandbar under the quay, in AA reach of both lanes
    k.put([(7, 10), (7, 12), (7, 14), (11, 13), (11, 15), (13, 9), (14, 8), (10, 6), (16, 4), (6, 2), (8, 2), (10, 2), (12, 2)], '.')
    thin(k, lanes, air=air)
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
    # islets and reefs round the knot; the air corridor stays the SAM's
    k.put([(24, 5), (24, 9), (11, 3), (13, 3)], '.')
    k.put([(4, 7), (5, 8), (19, 12), (20, 11), (13, 4), (12, 5), (11, 6), (10, 13)], ',')
    thin(k, lanes, air=air)
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
    k.put([(6, 1), (8, 1), (2, 11), (23, 4)], '.')
    k.put([(6, 5), (6, 7), (16, 10), (18, 10), (15, 8)], ',')
    thin(k, lanes, air=air)
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
    k.put([(12, 6), (12, 10), (19, 2), (19, 14)], '.')
    thin(k, lanes, air=air)
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
    k.put([(2, 6), (5, 6), (2, 10), (5, 10)], '.')  # islets in the outer bay for the AA pits
    thin(k, lanes, air=air)
    return k, lanes, air


# ---------------------------------------------------------------------------
# Act II: the Gulf. All towers from the start; difficulty comes from geometry and the fleet.


@level(11)
def l11():
    # Kish: the lane runs along the north shore and turns south to the tower beside the resort.
    lanes = [[(-1, 2), (14, 2), (14, 9)]]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(17, 4, 22, 9, ',').rect(18, 5, 21, 8, '~').rect(2, 9, 9, 14, ',').rect(3, 10, 8, 13, '~')  # the resort lagoons
    k.put([(17, 3), (22, 3), (17, 10), (22, 10), (1, 8), (10, 9), (24, 12), (0, 14)], 'P')
    k.put([(19, 11), (20, 11), (11, 13)], 'T')
    k.put([(5, 6)], 'M')
    k, lanes, air = finish(k, lanes, (14, 10))
    reefs(k, lanes, 5)
    thin(k, lanes, air=air)
    return k, lanes, air


@level(12)
def l12():
    # Lavan shoals: a lane from the west and one from the south run over wide shallows and merge late.
    lanes = [
        [(-1, 4), (10, 4), (14, 8), (19, 8)],
        [(8, 16), (8, 13), (13, 8), (19, 8)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, ',').rect(0, 0, 24, 0, '#')
    k.rect(0, 7, 5, 15, '.').rect(13, 11, 24, 15, '.').rect(16, 0, 24, 5, '.').rect(22, 6, 24, 10, '.')
    k.rect(2, 10, 4, 13, '~').rect(18, 13, 21, 15, '~')
    k.put([(1, 8), (4, 14), (15, 13), (23, 14), (18, 2), (23, 3), (22, 7)], 'P')
    k.put([(1, 12), (17, 12), (20, 1), (21, 1)], 'T')
    k.put([(23, 9)], 'M')
    k.put([(12, 1), (3, 2)], 'O')
    k, lanes, air = finish(k, lanes, (20, 8))
    k.rect(21, 7, 21, 9, '#')
    islets(k, lanes, 3)
    thin(k, lanes, air=air)
    return k, lanes, air


@level(13)
def l13():
    # Abu Musa: three hunters come from the north, the west and the south, join mid-strait and run
    # together to the tower on the east shore.
    lanes = [
        [(4, -1), (4, 3), (9, 8), (21, 8)],
        [(-1, 8), (21, 8)],
        [(4, 16), (4, 13), (9, 8), (21, 8)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(0, 1, 1, 4, ',').rect(0, 12, 1, 15, ',').rect(15, 1, 24, 3, '~').rect(15, 13, 24, 15, '~')
    k.rect(16, 2, 23, 2, ',').rect(16, 14, 23, 14, ',')
    k.put([(1, 6), (1, 10), (8, 2), (8, 14), (14, 4), (14, 12), (20, 5), (20, 11)], 'P')
    k.put([(11, 2), (11, 14), (23, 6)], 'T')
    k.put([(23, 10)], 'M')
    k, lanes, air = finish(k, lanes, (22, 8))
    reefs(k, lanes, 6)
    thin(k, lanes, air=air)
    return k, lanes, air


@level(14)
def l14():
    # Siri: two sea lanes slant in from the north corners and meet the sky road just above the tower;
    # the jets fly the sky road straight down the middle.
    lanes = [
        [(3, -1), (3, 3), (11, 11), (12, 12), (12, 13)],
        [(21, -1), (21, 3), (13, 11), (12, 12), (12, 13)],
        [(12, -1), (12, 13)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(0, 12, 4, 15, ',').rect(20, 12, 24, 15, ',').rect(1, 13, 2, 14, '~').rect(22, 13, 23, 14, '~')
    k.put([(1, 6), (23, 6), (4, 10), (20, 10), (8, 1), (16, 1)], 'P')
    k.put([(2, 9), (22, 9)], 'T')
    k.put([(7, 14), (17, 14)], 'O')
    k, lanes, air = finish(k, lanes, (12, 14), air=2)
    reefs(k, lanes, 5)
    thin(k, lanes, air=air)
    return k, lanes, air


@level(15)
def l15():
    # Asaluyeh: two lanes among the gas platforms and a sky road straight down the middle (the boss flies it).
    lanes = [
        [(25, 2), (18, 2), (13, 7), (2, 7)],
        [(25, 14), (18, 14), (13, 9), (2, 9)],
        [(25, 8), (3, 8)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(19, 4, 24, 4, ',').rect(19, 12, 24, 12, ',')
    k.put([(8, 2), (11, 3), (21, 4), (8, 13), (11, 12), (21, 12), (2, 3), (2, 12)], 'O')
    k.put([(5, 2), (5, 13), (15, 4), (15, 12)], 'P')
    k.put([(1, 4), (1, 11)], 'T')
    k, lanes, air = finish(k, lanes, (2, 8), air=2)
    reefs(k, lanes, 6)
    thin(k, lanes, air=air)
    return k, lanes, air


@level(16)
def l16():
    # Bushehr roads: one lane bending back through the mudflats, with the dead marshes to the south.
    lanes = [[(-1, 2), (19, 2), (19, 7), (4, 7)]]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(0, 13, 24, 15, ',').rect(3, 14, 6, 15, '~').rect(12, 14, 15, 15, '~').rect(19, 14, 22, 15, '~')
    k.rect(0, 12, 24, 12, '.').put([(1, 13), (9, 14), (17, 13), (23, 13), (24, 14)], '.')
    k.put([(7, 11), (16, 11), (23, 3), (23, 7)], 'P')
    k.put([(1, 10), (23, 5)], 'T')
    k, lanes, air = finish(k, lanes, (3, 7))
    reefs(k, lanes, 5)
    thin(k, lanes, air=air)
    return k, lanes, air


@level(17)
def l17():
    # Farsi Island: three fleets from the north, the east and the south join off the island and run in
    # to the tower on its east tip; most of the fight is in the water.
    lanes = [
        [(20, -1), (20, 3), (15, 8), (9, 8)],
        [(25, 8), (9, 8)],
        [(20, 16), (20, 13), (15, 8), (9, 8)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, ',').rect(0, 0, 24, 0, '~')
    k.rect(0, 3, 7, 12, '.').rect(1, 5, 5, 10, '#').rect(2, 6, 4, 9, '.')  # the island
    k.rect(9, 1, 14, 2, '~').rect(9, 14, 14, 15, '~').rect(22, 1, 24, 2, '.').rect(22, 14, 24, 15, '.')
    k.rect(10, 4, 12, 5, '.').rect(10, 11, 12, 12, '.')
    k.put([(1, 4), (6, 11), (3, 7)], 'P')
    k.put([(2, 11)], 'T')
    k.put([(17, 1), (17, 15), (24, 5)], 'O')
    k, lanes, air = finish(k, lanes, (8, 8))
    islets(k, lanes, 3)
    thin(k, lanes, air=air)
    return k, lanes, air


@level(18)
def l18():
    # Kharg Terminal: two lanes cross mid-strait and meet again at the tower.
    lanes = [
        [(-1, 2), (3, 2), (15, 14), (21, 8), (22, 8)],
        [(-1, 14), (3, 14), (15, 2), (21, 8), (22, 8)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(0, 6, 2, 10, ',').rect(23, 1, 24, 4, ',').rect(23, 12, 24, 15, ',')
    k.put([(1, 5), (1, 11), (9, 3), (9, 13), (20, 1), (20, 15)], 'P')
    k.put([(0, 8), (24, 6)], 'T')
    k.put([(24, 10)], 'M')
    k.put([(9, 0)], 'O')
    k, lanes, air = finish(k, lanes, (23, 8))
    reefs(k, lanes, 6)
    thin(k, lanes, air=air)
    return k, lanes, air


@level(19)
def l19():
    # Khor Musa: a tidal channel that doubles back three times before the tower.
    lanes = [[(2, -1), (2, 10), (6, 10), (6, 2), (10, 2), (10, 10), (14, 10), (14, 4)]]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(18, 3, 24, 12, ',').rect(20, 5, 23, 10, '~')
    k.rect(1, 13, 14, 15, ',').rect(4, 14, 11, 15, '~')
    k.put([(17, 1), (22, 2), (17, 14), (23, 14)], 'P')
    k.put([(20, 13), (21, 13)], 'T')
    k.put([(22, 4)], 'O')
    k, lanes, air = finish(k, lanes, (14, 3))
    reefs(k, lanes, 5)
    thin(k, lanes, air=air)
    return k, lanes, air


@level(20)
def l20():
    # Arvand Rud: three channels funnel into one short final run to the tower (no sky road: the
    # resort's jets fly every lane).
    lanes = [
        [(-1, 2), (10, 2), (16, 8), (21, 8)],
        [(-1, 8), (21, 8)],
        [(-1, 14), (10, 14), (16, 8), (21, 8)],
    ]
    k = Canvas()
    k.rect(0, 0, 24, 15, '.').rect(0, 0, 24, 0, '#')
    k.rect(18, 1, 24, 3, ',').rect(18, 13, 24, 15, ',')
    k.put([(20, 5), (20, 11), (14, 2), (14, 14), (23, 6)], 'P')
    k.put([(22, 4), (22, 12)], 'T')
    k, lanes, air = finish(k, lanes, (22, 8))
    reefs(k, lanes, 6)
    thin(k, lanes, air=air)
    return k, lanes, air


if __name__ == '__main__':
    n = int(sys.argv[1])
    k, lanes, air = LEVELS[n]()
    print(ts(k.rows()))
    print('  lanes: [' + ', '.join('[' + ', '.join(f'[{c}, {r}]' for c, r in l) + ']' for l in lanes) + '],')
