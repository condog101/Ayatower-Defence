"""Boss ships (fictional satire), facing EAST: the MAR-A-LAGO golden superyacht and USS BIG DON,
a gold-and-black supercarrier with the flaming Eye painted across its flight deck."""
import math

from draw import circle, ellipse, new, px, rect, strip
from palette import C

from .enemies_sea import block, finish, paint_hull, paint_hull2, taper


def a(c, alpha):
    return (*c[:3], alpha)


class Yacht:
    """Gaudy white-and-gold superyacht: tiered decks, gold trim, a pool and a helipad aft."""

    NAME = "boss_yacht"
    FRAME = (48, 14)
    FRAMES = 2
    X0, X1, HW, BOW = 3, 47, 6, 16
    CY = 7

    @classmethod
    def half(cls, x):
        return taper(x, cls.X0, cls.X1, cls.HW, cls.BOW, 2)

    @classmethod
    def body(cls):
        img = new(*cls.FRAME)
        cy = cls.CY
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["white"], deck=C["sand_lt"], lit=C["gold"],
                   shade=C["gold_dk"])
        # teak deck planking
        for x in range(4, 44, 2):
            for y in range(cy - 5, cy + 5):
                if img.getpixel((x, y)) == C["sand_lt"]:
                    px(img, x, y, C["sand"])
        # helipad on the stern
        rect(img, 4, 3, 10, 10, C["iron"])
        circle(img, 7, 6.5, 2.6, C["gold"], thickness=0.9)
        for y in range(5, 9):
            px(img, 6, y, C["gold"])
            px(img, 8, y, C["gold"])
        px(img, 7, 6, C["gold"])
        # tier 1 deckhouse (white, gold edges, smoked glass band)
        block(img, 13, 2, 33, 11, base=C["white"], lit=C["cream"], shade=C["hull_lt"])
        rect(img, 13, 2, 33, 2, C["gold"])
        rect(img, 13, 11, 33, 11, C["gold_dk"])
        rect(img, 14, 3, 32, 3, C["suit"])  # tinted windows port
        rect(img, 14, 10, 32, 10, C["suit"])  # starboard
        # pool with a gold rim
        rect(img, 15, 5, 20, 8, C["gold"])
        rect(img, 16, 6, 19, 7, C["shallow"])
        px(img, 16, 6, C["foam"])
        # tier 2 deckhouse
        block(img, 22, 4, 31, 9, base=C["white"], lit=C["cream"], shade=C["hull_lt"])
        rect(img, 22, 4, 31, 4, C["gold"])
        rect(img, 31, 5, 31, 8, C["suit"])
        # radar dome + gold mast
        ellipse(img, 25, 5, 27, 7, C["cream"])
        px(img, 25, 5, C["white"])
        rect(img, 29, 6, 29, 7, C["gold"])
        px(img, 29, 5, C["tie"])
        # gold stripes running forward along the foredeck
        for x in range(34, 44):
            k = cls.half(x)
            px(img, x, cy - k + 1, C["gold"])
            px(img, x, cy + k - 2, C["gold"])
        rect(img, 35, 6, 38, 7, C["white"])  # sun loungers
        px(img, 35, 6, C["gold"])
        px(img, 40, 6, C["gold"])
        px(img, 40, 7, C["gold_dk"])
        return img

    @classmethod
    def frame(cls, f):
        return finish(cls.body(), cls.X0, cls.X1, cls.CY, cls.half, f, spray_n=5)

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class BigDon:
    """USS BIG DON: supercarrier silhouette in gold and black, with a huge flaming Eye of Sauron
    painted across the flight deck. Frame 1 flickers the flames and the eye's glow."""

    NAME = "boss_don"
    FRAME = (80, 24)
    FRAMES = 2
    X0, X1 = 3, 79
    CY = 12

    @staticmethod
    def top(x):
        if x < 3 or x > 79:
            return 0
        if 16 <= x <= 54:
            return 11 if x <= 50 else 11 - (x - 50)
        if x < 16:
            return 8 + (x - 3) // 5
        t = (79 - x + 1) / 25
        return max(2, round(8 * t ** 0.5))

    @staticmethod
    def bot(x):
        if x < 3 or x > 79:
            return 0
        if 42 <= x <= 58:
            return 11
        if x > 58:
            t = (79 - x + 1) / 21
            return max(2, round(10 * t ** 0.5))
        return 10

    @classmethod
    def half(cls, x):
        return max(cls.top(x), cls.bot(x))

    @classmethod
    def eye(cls, img, f):
        cx, cy = 35.5, cls.CY - 0.5
        rx, ry = 17.0, 7.2
        flick = f
        # flame corona: jagged orange/red licks around the almond
        for y in range(1, 23):
            for x in range(14, 58):
                dx, dy = (x - cx) / (rx + 3.5), (y - cy) / (ry + 3.2)
                ang = math.atan2(dy, dx)
                jag = 0.12 * math.sin(ang * 9 + flick * 1.7) + 0.08 * math.sin(ang * 5 - flick)
                d = (dx * dx + dy * dy) ** 0.5
                if d < 1.0 + jag and img.getpixel((x, y)) == C["iron"]:
                    px(img, x, y, C["fire_red"] if d > 0.86 + jag * 0.5 else C["fire_orange"])
        # almond eye: lens shape from two arcs
        for y in range(2, 22):
            for x in range(16, 56):
                u = (x - cx) / rx
                if abs(u) >= 1:
                    continue
                lim = ry * (1 - u * u) ** 0.85
                dy = y - cy
                if abs(dy) <= lim:
                    r = ((u * rx / 1.0) ** 2 + (dy * 2.2) ** 2) ** 0.5
                    if r < 4 + flick * 0.6:
                        col = C["white"] if abs(x - cx) < 1.6 and abs(dy) < 2 else C["fire_yellow"]
                    elif r < 10:
                        col = C["fire_yellow"] if (x + y + flick) % 5 else C["gold"]
                    elif r < 15:
                        col = C["fire_orange"]
                    else:
                        col = C["fire_red"]
                    px(img, x, y, col)
                    if abs(dy) > lim - 1:
                        px(img, x, y, C["maroon"])  # eyelid rim
        # vertical slit pupil
        for y in range(3, 21):
            dy = abs(y - cy)
            wdt = 1.5 if dy < 4 else 1.0 if dy < 7 else 0.5
            for x in range(int(cx - 2), int(cx + 3)):
                if abs(x - cx) <= wdt:
                    px(img, x, y, C["black"])

    @classmethod
    def body(cls, f):
        img = new(*cls.FRAME)
        cy = cls.CY
        paint_hull2(img, cy, cls.X0, cls.X1, cls.top, cls.bot, C["gold"], C["iron"], C["fire_yellow"],
                    C["gold_dk"])
        # inner gold trim line around the black flight deck
        for x in range(5, 76):
            t, b = cls.top(x), cls.bot(x)
            if t > 2 and img.getpixel((x, cy - t + 1)) == C["iron"]:
                px(img, x, cy - t + 1, C["gold_dk"])
            if b > 2 and img.getpixel((x, cy + b - 2)) == C["iron"]:
                px(img, x, cy + b - 2, C["gold_dk"])
        cls.eye(img, f)
        # bow catapults in gold
        for y in (cy - 3, cy + 2):
            for x in range(60, 76):
                if img.getpixel((x, y)) == C["iron"]:
                    px(img, x, y, C["gold_dk"] if x % 2 else C["gold"])
        # island: gold tower with a black spiked crown, starboard side
        rect(img, 47, 20, 57, 22, C["black"])
        block(img, 46, 19, 56, 21, base=C["gold"], lit=C["cream"], shade=C["gold_dk"])
        for x in range(47, 56, 2):
            px(img, x, 19, C["iron"])  # crown spikes
        rect(img, 50, 20, 51, 20, C["tie"])
        px(img, 54, 20, C["iron"])
        # gold jets parked along the bow
        for jx, jy in ((64, cy + 6), (69, cy + 6), (64, cy - 7), (69, cy - 7)):
            px(img, jx, jy, C["gold"])
            px(img, jx + 1, jy, C["gold"])
            px(img, jx + 2, jy, C["gold_dk"])
            px(img, jx + 1, jy - 1, C["gold_dk"])
            px(img, jx + 1, jy + 1, C["gold_dk"])
        # stern: black ramp with gold edge
        for y in range(cy - 4, cy + 4):
            px(img, 4, y, C["gold_dk"])
        return img

    @classmethod
    def frame(cls, f):
        return finish(cls.body(f), cls.X0, cls.X1, cls.CY, cls.half, f, spray_n=7)

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])
