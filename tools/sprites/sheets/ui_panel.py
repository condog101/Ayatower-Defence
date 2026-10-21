"""UI chrome: four 9-slice frames (48x48, 8 px borders) and the wax seal.

  ui_panel  parchment page in a riveted black-iron frame
  button    carved slate stone with a chiselled groove
  palantir  dark crystal frame (night glass) with glowing red Eye-stones in the corners
  scroll    parchment sheet between two rolled ends (rolls top and bottom)
  seal      red wax seal stamped with a star and FICTIONAL SATIRE (not 9-slice; also the favicon)

9-slice rules: the border is 8 px on every side. All decoration lives inside the four 8x8 corner
cells; the edge strips are uniform along their length and the centre is one flat colour, because
Phaser stretches (it does not tile) the edges and the centre.
"""
import math

from draw import circle, disc, new, px, rect, tiny_text, tiny_text_width
from palette import C

CLEAR = (0, 0, 0, 0)
S = 48
B = 8  # border


def a(c, alpha):
    return (*c[:3], alpha)


def profiled(lit, dark, centre):
    """Frame from per-depth colour lists (outer -> inner, 8 entries each).

    lit is used on the top/left sides, dark on the bottom/right; corners are mitred."""
    img = new(S, S, centre)
    for y in range(S):
        for x in range(S):
            dt, dl, db, dr = y, x, S - 1 - y, S - 1 - x
            d = min(dt, dl, db, dr)
            if d >= B:
                continue
            # mitre: top/left win ties on the top-left half, bottom/right on the other half
            if d == dt or d == dl:
                side_lit = not (d == db or d == dr) or (dt + dl) <= (db + dr)
            else:
                side_lit = False
            px(img, x, y, (lit if side_lit else dark)[d])
    return img


def corners(img, fn):
    """Call fn(img, x, y, sx, sy) for each corner cell; (x, y) is the outer corner pixel and
    (sx, sy) point inward."""
    for cx, sx in ((0, 1), (S - 1, -1)):
        for cy, sy in ((0, 1), (S - 1, -1)):
            fn(img, cx, cy, sx, sy)


def round_corner(img, x, y, sx, sy, edge=None):
    """Clip the outermost corner pixels so the frame reads rounded."""
    px(img, x, y, CLEAR)
    px(img, x + sx, y, CLEAR)
    px(img, x, y + sy, CLEAR)
    px(img, x + sx, y + sy, edge or C["black"])


class Panel:
    """Parchment page in a black-iron frame with riveted corner plates."""

    NAME = "ui_panel"
    FRAME = (48, 48)
    FRAMES = 1

    @staticmethod
    def build():
        K, I, SM, SL = C["black"], C["iron"], C["smoke"], C["smoke_lt"]
        P, PD, CR = C["parch"], C["parch_dk"], C["cream"]
        lit = [K, SL, SM, I, K, PD, P, P]
        dark = [K, SM, I, I, K, CR, P, P]
        img = profiled(lit, dark, P)

        def plate(img, x, y, sx, sy):
            # iron corner plate 7x7 with a bevel and a rivet
            for k in range(7):
                for j in range(7):
                    xx, yy = x + sx * k, y + sy * j
                    if k == 6 or j == 6:
                        c = K
                    elif (sx > 0 and k == 0) or (sy > 0 and j == 0):
                        c = K
                    else:
                        lx = (k == 1) if sx > 0 else (k == 5)
                        ly = (j == 1) if sy > 0 else (j == 5)
                        top_left = (sx > 0 and k == 1) or (sy > 0 and j == 1)
                        bot_right = (sx < 0 and k == 1) or (sy < 0 and j == 1)
                        c = SL if top_left and not bot_right else I if bot_right and not top_left else SM
                        if not (lx or ly):
                            c = SM
                    px(img, xx, yy, c)
            # edge pixels facing inward: highlight/shade by world light (top-left)
            for k in range(1, 6):
                px(img, x + sx * k, y + sy * 1, SL if sy > 0 else I)
                px(img, x + sx * 1, y + sy * k, SL if sx > 0 else I)
                px(img, x + sx * k, y + sy * 5, I if sy > 0 else SL)
                px(img, x + sx * 5, y + sy * k, I if sx > 0 else SL)
            # rivet
            rx, ry = x + sx * 3, y + sy * 3
            px(img, rx, ry, C["cream"])
            px(img, rx + 1, ry, C["gold"])
            px(img, rx, ry + 1, C["gold"])
            px(img, rx + 1, ry + 1, C["gold_dk"])
            round_corner(img, x, y, sx, sy)

        corners(img, plate)
        return img


class Button:
    """Carved slate: bevelled block with a chiselled inner groove and rune-notched corners."""

    NAME = "button"
    FRAME = (48, 48)
    FRAMES = 1

    @staticmethod
    def build():
        K, SL, ST, SD = C["black"], C["stone_lt"], C["stone"], C["stone_dk"]
        W = C["chrome"]
        lit = [K, W, SL, SL, ST, SD, SL, ST]
        dark = [K, SD, SD, ST, ST, SL, SD, ST]
        img = profiled(lit, dark, ST)

        def notch(img, x, y, sx, sy):
            round_corner(img, x, y, sx, sy)
            # a small carved diamond (a mason's mark) at the groove's corner
            cx, cy = x + sx * 5, y + sy * 5
            for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
                px(img, cx + dx, cy + dy, SD if (dx + dy) < 0 else SL)
            px(img, cx, cy, C["gold_dk"])
            # weathered chips on the lit rim
            px(img, x + sx * 3, y + sy * 1, ST)

        corners(img, notch)
        return img


class Palantir:
    """Dark crystal frame: a black-glass rim with a violet facet sheen, red glowing Eye-stones
    set into each corner, and a deep night-blue pane."""

    NAME = "palantir"
    FRAME = (48, 48)
    FRAMES = 1

    @staticmethod
    def build():
        K, I, SD, N, D = C["black"], C["iron"], C["stone_dk"], C["night"], C["dusk"]
        lit = [K, D, SD, I, K, C["maroon"], N, N]
        dark = [K, I, I, K, K, N, N, N]
        img = profiled(lit, dark, N)
        # thin glassy sheen line along the inside of the rim, uniform along the edges
        for k in range(B, S - B):
            px(img, k, 2, C["mithril"])
            px(img, 2, k, C["mithril"])

        def stone(img, x, y, sx, sy):
            round_corner(img, x, y, sx, sy)
            cx = x + sx * 3
            cy = y + sy * 3
            # red glow bleeding into the frame
            for j in range(8):
                for k in range(8):
                    xx, yy = x + sx * k, y + sy * j
                    d = math.hypot(k - 3, j - 3)
                    if 2.4 < d <= 4.2 and (xx + yy) % 2 == 0:
                        px(img, xx, yy, C["maroon"] if d > 3.3 else C["tie"])
            disc(img, cx, cy, 2.1, C["tie"])
            px(img, cx, cy - 1, C["fire_orange"])
            px(img, cx, cy, C["fire_yellow"])
            px(img, cx, cy + 1, C["fire_orange"])
            px(img, cx - 1, cy, C["fire_red"])
            px(img, cx + 1, cy, C["fire_red"])
            px(img, cx - 1, cy - 1, C["white"])
            circle(img, cx, cy, 2.6, K, thickness=0.7)

        corners(img, stone)
        return img


class Scroll:
    """Parchment sheet between two rolled ends: the rolls run the full width top and bottom,
    the sheet's sides are inset 3 px."""

    NAME = "scroll"
    FRAME = (48, 48)
    FRAMES = 1

    @staticmethod
    def build():
        K, CR, P, PD = C["black"], C["cream"], C["parch"], C["parch_dk"]
        img = new(S, S, CR)
        roll = [K, CR, CR, P, P, PD, PD, K]  # cylinder lit from above
        side = [CLEAR, CLEAR, CLEAR, K, PD, P, CR, CR]  # sheet edge, outer -> inner
        for y in range(S):
            for x in range(S):
                if y < B:
                    c = roll[y]
                elif y >= S - B:
                    c = roll[y - (S - B)]
                elif x < B:
                    c = side[x]
                elif x >= S - B:
                    c = side[S - 1 - x]
                    if c == PD:
                        c = P
                else:
                    continue
                px(img, x, y, c)
        # roll ends: wooden dowel knobs poking out, then a curled spiral on the roll face
        W, WD = C["wood"], C["wood_dk"]
        for y0 in (0, S - B):
            for x0, s in ((0, 1), (S - 1, -1)):
                for j in range(B):
                    px(img, x0, y0 + j, CLEAR)
                    px(img, x0 + s, y0 + j, CLEAR)
                # dowel knob (2 px proud of the roll)
                for j in (2, 3, 4, 5):
                    px(img, x0 + s, y0 + j, WD if j == 5 else W)
                    px(img, x0, y0 + j, K)
                px(img, x0 + s, y0 + 1, K)
                px(img, x0 + s, y0 + 6, K)
                px(img, x0 + s, y0 + 2, C["parch"] if s > 0 else W)
                # roll end face: outline + spiral curl
                for j in range(B):
                    px(img, x0 + s * 2, y0 + j, K)
                for j in range(1, B - 1):
                    px(img, x0 + s * 3, y0 + j, PD if j > 3 else P)
                px(img, x0 + s * 3, y0 + 3, K)
                px(img, x0 + s * 4, y0 + 2, K)
                px(img, x0 + s * 4, y0 + 5, PD)
                px(img, x0 + s * 4, y0 + 4, K)
        return img


class Seal:
    """Red wax seal: drippy rim, embossed ring, a Persian star, FICTIONAL / SATIRE."""

    NAME = "seal"
    FRAME = (48, 48)
    FRAMES = 1

    @staticmethod
    def build():
        img = new(S, S)
        cx = cy = 23.5
        R = 22.0
        # wobbly wax blob
        for y in range(S):
            for x in range(S):
                ang = math.atan2(y - cy, x - cx)
                r = R + 0.9 * math.sin(ang * 7 + 0.6) + 0.6 * math.sin(ang * 11 + 2.0)
                d = math.hypot(x - cx, y - cy)
                if d <= r:
                    lit = (x - cx) + (y - cy) < -r * 0.9
                    shade = (x - cx) + (y - cy) > r * 0.9
                    if d > r - 1.2:
                        c = C["maroon"]
                    elif d > r - 3.2:
                        c = C["fire_red"] if lit else (C["maroon"] if shade else C["tie"])
                    else:
                        c = C["tie"]
                    px(img, x, y, c)
        # pressed ring: dark groove with a lit lower lip
        circle(img, cx, cy, 18.6, C["maroon"], thickness=1.0)
        circle(img, cx + 0.6, cy + 0.6, 18.6, C["fire_red"], thickness=0.6)
        circle(img, cx, cy, 18.6, C["maroon"], thickness=1.0)

        # embossed text: dark recess with a lit lower edge
        def emboss(s, y):
            w = tiny_text_width(s)
            x = round(cx - w / 2 + 0.5)
            tiny_text(img, x, y + 1, s, C["fire_red"])
            tiny_text(img, x, y, s, C["cream"])
        emboss("FICTIONAL", 18)
        emboss("SATIRE", 25)

        # eight-point star above, small dots below
        def star(sx, sy):
            for dx, dy in ((0, -3), (0, 3), (-3, 0), (3, 0), (-2, -2), (2, -2), (-2, 2), (2, 2)):
                px(img, sx + dx, sy + dy, C["gold"])
            rect(img, sx - 1, sy - 1, sx + 1, sy + 1, C["gold"])
            for dx, dy in ((0, -2), (0, 2), (-2, 0), (2, 0)):
                px(img, sx + dx, sy + dy, C["gold"])
            px(img, sx, sy, C["cream"])
            for dx, dy in ((1, 1), (2, 2), (0, 3), (3, 0)):
                px(img, sx + dx, sy + dy, C["gold_dk"])
        star(23, 11)
        for x in (17, 23, 29):
            px(img, x, 34, C["gold"])
            px(img, x + 1, 35, C["gold_dk"])
        # wax drips off the lower right
        for x, y0, n in ((34, 42, 3), (12, 43, 2)):
            for k in range(n):
                px(img, x, y0 + k, C["tie"] if k < n - 1 else C["maroon"])
                px(img, x + 1, y0 + k, C["maroon"])
        # glossy highlight on the upper left
        for x, y in ((9, 13), (10, 11), (11, 10), (12, 9), (13, 8)):
            px(img, x, y, a(C["white"], 200))
        return img
