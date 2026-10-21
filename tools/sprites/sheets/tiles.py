"""Opaque 16x16 terrain tiles for the Strait map (every tile is seamlessly tileable).

  0-3  deep water animation: dark teal with drifting crests and a few sparkle pixels that move
       4px east per frame (period 16, so 3 -> 0 loops cleanly; the tile also wraps on both axes)
  4    shipping lane water (darker channel with faint dotted channel marks)
  5    shallows (teal over a sandy bottom)
  6    land: meadow grass with moss dither, sandy patches and tufts
  7-22 land shore: 7 + mask, mask bits N=1 E=2 S=4 W=8 flag the sides where water lies;
       each flagged edge is a LOW CLIFF (earth face on the south / east, a lit sandy lip on the
       north / west) with a foam line at its foot; convex corners are rounded
  23   rock: slate crags with snow caps
  24-39 rock shore: 24 + mask, same scheme with dark slate cliff faces, snow on the lit lips, foam
  40   placement OK hatch (green)   41 placement bad hatch (red)
  42   lane marker: lane water with a small wooden lantern post (lantern lit, reflection below)
  43   ancient flagstone road (opaque land variant: worn slabs with moss in the joints)

Every edge pattern is a function of the coordinate along that edge with a 16px period, so
neighbouring edge tiles join seamlessly.
"""
import math

from draw import new, outline, px, rect, strip
from palette import C

NAME = "tiles"
FRAME = (16, 16)
FRAMES = 44
T = 16

N, E, S, W = 1, 2, 4, 8
TAU = 2 * math.pi


def solid(c):
    return new(T, T, c)


def h(x, y, seed):
    """Deterministic per-pixel hash in [0, 1)."""
    v = ((x % T) * 374761393 + (y % T) * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    v = ((v ^ (v >> 13)) * 1274126177) & 0xFFFFFFFF
    return (v ^ (v >> 16)) / 0xFFFFFFFF


def speckle(img, specks, seed):
    for y in range(T):
        for x in range(T):
            r = h(x, y, seed)
            acc = 0.0
            for c, p in specks:
                acc += p
                if r < acc:
                    px(img, x, y, c)
                    break
    return img


# ---------------------------------------------------------------------------
# water

CRESTS = [(1, 2), (9, 5), (4, 9), (12, 12), (7, 14)]
SPARKS = [(5, 3), (13, 10)]


def water(variant):
    img = solid(C["water"])
    # static depth mottling: soft periodic clusters of deeper water
    for y in range(T):
        for x in range(T):
            v = math.sin((x + 0.5) / T * TAU) + math.sin((y + 0.5) / T * 2 * TAU + 1.3)
            if v > 1.0 and h(x, y, 2) < 0.6:
                px(img, x, y, C["water_dk"])
            elif h(x, y, 1) < 0.08:
                px(img, x, y, C["water_dk"])
    # wave crests drifting east 4px per frame (period 16 -> loops after 4 frames)
    for wx, wy in CRESTS:
        x0 = (wx + variant * 4) % T
        for d in range(3):
            px(img, (x0 + d) % T, wy, C["water_lt"])
        px(img, (x0 + 1) % T, (wy - 1) % T, C["water_lt"])
        px(img, (x0 + 3) % T, (wy + 1) % T, C["water_dk"])
    # sparkles: single glints that drift 4px a frame against the crests and twinkle
    for k, (sx, sy) in enumerate(SPARKS):
        x = (sx - variant * 4) % T
        px(img, x, sy, C["white"] if (variant + k) % 2 == 0 else C["foam"])
        if (variant + k) % 3 == 0:
            px(img, x, (sy - 1) % T, C["water_lt"])
    return img


def lane():
    img = solid(C["water_dk"])
    speckle(img, [(C["water"], 0.16)], 21)
    # faint channel marks on the tile corners -> a dotted grid along the lane
    for k in (0, 1, 2, 13, 14, 15):
        px(img, k, 0, C["water_lt"] if k in (0, 15) else C["water"])
        px(img, 0, k, C["water_lt"] if k in (0, 15) else C["water"])
    for k in (6, 7, 8, 9):
        px(img, k, 8, C["water"])
    px(img, 4, 4, C["water"])
    px(img, 11, 12, C["water"])
    return img


def shallows():
    img = solid(C["shallow"])
    speckle(img, [(C["water_lt"], 0.12)], 14)
    # sandy bottom showing through in a soft periodic patch
    for y in range(T):
        for x in range(T):
            if periodic(x, y, 1, 1, 0.9) > 1.2 and (x + y) % 2 == 0:
                px(img, x, y, C["sand_dk"] if h(x, y, 15) > 0.3 else C["sand"])
    # sunlit ripples
    for x0, y in ((2, 3), (10, 7), (5, 12)):
        for d in range(3):
            px(img, (x0 + d) % T, y, C["foam"])
        px(img, (x0 + 1) % T, y + 1, C["water_lt"])
    return img


# ---------------------------------------------------------------------------
# land

def periodic(x, y, fx, fy, ph):
    return math.sin((x + 0.5) / T * TAU * fx + ph) + math.sin((y + 0.5) / T * TAU * fy + ph * 1.7)


TUFTS = [(3, 4), (11, 2), (13, 10), (6, 13), (9, 7)]


def land():
    img = solid(C["grass"])
    speckle(img, [(C["grass_lt"], 0.06), (C["grass_dk"], 0.06)], 4)
    for y in range(T):
        for x in range(T):
            # mossy hollows: checker dither of moss where a low-frequency field dips
            m = periodic(x, y, 1, 1, 0.4)
            if m < -1.5:
                px(img, x, y, C["moss"])
            elif m < -1.0 and (x + y) % 2 == 0:
                px(img, x, y, C["moss"])
            # sun-bleached sandy ground showing through the turf (sparse dither, no hard blob)
            s = periodic(x - 9, y - 3, 1, 2, 2.0)
            if s > 1.6 and (x + y) % 2 == 1:
                px(img, x, y, C["sand"] if h(x, y, 8) > 0.5 else C["sand_dk"])
            elif s > 1.35 and (x * 3 + y) % 4 == 1:
                px(img, x, y, C["moss"])
    # grass tufts: lit blades over a dark root
    for tx, ty in TUFTS:
        px(img, tx, ty, C["grass_lt"])
        px(img, tx + 1, ty - 1, C["grass_lt"])
        px(img, tx, ty + 1, C["grass_dk"])
        px(img, tx + 1, ty, C["grass_dk"])
    # one tiny flower
    px(img, 14, 5, C["cream"])
    return img


def rock():
    img = solid(C["stone"])
    speckle(img, [(C["stone_lt"], 0.10), (C["stone_dk"], 0.14)], 6)
    # crags of different sizes: snow cap on top, lit left flank, dark right flank, black crevice
    for bx, by, w, hgt in ((1, 1, 6, 5), (10, 2, 4, 4), (7, 9, 5, 5), (0, 11, 3, 3), (13, 10, 3, 4)):
        for dy in range(hgt):
            for dx in range(w):
                x, y = bx + dx, by + dy
                inset = max(0, 1 - dy) if dx in (0, w - 1) else 0
                if inset:
                    continue
                if dy == 0 or (dy == 1 and dx < w - 2 and h(x, y, 61) > 0.3):
                    c = C["white"] if dx < w - 1 else C["chrome"]
                elif dx < w // 2:
                    c = C["stone_lt"] if dy < hgt - 1 else C["stone"]
                else:
                    c = C["stone"] if dy < hgt - 1 else C["stone_dk"]
                px(img, x % T, y % T, c)
        for dy in range(1, hgt + 1):
            px(img, (bx + w) % T, (by + dy) % T, C["black"] if dy > 1 else C["stone_dk"])
        for dx in range(1, w + 1):
            px(img, (bx + dx) % T, (by + hgt) % T, C["stone_dk"])
    # cracks
    for x, y in ((7, 5), (8, 6), (8, 7), (14, 13), (15, 14), (0, 14)):
        px(img, x, y, C["stone_dk"])
    return img


# ---------------------------------------------------------------------------
# shores

# per-edge irregularity, indexed by the coordinate along the edge (period 16)
BUMP = [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0]
FOAM2 = [1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0]
R = 4.0  # convex corner radius


def edge_dist(x, y, mask):
    """Distance (in px) to the nearest flagged water edge, with rounded convex corners.

    Returns (d, edge, t): edge is the side that wins, t the coordinate along it."""
    cands = []
    if mask & N:
        cands.append((y, N, x))
    if mask & S:
        cands.append((T - 1 - y, S, x))
    if mask & W:
        cands.append((x, W, y))
    if mask & E:
        cands.append((T - 1 - x, E, y))
    if not cands:
        return None
    d, edge, t = min(cands)
    for a_, b_ in ((N, E), (N, W), (S, E), (S, W)):
        if mask & a_ and mask & b_:
            da = y if a_ == N else T - 1 - y
            db = T - 1 - x if b_ == E else x
            if da < R and db < R:
                rd = R - math.hypot(R - da, R - db)
                if rd < d:
                    d, edge, t = rd, (a_ if da <= db else b_), (x if da <= db else y)
    return d, edge, t


def surf(img, x, y, d, t, seed):
    """Water beyond the rounded corner + the foam line at the cliff foot. True if painted."""
    if d < -0.2:
        px(img, x, y, C["water"] if h(x, y, seed) > 0.25 else C["water_lt"])
        return True
    if d < 1:
        px(img, x, y, C["foam"] if h(x, y, seed + 1) > 0.15 else C["white"])
        return True
    return False


def land_shore(mask):
    img = land()
    if mask == 0:
        return img
    for y in range(T):
        for x in range(T):
            d, edge, t = edge_dist(x, y, mask)
            b = BUMP[t % T]
            if surf(img, x, y, d, t, 31):
                continue
            if edge in (S, E):
                # earth cliff face in the shade, taller on the south side, with strata
                face = (3 if edge == S else 2) + b
                if d < 2:
                    px(img, x, y, C["foam"] if FOAM2[t % T] else C["wood_dk"])
                elif d < face + 1:
                    k = int(d)
                    if k % 2 == 0:
                        px(img, x, y, C["parch_dk"] if (t + k) % 5 else C["sand_dk"])
                    else:
                        px(img, x, y, C["sand_dk"] if (t * 3 + k) % 7 else C["wood_dk"])
                elif d < face + 2:
                    px(img, x, y, C["grass_dk"])  # overhanging turf lip
                elif d < face + 3 and (x + y) % 2 == 0:
                    px(img, x, y, C["moss"])
            else:
                # sunlit north / west lip: a narrow bright sandy drop + wet sand at the foot
                face = 1 + b
                if d < 2:
                    px(img, x, y, C["sand_dk"] if FOAM2[t % T] == 0 else C["foam"])
                elif d < face + 2:
                    px(img, x, y, C["sand_lt"] if (int(d) + t) % 4 else C["sand"])
                elif d < face + 3:
                    px(img, x, y, C["grass_lt"] if (x + y) % 2 == 0 else C["grass"])
    return img


def rock_shore(mask):
    img = rock()
    if mask == 0:
        return img
    for y in range(T):
        for x in range(T):
            d, edge, t = edge_dist(x, y, mask)
            b = BUMP[t % T]
            if surf(img, x, y, d, t, 33):
                continue
            if edge in (S, E):
                # shadowed slate cliff face; taller on the south side
                face = (4 if edge == S else 3) + b
                if d < 2:
                    px(img, x, y, C["black"])
                elif d < face + 1:
                    k = int(d)
                    px(img, x, y, C["stone_dk"] if (t + k * 2) % 5 else C["black"])
                    if k == int(face) and t % 3 == 0:
                        px(img, x, y, C["stone"])
                elif d < face + 2:
                    px(img, x, y, C["stone_lt"])
                elif d < face + 3 and (x + y) % 2 == 0:
                    px(img, x, y, C["white"])  # snow along the crest
            else:
                # lit north / west lip with a snow cornice
                face = 1 + b
                if d < 2:
                    px(img, x, y, C["stone_dk"])
                elif d < face + 2:
                    px(img, x, y, C["stone_lt"] if (x + y) % 3 else C["stone"])
                elif d < face + 3:
                    px(img, x, y, C["white"])
                elif d < face + 4 and (x + y) % 2 == 0:
                    px(img, x, y, C["chrome"])
    return img


# ---------------------------------------------------------------------------
# overlays baked into opaque tiles

def hatch(col, col_dk):
    img = solid(C["black"])
    for y in range(T):
        for x in range(T):
            m = (x + y) % 6
            if m < 2:
                px(img, x, y, col)
            elif m == 2:
                px(img, x, y, col_dk)
            elif (x + y) % 2 == 0:
                px(img, x, y, C["iron"])
    return img


def lantern():
    img = lane()
    # reflection of the lantern light, broken by ripples, below the post
    for x, y, c in ((7, 13, "fire_orange"), (8, 14, "fire_yellow"), (7, 15, "fire_orange"),
                    (9, 13, "fire_red"), (6, 14, "fire_red")):
        px(img, x, y, C[c])
    ov = new(T, T)
    # stout wooden post rising from the water
    rect(ov, 7, 7, 8, 12, C["wood"])
    rect(ov, 8, 7, 8, 12, C["wood_dk"])
    px(ov, 7, 10, C["wood_dk"])
    # iron lantern on top: peaked cap, glowing panes, base plate
    rect(ov, 6, 2, 9, 2, C["iron"])
    rect(ov, 7, 1, 8, 1, C["iron"])
    rect(ov, 6, 3, 9, 5, C["fire_yellow"])
    rect(ov, 7, 3, 8, 4, C["white"])
    px(ov, 9, 5, C["fire_orange"])
    px(ov, 6, 5, C["fire_orange"])
    rect(ov, 6, 6, 9, 6, C["iron"])
    outline(ov)
    img.alpha_composite(ov)
    # foam ring where the post enters the water
    for x, y in ((5, 12), (6, 13), (10, 12), (9, 13), (4, 11), (11, 11)):
        px(img, x, y, C["foam"])
    return img


# flagstone slabs: rows (y0, y1) with vertical joints at these x (period 16 -> seamless)
SLABS = [((0, 4), (0, 7, 12)), ((5, 10), (3, 10)), ((11, 15), (0, 6, 13))]


def road():
    img = solid(C["stone"])
    speckle(img, [(C["stone_lt"], 0.07), (C["smoke"], 0.06)], 43)
    for (y0, y1), joints in SLABS:
        # horizontal joint at the top of each slab row (dark), lit edge just below it
        for x in range(T):
            px(img, x, y0, C["stone_dk"])
            if h(x, y0, 44) < 0.2:
                px(img, x, y0, C["moss"])
            px(img, x, y0 + 1, C["stone_lt"] if h(x, y0, 45) > 0.3 else C["stone"])
        for jx in joints:
            for y in range(y0, y1 + 1):
                px(img, jx, y, C["stone_dk"] if h(jx, y, 46) > 0.25 else C["grass_dk"])
                if y > y0:
                    px(img, (jx + 1) % T, y, C["stone_lt"] if y < y1 else C["stone"])
            px(img, (jx - 1) % T, y1, C["black"])
    # worn wheel ruts / chips and moss tufts in the joints
    for x, y in ((4, 8), (5, 8), (11, 2), (9, 13), (14, 7)):
        px(img, x, y, C["stone_dk"])
    for x, y in ((7, 1), (3, 11), (13, 6)):
        px(img, x, y, C["grass"])
    return img


def build():
    tiles = [water(0), water(1), water(2), water(3), lane(), shallows(), land()]
    tiles += [land_shore(m) for m in range(16)]
    tiles.append(rock())
    tiles += [rock_shore(m) for m in range(16)]
    tiles += [hatch(C["grass_lt"], C["grass_dk"]), hatch(C["tie"], C["maroon"]), lantern(), road()]
    assert len(tiles) == FRAMES, len(tiles)
    out = strip(tiles)
    assert all(p[3] == 255 for p in out.getdata()), "tiles must be fully opaque"
    return out
