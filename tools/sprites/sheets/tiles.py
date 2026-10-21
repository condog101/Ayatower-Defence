"""Opaque 16x16 terrain tiles for the Strait map (every tile is seamlessly tileable).

  0-3  deep water animation (wave crests drift 4px per frame, so 3 -> 0 loops cleanly)
  4    shipping lane water (darker channel with faint corner channel marks)
  5    shallows (turquoise over a sandy bottom)
  6    sand
  7-22 sand shore: 7 + mask, mask bits N=1 E=2 S=4 W=8 flag the sides where water lies;
       each flagged edge gets a foam line + wet-sand fringe, convex corners are rounded
  23   rock (dark rocky cliff top)
  24-39 rock shore: 24 + mask, same scheme with a cliff face + foam
  40   placement OK hatch (green)   41 placement bad hatch (red)   42 lane buoy

Every edge pattern is a function of the coordinate along that edge with a 16px period, so
neighbouring edge tiles join seamlessly.
"""
import math

from draw import new, outline, px, rect, strip
from palette import C

NAME = "tiles"
FRAME = (16, 16)
FRAMES = 43
T = 16

N, E, S, W = 1, 2, 4, 8


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


def water(variant):
    img = solid(C["water"])
    # static depth mottling: soft clusters of darker water
    for y in range(T):
        for x in range(T):
            v = math.sin((x + 0.5) / T * 2 * math.pi) + math.sin((y + 0.5) / T * 4 * math.pi + 1.3)
            if v > 1.1 and h(x, y, 2) < 0.5:
                px(img, x, y, C["water_dk"])
            elif h(x, y, 1) < 0.1:
                px(img, x, y, C["water_dk"])
    # wave crests drifting east 4px per frame (period 16 -> loops after 4 frames)
    for k, (wx, wy) in enumerate(CRESTS):
        x0 = (wx + variant * 4) % T
        for d in range(3):
            px(img, (x0 + d) % T, wy, C["water_lt"])
        px(img, (x0 + 1) % T, (wy - 1) % T, C["water_lt"])
        px(img, (x0 + 3) % T, (wy + 1) % T, C["water_dk"])
    return img


def lane():
    img = solid(C["water_dk"])
    speckle(img, [(C["water"], 0.16)], 21)
    # faint channel marks: little crosses on the tile corners -> a dotted grid along the lane
    for k in (0, 1, 2, 13, 14, 15):
        px(img, k, 0, C["water_lt"] if k in (0, 15) else C["water"])
        px(img, 0, k, C["water_lt"] if k in (0, 15) else C["water"])
    # dashed centre marks, alternating so a run of lane tiles reads as a channel
    for k in (6, 7, 8, 9):
        px(img, k, 8, C["water"])
    px(img, 4, 4, C["water"])
    px(img, 11, 12, C["water"])
    return img


def shallows():
    img = solid(C["shallow"])
    speckle(img, [(C["water_lt"], 0.12), (C["sand"], 0.05), (C["sand_lt"], 0.03)], 14)
    # sunlit ripples
    for x0, y in ((2, 3), (10, 7), (5, 12)):
        for d in range(3):
            px(img, (x0 + d) % T, y, C["foam"])
        px(img, (x0 + 1) % T, y + 1, C["water_lt"])
    return img


# ---------------------------------------------------------------------------
# land

def sand():
    img = solid(C["sand"])
    speckle(img, [(C["sand_lt"], 0.12), (C["sand_dk"], 0.07)], 4)
    # one soft wind ripple (wraps across the tile edge)
    for d in range(3):
        px(img, (11 + d) % T, 11, C["sand_lt"])
        px(img, (12 + d) % T, 12, C["sand_dk"] if d == 1 else C["sand"])
    return img


def rock():
    img = solid(C["rock"])
    speckle(img, [(C["rock_lt"], 0.14), (C["rock_dk"], 0.12), (C["soil"], 0.025)], 6)
    # boulders lit from the top-left
    for bx, by in ((3, 3), (10, 9), (12, 2), (5, 12)):
        px(img, bx, by, C["rock_lt"])
        px(img, bx + 1, by, C["rock_lt"])
        px(img, bx, by + 1, C["rock"])
        px(img, bx + 1, by + 1, C["rock_dk"])
        px(img, bx + 2, by + 1, C["black"])
        px(img, bx + 1, by + 2, C["rock_dk"])
    # cracks
    for x, y in ((7, 5), (8, 6), (8, 7), (14, 13), (15, 14), (0, 14)):
        px(img, x, y, C["rock_dk"])
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


def sand_shore(mask):
    img = sand()
    if mask == 0:
        return img
    for y in range(T):
        for x in range(T):
            d, edge, t = edge_dist(x, y, mask)
            depth = 2 + BUMP[t % T]
            if d < -0.2:
                px(img, x, y, C["shallow"] if h(x, y, 31) > 0.2 else C["water_lt"])
            elif d < 1:
                px(img, x, y, C["foam"])
            elif d < 2:
                px(img, x, y, C["foam"] if FOAM2[t % T] else C["sand_dk"])
            elif d < depth + 1:
                # wet sand, darker near the water and dithered into the dry sand
                if d < depth or (x + y) % 2 == 0:
                    px(img, x, y, C["sand_dk"] if d < depth else C["sand"])
            elif d < depth + 2 and (x + y) % 2 == 0:
                px(img, x, y, C["sand_lt"])  # dry high-water line
    return img


def rock_shore(mask):
    img = rock()
    if mask == 0:
        return img
    for y in range(T):
        for x in range(T):
            d, edge, t = edge_dist(x, y, mask)
            b = BUMP[t % T]
            if d < -0.2:
                px(img, x, y, C["water_lt"] if h(x, y, 33) > 0.3 else C["shallow"])
                continue
            if d < 1:
                px(img, x, y, C["foam"] if h(x, y, 35) > 0.15 else C["white"])
                continue
            if edge in (S, E):
                # shadowed cliff face (light comes from the top-left); taller on the south side
                face = (3 if edge == S else 2) + b
                if d < 2:
                    px(img, x, y, C["black"])
                elif d < face + 1:
                    px(img, x, y, C["rock_dk"] if (x * 3 + y) % 5 else C["black"])
                elif d < face + 2:
                    px(img, x, y, C["rock"])
            else:
                # sunlit cliff lip on the north / west sides
                face = 1 + b
                if d < 2:
                    px(img, x, y, C["rock_dk"])
                elif d < face + 1:
                    px(img, x, y, C["rock_dk"] if (x + y) % 3 == 0 else C["rock"])
                elif d < face + 2:
                    px(img, x, y, C["rock_lt"] if (x + y) % 4 else C["sand_dk"])
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


def buoy():
    img = lane()
    ov = new(T, T)
    # small red/white can buoy with a top mark and light
    rect(ov, 6, 6, 9, 10, C["tie"])
    rect(ov, 6, 8, 9, 8, C["white"])
    rect(ov, 7, 4, 8, 5, C["iron"])
    px(ov, 7, 3, C["fire_yellow"])
    px(ov, 6, 6, C["fire_red"])
    px(ov, 9, 10, C["maroon"])
    px(ov, 9, 9, C["maroon"])
    outline(ov)
    img.alpha_composite(ov)
    # waterline ripple
    for x, y in ((4, 11), (5, 12), (10, 12), (11, 11), (3, 10), (12, 10)):
        px(img, x, y, C["foam"])
    return img


def build():
    tiles = [water(0), water(1), water(2), water(3), lane(), shallows(), sand()]
    tiles += [sand_shore(m) for m in range(16)]
    tiles.append(rock())
    tiles += [rock_shore(m) for m in range(16)]
    tiles += [hatch(C["green"], C["olive_dk"]), hatch(C["tie"], C["maroon"]), buoy()]
    assert len(tiles) == FRAMES, len(tiles)
    out = strip(tiles)
    assert all(p[3] == 255 for p in out.getdata()), "tiles must be fully opaque"
    return out
