"""HUD icons, 12x12 with a 1px dark outline.

 0 lives (grey turban)   1 rial coin   2 wave crest   3 play   4-6 speed x1/x2/x3
 7 auto (circular arrows)   8 pause   9 target FIRST   10 target LAST   11 target STRONG
12 target CLOSE (crosshair)   13 staff ability   14 fatwa scroll ability   15 sell   16 upgrade
"""
from draw import bevel, circle, disc, ellipse, new, outline, poly, px, rect, strip
from palette import C

NAME = "hud_icons"
FRAME = (12, 12)
FRAMES = 17

INK = C["cream"]
INK_DK = C["sand_dk"]


def icon():
    return new(12, 12)


def finish(img, bev=True):
    if bev:
        bevel(img, light=0.25, dark=-0.22)
    return outline(img, C["black"])


def lives():
    """The Grey Turban: tiny bust with a big grey turban, face, spectacles and a white beard."""
    img = icon()
    ellipse(img, 1, 0, 10, 5, C["smoke"])  # turban
    rect(img, 1, 3, 10, 5, C["smoke"])
    for k in range(8):
        px(img, 2 + k, 2 + k // 4, C["smoke_lt"])  # wrap fold
    rect(img, 1, 5, 10, 5, C["iron"])
    px(img, 3, 1, C["white"])
    rect(img, 3, 6, 8, 7, C["skin_lt"])  # face
    px(img, 4, 6, C["iron"])  # spectacles
    px(img, 7, 6, C["iron"])
    poly(img, [(2, 7), (9, 7), (8, 10), (5.5, 11), (3, 10)], C["white"])  # beard
    px(img, 5, 9, C["chrome"])
    px(img, 7, 9, C["chrome"])
    rect(img, 4, 8, 7, 8, C["chrome"])
    return outline(img)


def coin(minus=False):
    img = icon()
    disc(img, 5.5, 5.5, 4.6, C["gold"])
    circle(img, 5.5, 5.5, 3.4, C["gold_dk"], thickness=0.9)
    if minus:
        rect(img, 3, 5, 8, 6, C["tie"])
        rect(img, 3, 5, 8, 5, C["fire_red"])
    else:
        rect(img, 5, 3, 6, 8, C["gold_dk"])  # stamped I (rial bar)
        rect(img, 4, 3, 7, 3, C["gold_dk"])
        rect(img, 4, 8, 7, 8, C["gold_dk"])
    px(img, 3, 2, C["cream"])
    px(img, 2, 3, C["cream"])
    return outline(img)


def wave():
    img = icon()
    poly(img, [(0, 10), (1, 6), (3, 3), (6, 2), (9, 3), (10, 5), (8, 5), (7, 4), (6, 5), (7, 7), (10, 8), (11, 10)],
         C["water_lt"])
    rect(img, 0, 9, 11, 10, C["water"])
    for x, y in ((3, 3), (4, 2), (5, 2), (6, 2), (7, 2), (8, 3), (9, 3), (10, 4)):
        px(img, x, y, C["foam"])
    px(img, 2, 5, C["shallow"])
    px(img, 1, 7, C["shallow"])
    return outline(img)


def play():
    img = icon()
    poly(img, [(3, 1), (10, 5.5), (3, 10)], INK)
    return finish(img)


def chevrons(n):
    img = icon()
    widths = {1: [4], 2: [2, 6], 3: [0, 4, 8]}[n]
    for x0 in widths:
        for y in range(1, 11):
            d = 4 - abs(y - 5.5) + 0.5
            for t in range(2):
                px(img, x0 + int(d) + t - 1 + (1 if n == 1 else 0), y, INK)
    return finish(img)


AUTO = [
    "...####...",
    ".##....#..",
    ".#....###.",
    "#......#..",
    "#.........",
    ".........#",
    "..#......#",
    ".###....#.",
    "..#....##.",
    "...####...",
]


def auto():
    """Two chasing arrows round a circle (auto-start waves)."""
    img = icon()
    for y, row in enumerate(AUTO):
        for x, ch in enumerate(row):
            if ch == "#":
                px(img, x + 1, y + 1, INK)
    return finish(img, bev=False)


def pause():
    img = icon()
    rect(img, 2, 1, 4, 10, INK)
    rect(img, 7, 1, 9, 10, INK)
    return finish(img)


def target_first():
    img = icon()
    rect(img, 1, 5, 6, 6, INK)
    poly(img, [(6, 2), (9, 5.5), (6, 9)], INK)
    rect(img, 10, 1, 10, 10, C["gold"])
    return finish(img)


def target_last():
    img = icon()
    rect(img, 5, 5, 10, 6, INK)
    poly(img, [(5, 2), (2, 5.5), (5, 9)], INK)
    rect(img, 1, 1, 1, 10, C["smoke_lt"])
    return finish(img)


def target_strong():
    img = icon()
    poly(img, [(1, 1), (10, 1), (10, 6), (5.5, 10.5), (1, 6)], C["tie"])
    poly(img, [(3, 3), (8, 3), (8, 6), (5.5, 8.5), (3, 6)], C["maroon"])
    rect(img, 5, 2, 6, 9, C["gold"])  # vertical bar of the cross
    rect(img, 2, 4, 9, 5, C["gold"])
    bevel(img, light=0.25, dark=-0.25)
    return outline(img)


def target_close():
    img = icon()
    circle(img, 5.5, 5.5, 3.6, C["tie"], thickness=1.2)
    for k in range(0, 3):
        px(img, 5, k, C["tie"])
        px(img, 6, k, C["tie"])
        px(img, 5, 11 - k, C["tie"])
        px(img, 6, 11 - k, C["tie"])
        px(img, k, 5, C["tie"])
        px(img, k, 6, C["tie"])
        px(img, 11 - k, 5, C["tie"])
        px(img, 11 - k, 6, C["tie"])
    rect(img, 5, 5, 6, 6, C["fire_yellow"])
    return outline(img)


def staff():
    img = icon()
    for k in range(9):  # diagonal wooden staff, bottom-left to top-right
        px(img, 1 + k, 10 - k, C["wood"])
        px(img, 2 + k, 10 - k, C["rock"])
    px(img, 1, 10, C["rock"])
    # gnarled crook at the top
    px(img, 9, 1, C["wood"])
    px(img, 10, 2, C["wood"])
    outline(img)
    # glowing tip
    disc(img, 9.5, 1.5, 1.6, (*C["foam"][:3], 255))
    px(img, 9, 1, C["white"])
    px(img, 10, 1, C["white"])
    for x, y in ((11, 0), (7, 0), (11, 4)):
        px(img, x, y, C["fire_yellow"])
    return img


def fatwa():
    img = icon()
    rect(img, 2, 1, 9, 9, C["cream"])
    rect(img, 1, 1, 10, 2, C["sand"])  # top roll
    rect(img, 1, 9, 10, 10, C["sand"])  # bottom roll
    rect(img, 1, 1, 10, 1, C["sand_lt"])
    for y in (4, 6):
        rect(img, 3, y, 8, y, C["smoke"])  # script lines
    rect(img, 3, 5, 6, 5, C["smoke"])
    disc(img, 8, 8, 1.6, C["tie"])  # red wax seal
    px(img, 7, 7, C["fire_orange"])
    px(img, 9, 10, C["maroon"])
    return outline(img)


def upgrade():
    """Two stacked gold chevrons pointing up."""
    img = icon()
    for y0 in (1, 5):
        for x in range(1, 11):
            d = abs(x - 5.5) + 0.5
            yy = y0 + int(d) - 1
            for t in range(3):
                px(img, x, yy + t, C["gold"] if y0 == 1 else C["gold_dk"])
    bevel(img, light=0.3, dark=-0.2)
    return outline(img)


def build():
    return strip([
        lives(), coin(), wave(), play(), chevrons(1), chevrons(2), chevrons(3), auto(), pause(),
        target_first(), target_last(), target_strong(), target_close(), staff(), fatwa(), coin(minus=True), upgrade(),
    ])
