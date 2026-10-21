"""The AYATOWER: the player's fortress at the end of the shipping lane (fictional satire).

A white Minas-Tirith-style citadel on a slate rock in the surf: a tiered curtain wall with a
gate, a turquoise Persian onion dome on the second tier, the tall white Tower of the Grey Turban
crowned by a burning beacon brazier, a pennant, and the Grey Turban himself (tiny turbaned wizard
with a white beard and a crystal-tipped staff) on the parapet.
Frames: 0 idle, 1 blink + pennant wave, 2 staff slam (staff raised, mithril flash at the
crystal), 3 hurt (red flash, cracks and a fire in the walls).
"""
from draw import blob, disc, new, outline, poly, px, rect, rng, strip, tint
from palette import C

NAME = "ayatower"
FRAME = (32, 32)
FRAMES = 4

W = H = 32
CLEAR = (0, 0, 0, 0)

WALL_HI, WALL, WALL_SH, WALL_DK = C["white"], C["chrome"], C["smoke_lt"], C["stone_lt"]


def a(c, alpha):
    return (*c[:3], alpha)


def rock_base(img):
    rnd = rng(5)
    for x in range(1, 31):
        y = 29 + (1 if (x * 7) % 5 == 0 else 0)
        px(img, x, y, a(C["foam"], 220))
        if x % 3 == 0:
            px(img, x, y + 1, a(C["white"], 160))
    poly(img, [(1, 29), (2, 25), (5, 23), (10, 22), (22, 22), (27, 23), (30, 25), (31, 29)], C["stone"])
    for _ in range(70):
        x, y = rnd.randint(2, 30), rnd.randint(23, 28)
        if img.getpixel((x, y)) == C["stone"]:
            px(img, x, y, C["stone_lt"] if rnd.random() < 0.4 else C["stone_dk"])
    # moss tufts on the rock shoulders
    for x, y in ((3, 25), (4, 24), (5, 24), (26, 24), (27, 24), (28, 25), (6, 23)):
        px(img, x, y, C["grass"])
    px(img, 4, 25, C["grass_dk"])
    px(img, 27, 25, C["grass_dk"])
    for y in range(25, 29):
        px(img, 30, y, C["stone_dk"])
    for x in range(2, 31):
        px(img, x, 28, C["stone_dk"])


def wall_block(img, x0, y0, x1, y1, courses=True):
    """White ashlar wall: lit left edge, shaded right edge, faint staggered joints."""
    rect(img, x0, y0, x1, y1, WALL)
    if courses:
        for y in range(y0 + 2, y1, 3):
            off = 0 if (y // 3) % 2 else 2
            for x in range(x0 + 1 + off, x1, 4):
                px(img, x, y, WALL_SH)
    rect(img, x0, y0, x0, y1, WALL_HI)
    rect(img, x1, y0, x1, y1, WALL_SH)


def merlons(img, x0, x1, y):
    """Battlement row: merlons at y-2..y-1, walkway lip at y."""
    rect(img, x0, y, x1, y, WALL_HI)
    for x in range(x0, x1 + 1, 3):
        rect(img, x, y - 2, x + 1, y - 1, WALL)
        px(img, x, y - 2, WALL_HI)
        px(img, x + 1, y - 1, WALL_SH)


def citadel(img):
    # first tier: broad curtain wall with a gate
    wall_block(img, 3, 20, 28, 26)
    merlons(img, 3, 28, 19)
    rect(img, 3, 26, 28, 26, WALL_SH)
    rect(img, 14, 22, 17, 26, C["iron"])  # gate arch
    rect(img, 15, 21, 16, 21, C["iron"])
    rect(img, 15, 23, 16, 26, C["wood"])
    px(img, 15, 24, C["gold"])
    px(img, 16, 23, C["wood_dk"])
    for x in (6, 10, 21, 25):  # arrow slits
        rect(img, x, 22, x, 24, C["stone_dk"])
    # second tier, narrower, with a gilded string course
    wall_block(img, 7, 14, 24, 18)
    rect(img, 7, 18, 24, 18, WALL_SH)
    merlons(img, 7, 24, 13)
    rect(img, 7, 16, 24, 16, C["gold_dk"])
    for x in (10, 21):
        rect(img, x, 15, x, 15, C["stone_dk"])
    # third tier ring
    wall_block(img, 11, 9, 20, 12, courses=False)
    rect(img, 11, 12, 20, 12, WALL_SH)
    merlons(img, 11, 20, 8)
    # the white tower
    wall_block(img, 14, 4, 17, 11, courses=False)
    rect(img, 17, 5, 17, 11, WALL_SH)
    for y in (6, 9):
        px(img, 15, y, C["stone_dk"])  # tall windows
        px(img, 15, y + 1, C["stone_dk"])
    rect(img, 13, 4, 18, 4, WALL_HI)  # crown cornice


def dome(img):
    """Turquoise Persian onion dome on the left of the second tier, with a gold finial."""
    rect(img, 6, 9, 10, 13, WALL)  # drum
    rect(img, 6, 9, 6, 13, WALL_HI)
    rect(img, 10, 9, 10, 13, WALL_SH)
    px(img, 8, 11, C["water_dk"])
    px(img, 8, 12, C["water_dk"])
    disc(img, 8, 6.4, 2.7, C["shallow"])
    rect(img, 6, 7, 10, 8, C["shallow"])
    px(img, 8, 3, C["shallow"])
    px(img, 7, 5, C["foam"])
    px(img, 6, 6, C["foam"])
    for x, y in ((10, 6), (10, 7), (9, 8), (10, 8)):
        px(img, x, y, C["water_lt"])
    px(img, 8, 2, C["gold"])
    px(img, 8, 1, C["gold"])
    rect(img, 6, 9, 10, 9, C["gold_dk"])


def pennant(img, wave):
    """Red-and-white pennant on the east end of the curtain wall."""
    rect(img, 27, 11, 27, 17, C["iron"])
    px(img, 27, 10, C["gold"])
    for k in range(4):
        dy = (1 if (k + wave) % 4 in (1, 2) else 0) if wave else (k // 3)
        px(img, 28 + k, 11 + dy, C["tie"])
        if k < 3:
            px(img, 28 + k, 12 + dy, C["white"] if k else C["tie"])


def beacon(img, flick):
    """Iron brazier on the tower crown (the fire is painted after the outline)."""
    rect(img, 14, 3, 17, 3, C["iron"])
    px(img, 14, 3, C["smoke"])


def beacon_fire(img, flick):
    pts = {
        0: [(14, 2, "fire_orange"), (15, 2, "fire_yellow"), (16, 2, "fire_yellow"), (17, 2, "fire_orange"),
            (15, 1, "fire_yellow"), (16, 1, "fire_orange"), (14, 1, "fire_red"), (15, 0, "fire_red"),
            (13, 2, "fire_red")],
        1: [(14, 2, "fire_yellow"), (15, 2, "white"), (16, 2, "fire_yellow"), (17, 2, "fire_orange"),
            (16, 1, "fire_yellow"), (15, 1, "fire_orange"), (17, 1, "fire_red"), (16, 0, "fire_orange"),
            (18, 2, "fire_red")],
    }[flick]
    for x, y, c in pts:
        px(img, x, y, C[c])


def grey_turban(img, pose, blink=False):
    """Tiny Gandalf-Ayatollah on the second-tier parapet: turban, face, beard, robe, staff."""
    cx = 22
    rect(img, cx - 2, 9, cx + 1, 12, C["smoke"])  # robe over the merlons
    rect(img, cx - 2, 9, cx - 2, 12, C["smoke_lt"])
    rect(img, cx + 1, 10, cx + 1, 12, C["iron"])
    rect(img, cx - 1, 8, cx, 10, C["white"])  # beard
    px(img, cx - 1, 11, C["white"])
    rect(img, cx - 1, 6, cx, 7, C["skin_lt"])  # face
    if not blink:
        px(img, cx - 1, 6, C["black"])
        px(img, cx, 6, C["black"])
    rect(img, cx - 2, 4, cx + 1, 5, C["smoke_lt"])  # turban
    px(img, cx - 1, 4, C["white"])
    px(img, cx + 1, 5, C["smoke"])
    px(img, cx - 2, 5, C["smoke"])
    if pose == "raise":
        rect(img, cx + 3, 2, cx + 3, 8, C["wood"])
        px(img, cx + 2, 5, C["skin_lt"])
        px(img, cx + 2, 6, C["smoke"])
    else:
        rect(img, cx + 3, 5, cx + 3, 13, C["wood"])
        px(img, cx + 2, 9, C["skin_lt"])
        px(img, cx + 3, 4, C["mithril_lt"])


def frame(i):
    img = new(W, H)
    rock_base(img)
    citadel(img)
    dome(img)
    pennant(img, wave=(i == 1))
    beacon(img, i % 2)
    img = outline(img)
    wiz = new(W, H)
    grey_turban(wiz, "raise" if i == 2 else "rest", blink=(i == 1))
    img.alpha_composite(outline(wiz))
    beacon_fire(img, i % 2)
    if i == 2:
        cx, cy = 26, 1
        for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (1, 1), (-1, 1), (2, 0), (-2, 0), (0, 2)):
            px(img, cx + dx, cy + dy, C["white"])
        for dx, dy in ((3, 0), (-3, 0), (2, 2), (-2, 2), (0, 3), (3, 1), (-3, 1)):
            px(img, cx + dx, cy + dy, a(C["mithril_lt"], 230))
        for dx, dy in ((4, 2), (-4, 2), (0, 4), (5, 0), (-5, 0), (3, 3), (-3, 3), (6, 1)):
            px(img, cx + dx, cy + dy, a(C["mithril"], 190))
    if i == 3:
        img = tint(img, C["fire_red"], 0.35)
        for x, y in ((10, 21), (11, 22), (11, 23), (12, 24), (11, 25), (19, 14), (18, 15), (19, 16), (20, 17),
                     (24, 21), (25, 22), (24, 23), (16, 5), (15, 6), (16, 7)):
            px(img, x, y, C["black"])
        blob(img, 13, 15, 1.6, [C["fire_yellow"], C["fire_orange"]], seed=3)
        blob(img, 7, 22, 1.3, [C["fire_yellow"], C["fire_orange"]], seed=4)
        for x, y in ((13, 12), (14, 11), (12, 10), (8, 19), (7, 18)):
            px(img, x, y, a(C["smoke"], 200))
    return img


def build():
    return strip([frame(i) for i in range(FRAMES)])
