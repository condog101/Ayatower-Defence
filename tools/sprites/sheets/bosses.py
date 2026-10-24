"""Bosses (fictional satire), facing EAST: the MAR-A-LAGO golden superyacht, USS SOUR-DON (a
gold-and-black supercarrier with the flaming Eye painted across its flight deck and the spires of
Barad-dur rising from its island), AIR FARCE ONE (a golden jumbo with the Eye on its tail fin; an
air boss) and MORDOR-A-LAGO, the final sea boss: a floating gold resort barge with a turquoise
pool, palm planters and a giant red Eye tower."""
import math

from draw import circle, disc, ellipse, new, outline, poly, px, rect, strip
from palette import C

from .enemies_sea import block, eye, finish, paint_hull, paint_hull2, planks, taper


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
        block(img, 13, 2, 33, 11, base=C["white"], lit=C["cream"], shade=C["smoke_lt"])
        rect(img, 13, 2, 33, 2, C["gold"])
        rect(img, 13, 11, 33, 11, C["gold_dk"])
        rect(img, 14, 3, 32, 3, C["night"])  # tinted windows port
        rect(img, 14, 10, 32, 10, C["night"])  # starboard
        # pool with a gold rim
        rect(img, 15, 5, 20, 8, C["gold"])
        rect(img, 16, 6, 19, 7, C["shallow"])
        px(img, 16, 6, C["foam"])
        # tier 2 deckhouse
        block(img, 22, 4, 31, 9, base=C["white"], lit=C["cream"], shade=C["smoke_lt"])
        rect(img, 22, 4, 31, 4, C["gold"])
        rect(img, 31, 5, 31, 8, C["night"])
        # radar dome + gold mast
        ellipse(img, 25, 5, 27, 7, C["cream"])
        px(img, 25, 5, C["white"])
        rect(img, 29, 6, 29, 7, C["gold"])
        px(img, 29, 5, C["tie"])
        px(img, 28, 5, C["black"])  # little black Eye pennant streaming aft
        px(img, 27, 5, C["tie"])
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


class SourDon:
    """USS SOUR-DON: supercarrier silhouette in gold and black, with a huge flaming Eye of Sauron
    painted across the flight deck and the black spires of Barad-dur rising from a gold island
    sponson on the starboard bow. Frame 1 flickers the flames, the eye's glow and the spire fire."""

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
        if 50 <= x <= 68:
            return 11
        if x > 68:
            t = (79 - x + 1) / 12
            return max(2, round(10 * t ** 0.6))
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
        for y in (cy - 3, cy + 1):
            for x in range(68, 77):
                if img.getpixel((x, y)) == C["iron"]:
                    px(img, x, y, C["gold_dk"] if x % 2 else C["gold"])
        # gold jets parked along the port bow
        for jx, jy in ((58, cy - 8), (63, cy - 8), (68, cy - 7)):
            px(img, jx, jy, C["gold"])
            px(img, jx + 1, jy, C["gold"])
            px(img, jx + 2, jy, C["gold_dk"])
            px(img, jx + 1, jy - 1, C["gold_dk"])
            px(img, jx + 1, jy + 1, C["gold_dk"])
        cls.spires(img, f)
        # stern: black ramp with gold edge
        for y in range(cy - 4, cy + 4):
            px(img, 4, y, C["gold_dk"])
        return img

    @classmethod
    def spires(cls, img, f):
        """Barad-dur on the island: a gold sponson platform with three black spires rising north
        (drawn in 3/4 so they read as tall), the great forked crown and a fire between its horns."""
        rect(img, 51, 19, 70, 22, C["gold"])
        rect(img, 51, 19, 70, 19, C["fire_yellow"])
        rect(img, 51, 22, 70, 22, C["gold_dk"])
        towers = [
            # (x_left, x_right, top) per row band: list of (y_from, y_to, x0, x1)
            [(17, 21, 53, 55), (15, 16, 54, 55), (14, 14, 54, 54)],
            [(18, 21, 66, 68), (16, 17, 66, 67), (15, 15, 67, 67)],
            [(17, 21, 57, 64), (13, 16, 58, 63), (10, 12, 59, 62), (7, 9, 59, 59), (7, 9, 62, 62)],
        ]
        mask = set()
        for bands in towers:
            for y0, y1, x0, x1 in bands:
                for y in range(y0, y1 + 1):
                    for x in range(x0, x1 + 1):
                        mask.add((x, y))
        # outline first so the spires stand out on the iron deck
        for (x, y) in mask:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if (x + dx, y + dy) not in mask:
                    px(img, x + dx, y + dy, C["black"])
        for (x, y) in mask:
            left = (x - 1, y) not in mask
            right = (x + 1, y) not in mask
            col = C["stone_dk"]
            if left:
                col = C["smoke"]
            elif right or (x + 2, y) not in mask and x > 60:
                col = C["iron"]
            px(img, x, y, col)
        # lit windows and the burning crown
        for x, y in ((55, 18), (59, 19), (61, 15), (60, 12), (67, 19), (63, 18)):
            px(img, x, y, C["fire_orange"] if (x + y + f) % 2 else C["fire_red"])
        px(img, 60, 9, C["fire_yellow"])
        px(img, 61, 9, C["fire_orange"])
        px(img, 60, 8, C["fire_orange"] if f == 0 else C["fire_yellow"])
        px(img, 61, 8, C["fire_red"])
        px(img, 60 + f, 7, C["fire_red"])
        px(img, 59, 7, C["smoke_lt"])
        px(img, 62, 7, C["smoke_lt"])

    @classmethod
    def frame(cls, f):
        return finish(cls.body(f), cls.X0, cls.X1, cls.CY, cls.half, f, spray_n=7)

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


def gilt(img, base, lit, shade):
    """Palette-exact bevel: base pixels with empty space up/left turn lit, down/right turn shade."""
    src = img.copy()
    w, h = img.size

    def empty(x, y):
        return not (0 <= x < w and 0 <= y < h) or src.getpixel((x, y))[3] == 0

    for y in range(h):
        for x in range(w):
            if src.getpixel((x, y)) != base:
                continue
            up = empty(x, y - 1) or empty(x - 1, y)
            dn = empty(x, y + 1) or empty(x + 1, y)
            if up and not dn:
                img.putpixel((x, y), lit)
            elif dn and not up:
                img.putpixel((x, y), shade)


class AirForceOne:
    """AIR FARCE ONE: a solid-gold jumbo seen from above, nose east. Swept wings with four iron
    engine pods, a long fuselage with the upper-deck hump, tail planes, and the tail fin drawn in
    3/4 rising north so the red Eye painted on it reads. Frame 1 flickers the exhausts and the
    wingtip lights."""

    NAME = "boss_af1"
    FRAME = (40, 28)
    FRAMES = 2

    @staticmethod
    def mirror(pts):
        return [(x, 27 - y) for x, y in pts]

    @classmethod
    def frame(cls, f):
        img = new(*cls.FRAME)
        G, GL, GD = C["gold"], C["fire_yellow"], C["gold_dk"]
        wing = [(27, 12), (18, 12), (9, 2), (13, 1)]
        tail = [(9, 12), (5, 12), (1, 6), (3, 6)]
        for shape in (wing, tail):
            poly(img, shape, G)
            poly(img, cls.mirror(shape), G)
        rect(img, 2, 12, 36, 15, G)  # fuselage
        rect(img, 37, 12, 38, 15, G)
        px(img, 37, 12, (0, 0, 0, 0))
        px(img, 37, 15, (0, 0, 0, 0))
        px(img, 38, 12, (0, 0, 0, 0))
        px(img, 38, 15, (0, 0, 0, 0))
        rect(img, 39, 13, 39, 14, G)
        rect(img, 1, 13, 1, 14, G)
        gilt(img, G, GL, GD)
        # upper-deck hump: a lighter stripe on the forward spine
        rect(img, 28, 13, 35, 13, GL)
        rect(img, 28, 14, 35, 14, G)
        px(img, 36, 13, GL)
        # engine pods hung ahead of the leading edge (inboard, outboard), both wings
        pods = [(20, 7), (15, 3)]
        for ex, ey in pods:
            for y0 in (ey, 26 - ey):
                rect(img, ex, y0, ex + 4, y0 + 1, C["iron"])
                rect(img, ex, y0, ex + 4, y0, C["smoke"])
                px(img, ex + 4, y0, C["smoke_lt"])
                px(img, ex + 4, y0 + 1, C["stone"])
        outline(img)
        # cockpit glass and a red cheat-line down the fuselage
        px(img, 37, 13, C["night"])
        px(img, 38, 13, C["night"])
        px(img, 37, 14, C["night"])
        for x in range(6, 36, 2):
            px(img, x, 14, C["gold_dk"])
        # eye roundels on the wings
        eye(img, 15, 6, 0)
        eye(img, 15, 21, 0)
        # tail fin in 3/4, rising north from the tail, with the Eye
        fin = [(2, 13), (9, 13), (6, 6), (2, 4)]
        mask = new(*cls.FRAME)
        poly(mask, fin, C["gold"])
        for y in range(28):
            for x in range(40):
                if mask.getpixel((x, y))[3]:
                    for dx, dy in ((1, 0), (-1, 0), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < 40 and 0 <= ny < 28 and not mask.getpixel((nx, ny))[3]:
                            px(img, nx, ny, C["black"])
        for y in range(28):
            for x in range(40):
                if mask.getpixel((x, y))[3]:
                    left = x == 0 or not mask.getpixel((x - 1, y))[3]
                    right = x == 39 or not mask.getpixel((x + 1, y))[3]
                    px(img, x, y, GL if left else GD if right else G)
        eye(img, 5, 9, 1)
        # exhausts and nav lights
        for ex, ey in pods:
            for y0 in (ey, 26 - ey):
                px(img, ex - 1, y0, C["fire_orange"] if f == 0 else C["fire_yellow"])
                px(img, ex - 1, y0 + 1, C["fire_red"] if f == 0 else C["fire_orange"])
                px(img, ex - 2, y0 + f, a(C["fire_orange"], 150))
        px(img, 13, 1, C["tie"] if f == 0 else C["fire_orange"])
        px(img, 13, 26, C["shallow"] if f == 0 else C["foam"])
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Resort:
    """MORDOR-A-LAGO, the final sea boss: a broad gilded barge carrying a gold hotel tower aft
    (roof and lit south facade in 3/4), a turquoise pool with loungers, potted palms, a putting
    green on the bow and, forward, a black pylon holding up a giant red Eye in a gold ring.
    Frame 1 ripples the pool and flares the Eye."""

    NAME = "boss_resort"
    FRAME = (72, 28)
    FRAMES = 2
    X0, X1, HW, BOW = 3, 71, 12, 10
    CY = 14

    @classmethod
    def half(cls, x):
        return taper(x, cls.X0, cls.X1, cls.HW, cls.BOW, 2)

    @staticmethod
    def palm(img, x, y, f):
        """Potted palm seen from above: a gold pot under a star of fronds (lit north, dark south)."""
        px(img, x + 1, y + 1, C["gold_dk"])  # pot rim peeking out
        px(img, x - 1, y + 1, C["gold"])
        for dx, dy in ((-1, -1), (-2, -2), (1, -1), (2, -2), (-1, 1), (-2, 2), (1, 1), (2, 2),
                       (-2, 0), (2, 0), (0, -2)):
            far = abs(dx) == 2 or abs(dy) == 2
            col = C["grass_lt"] if dy < 0 else C["grass_dk"] if far else C["grass"]
            px(img, x + dx + (f if far and dy == 0 else 0), y + dy, col)
        px(img, x, y, C["wood"])  # trunk crown

    @classmethod
    def body(cls, f):
        img = new(*cls.FRAME)
        cy = cls.CY
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["gold"], deck=C["sand_lt"], lit=C["fire_yellow"],
                   shade=C["gold_dk"])
        planks(img, 4, 68, 3, 24, deck=C["sand_lt"], seam=C["sand"], step=2)
        # gold railing just inside the rim
        for x in range(5, 66):
            k = cls.half(x)
            if img.getpixel((x, cy - k + 1)) in (C["sand_lt"], C["sand"]):
                px(img, x, cy - k + 1, C["gold_dk"] if x % 2 else C["gold"])
            if img.getpixel((x, cy + k - 2)) in (C["sand_lt"], C["sand"]):
                px(img, x, cy + k - 2, C["gold_dk"])
        # hotel tower aft: roof (cream, gold parapet) and a gold south facade with window grid
        rect(img, 6, 5, 24, 22, C["black"])  # drop shadow / outline base
        rect(img, 5, 4, 23, 14, C["cream"])
        rect(img, 5, 4, 23, 4, C["gold"])
        rect(img, 5, 4, 5, 14, C["gold"])
        rect(img, 23, 4, 23, 14, C["gold_dk"])
        rect(img, 7, 6, 11, 9, C["smoke_lt"])  # rooftop plant
        rect(img, 7, 6, 11, 6, C["white"])
        eye(img, 17, 9, 2)  # an Eye on the roof for the drakes
        rect(img, 5, 15, 23, 21, C["gold"])  # facade
        rect(img, 5, 15, 23, 15, C["fire_yellow"])
        rect(img, 5, 21, 23, 21, C["gold_dk"])
        for wy in (16, 18, 20):
            for wx in range(6, 23, 2):
                lit = (wx * 7 + wy * 3 + f) % 5 == 0
                px(img, wx, wy, C["fire_orange"] if lit else C["night"])
        rect(img, 13, 20, 15, 21, C["maroon"])  # grand entrance awning
        # pool with a gold rim and rippling turquoise water, loungers alongside
        rect(img, 28, 5, 42, 13, C["gold"])
        rect(img, 28, 13, 42, 13, C["gold_dk"])
        rect(img, 29, 6, 41, 12, C["shallow"])
        for x in range(29, 42):
            for y in range(6, 13):
                if (x + 2 * y + f * 2) % 7 == 0:
                    px(img, x, y, C["foam"])
                elif (x - y + f) % 9 == 0:
                    px(img, x, y, C["mithril_lt"])
        px(img, 34, 9, C["tie"])  # an Eye-red pool float
        px(img, 35, 9, C["tie"])
        for lx in range(29, 42, 3):
            rect(img, lx, 15, lx + 1, 16, C["white"])
            px(img, lx, 15, C["cream"])
            px(img, lx + 1, 17, C["tie"])  # red towels
        # palms in planters
        for (x, y) in ((26, 4), (26, 20), (44, 4), (44, 20), (36, 21)):
            cls.palm(img, x, y, f)
        # putting green on the bow with a red flag
        ellipse(img, 59, 9, 66, 18, C["grass"])
        ellipse(img, 60, 10, 65, 13, C["grass_lt"])
        px(img, 63, 14, C["black"])
        px(img, 63, 13, C["white"])
        px(img, 64, 12, C["tie"])
        px(img, 65, 12 + f, C["tie"])
        # gold trim chevrons on the bow
        for x in range(66, 70):
            k = cls.half(x)
            px(img, x, cy - k + 1, C["gold_dk"])
            px(img, x, cy + k - 2, C["gold_dk"])
        return img

    @classmethod
    def eye_tower(cls, img, f):
        """Black pylon rising north in 3/4 from a gold plinth, holding a gold ring with a big
        slit-pupilled red Eye that flares on frame 1."""
        cx, cy = 52, 8
        mask = set()
        for y in range(9, 22):
            for x in (51, 52, 53):
                mask.add((x, y))
        for y in range(1, 16):
            for x in range(44, 61):
                if ((x - cx) / 7.2) ** 2 + ((y - cy) / 6.4) ** 2 <= 1.0:
                    mask.add((x, y))
        for (x, y) in list(mask):
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if (x + dx, y + dy) not in mask:
                    px(img, x + dx, y + dy, C["black"])
        rect(img, 49, 21, 55, 23, C["gold"])  # plinth
        rect(img, 49, 21, 55, 21, C["fire_yellow"])
        rect(img, 49, 23, 55, 23, C["gold_dk"])
        for y in range(9, 21):
            px(img, 51, y, C["smoke"])
            px(img, 52, y, C["iron"])
            px(img, 53, y, C["black"])
        for y in range(11, 21, 3):
            px(img, 52, y, C["fire_red"])  # lit rivets down the pylon
        for (x, y) in mask:
            if y > 15:
                continue
            d = ((x - cx) / 7.2) ** 2 + ((y - cy) / 6.4) ** 2
            if d > 0.62:
                px(img, x, y, C["fire_yellow"] if x < cx and y < cy else C["gold"] if x <= cx + 2 else C["gold_dk"])
            else:
                u = (x - cx) / 5.2
                lim = 3.8 * max(0.0, 1 - u * u) ** 0.8
                if abs(y - cy) <= lim:
                    r = abs(x - cx) + abs(y - cy) * 1.4
                    col = C["fire_yellow"] if r < 2 + f else C["fire_orange"] if r < 4 + f else C["tie"]
                    px(img, x, y, col)
                else:
                    px(img, x, y, C["maroon"] if f == 0 else C["fire_red"])
        for y in range(cy - 3, cy + 4):
            px(img, cx, y, C["black"])  # slit pupil
        px(img, cx - 1 + 0, cy - 2, C["white"])  # glint

    @classmethod
    def frame(cls, f):
        img = finish(cls.body(f), cls.X0, cls.X1, cls.CY, cls.half, f, spray_n=7)
        cls.eye_tower(img, f)
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])
