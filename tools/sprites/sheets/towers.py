"""Tower bases, 16x16 transparent, frame = towerIndex * 3 + tier. High-fantasy stone and timber.

Tier 0 is the plain structure, tier 1 adds banners (and more kit), tier 2 is the showpiece with
gold trim and glowing mithril runes. Aimed towers (boats, aa_gun, missile, sam) keep a mount ring
at the exact centre for the turret sheet. Water-placed towers (boats, mines, martyr, ghadir)
carry their own patch of water.

 0 boats    timber pier, watch-hut and a ballista longboat
 1 mines    shipwright's hut with iron powder kegs
 2 martyr   dock of black-sailed fire skiffs
 3 aa_gun   round ballista bastion
 4 shahed   roost tower with winged drones
 5 jammer   wizard's tent with a crackling orb
 6 missile  stone keep with a great bow
 7 radar    palantir dome on a tower
 8 ghadir   sunken iron hull among reeds
 9 sam      twin-ballista tower (octagon with a timber fighting deck)
10 minaret  tall minaret with a beacon flame
"""
from draw import circle, disc, new, outline, px, rect, strip
from palette import C

NAME = "towers"
FRAME = (16, 16)
FRAMES = 33

CLEAR = (0, 0, 0, 0)
SHADOW = (*C["black"][:3], 80)


def a(c, alpha):
    return (*c[:3], alpha)


# ---------------------------------------------------------------------------
# shared parts

def pennant(img, x, y, c=None):
    """Small swallow-tail pennant on a pole: pole at column x from row y, cloth flying right."""
    c = c or C["grass_lt"]
    rect(img, x, y, x, y + 3, C["wood_dk"])
    px(img, x, y - 1, C["gold"])
    px(img, x + 1, y, c)
    px(img, x + 2, y, c)
    px(img, x + 3, y, c)
    px(img, x + 1, y + 1, c)
    px(img, x + 2, y + 1, C["white"])


def banner(img, x, y, gold=False):
    """Tall hanging banner: pole at column x, crossbar at row y, white cloth with a green
    border and a red swallow-tail, a gold finial."""
    rect(img, x, y - 1, x, y + 6, C["wood_dk"])
    px(img, x, y - 2, C["gold"])
    rect(img, x, y, x + 3, y, C["wood_dk"])
    rect(img, x + 1, y + 1, x + 3, y + 4, C["white"])
    rect(img, x + 1, y + 1, x + 1, y + 4, C["grass"])
    px(img, x + 2, y + 2, C["gold"] if gold else C["tie"])
    px(img, x + 1, y + 5, C["tie"])
    px(img, x + 3, y + 5, C["tie"])


def rune(img, x, y):
    """A glowing mithril rune pixel with a soft blue halo."""
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        px(img, x + dx, y + dy, C["mithril"])
    px(img, x, y, C["mithril_lt"])


def water_patch(img, x0, y0, x1, y1):
    rect(img, x0, y0, x1, y1, C["water_lt"])
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if (x * 7 + y * 3) % 11 == 0:
                px(img, x, y, C["water"])
            elif (x * 5 + y * 9) % 17 == 0:
                px(img, x, y, C["shallow"])


def planks(img, x0, y0, x1, y1, vertical=False):
    rect(img, x0, y0, x1, y1, C["wood"])
    if vertical:
        for y in range(y0 + 1, y1 + 1, 2):
            rect(img, x0, y, x1, y, C["wood_dk"])
        rect(img, x0, y0, x0, y1, C["parch_dk"])
    else:
        for x in range(x0 + 1, x1 + 1, 2):
            rect(img, x, y0, x, y1, C["wood_dk"])
        rect(img, x0, y0, x1, y0, C["parch_dk"])


def posts(img, pts):
    for x, y in pts:
        px(img, x, y, C["wood_dk"])


def flagstones(img, x0, y0, x1, y1, lt=None, mid=None, dk=None):
    """Flagstone paving with staggered dark joints."""
    lt, mid, dk = lt or C["stone_lt"], mid or C["stone"], dk or C["stone_dk"]
    rect(img, x0, y0, x1, y1, mid)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            row = (y - y0) // 3
            if (y - y0) % 3 == 2:
                px(img, x, y, dk)
            elif (x - x0 + row * 2) % 4 == 3:
                px(img, x, y, dk)
            elif (y - y0) % 3 == 0 and (x + y) % 3 == 0:
                px(img, x, y, lt)


def gold_rim(img, x0, y0, x1, y1):
    for x in range(x0, x1 + 1):
        px(img, x, y0, C["gold"])
        px(img, x, y1, C["gold_dk"])
    for y in range(y0, y1 + 1):
        px(img, x0, y, C["gold"])
        px(img, x1, y, C["gold_dk"])


def mount(img, gold=False):
    """Turret mount ring at the frame centre (pixels 5..10): an iron turntable."""
    disc(img, 7.5, 7.5, 2.9, C["iron"])
    circle(img, 7.5, 7.5, 2.6, C["gold"] if gold else C["smoke"], thickness=0.8)
    rect(img, 7, 7, 8, 8, C["black"])


def keg(img, x, y, glow=False):
    """Iron-banded powder keg standing upright, 3x4, with a fuse on top."""
    rect(img, x, y, x + 2, y + 3, C["iron"])
    rect(img, x, y, x, y + 3, C["smoke"])
    rect(img, x, y + 1, x + 2, y + 1, C["wood_dk"])
    rect(img, x, y + 3, x + 2, y + 3, C["black"])
    px(img, x, y + 1, C["wood"])
    px(img, x + 1, y, C["smoke_lt"])
    px(img, x + 1, y - 1, C["mithril_lt"] if glow else C["fire_orange"])


def skiff(img, x0, y, sail=3, gold=False):
    """Fire skiff pointing east: a 7-long hull on rows y..y+1, a black sail rising above."""
    rect(img, x0, y, x0 + 5, y + 1, C["wood_dk"])
    rect(img, x0 + 1, y, x0 + 4, y, C["wood"])
    px(img, x0 + 6, y, C["wood_dk"])
    px(img, x0 + 6, y + 1, C["black"])
    px(img, x0 + 5, y + 1, C["fire_orange"])  # pitch pot in the bow
    # mast + black sail (a triangle seen leaning up from the deck)
    m = x0 + 2
    for k in range(1, sail + 1):
        for x in range(m - (sail - k) // 2, m + 2 + (sail - k) // 2 + (1 if k < sail else 0)):
            px(img, x, y - k, C["black"] if (x + k) % 3 else C["iron"])
    px(img, m, y - sail - 1, C["gold"] if gold else C["tie"])
    if gold:
        px(img, x0 + 1, y + 1, C["gold"])
        px(img, x0 + 4, y + 1, C["gold"])


def drone(img, cx, cy, glow=False):
    """Winged drone with leathery bat wings spread, 7x3: dusk membranes, pale wing bones."""
    for dx in (-3, -2, -1, 1, 2, 3):
        px(img, cx + dx, cy, C["dusk"])
    px(img, cx - 3, cy - 1, C["smoke_lt"])
    px(img, cx + 3, cy - 1, C["smoke_lt"])
    px(img, cx - 2, cy - 1, C["smoke_lt"])
    px(img, cx + 2, cy - 1, C["smoke_lt"])
    px(img, cx - 2, cy + 1, C["dusk"])
    px(img, cx + 2, cy + 1, C["dusk"])
    px(img, cx, cy, C["black"])
    px(img, cx, cy + 1, C["black"])
    px(img, cx, cy - 1, C["mithril_lt"] if glow else C["fire_orange"])  # glowing eye


def reeds(img, x, y, h=3):
    for k in range(h):
        px(img, x, y - k, C["grass"] if k < h - 1 else C["grass_lt"])
    px(img, x, y - h, C["sand_dk"])
    px(img, x + 1, y, C["moss"])


def finish(fig, shadow=None):
    outline(fig)
    if shadow is None:
        return fig
    out = new(16, 16)
    for (x0, y0, x1, y1) in shadow:
        rect(out, x0, y0, x1, y1, SHADOW)
    out.alpha_composite(fig)
    return out


# ---------------------------------------------------------------------------
# towers

def boats(tier):
    """Timber pier, a thatched watch-hut and a ballista longboat moored alongside."""
    img = new(16, 16)
    water_patch(img, 2, 0, 15, 11)
    planks(img, 0, 12, 15, 15)
    planks(img, 0, 0, 2, 12, vertical=True)
    posts(img, [(3, 12), (7, 12), (11, 12), (15, 12), (2, 3), (2, 7)])
    if tier == 2:
        for x, y in ((3, 12), (7, 12), (11, 12), (15, 12)):
            px(img, x, y, C["gold"])
    # longboat with a carved prow (bow east), mount amidships
    hull = C["wood_dk"]
    rect(img, 4, 5, 12, 10, hull)
    rect(img, 13, 6, 13, 9, hull)
    px(img, 14, 7, hull)
    px(img, 14, 8, hull)
    px(img, 3, 6, hull)
    px(img, 3, 9, hull)
    rect(img, 4, 6, 12, 9, C["wood"])
    for x in (5, 10, 12):
        rect(img, x, 6, x, 9, C["parch_dk"])  # thwarts
    rect(img, 4, 5, 12, 5, C["parch_dk"] if tier < 2 else C["gold"])  # gunwale
    if tier == 2:
        rect(img, 4, 10, 12, 10, C["gold_dk"])
        px(img, 15, 7, C["gold"])  # gilded dragon prow
    else:
        px(img, 15, 7, C["wood"])
    px(img, 15, 6, C["wood_dk"] if tier < 2 else C["gold_dk"])
    # oars
    for x in (6, 9):
        px(img, x, 4, C["parch_dk"])
        px(img, x, 11, C["parch_dk"])
    if tier == 2:  # a second rowboat moored up top
        rect(img, 7, 1, 12, 2, C["wood_dk"])
        rect(img, 8, 1, 11, 1, C["wood"])
        px(img, 13, 1, C["wood_dk"])
    # thatched watch-hut on the pier corner
    rect(img, 0, 9, 4, 13, C["sand"])
    rect(img, 0, 9, 4, 9, C["sand_lt"])
    rect(img, 0, 11, 4, 11, C["sand_dk"])  # ridge shadow
    for x in (1, 3):
        px(img, x, 10, C["sand_dk"])
    rect(img, 5, 9, 5, 13, C["wood_dk"])
    rect(img, 0, 13, 5, 13, C["wood_dk"])  # eaves
    rect(img, 0, 14, 4, 15, C["wood"])
    px(img, 2, 15, C["black"])  # door
    px(img, 2, 14, C["wood_dk"])
    if tier >= 1:
        banner(img, 1, 3, gold=tier == 2)
    else:
        pennant(img, 1, 5)
    if tier == 2:
        rune(img, 3, 14)
    disc(img, 7.5, 7.5, 2.0, C["iron"])  # pintle mount on the boat
    circle(img, 7.5, 7.5, 2.0, C["gold"] if tier == 2 else C["smoke"], thickness=0.7)
    return finish(img)


def mines(tier):
    """Shipwright's hut on a jetty, iron powder kegs stacked and floating on tethers."""
    img = new(16, 16)
    water_patch(img, 0, 0, 15, 10)
    planks(img, 0, 11, 15, 15)
    posts(img, [(2, 11), (8, 11), (14, 11)])
    # hut with a shingled roof over the water + front wall on the jetty
    rx0, rx1 = 1, 7
    rect(img, rx0, 4, rx1, 11, C["wood_dk"])
    for y in range(4, 11, 2):
        for x in range(rx0, rx1 + 1):
            px(img, x, y, C["stone"] if (x + y // 2) % 2 else C["stone_dk"])
    rect(img, rx0, 4, rx1, 4, C["stone_lt"])
    rect(img, rx0 + 3, 4, rx0 + 3, 11, C["stone_lt"])  # ridge
    if tier == 2:
        rect(img, rx0, 11, rx1, 11, C["gold"])
        rect(img, rx0 + 3, 4, rx0 + 3, 10, C["gold"])
    rect(img, rx0, 12, rx1, 14, C["wood"])
    rect(img, rx0, 12, rx1, 12, C["parch_dk"])
    rect(img, 3, 13, 4, 14, C["black"])  # door
    px(img, 6, 13, C["fire_yellow"])  # lit window
    # kegs
    spots = {0: [(9, 12), (12, 12)], 1: [(9, 12), (12, 12), (9, 6), (12, 3)],
             2: [(9, 12), (12, 12), (9, 6), (12, 3), (12, 7), (9, 1)]}[tier]
    for x, y in spots:
        keg(img, x, y, glow=tier == 2)
        if y < 11:  # floating keg: tether + ripple
            px(img, x - 1, y + 3, C["foam"])
            px(img, x + 3, y + 3, C["foam"])
    if tier >= 1:
        # crane boom swinging over the water
        rect(img, 8, 2, 8, 10, C["wood"])
        rect(img, 8, 2, 11, 2, C["wood_dk"])
        px(img, 11, 3, C["iron"])
        banner(img, 14, 5, gold=tier == 2)
    else:
        pennant(img, 4, 0)
    if tier == 2:
        rune(img, 2, 7)
        rune(img, 6, 9)
    return finish(img)


def martyr(tier):
    """A dock of black-sailed fire skiffs."""
    img = new(16, 16)
    water_patch(img, 3, 0, 15, 15)
    planks(img, 0, 0, 2, 15, vertical=True)
    posts(img, [(2, 2), (2, 6), (2, 10), (2, 14)])
    rows = {0: [(9, 4)], 1: [(6, 3), (13, 3)], 2: [(3, 2), (8, 3), (13, 2)]}[tier]
    for y, sail in rows:
        skiff(img, 5, y, sail=sail, gold=tier == 2)
        px(img, 3, y + 1, C["parch_dk"])  # mooring line
        px(img, 4, y + 1, C["parch_dk"])
    if tier == 0:
        pennant(img, 0, 2, C["tie"])
    if tier >= 1:
        banner(img, 0, 9 if tier == 1 else 9, gold=tier == 2)
    if tier == 2:
        # gold-roofed boat shed at the head of the dock
        rect(img, 0, 0, 3, 3, C["gold"])
        rect(img, 0, 3, 3, 3, C["gold_dk"])
        px(img, 0, 0, C["cream"])
        rune(img, 1, 6)
    return finish(img)


def bastion_ring(img, cx, cy, r, gold=False):
    """Round stone bastion: wall ring with merlons, lit top-left, flagstone floor inside."""
    disc(img, cx, cy, r, C["stone"])
    for y in range(16):
        for x in range(16):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if r - 1.6 < d <= r + 0.1:
                lit = (x - cx) + (y - cy) < 0
                px(img, x, y, C["stone_lt"] if lit else C["stone_dk"])
    disc(img, cx, cy, r - 1.8, C["stone"])
    flagstones(img, int(cx - r + 3), int(cy - r + 3), int(cx + r - 3), int(cy + r - 3),
               lt=C["chrome"], mid=C["stone_lt"], dk=C["stone"])
    # trim the paving back to a disc
    for y in range(16):
        for x in range(16):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if r - 2.6 < d <= r - 1.6:
                px(img, x, y, C["stone"])
    # merlons: lighter blocks with dark crenel gaps every 45 degrees
    import math
    for k in range(8):
        ang = k * math.pi / 4 + math.pi / 8
        x = round(cx + math.cos(ang) * (r - 0.8))
        y = round(cy + math.sin(ang) * (r - 0.8))
        px(img, x, y, C["black"])
    if gold:
        circle(img, cx, cy, r - 0.3, C["gold"], thickness=0.7)


def aa_gun(tier):
    """Round ballista bastion: crenellated stone ring around the ballista turntable."""
    img = new(16, 16)
    bastion_ring(img, 7.5, 7.5, 7.4, gold=tier == 2)
    # bolt racks
    for x, y in ((3, 10), (11, 4)):
        rect(img, x, y, x + 1, y + 1, C["wood"])
        px(img, x, y, C["iron"])
        px(img, x + 1, y, C["iron"])
    if tier >= 1:
        for x, y in ((3, 4), (11, 10)):
            rect(img, x, y, x + 1, y + 1, C["wood"])
            px(img, x, y, C["iron"])
            px(img, x + 1, y, C["iron"])
        banner(img, 0, 1, gold=tier == 2)
        pennant(img, 13, 10)
    else:
        pennant(img, 1, 1)
    if tier == 2:
        for x, y in ((7, 3), (12, 7), (7, 12), (3, 7)):
            rune(img, x if x < 8 else x + 1, y if y < 8 else y + 1)
    mount(img, gold=tier == 2)
    return finish(img)


def shahed(tier):
    """Roost tower: a round stone tower with timber perches and winged drones."""
    img = new(16, 16)
    # tower: cylinder walls (seen with height) and a crenellated top
    rect(img, 4, 6, 11, 14, C["stone"])
    for y in range(7, 15, 2):  # brick courses
        rect(img, 4, y, 11, y, C["stone_dk"])
        for x in range(4 + (y // 2) % 2 * 2, 12, 4):
            px(img, x, y - 1, C["stone_dk"])
    rect(img, 4, 6, 4, 14, C["stone_lt"])
    rect(img, 11, 6, 11, 14, C["stone_dk"])
    rect(img, 7, 12, 8, 14, C["black"])  # arched door
    px(img, 7, 11, C["stone_dk"])
    # roof platform
    disc(img, 7.5, 5.0, 4.6, C["stone_lt"])
    disc(img, 7.5, 5.0, 3.4, C["stone_dk"])
    disc(img, 7.5, 5.0, 2.5, C["wood"])
    for x in (4, 7, 10):
        px(img, x, 1, C["black"])
    # perch beams sticking out
    rect(img, 0, 8, 3, 8, C["wood_dk"])
    rect(img, 12, 9, 15, 9, C["wood_dk"])
    if tier == 2:
        rect(img, 4, 14, 11, 14, C["gold"])
        circle(img, 7.5, 5.0, 4.4, C["gold"], thickness=0.7)
    # drones
    spots = {0: [(7, 4), (3, 8)], 1: [(7, 4), (3, 8), (12, 9)], 2: [(7, 4), (3, 8), (12, 9), (12, 1)]}[tier]
    for cx, cy in spots:
        drone(img, cx, cy, glow=tier == 2)
    if tier >= 1:
        banner(img, 1, 10 if tier == 1 else 10, gold=tier == 2)
    else:
        pennant(img, 12, 4)
    if tier == 2:
        rune(img, 9, 10)
    return finish(img, [(6, 13, 14, 15)])


def jammer(tier):
    """Wizard's striped tent with a crackling orb on the centre pole."""
    img = new(16, 16)
    top = 4 if tier < 2 else 5
    # cone tent: stripes alternating dusk / cream, lit left, shaded right
    for y in range(top, 14):
        t = (y - top) / (13 - top)
        hw = 1 + t * 5.6
        for x in range(16):
            dx = x - 7.5
            if abs(dx) <= hw:
                stripe = int((dx / max(hw, 0.1) + 1) * 3) % 2
                c = C["dusk"] if stripe else C["cream"]
                if dx > hw * 0.45:
                    c = C["night"] if stripe else C["parch"]
                px(img, x, y, c)
    rect(img, 2, 13, 13, 13, C["parch_dk"])
    rect(img, 7, 10, 8, 13, C["black"])  # door flap
    px(img, 6, 13, C["dusk"])
    if tier == 2:
        rect(img, 2, 13, 13, 13, C["gold"])
        px(img, 7, top, C["gold"])
        px(img, 8, top, C["gold"])
    # orb on the pole
    rect(img, 7, top - 2, 8, top, C["wood_dk"])
    r = {0: 1.6, 1: 2.0, 2: 2.3}[tier]
    oy = top - 2 - r
    disc(img, 7.5, oy, r, C["mithril"])
    disc(img, 7.5, oy, r - 0.9, C["mithril_lt"])
    px(img, 7, round(oy - 0.5), C["white"])
    if tier >= 1:
        banner(img, 12, 4, gold=tier == 2)
        rect(img, 1, 9, 1, 13, C["wood_dk"])  # guy-rope stake
        px(img, 1, 8, C["fire_yellow"])  # lantern
    else:
        pennant(img, 1, 8, C["dusk"])
    if tier == 2:
        for x, y in ((1, 14), (5, 15), (10, 15), (14, 14)):
            rune(img, x, y)
    out = finish(img, [(4, 13, 14, 15)])
    # crackle sparks spill over the outline
    sparks = {0: [(5, round(oy) - 2), (10, round(oy))],
              1: [(4, round(oy) - 1), (11, round(oy) - 2), (6, round(oy) + 3)],
              2: [(4, round(oy) - 2), (11, round(oy) - 1), (5, round(oy) + 3), (10, round(oy) + 3), (7, 0)]}[tier]
    for x, y in sparks:
        px(out, x, y, C["mithril_lt"])
        px(out, x + (1 if x < 8 else -1), y + 1, a(C["dusk"], 220))
    return out


def missile(tier):
    """Square stone keep with corner turrets, the great bow mounted on its roof."""
    img = new(16, 16)
    rect(img, 1, 1, 14, 14, C["stone"])
    rect(img, 1, 1, 14, 1, C["stone_lt"])
    rect(img, 1, 1, 1, 14, C["stone_lt"])
    rect(img, 14, 2, 14, 14, C["stone_dk"])
    rect(img, 2, 14, 14, 14, C["stone_dk"])
    flagstones(img, 3, 3, 12, 12, lt=C["chrome"], mid=C["stone_lt"], dk=C["stone"])
    frame_c = C["stone_dk"]
    rect(img, 2, 2, 13, 2, frame_c)
    rect(img, 2, 2, 2, 13, frame_c)
    # crenels along the parapet
    for k in range(4, 12, 3):
        px(img, k, 1, C["black"])
        px(img, 1, k, C["black"])
        px(img, k, 14, C["black"])
        px(img, 14, k, C["black"])
    # corner turrets
    for cx, cy in ((2.0, 2.0), (13.0, 2.0), (2.0, 13.0), (13.0, 13.0)):
        disc(img, cx, cy, 2.0, C["stone_lt"] if cx + cy < 15 else C["stone"])
        px(img, int(cx), int(cy), C["stone_dk"])
    if tier >= 1:
        banner(img, 1, 3, gold=tier == 2)
        banner(img, 12, 3, gold=tier == 2) if tier == 2 else pennant(img, 12, 1)
    else:
        pennant(img, 1, 0)
    if tier == 2:
        gold_rim(img, 3, 3, 12, 12)
        for x, y in ((2, 13), (13, 13)):
            rune(img, x, y)
    mount(img, gold=tier == 2)
    return finish(img)


def radar(tier):
    """A slim stone tower crowned by a cradle holding a palantir seeing-stone."""
    img = new(16, 16)
    # plinth
    rect(img, 3, 12, 12, 14, C["stone"])
    rect(img, 3, 12, 12, 12, C["stone_lt"])
    rect(img, 12, 13, 12, 14, C["stone_dk"])
    # shaft
    rect(img, 5, 6, 10, 12, C["stone_lt"])
    rect(img, 9, 6, 10, 12, C["stone"])
    rect(img, 10, 6, 10, 12, C["stone_dk"])
    for y in (8, 11):
        rect(img, 5, y, 10, y, C["stone_dk"])
    px(img, 7, 9, C["black"])  # window
    px(img, 7, 10, C["black"])
    rect(img, 7, 13, 8, 14, C["black"])  # door
    # cradle (dome ribs) holding the stone
    rect(img, 4, 5, 11, 6, C["gold"] if tier == 2 else C["stone_dk"])
    rect(img, 4, 5, 11, 5, C["gold"] if tier == 2 else C["stone"])
    r = 2.6 if tier == 0 else 3.0
    cy = 2.9
    disc(img, 7.5, cy, r, C["night"])
    disc(img, 8.2, cy + 0.6, r - 1.2, C["dusk"])
    px(img, 6, round(cy) - 1, C["mithril_lt"])
    px(img, 6, round(cy), C["mithril"])
    if tier >= 1:
        # ribs of the dome rising round the stone
        px(img, 4, 4, C["gold"] if tier == 2 else C["stone"])
        px(img, 11, 4, C["gold_dk"] if tier == 2 else C["stone_dk"])
        banner(img, 12, 7, gold=tier == 2)
    else:
        pennant(img, 1, 8)
    if tier == 2:
        px(img, 8, round(cy) + 1, C["fire_red"])  # the stone stirs
        rune(img, 7, 9)
        rect(img, 3, 12, 12, 12, C["gold"])
        rune(img, 4, 13)
    return finish(img, [(7, 13, 14, 15)])


def ghadir(tier):
    """A sunken iron hull half-drowned among the reeds, its broken mast still standing."""
    img = new(16, 16)
    water_patch(img, 0, 1, 15, 15)
    # iron hull lying east-west, the right end slipping under the water
    rect(img, 2, 6, 12, 10, C["iron"])
    rect(img, 3, 5, 11, 5, C["iron"])
    rect(img, 3, 11, 11, 11, C["iron"])
    rect(img, 3, 6, 11, 6, C["smoke"])  # lit upper strake
    rect(img, 3, 9, 11, 10, C["stone_dk"])
    for x in range(3, 12, 2):
        px(img, x, 8, C["gold"] if tier == 2 else C["smoke_lt"])  # rivets
    px(img, 1, 8, C["iron"])
    # waterline lapping over the bow
    for x, y in ((12, 6), (12, 7), (13, 8), (12, 9), (11, 10), (12, 11)):
        px(img, x, y, C["water_lt"])
    for x, y in ((13, 7), (13, 9), (12, 10), (2, 11), (1, 9)):
        px(img, x, y, C["foam"])
    # rust holes
    px(img, 5, 7, C["fire_orange"] if tier == 2 else C["maroon"])
    px(img, 9, 7, C["black"])
    # broken mast + yard
    rect(img, 7, 1, 7, 7, C["wood_dk"])
    rect(img, 5, 3, 9, 3, C["wood_dk"])
    px(img, 7, 0, C["wood"])
    # reeds
    clumps = {0: [(1, 4), (14, 14), (4, 14)], 1: [(1, 4), (14, 14), (4, 14), (14, 4), (10, 14)],
              2: [(1, 4), (14, 14), (4, 14), (14, 4), (10, 14), (0, 14)]}[tier]
    for x, y in clumps:
        reeds(img, x, y)
        reeds(img, x + 1, y + 1, 2)
    if tier >= 1:
        banner(img, 7, 1, gold=tier == 2)
    else:
        pennant(img, 7, 1, C["tie"])
    if tier == 2:
        for x, y in ((4, 12), (10, 12)):
            rune(img, x, y)
    return finish(img)


def sam(tier):
    """Twin-ballista tower: an octagonal stone tower topped with a timber fighting deck."""
    img = new(16, 16)
    oct_ = [(4, 0), (11, 0), (15, 4), (15, 11), (11, 15), (4, 15), (0, 11), (0, 4)]
    from draw import poly
    poly(img, oct_, C["stone"])
    for k in range(16):  # lit NW edges, dark SE edges
        for x, y in ((k, 4 - k) if k <= 4 else (None, None), (0, k) if 4 <= k <= 11 else (None, None)):
            if x is not None:
                px(img, x, y, C["stone_lt"])
    rect(img, 4, 0, 11, 0, C["stone_lt"])
    rect(img, 4, 15, 11, 15, C["stone_dk"])
    rect(img, 15, 4, 15, 11, C["stone_dk"])
    for k in range(5):
        px(img, 11 + k, 15 - k, C["stone_dk"])
        px(img, 11 + k, k, C["stone"])
        px(img, k, 11 + k, C["stone"])
    # timber deck inside
    poly(img, [(5, 2), (10, 2), (13, 5), (13, 10), (10, 13), (5, 13), (2, 10), (2, 5)], C["wood"])
    for x in range(3, 13, 2):
        for y in range(2, 14):
            if img.getpixel((x, y)) == C["wood"]:
                px(img, x, y, C["wood_dk"])
    for x, y in ((5, 2), (10, 2), (13, 5), (13, 10), (10, 13), (5, 13), (2, 10), (2, 5)):
        px(img, x, y, C["black"])  # crenel gaps at the facets
    if tier == 2:
        poly(img, [(5, 2), (10, 2)], C["gold"])
        rect(img, 5, 1, 10, 1, C["gold"])
        rect(img, 5, 14, 10, 14, C["gold_dk"])
        rect(img, 1, 5, 1, 10, C["gold"])
        rect(img, 14, 5, 14, 10, C["gold_dk"])
    if tier >= 1:
        banner(img, 12, 0, gold=tier == 2)
        banner(img, 0, 8, gold=tier == 2) if tier == 2 else pennant(img, 1, 11)
    else:
        pennant(img, 12, 1)
    if tier == 2:
        for x, y in ((3, 3), (12, 12)):
            rune(img, x, y)
    mount(img, gold=tier == 2)
    return finish(img)


def minaret(tier):
    """A tall minaret: turquoise tile bands, a balcony, a dome cap and a beacon flame on top."""
    img = new(16, 16)
    # plinth
    rect(img, 3, 12, 12, 14, C["sand"])
    rect(img, 3, 12, 12, 12, C["sand_lt"])
    rect(img, 12, 13, 12, 14, C["sand_dk"])
    rect(img, 7, 13, 8, 14, C["black"])  # door
    px(img, 7, 12, C["sand_dk"])
    top = 5
    # shaft
    rect(img, 6, top, 9, 12, C["sand_lt"])
    rect(img, 9, top, 9, 12, C["sand_dk"])
    rect(img, 6, top, 6, 12, C["cream"])
    for y in (9, 11):
        rect(img, 6, y, 9, y, C["shallow"])
        px(img, 9, y, C["water_lt"])
    # balcony
    by = top + 2
    rect(img, 5, by, 10, by, C["sand_dk"])
    rect(img, 5, by - 1, 10, by - 1, C["sand"])
    # dome cap
    dome = C["gold"] if tier == 2 else C["shallow"]
    rect(img, 6, top - 1, 9, top, dome)
    rect(img, 7, top - 2, 8, top - 2, dome)
    px(img, 6, top - 1, C["gold"] if tier == 2 else C["foam"])
    px(img, 9, top, C["gold_dk"] if tier == 2 else C["water_lt"])
    if tier >= 1:
        rect(img, 4, by + 3, 11, by + 3, C["sand_dk"])  # second balcony
        rect(img, 4, by + 2, 11, by + 2, C["sand"])
        banner(img, 1, 7, gold=tier == 2)
    else:
        pennant(img, 10, 8)
    if tier == 2:
        rect(img, 3, 12, 12, 12, C["gold"])
        rect(img, 5, by, 10, by, C["gold"])
        rune(img, 7, 10)
        rune(img, 11, 13)
    out = finish(img, [(8, 12, 15, 15)])
    # beacon flame above the dome (grows with tier)
    fy = top - 3
    flame = {0: [(7, fy, "fire_orange"), (8, fy, "fire_yellow"), (7, fy - 1, "fire_yellow")],
             1: [(7, fy, "fire_orange"), (8, fy, "fire_yellow"), (7, fy - 1, "fire_yellow"),
                 (8, fy - 1, "fire_orange"), (8, fy - 2, "fire_red")],
             2: [(6, fy, "fire_red"), (7, fy, "fire_orange"), (8, fy, "fire_yellow"), (9, fy, "fire_orange"),
                 (7, fy - 1, "white"), (8, fy - 1, "fire_yellow"), (7, fy - 2, "fire_orange"),
                 (8, fy - 2, "fire_yellow")]}[tier]
    for x, y, c in flame:
        px(out, x, max(0, y), C[c])
    return out


TOWERS = [boats, mines, martyr, aa_gun, shahed, jammer, missile, radar, ghadir, sam, minaret]


def build():
    frames = [fn(tier) for fn in TOWERS for tier in range(3)]
    assert len(frames) == FRAMES
    return strip(frames)
