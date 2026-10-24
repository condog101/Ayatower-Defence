"""Tower bases, 32x32 transparent drawn at 1x (twice the world's pixel density), frame =
towerIndex * 3 + tier. High-fantasy stone and timber.

Drawn to read at phone size, where a tower is ~20 CSS px: one bold silhouette per tower, three
big tones (lit top/left, mid, dark bottom/right) with a black outline and a dark inner rim, one
saturated hero element of 5px or more, and texture kept to one shade off the base tone. Tier 1
adds a structure, tier 2 another plus 2px gold trim and glowing mithril runes. Aimed towers
(boats, aa_gun, missile, sam) keep an iron turntable at the exact centre for the turret sheet.
Water-placed towers (boats, mines, martyr, ghadir) carry their own patch of water; land towers
cast a soft shadow down-right.

 0 boats    timber pier, watch-hut and a ballista longboat
 1 mines    shipwright's hut with iron powder kegs
 2 martyr   dock of black-sailed fire skiffs
 3 aa_gun   round ballista bastion
 4 shahed   roost tower with winged drones
 5 jammer   wizard's tent with a crackling orb
 6 missile  stone keep with a great bow
 7 radar    palantir sphere on a tower
 8 ghadir   sunken iron hull among reeds
 9 sam      twin-ballista tower (octagon with a timber fighting deck)
10 minaret  tall minaret with a beacon flame
"""
import math

from draw import circle, disc, line, new, outline, poly, px, rect, shift, strip
from palette import C

NAME = "towers"
FRAME = (32, 32)
FRAMES = 33

W = H = 32
CX = CY = 15.5  # frame centre in pixel-centre coordinates (the turret pivot)
SHADOW = (*C["black"][:3], 80)


def a(c, alpha):
    return (*c[:3], alpha)


def opaque(img, x, y):
    return 0 <= x < W and 0 <= y < H and img.getpixel((x, y))[3] > 0


# ---------------------------------------------------------------------------
# shared parts

def pennant(img, x, y, c=None):
    """Swallow-tail pennant: 2px pole at columns x..x+1 from row y, 5x3 cloth flying right."""
    c = c or C["grass_lt"]
    rect(img, x, y, x + 1, y + 9, C["wood_dk"])
    rect(img, x, y, x, y + 9, C["wood"])
    rect(img, x, y - 2, x + 1, y - 1, C["gold"])
    rect(img, x + 2, y, x + 6, y + 2, c)
    rect(img, x + 2, y, x + 6, y, shift(c, 0.3))
    px(img, x + 6, y + 1, (0, 0, 0, 0))  # the swallow-tail notch
    rect(img, x + 2, y + 2, x + 5, y + 2, shift(c, -0.3))


def banner(img, x, y, gold=False):
    """Hanging banner: 2px pole at x..x+1, crossbar at row y, a 5x9 white cloth with a green
    hoist and a red (gold at tier 2) device, swallow-tailed in red, gold finial."""
    rect(img, x, y - 2, x + 1, y + 13, C["wood_dk"])
    rect(img, x, y - 2, x, y + 13, C["wood"])
    rect(img, x, y - 4, x + 1, y - 3, C["gold"])
    rect(img, x, y, x + 7, y, C["wood_dk"])
    rect(img, x + 2, y + 1, x + 6, y + 9, C["white"])
    rect(img, x + 2, y + 1, x + 2, y + 9, C["grass"])
    rect(img, x + 6, y + 1, x + 6, y + 9, C["smoke_lt"])
    rect(img, x + 3, y + 3, x + 5, y + 6, C["gold"] if gold else C["tie"])
    px(img, x + 4, y + 2, C["gold"] if gold else C["tie"])
    px(img, x + 4, y + 7, C["gold"] if gold else C["tie"])
    rect(img, x + 2, y + 10, x + 3, y + 11, C["tie"])
    rect(img, x + 5, y + 10, x + 6, y + 11, C["tie"])


def rune(img, x, y):
    """A glowing 3x3 plus-shaped mithril rune with a soft halo, centred on (x, y)."""
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            d = abs(dx) + abs(dy)
            if d == 2 or (abs(dx) == 1 and abs(dy) == 1):
                px(img, x + dx, y + dy, a(C["mithril"], 200))
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        px(img, x + dx, y + dy, C["mithril_lt"])
    px(img, x, y, C["white"])


def water_patch(img, x0, y0, x1, y1, waves=()):
    """Flat water with a few 2px wave strokes (no hash noise: it turns to mush when small)."""
    rect(img, x0, y0, x1, y1, C["water_lt"])
    for x, y in waves:
        if x0 <= x <= x1 - 2 and y0 <= y <= y1:
            rect(img, x, y, x + 2, y, C["shallow"])
            px(img, x + 1, y, C["foam"])


def planks(img, x0, y0, x1, y1, vertical=False):
    """Timber decking: 2px boards, one shade off, a lit leading edge and staggered butt joints."""
    rect(img, x0, y0, x1, y1, C["wood"])
    if vertical:
        for y in range(y0 + 2, y1 + 1, 3):
            rect(img, x0, y, x1, y, C["wood_dk"])
        for x in range(x0, x1 + 1, 4):
            for y in range(y0, y1 + 1, 3):
                px(img, x + (y // 3) % 2, y + 1, C["wood_dk"])
        rect(img, x0, y0, x0, y1, C["parch_dk"])
    else:
        for x in range(x0 + 2, x1 + 1, 3):
            rect(img, x, y0, x, y1, C["wood_dk"])
        rect(img, x0, y0, x1, y0, C["parch_dk"])
        rect(img, x0, y1, x1, y1, C["wood_dk"])


def bollard(img, x, y, gold=False):
    rect(img, x, y, x + 1, y + 1, C["wood_dk"])
    px(img, x, y, C["gold"] if gold else C["smoke_lt"])
    px(img, x + 1, y, C["gold_dk"] if gold else C["smoke"])


def flagstones(img, x0, y0, x1, y1, lt=None, mid=None, dk=None):
    """3x3 paving stones with 1px joints, staggered by row, a lit corner on every other stone."""
    lt, mid, dk = lt or C["stone_lt"], mid or C["stone"], dk or C["stone_dk"]
    rect(img, x0, y0, x1, y1, mid)
    for y in range(y0, y1 + 1):
        row = (y - y0) // 4
        for x in range(x0, x1 + 1):
            if (y - y0) % 4 == 3 or (x - x0 + row * 2) % 4 == 3:
                px(img, x, y, dk)
            elif (y - y0) % 4 == 0 and (x - x0 + row * 2) % 4 == 0 and (x // 4 + row) % 2 == 0:
                px(img, x, y, lt)


def gold_rim(img, x0, y0, x1, y1):
    """2px gold edge round a rectangle: bright top/left, dark bottom/right."""
    rect(img, x0, y0, x1, y0 + 1, C["gold"])
    rect(img, x0, y0, x0 + 1, y1, C["gold"])
    rect(img, x0, y1 - 1, x1, y1, C["gold_dk"])
    rect(img, x1 - 1, y0 + 2, x1, y1, C["gold_dk"])


def mount(img, gold=False, r=6.0):
    """Iron turntable at the frame centre, under the turret pivot: rim ring, rivets, axle."""
    disc(img, CX, CY, r, C["iron"])
    circle(img, CX, CY, r - 0.9, C["gold"] if gold else C["smoke"], thickness=1.0)
    for k in range(8):
        ang = k * math.pi / 4
        px(img, round(CX + math.cos(ang) * (r - 2.5)), round(CY + math.sin(ang) * (r - 2.5)),
           C["gold_dk"] if gold else C["stone_dk"])
    rect(img, 15, 15, 16, 16, C["black"])


def keg(img, x, y, glow=False):
    """Upright iron-banded powder keg, 5x7, a lit staves column and a lit fuse on top."""
    rect(img, x, y + 1, x + 4, y + 6, C["wood"])
    rect(img, x + 1, y, x + 3, y + 6, C["wood"])
    rect(img, x, y + 1, x + 1, y + 6, C["parch_dk"])
    rect(img, x + 4, y + 1, x + 4, y + 6, C["wood_dk"])
    rect(img, x, y + 2, x + 4, y + 2, C["iron"])
    rect(img, x, y + 5, x + 4, y + 5, C["iron"])
    rect(img, x + 1, y, x + 3, y, C["smoke"])
    fuse = C["mithril_lt"] if glow else C["fire_yellow"]
    px(img, x + 2, y - 1, C["black"])
    px(img, x + 2, y - 2, fuse)
    px(img, x + 3, y - 2, C["fire_orange"] if not glow else C["mithril"])
    px(img, x + 2, y - 3, C["white"] if glow else C["fire_orange"])


def float_keg(img, x, y, glow=False):
    """A keg bobbing in the water with a ripple ring round it."""
    for dx in range(-2, 7):
        px(img, x + dx, y + 7, C["foam"] if dx in (-2, 6) else C["shallow"])
    px(img, x - 1, y + 6, C["shallow"])
    px(img, x + 5, y + 6, C["shallow"])
    keg(img, x, y, glow)


def skiff(img, x0, y, sail=8, gold=False):
    """Fire skiff pointing east: a 13x4 hull with its deck at rows y..y+3, a tall black sail
    rising above it, a red pennant at the masthead and a glowing pitch pot in the bow."""
    hull = C["gold_dk"] if gold else C["wood_dk"]
    rect(img, x0, y, x0 + 10, y + 3, hull)
    rect(img, x0 + 11, y + 1, x0 + 11, y + 3, hull)
    px(img, x0 + 12, y + 2, hull)
    rect(img, x0 + 1, y, x0 + 10, y + 1, C["wood"])
    rect(img, x0 + 1, y, x0 + 10, y, C["gold"] if gold else C["parch_dk"])  # gunwale
    rect(img, x0 + 9, y + 1, x0 + 10, y + 2, C["fire_orange"])  # pitch pot
    px(img, x0 + 10, y + 1, C["fire_yellow"])
    # mast and a triangular black sail leaning up off the deck
    m = x0 + 4
    rect(img, m, y - sail - 1, m, y, C["wood_dk"])
    for k in range(1, sail + 1):
        half = (sail - k) * 4 // sail
        for x in range(m - half, m + 2 + half):
            px(img, x, y - k, C["iron"] if x == m - half else C["black"])
    rect(img, m + 1, y - sail - 2, m + 3, y - sail - 1, C["tie"])
    px(img, m, y - sail - 2, C["gold"] if gold else C["tie"])


def drone(img, cx, cy, glow=False):
    """Winged drone, 11x5: leathery dusk bat wings with pale bones, a black body, glowing eyes."""
    for dx in range(-5, 6):
        if dx == 0:
            continue
        sag = abs(dx) // 2 - 1
        px(img, cx + dx, cy + max(0, sag), C["dusk"])
        px(img, cx + dx, cy + max(0, sag) + 1, shift(C["dusk"], -0.35))
        if abs(dx) >= 2:
            px(img, cx + dx, cy - 1 + max(0, sag), C["smoke_lt"])  # wing bones
    rect(img, cx - 1, cy - 1, cx + 1, cy + 2, C["black"])
    px(img, cx, cy + 3, C["black"])
    eye = C["mithril_lt"] if glow else C["fire_yellow"]
    px(img, cx - 1, cy - 1, eye)
    px(img, cx + 1, cy - 1, eye)


def reeds(img, x, y, h=6):
    """A reed clump rooted at row y: three 1px stems (2px wide clump), pale tips, a seed head."""
    for i, (dx, hh) in enumerate(((0, h), (1, h - 2), (-1, h - 3))):
        for k in range(hh):
            px(img, x + dx, y - k, C["grass_lt"] if k >= hh - 2 else (C["grass"] if i == 0 else C["grass_dk"]))
    rect(img, x, y - h - 1, x, y - h, C["sand_dk"])
    px(img, x - 1, y + 1, C["moss"])
    px(img, x + 1, y + 1, C["moss"])


def inner_rim(img, amt=-0.3):
    """Darken the shadow-side edge (pixels with empty space right of or below them)."""
    src = img.copy()
    for y in range(H):
        for x in range(W):
            c = src.getpixel((x, y))
            if c[3] < 200:
                continue
            if not opaque(src, x + 1, y) or not opaque(src, x, y + 1):
                img.putpixel((x, y), shift(c, amt))
    return img


def finish(fig, shadow=False):
    inner_rim(fig)
    outline(fig)
    if not shadow:
        return fig
    out = new(W, H)
    for y in range(H):
        for x in range(W):
            if fig.getpixel((x, y))[3] > 0 and x + 2 < W and y + 2 < H:
                out.putpixel((x + 2, y + 2), SHADOW)
    out.alpha_composite(fig)
    return out


def ring_tone(x, y, cx=CX, cy=CY):
    """Lit north-west, dark south-east, mid between: for walls seen from above."""
    d = (x - cx) + (y - cy)
    if d < -4:
        return C["stone_lt"]
    if d > 4:
        return C["stone_dk"]
    return C["stone"]


# ---------------------------------------------------------------------------
# towers

def boats(tier):
    """Timber pier, a thatched watch-hut and a ballista longboat moored alongside."""
    img = new(W, H)
    water_patch(img, 6, 0, 31, 23, waves=[(9, 3), (24, 5), (27, 21), (8, 22), (16, 1)])
    planks(img, 0, 24, 31, 31)
    planks(img, 0, 0, 5, 23, vertical=True)
    for x in (8, 15, 22, 29):
        bollard(img, x, 24, gold=tier == 2)
    bollard(img, 4, 4, gold=tier == 2)
    bollard(img, 4, 13, gold=tier == 2)
    if tier >= 1:  # a second rowboat moored up top
        rect(img, 14, 2, 24, 5, C["wood_dk"])
        rect(img, 25, 3, 26, 4, C["wood_dk"])
        rect(img, 15, 3, 24, 4, C["wood"])
        rect(img, 15, 3, 24, 3, C["parch_dk"])
        for x in (17, 21):
            rect(img, x, 3, x, 4, C["wood_dk"])
        line(img, 6, 6, 13, 4, C["parch_dk"])  # painter rope to the pier
    # longboat (bow east), hull 20x10, mount amidships at the frame centre
    hull = C["wood_dk"]
    rect(img, 8, 11, 26, 20, hull)
    rect(img, 6, 12, 7, 19, hull)
    rect(img, 27, 12, 27, 19, hull)
    rect(img, 28, 13, 28, 18, hull)
    rect(img, 29, 14, 29, 17, hull)
    rect(img, 8, 13, 26, 18, C["wood"])
    rect(img, 7, 14, 7, 17, C["wood"])
    rect(img, 27, 14, 28, 17, C["wood"])
    for y in (14, 17):  # strakes
        rect(img, 8, y, 27, y, shift(C["wood"], -0.15))
    rect(img, 8, 12, 26, 12, C["gold"] if tier == 2 else C["parch_dk"])  # gunwale (lit side)
    rect(img, 8, 19, 26, 19, C["gold_dk"] if tier == 2 else hull)
    for x in (10, 21, 25):  # thwarts
        rect(img, x, 13, x + 1, 18, C["parch_dk"])
    # oars out both sides
    for x in (12, 19):
        line(img, x, 10, x - 2, 7, C["parch_dk"])
        line(img, x, 21, x - 2, 23, C["parch_dk"])
    # carved prow
    if tier == 2:  # gilded dragon head
        rect(img, 29, 11, 31, 14, C["gold"])
        rect(img, 30, 10, 31, 10, C["gold_dk"])
        px(img, 30, 12, C["fire_red"])
        px(img, 31, 14, C["gold_dk"])
    else:
        rect(img, 29, 12, 30, 14, C["wood"])
        px(img, 30, 11, C["wood_dk"])
    # thatched watch-hut on the pier corner
    rect(img, 0, 19, 10, 25, C["sand"])
    for y in (20, 22, 24):
        for x in range(0, 11, 2):
            px(img, x + (y // 2) % 2, y, C["sand_dk"])
    rect(img, 0, 19, 10, 19, C["sand_lt"])
    rect(img, 0, 25, 10, 25, C["sand_dk"])  # eaves
    rect(img, 0, 26, 9, 31, C["wood"])
    rect(img, 0, 26, 9, 26, C["wood_dk"])
    rect(img, 2, 28, 4, 31, C["black"])  # door
    rect(img, 6, 28, 7, 29, C["fire_yellow"])  # lit window
    px(img, 7, 29, C["fire_orange"])
    if tier >= 1:
        banner(img, 1, 6, gold=tier == 2)
    else:
        pennant(img, 1, 8)
    if tier == 2:
        rect(img, 30, 23, 30, 27, C["wood_dk"])  # lantern post
        rect(img, 29, 21, 31, 23, C["fire_yellow"])
        px(img, 30, 22, C["white"])
        rune(img, 5, 29)
    mount(img, gold=tier == 2, r=5.0)
    return finish(img)


def mines(tier):
    """Shipwright's hut on a jetty, iron powder kegs stacked and floating."""
    img = new(W, H)
    water_patch(img, 0, 0, 31, 23, waves=[(17, 2), (26, 16), (19, 20), (2, 2)])
    planks(img, 0, 24, 31, 31)
    for x in (15, 22, 29):
        bollard(img, x, 24)
    # hut: a pitched shingle roof (ridge running north-south) over the water, front wall on the jetty
    x0, x1 = 1, 14
    rect(img, x0, 8, x1, 22, C["stone"])
    for y in range(8, 23, 3):  # shingle courses
        rect(img, x0, y + 2, x1, y + 2, C["stone_dk"])
        for x in range(x0 + (y // 3) % 2 * 2, x1 + 1, 4):
            px(img, x, y + 1, C["stone_dk"])
    for y in range(8, 23):  # lit west slope, shaded east slope (keep the shingle joints)
        for x in range(x0, x1 + 1):
            c = img.getpixel((x, y))
            if x <= 7:
                px(img, x, y, shift(c, 0.28))
            elif x >= 10:
                px(img, x, y, shift(c, -0.22))
    rect(img, 8, 8, 8, 22, C["gold"] if tier == 2 else C["stone_lt"])  # ridge highlight
    rect(img, 9, 8, 9, 22, C["gold_dk"] if tier == 2 else C["stone_dk"])
    rect(img, x0, 8, x1, 8, C["stone_lt"])
    rect(img, x0, 23, x1, 29, C["wood"])
    rect(img, x0, 23, x1, 23, C["wood_dk"])
    rect(img, x0, 23, x0, 29, C["parch_dk"])
    rect(img, 4, 25, 6, 29, C["black"])  # door
    rect(img, 10, 25, 12, 27, C["fire_yellow"])  # lit window
    px(img, 12, 27, C["fire_orange"])
    # kegs on the jetty
    for x in ((17, 23) if tier < 2 else (16, 21, 26)):
        keg(img, x, 24, glow=tier == 2)
    floats = {0: [(22, 9)], 1: [(23, 13)], 2: [(23, 13), (17, 4), (26, 3)]}[tier]
    for x, y in floats:
        float_keg(img, x, y, glow=tier == 2)
    if tier >= 1:
        # crane: a post on the hut corner, a boom over the water, a chain and a hanging keg
        rect(img, 15, 3, 16, 23, C["wood_dk"])
        rect(img, 15, 3, 15, 23, C["wood"])
        rect(img, 15, 3, 25, 4, C["wood_dk"])
        rect(img, 15, 3, 25, 3, C["wood"])
        line(img, 16, 8, 20, 4, C["wood_dk"])  # brace
        rect(img, 24, 5, 24, 7, C["iron"])
        keg(img, 22, 9, glow=tier == 2) if tier == 1 else None
        banner(img, 28, 6, gold=tier == 2) if tier == 1 else banner(img, 28, 9, gold=True)
    else:
        pennant(img, 9, 1, C["fire_orange"])
    if tier == 2:
        rect(img, 22, 8, 26, 8, C["iron"])
        rune(img, 4, 14)
        rune(img, 12, 19)
    return finish(img)


def martyr(tier):
    """A dock of black-sailed fire skiffs."""
    img = new(W, H)
    water_patch(img, 7, 0, 31, 31, waves=[(25, 3), (12, 28), (27, 26), (20, 13)])
    planks(img, 0, 0, 6, 31, vertical=True)
    for y in (3, 11, 19, 27):
        bollard(img, 5, y, gold=tier == 2)
    rows = {0: [(17, 9)], 1: [(11, 7), (25, 7)], 2: [(9, 6), (18, 7), (28, 6)]}[tier]
    for y, sail in rows:
        skiff(img, 10 if tier < 2 else 12, y, sail=sail, gold=tier == 2)
        line(img, 6, y + 2, 9 if tier < 2 else 11, y + 2, C["parch_dk"])  # mooring line
    if tier == 0:
        pennant(img, 1, 22, C["tie"])
    if tier >= 1:
        banner(img, 0, 16, gold=tier == 2)
    if tier == 2:
        # gold-roofed boathouse at the head of the dock
        rect(img, 0, 0, 10, 7, C["gold"])
        for y in (2, 5):
            rect(img, 0, y, 10, y, C["gold_dk"])
        rect(img, 0, 0, 10, 0, C["cream"])
        rect(img, 5, 0, 5, 7, C["fire_yellow"])
        rect(img, 0, 8, 10, 10, C["wood"])
        rect(img, 4, 8, 6, 10, C["black"])
        rune(img, 3, 13)
    return finish(img)


def aa_gun(tier):
    """Round ballista bastion: a thick crenellated stone ring round a paved floor and the turntable."""
    img = new(W, H)
    R = 15.2
    for y in range(H):
        for x in range(W):
            d = math.hypot(x - CX, y - CY)
            if d <= R:
                px(img, x, y, ring_tone(x, y) if d > R - 4 else C["stone"])
    flagstones(img, 5, 5, 26, 26, lt=C["chrome"], mid=C["stone_lt"], dk=C["stone"])
    for y in range(H):  # trim the paving back to a disc, with a dark inner lip
        for x in range(W):
            d = math.hypot(x - CX, y - CY)
            if R - 5 < d <= R - 4:
                px(img, x, y, C["stone_dk"])
            elif R - 4 < d <= R:
                px(img, x, y, ring_tone(x, y))
    # crenels: 8 dark 2px gaps through the outer wall, merlons between them
    for k in range(8):
        ang = k * math.pi / 4 + math.pi / 8
        for t in (-0.06, 0.06):
            for rr in (R - 0.5, R - 1.5):
                px(img, round(CX + math.cos(ang + t) * rr), round(CY + math.sin(ang + t) * rr), C["black"])
    if tier == 2:  # gold coping along the wall top
        for y in range(H):
            for x in range(W):
                d = math.hypot(x - CX, y - CY)
                if R - 3.8 < d <= R - 2.2 and img.getpixel((x, y)) != C["black"]:
                    px(img, x, y, C["gold"] if (x - CX) + (y - CY) < 0 else C["gold_dk"])
    racks = [(8, 19), (19, 8)] + ([(8, 8), (19, 19)] if tier >= 1 else [])
    for x, y in racks:  # bolt racks, 5x4
        rect(img, x, y, x + 4, y + 3, C["wood"])
        rect(img, x, y, x + 4, y, C["parch_dk"])
        for bx in (x + 1, x + 3):
            rect(img, bx, y + 1, bx, y + 3, C["smoke_lt"])
        rect(img, x, y + 3, x + 4, y + 3, C["wood_dk"])
    if tier >= 1:
        banner(img, 0, 3, gold=tier == 2)
        pennant(img, 26, 20)
    else:
        pennant(img, 3, 4)
    if tier == 2:
        for x, y in ((15, 3), (28, 15), (15, 28), (3, 15)):
            rune(img, x, y)
    mount(img, gold=tier == 2)
    return finish(img, shadow=True)


def shahed(tier):
    """Roost tower: a stone drum with timber perches and winged drones."""
    img = new(W, H)
    # drum: walls seen with height, brick courses, lit west and dark east thirds
    rect(img, 8, 12, 23, 29, C["stone"])
    for y in range(14, 30, 3):
        rect(img, 8, y, 23, y, C["stone_dk"])
        for x in range(8 + (y // 3) % 2 * 2, 24, 4):
            rect(img, x, y - 2, x, y - 1, C["stone_dk"])
    rect(img, 8, 12, 10, 29, C["stone_lt"])
    rect(img, 21, 12, 23, 29, shift(C["stone_dk"], 0.1))
    rect(img, 14, 24, 17, 29, C["black"])  # arched door
    rect(img, 15, 23, 16, 23, C["black"])
    rect(img, 13, 24, 13, 29, C["stone_dk"])
    rect(img, 17, 18, 18, 20, C["black"])  # arrow slit
    # roof platform: an ellipse rim, a dark parapet ring and a timber deck
    for y in range(3, 17):
        for x in range(4, 28):
            e = ((x - CX) / 11.6) ** 2 + ((y - 9.5) / 6.6) ** 2
            if e <= 1:
                px(img, x, y, C["stone_lt"] if (x - CX) * 0.4 + (y - 9.5) < 1 else C["stone"])
            if e <= 0.62:
                px(img, x, y, C["stone_dk"])
            if e <= 0.45:
                px(img, x, y, C["wood"] if (y % 3) else C["wood_dk"])
    for x in (8, 15, 22):  # crenels along the front of the rim
        rect(img, x, 15, x + 1, 16, C["black"])
    if tier == 2:
        rect(img, 8, 27, 23, 28, C["gold"])
        rect(img, 8, 28, 23, 28, C["gold_dk"])
    # perch beams
    rect(img, 1, 19, 8, 20, C["wood_dk"])
    rect(img, 1, 19, 8, 19, C["wood"])
    rect(img, 23, 22, 30, 23, C["wood_dk"])
    rect(img, 23, 22, 30, 22, C["wood"])
    spots = {0: [(15, 8), (5, 16)], 1: [(15, 8), (5, 16), (26, 19)],
             2: [(15, 8), (5, 16), (26, 19), (25, 2)]}[tier]
    for cx, cy in spots:
        drone(img, cx, cy, glow=tier == 2)
    if tier >= 1:
        banner(img, 1, 22 if tier == 1 else 22, gold=tier == 2)
    else:
        pennant(img, 25, 6)
    if tier == 2:
        rune(img, 19, 25)
    return finish(img, shadow=True)


def jammer(tier):
    """Wizard's striped tent with a crackling mithril orb on the centre pole."""
    img = new(W, H)
    r = {0: 4.0, 1: 5.0, 2: 6.0}[tier]
    oy = 1.5 + r
    top = int(oy + r) + 4  # tent apex
    bot = 29
    for y in range(top, bot + 1):
        t = (y - top) / (bot - top)
        hw = 1.0 + t * 12.5
        for x in range(W):
            dx = x - CX
            if abs(dx) <= hw:
                stripe = int((dx / max(hw, 0.1) + 1) * 2) % 2
                c = C["dusk"] if stripe else C["cream"]
                if dx > hw * 0.15:  # the right half turned from the light
                    c = C["night"] if stripe else C["parch"]
                px(img, x, y, c)
    rect(img, 3, bot, 28, bot, C["gold"] if tier == 2 else C["parch_dk"])  # hem
    if tier == 2:
        rect(img, 3, bot - 1, 28, bot - 1, C["gold_dk"])
    # door flap, folded back
    rect(img, 14, bot - 7, 17, bot, C["black"])
    poly(img, [(17, bot - 7), (20, bot), (17, bot)], C["dusk"])
    # pole and orb
    rect(img, 15, int(oy + r) - 1, 16, top + 1, C["wood_dk"])
    disc(img, CX, oy, r, C["mithril"])
    disc(img, CX + 0.6, oy + 0.6, r - 1.6, C["mithril_lt"])
    rect(img, int(CX - r / 2), int(oy - r / 2), int(CX - r / 2) + 1, int(oy - r / 2) + 1, C["white"])
    if tier >= 1:
        banner(img, 24, 9, gold=tier == 2)
        rect(img, 2, 18, 3, bot, C["wood_dk"])  # guy-rope stake and lantern
        line(img, 3, 19, 10, 22, C["parch_dk"])
        rect(img, 1, 15, 4, 17, C["fire_yellow"])
        px(img, 2, 16, C["white"])
    else:
        pennant(img, 3, 16, C["dusk"])
    if tier == 2:
        for x, y in ((3, 27), (9, 24), (22, 24), (28, 27)):
            rune(img, x, y)
    out = finish(img, shadow=True)
    # crackle sparks spill over the outline, 2px each
    k = int(r)
    sparks = {0: [(-7, -3), (6, 1)], 1: [(-8, -2), (7, -4), (-6, 5)],
              2: [(-9, -3), (8, -2), (-7, 6), (7, 6), (0, -8)]}[tier]
    for dx, dy in sparks:
        x, y = int(CX + dx), int(oy + dy)
        rect(out, x, y, x + 1, y, C["mithril_lt"])
        px(out, x + (1 if dx < 0 else 0), y + 1, a(C["white"], 230))
    del k
    return out


def missile(tier):
    """Square stone keep: lit north/west walls, corner turrets, a paved roof round the great bow."""
    img = new(W, H)
    rect(img, 2, 2, 29, 29, C["stone"])
    rect(img, 2, 2, 29, 3, C["stone_lt"])
    rect(img, 2, 2, 3, 29, C["stone_lt"])
    rect(img, 28, 4, 29, 29, C["stone_dk"])
    rect(img, 4, 28, 29, 29, C["stone_dk"])
    flagstones(img, 6, 6, 25, 25, lt=C["chrome"], mid=C["stone_lt"], dk=C["stone"])
    rect(img, 5, 5, 26, 5, C["stone_dk"])  # inner lip of the parapet
    rect(img, 5, 5, 5, 26, C["stone_dk"])
    rect(img, 26, 6, 26, 26, C["stone_lt"])
    rect(img, 6, 26, 26, 26, C["stone_lt"])
    for k in range(9, 24, 4):  # crenels, 2px every 4px
        rect(img, k, 2, k + 1, 3, C["black"])
        rect(img, 2, k, 3, k + 1, C["black"])
        rect(img, k, 28, k + 1, 29, C["black"])
        rect(img, 28, k, 29, k + 1, C["black"])
    if tier == 2:
        gold_rim(img, 6, 6, 25, 25)
    for cx, cy in ((5.5, 5.5), (25.5, 5.5), (5.5, 25.5), (25.5, 25.5)):
        lit = cx + cy < 31
        disc(img, cx, cy, 4.2, C["stone_lt"] if lit else C["stone"])
        disc(img, cx + 0.8, cy + 0.8, 3.2, C["stone"] if lit else C["stone_dk"])
        disc(img, cx, cy, 2.0, C["gold"] if tier == 2 else C["iron"])  # cap
        px(img, int(cx), int(cy), C["gold_dk"] if tier == 2 else C["black"])
    if tier >= 1:
        banner(img, 2, 9, gold=tier == 2)
        if tier == 2:
            banner(img, 22, 9, gold=True)
        else:
            pennant(img, 24, 8)
    else:
        pennant(img, 4, 10)
    if tier == 2:
        for x, y in ((9, 22), (22, 22)):
            rune(img, x, y)
    mount(img, gold=tier == 2)
    return finish(img, shadow=True)


def radar(tier):
    """A slim stone tower whose ribbed cradle holds a palantir: a night-dark seeing-stone."""
    img = new(W, H)
    # plinth
    rect(img, 6, 24, 25, 29, C["stone"])
    rect(img, 6, 24, 25, 25, C["gold"] if tier == 2 else C["stone_lt"])
    rect(img, 22, 26, 25, 29, C["stone_dk"])
    rect(img, 6, 26, 8, 29, C["stone_lt"])
    # shaft
    rect(img, 10, 12, 21, 24, C["stone"])
    rect(img, 10, 12, 13, 24, C["stone_lt"])
    rect(img, 19, 12, 21, 24, C["stone_dk"])
    for y in (15, 19, 23):
        rect(img, 10, y, 21, y, shift(C["stone"], -0.2))
    for x in (13, 18):  # slit windows
        rect(img, x, 15, x, 18, C["black"])
    rect(img, 14, 21, 17, 29, C["black"])  # arched door
    rect(img, 15, 20, 16, 20, C["black"])
    # cradle collar and ribs
    collar = C["gold"] if tier == 2 else C["stone_dk"]
    rect(img, 8, 11, 23, 13, collar)
    rect(img, 8, 11, 23, 11, C["gold"] if tier == 2 else C["stone"])
    r = 6.0 if tier == 0 else 7.0
    cy = 1.0 + r
    disc(img, CX, cy, r, C["night"])
    disc(img, CX + 1.4, cy + 1.4, r - 2.6, C["dusk"])  # inner glow
    disc(img, CX + 1.8, cy + 1.8, r - 4.4, shift(C["dusk"], 0.25))
    rect(img, int(CX - r * 0.55), int(cy - r * 0.55), int(CX - r * 0.55) + 1, int(cy - r * 0.55) + 1, C["mithril_lt"])
    px(img, int(CX - r * 0.55) + 2, int(cy - r * 0.55), C["mithril"])
    px(img, int(CX - r * 0.55), int(cy - r * 0.55) + 2, C["mithril"])
    rib = C["gold"] if tier == 2 else (C["stone_lt"] if tier == 1 else C["stone_dk"])
    rib_dk = C["gold_dk"] if tier == 2 else C["stone_dk"]
    for x0, x1, top in ((9, 8, cy - 1), (22, 23, cy - 1), (12, 11, cy + r * 0.6), (19, 20, cy + r * 0.6)):
        line(img, x0, 11, x1, int(top), rib if x0 < 16 else rib_dk, width=2 if tier >= 1 else 1)
    if tier == 2:
        rect(img, 15, int(cy), 16, int(cy) + 1, C["fire_red"])  # the stone stirs
        px(img, 16, int(cy) - 1, C["fire_orange"])
    if tier >= 1:
        banner(img, 24, 13, gold=tier == 2)
    else:
        pennant(img, 3, 16)
    if tier == 2:
        rune(img, 15, 16)
        rune(img, 8, 27)
    return finish(img, shadow=True)


def ghadir(tier):
    """A sunken iron hull half-drowned among the reeds, its broken mast still standing."""
    img = new(W, H)
    water_patch(img, 0, 0, 31, 31, waves=[(2, 2), (22, 2), (24, 26), (3, 27), (12, 29)])
    # iron hull lying east-west, the east end (the bow) slipping under the water
    rect(img, 6, 10, 23, 21, C["iron"])
    rect(img, 4, 12, 5, 19, C["iron"])
    rect(img, 24, 11, 25, 20, C["iron"])
    rect(img, 6, 11, 23, 13, C["smoke"])  # lit upper strake
    rect(img, 6, 11, 23, 11, C["smoke_lt"])
    rect(img, 6, 18, 23, 21, C["stone_dk"])
    for y in (14, 17):  # rivet rows
        for x in range(7, 24, 3):
            px(img, x, y, C["gold"] if tier == 2 else C["smoke_lt"])
    # rust holes
    rect(img, 9, 15, 10, 16, C["fire_orange"] if tier == 2 else C["maroon"])
    if tier == 2:
        px(img, 9, 15, C["fire_yellow"])
    rect(img, 18, 15, 19, 16, C["black"])
    # the bow dips under: water laps over it, foam along the line
    for y in range(9, 23):
        for x in range(22, 28):
            if x - 22 >= (y - 9) * 0.0 + 2 + abs(y - 15.5) * 0.25:
                px(img, x, y, C["water_lt"])
    for x, y in ((23, 11), (24, 13), (24, 15), (24, 18), (23, 20), (25, 16), (4, 20), (5, 21), (7, 22)):
        px(img, x, y, C["foam"])
    # broken mast and yard
    rect(img, 13, 0, 14, 13, C["wood_dk"])
    rect(img, 13, 0, 13, 13, C["wood"])
    rect(img, 9, 4, 19, 5, C["wood_dk"])
    rect(img, 9, 4, 19, 4, C["wood"])
    px(img, 14, 0, (0, 0, 0, 0))  # the splintered top
    clumps = {0: [(2, 8), (28, 30), (6, 30)], 1: [(2, 8), (28, 30), (6, 30), (28, 8), (18, 30)],
              2: [(2, 8), (28, 30), (6, 30), (28, 8), (18, 30), (1, 24)]}[tier]
    for x, y in clumps:
        reeds(img, x, y, 7)
        reeds(img, x + 2, y + 1, 5)
    if tier >= 1:
        banner(img, 13, 3, gold=tier == 2)
    else:
        pennant(img, 13, 3, C["tie"])
    if tier == 2:
        for x, y in ((9, 25), (21, 25)):
            rune(img, x, y)
    return finish(img)


def sam(tier):
    """Twin-ballista tower: an octagonal stone tower topped with a timber fighting deck."""
    img = new(W, H)
    oct_ = [(9, 1), (22, 1), (30, 9), (30, 22), (22, 30), (9, 30), (1, 22), (1, 9)]
    poly(img, oct_, C["stone"])
    for y in range(H):
        for x in range(W):
            if img.getpixel((x, y))[3]:
                px(img, x, y, ring_tone(x, y))
    deck = [(10, 4), (21, 4), (27, 10), (27, 21), (21, 27), (10, 27), (4, 21), (4, 10)]
    poly(img, deck, C["wood"])
    for x in range(5, 27, 3):  # deck boards
        for y in range(4, 28):
            if img.getpixel((x, y)) == C["wood"]:
                px(img, x, y, C["wood_dk"])
    if tier == 2:  # gold along the inner wall rim
        for (x0, y0), (x1, y1) in zip(deck, deck[1:] + deck[:1]):
            line(img, x0, y0, x1, y1, C["gold"] if x0 + y0 + x1 + y1 < 62 else C["gold_dk"], width=2)
    for (x0, y0), (x1, y1) in zip(oct_, oct_[1:] + oct_[:1]):  # crenel gaps mid-facet
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        ix, iy = mx + (CX - mx) * 0.08, my + (CY - my) * 0.08
        rect(img, int(ix) - 1, int(iy) - 1, int(ix), int(iy), C["black"])
    if tier >= 1:
        banner(img, 23, 2, gold=tier == 2)
        if tier == 2:
            banner(img, 2, 14, gold=True)
        else:
            pennant(img, 3, 18)
    else:
        pennant(img, 23, 3)
    if tier == 2:
        for x, y in ((8, 8), (23, 23)):
            rune(img, x, y)
    mount(img, gold=tier == 2)
    return finish(img, shadow=True)


def minaret(tier):
    """A tall minaret: turquoise tile bands, balconies, a dome cap and a beacon flame on top."""
    img = new(W, H)
    # plinth
    rect(img, 6, 25, 25, 30, C["sand"])
    rect(img, 6, 25, 25, 26, C["gold"] if tier == 2 else C["sand_lt"])
    rect(img, 22, 27, 25, 30, C["sand_dk"])
    rect(img, 14, 26, 17, 30, C["black"])  # door
    rect(img, 15, 25, 16, 25, C["black"])
    # shaft
    top = 12
    rect(img, 12, top, 19, 25, C["sand_lt"])
    rect(img, 12, top, 13, 25, C["cream"])
    rect(img, 18, top, 19, 25, C["sand_dk"])
    for y in (17, 22):
        rect(img, 12, y, 19, y + 1, C["shallow"])
        rect(img, 18, y, 19, y + 1, C["water_lt"])
        rect(img, 12, y, 13, y, C["foam"])
    rect(img, 15, 19, 16, 20, C["black"])  # window
    # balconies (railing dots over a corbelled underside)
    def balcony(y, w):
        x0, x1 = 16 - w // 2, 15 + w // 2
        rect(img, x0, y, x1, y + 1, C["sand_dk"])
        rect(img, x0, y - 1, x1, y - 1, C["gold"] if tier == 2 else C["sand"])
        for x in range(x0, x1 + 1, 2):
            px(img, x, y - 2, C["gold"] if tier == 2 else C["sand_lt"])
        rect(img, x0 + 2, y + 2, x1 - 2, y + 2, shift(C["sand_dk"], -0.2))
    balcony(top + 2, 14)
    if tier >= 1:
        balcony(top + 8, 12)
    # dome cap and finial
    dome = C["gold"] if tier == 2 else C["shallow"]
    dome_dk = C["gold_dk"] if tier == 2 else C["water_lt"]
    rect(img, 11, top - 2, 20, top, dome)
    rect(img, 12, top - 4, 19, top - 3, dome)
    rect(img, 14, top - 5, 17, top - 5, dome)
    rect(img, 18, top - 3, 20, top, dome_dk)
    rect(img, 12, top - 3, 13, top - 2, C["fire_yellow"] if tier == 2 else C["foam"])
    rect(img, 15, top - 6, 16, top - 6, C["gold"])
    if tier >= 1:
        banner(img, 1, 11, gold=tier == 2)
    else:
        pennant(img, 21, 17)
    if tier == 2:
        rune(img, 9, 20)
        rune(img, 22, 20)
    out = finish(img, shadow=True)
    # beacon flame above the finial, taller each tier
    fy = top - 7
    h = {0: 4, 1: 6, 2: 7}[tier]
    for k in range(h):
        y = fy - k
        half = max(0, (h - k) // 2 - (1 if k == 0 else 0))
        for x in range(16 - half - 1, 16 + half + 1):
            c = C["fire_red"] if x in (16 - half - 1, 15 + half + 1) else (C["fire_orange"] if k < h // 2 else C["fire_yellow"])
            px(out, x, max(0, y), c)
    if tier == 2:
        rect(out, 15, fy - 3, 16, fy - 2, C["white"])
    else:
        px(out, 15, fy - 1, C["fire_yellow"])
    return out


TOWERS = [boats, mines, martyr, aa_gun, shahed, jammer, missile, radar, ghadir, sam, minaret]


def build():
    frames = [fn(tier) for fn in TOWERS for tier in range(3)]
    assert len(frames) == FRAMES
    return strip(frames)
