"""HUD icons, 12x12 with a 1px dark outline.

 0 lives (the Grey Turban)   1 gold coin with a Persian star   2 wave (the red Eye)   3 play
 4-6 speed x1/x2/x3 (hourglass with 1/2/3 gold pips)   7 auto (circular arrows)   8 pause
 9 target FIRST (arrow to the goal)   10 target LAST (arrow back)   11 target STRONG (shield)
12 target CLOSE (crosshair)   13 staff ability (wizard staff + crystal)
14 fatwa ability (rolled scroll with a red wax seal)   15 sell (coin minus)   16 upgrade
"""
from draw import bevel, circle, disc, ellipse, new, outline, poly, px, rect, strip
from palette import C

NAME = "hud_icons"
FRAME = (12, 12)
FRAMES = 17

INK = C["cream"]


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
    disc(img, 5.5, 5.5, 4.9, C["gold_dk"])
    disc(img, 5.2, 5.2, 4.2, C["gold"])
    if minus:
        rect(img, 3, 5, 8, 6, C["tie"])
        rect(img, 3, 5, 8, 5, C["fire_red"])
    else:
        for dx, dy in ((0, -3), (0, 3), (-3, 0), (3, 0), (-2, -2), (2, -2), (-2, 2), (2, 2)):
            px(img, 5 + dx, 5 + dy, C["gold_dk"])
        rect(img, 4, 4, 6, 6, C["gold_dk"])
        for dx, dy in ((0, -2), (0, 2), (-2, 0), (2, 0)):
            px(img, 5 + dx, 5 + dy, C["gold_dk"])
        px(img, 5, 5, C["fire_yellow"])
    px(img, 3, 2, C["cream"])
    px(img, 2, 3, C["cream"])
    return outline(img)


def wave():
    """The red Eye: flame-licked almond, fiery iris, black slit pupil."""
    img = icon()
    # flame licks above and below
    for x, y in ((3, 1), (5, 0), (5, 1), (8, 1), (6, 10)):
        px(img, x, y, C["fire_red"])
    for x, y in ((5, 2), (6, 2), (4, 2), (7, 2)):
        px(img, x, y, C["fire_orange"])
    # almond
    for x in range(0, 12):
        u = (x - 5.5) / 6.0
        lim = 3.2 * (1 - u * u) ** 0.9
        for y in range(12):
            dy = y - 5.5
            if abs(dy) <= lim:
                d = abs(x - 5.5) + abs(dy) * 1.3
                c = C["fire_yellow"] if d < 2.2 else C["fire_orange"] if d < 4.2 else C["fire_red"]
                px(img, x, y, c)
    # slit pupil
    rect(img, 5, 3, 6, 8, C["black"])
    return outline(img)


def hourglass(n):
    """Speed: hourglass (wood caps, glass bulbs, running sand) with n gold pips beside it."""
    img = icon()
    W, WD, G, SA, SD = C["wood"], C["wood_dk"], C["chrome"], C["sand"], C["gold_dk"]
    rect(img, 0, 0, 7, 1, W)
    rect(img, 0, 1, 7, 1, WD)
    rect(img, 0, 10, 7, 11, W)
    rect(img, 0, 10, 7, 10, C["parch"])
    # posts
    rect(img, 0, 2, 0, 9, WD)
    rect(img, 7, 2, 7, 9, WD)
    # glass: bulbs narrowing to a neck at row 5/6
    for y in range(2, 10):
        hw = {2: 2, 3: 2, 4: 1, 5: 0, 6: 0, 7: 1, 8: 2, 9: 2}[y]
        for x in range(3 - hw, 5 + hw):
            px(img, x, y, G)
    # sand: less on top / more below the faster the speed
    top_rows = {1: (3, 4), 2: (4,), 3: ()}[n]
    for y in top_rows:
        hw = {3: 2, 4: 1}[y]
        for x in range(3 - hw, 5 + hw):
            px(img, x, y, SA)
    bot_rows = {1: (9,), 2: (8, 9), 3: (7, 8, 9)}[n]
    for y in bot_rows:
        hw = {7: 1, 8: 2, 9: 2}[y]
        for x in range(3 - hw, 5 + hw):
            px(img, x, y, SA if y < 9 else SD)
    px(img, 3, 5, SA)  # falling stream
    px(img, 4, 6, SA)
    px(img, 2, 2, C["white"])  # glint
    # pips
    for k in range(n):
        y = 9 - k * 4
        rect(img, 9, y, 10, y + 1, C["gold"])
        px(img, 9, y, C["fire_yellow"])
        px(img, 10, y + 1, C["gold_dk"])
    return outline(img)


def play():
    img = icon()
    poly(img, [(3, 1), (10, 5.5), (3, 10)], INK)
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


def arrow(img, flip=False):
    """A fletched arrow pointing east (west when flipped), rows 4..7."""
    def P(x, y, c):
        px(img, 11 - x if flip else x, y, c)
    for x in range(2, 8):
        P(x, 5, C["parch"])
        P(x, 6, C["wood"])
    # iron head
    for x, y in ((8, 3), (8, 4), (9, 4), (8, 5), (9, 5), (10, 5), (8, 6), (9, 6), (10, 6), (8, 7), (9, 7), (8, 8)):
        P(x, y, C["chrome"] if y <= 5 else C["smoke_lt"])
    # red fletching
    for x, y in ((0, 3), (1, 4), (2, 4), (0, 8), (1, 7), (2, 7), (0, 4), (0, 7), (1, 5), (1, 6)):
        P(x, y, C["tie"])


def target_first():
    img = icon()
    arrow(img)
    rect(img, 11, 1, 11, 10, C["gold"])
    return finish(img, bev=False)


def target_last():
    img = icon()
    arrow(img, flip=True)
    rect(img, 0, 1, 0, 10, C["smoke_lt"])
    return finish(img, bev=False)


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
    """Wizard staff with a glowing crystal in a gnarled crook."""
    img = icon()
    for k in range(8):  # diagonal staff, bottom-left to top-right
        px(img, 1 + k, 10 - k, C["wood"])
        px(img, 2 + k, 10 - k, C["wood_dk"])
    px(img, 0, 11, C["wood_dk"])
    # crook prongs around the crystal
    px(img, 7, 2, C["wood"])
    px(img, 7, 1, C["wood"])
    px(img, 10, 4, C["wood_dk"])
    px(img, 11, 4, C["wood_dk"])
    outline(img)
    # crystal (drawn over the outline so it glows)
    for x, y, c in ((9, 0, C["white"]), (8, 1, C["mithril_lt"]), (9, 1, C["white"]), (10, 1, C["mithril_lt"]),
                    (8, 2, C["mithril"]), (9, 2, C["mithril_lt"]), (10, 2, C["mithril"]), (9, 3, C["mithril"]),
                    (11, 2, C["mithril_lt"])):
        px(img, x, y, c)
    for x, y in ((11, 0), (6, 0), (11, 5)):
        px(img, x, y, (*C["mithril_lt"][:3], 200))
    return img


def fatwa():
    """A rolled scroll tied with a red ribbon and a wax seal."""
    img = icon()
    # rolled parchment (horizontal cylinder) with spiral ends
    rect(img, 1, 3, 10, 8, C["parch"])
    rect(img, 1, 3, 10, 4, C["cream"])
    rect(img, 1, 8, 10, 8, C["parch_dk"])
    for x in (1, 10):
        rect(img, x, 4, x, 7, C["parch_dk"])
        px(img, x, 5, C["sand_lt"])
    # ribbon tails
    rect(img, 5, 2, 6, 9, C["tie"])
    px(img, 4, 10, C["tie"])
    px(img, 7, 10, C["maroon"])
    # wax seal
    disc(img, 5.5, 5.5, 1.9, C["tie"])
    px(img, 5, 5, C["fire_red"])
    px(img, 6, 6, C["maroon"])
    px(img, 4, 4, C["fire_orange"])
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
        lives(), coin(), wave(), play(), hourglass(1), hourglass(2), hourglass(3), auto(), pause(),
        target_first(), target_last(), target_strong(), target_close(), staff(), fatwa(), coin(minus=True), upgrade(),
    ])
