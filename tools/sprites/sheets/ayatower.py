"""The AYATOWER: the player's fortress at the end of the shipping lane (fictional satire).

A sandstone keep with a turquoise tile band and a slender minaret, on a rock in the surf, with the
Grey Turban (tiny turbaned wizard with a white beard and a staff) on the battlement.
Frames: 0 idle, 1 blink + flag wave, 2 slam (staff raised, white flash at the tip),
3 hurt (red flash and cracks).
"""
from draw import blob, new, outline, poly, px, rect, rng, strip, tint
from palette import C

NAME = "ayatower"
FRAME = (32, 32)
FRAMES = 4

W = H = 32


def a(c, alpha):
    return (*c[:3], alpha)


def rock_base(img):
    rnd = rng(5)
    # foam ring where the rock meets the sea
    for x in range(1, 31):
        y = 29 + (1 if (x * 7) % 5 == 0 else 0)
        px(img, x, y, a(C["foam"], 210))
        if x % 3 == 0:
            px(img, x, y + 1, a(C["white"], 160))
    poly(img, [(2, 29), (3, 24), (7, 21), (12, 20), (20, 20), (26, 21), (29, 24), (30, 29)], C["rock"])
    for _ in range(70):
        x, y = rnd.randint(3, 29), rnd.randint(21, 28)
        if img.getpixel((x, y)) == C["rock"]:
            px(img, x, y, C["rock_lt"] if rnd.random() < 0.45 else C["rock_dk"])
    # lit top-left slabs, dark right side
    for x, y in ((4, 24), (5, 23), (6, 22), (7, 22), (8, 21), (5, 25), (9, 21)):
        px(img, x, y, C["rock_lt"])
    for y in range(23, 29):
        px(img, 29, y, C["rock_dk"])
        px(img, 28, y + 1, C["rock_dk"])
    for x in range(3, 30):
        px(img, x, 28, C["rock_dk"])


def keep(img):
    x0, x1, y0, y1 = 9, 24, 9, 24
    rect(img, x0, y0, x1, y1, C["sand"])
    # stone courses with staggered joints
    for y in range(y0 + 2, y1, 3):
        rect(img, x0, y, x1, y, C["sand_dk"])
        off = 0 if (y // 3) % 2 else 2
        for x in range(x0 + off, x1, 4):
            px(img, x, y - 1, C["sand_dk"])
    rect(img, x0, y0, x0, y1, C["sand_lt"])  # lit left edge
    rect(img, x1 - 1, y0, x1, y1, C["sand_dk"])  # shaded right side
    # turquoise tile band with a gold rule
    rect(img, x0, 13, x1, 14, C["water_lt"])
    for x in range(x0, x1 + 1, 2):
        px(img, x, 13, C["shallow"])
    rect(img, x0, 15, x1, 15, C["gold_dk"])
    # arched gate
    rect(img, 15, 19, 18, 24, C["iron"])
    rect(img, 16, 18, 17, 18, C["iron"])
    px(img, 15, 19, C["sand_dk"])
    px(img, 18, 19, C["sand_dk"])
    rect(img, 16, 20, 17, 24, C["wood"])
    px(img, 16, 22, C["gold"])
    # arrow slits
    for x in (11, 21):
        rect(img, x, 17, x, 19, C["black"])
    # battlements (merlons) on the parapet
    rect(img, x0 - 1, y0 - 1, x1 + 1, y0, C["sand_lt"])
    for x in range(x0 - 1, x1 + 2, 3):
        rect(img, x, y0 - 3, x + 1, y0 - 2, C["sand_lt"])
        px(img, x + 1, y0 - 2, C["sand"])
    rect(img, x0 - 1, y0, x1 + 1, y0, C["sand_dk"])


def minaret(img):
    # slender minaret on the left with a balcony, turquoise cap and gold finial
    rect(img, 4, 6, 7, 23, C["sand_lt"])
    rect(img, 7, 6, 7, 23, C["sand_dk"])
    rect(img, 4, 6, 4, 23, C["cream"])
    for y in (12, 18):
        rect(img, 4, y, 7, y, C["water_lt"])
    rect(img, 3, 9, 8, 9, C["sand_dk"])
    rect(img, 3, 8, 8, 8, C["sand"])
    rect(img, 4, 3, 7, 5, C["water_lt"])
    rect(img, 5, 2, 6, 2, C["water_lt"])
    px(img, 4, 3, C["shallow"])
    px(img, 5, 3, C["foam"])
    px(img, 7, 5, C["water"])
    px(img, 5, 1, C["gold"])
    px(img, 5, 0, C["gold"])
    px(img, 5, 15, C["black"])  # window


def flag(img, wave):
    rect(img, 26, 1, 26, 9, C["iron"])
    px(img, 26, 0, C["gold"])
    rows = (C["green"], C["white"], C["tie"])
    for i, c in enumerate(rows):
        for k in range(4):
            dy = (1 if (k + wave) % 4 in (1, 2) else 0) if wave else (1 if k == 3 else 0)
            px(img, 27 + k, 1 + i + dy, c)
    px(img, 28, 2 + (1 if wave else 0), C["tie"])


def grey_turban(img, pose, blink=False):
    """Tiny Gandalf-Ayatollah on the battlement: turban, face, beard, robe, staff."""
    cx = 16
    # robe (grey, cape over the parapet)
    rect(img, cx - 2, 5, cx + 2, 8, C["smoke"])
    rect(img, cx - 2, 5, cx - 2, 8, C["smoke_lt"])
    rect(img, cx + 2, 6, cx + 2, 8, C["iron"])
    # beard (long, white, over the robe)
    rect(img, cx - 1, 4, cx + 1, 6, C["white"])
    px(img, cx, 7, C["white"])
    px(img, cx + 1, 6, C["chrome"])
    # face
    rect(img, cx - 1, 2, cx + 1, 3, C["skin_lt"])
    if not blink:
        px(img, cx - 1, 2, C["black"])
        px(img, cx + 1, 2, C["black"])
    px(img, cx, 3, C["skin"])
    # turban: rounded grey wrap, wider than the head
    rect(img, cx - 2, 0, cx + 2, 1, C["smoke_lt"])
    px(img, cx - 2, 0, (0, 0, 0, 0))
    px(img, cx + 2, 0, (0, 0, 0, 0))
    px(img, cx - 1, 0, C["white"])
    px(img, cx + 1, 1, C["smoke"])
    px(img, cx - 2, 1, C["smoke"])
    # staff + hand
    if pose == "raise":
        rect(img, cx + 4, 2, cx + 4, 7, C["wood"])
        px(img, cx + 3, 4, C["skin_lt"])
        px(img, cx + 3, 3, C["smoke"])
    else:
        rect(img, cx + 4, 2, cx + 4, 9, C["wood"])
        px(img, cx + 3, 6, C["skin_lt"])
        px(img, cx + 4, 1, C["foam"])


def frame(i):
    img = new(W, H)
    rock_base(img)
    keep(img)
    minaret(img)
    flag(img, wave=(i == 1))
    grey_turban(img, "raise" if i == 2 else "rest", blink=(i == 1))
    img = outline(img)
    if i == 2:
        # the staff flash: white star burst at the raised tip
        cx, cy = 20, 1
        for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (1, 1), (-1, 1), (1, -1),
                       (-1, -1)):
            px(img, cx + dx, cy + dy, C["white"])
        for dx, dy in ((3, 0), (-3, 0), (0, 2), (2, 2), (-2, 2), (2, -1), (-2, -1)):
            px(img, cx + dx, cy + dy, a(C["foam"], 210))
        for dx, dy in ((4, 2), (-4, 2), (0, 3), (5, 0), (-5, 0), (3, 3), (-3, 3), (4, -1), (-4, -1)):
            px(img, cx + dx, cy + dy, a(C["fire_yellow"], 180))
    if i == 3:
        img = tint(img, C["fire_red"], 0.35)
        # cracks in the keep
        for x, y in ((12, 10), (13, 11), (13, 12), (14, 13), (13, 14), (14, 15), (21, 16), (20, 17), (21, 18),
                     (22, 19), (10, 20), (11, 21)):
            px(img, x, y, C["black"])
        blob(img, 22, 11, 1.6, [C["fire_yellow"], C["fire_orange"]], seed=3)
        for x, y in ((24, 6), (25, 5), (23, 4)):
            px(img, x, y, a(C["smoke"], 200))
    return img


def build():
    return strip([frame(i) for i in range(FRAMES)])
