"""Sauron's air host (fictional satire), top-down, all facing EAST (nose right): the MQ-9 Reaper,
MH-60 Seahawk and F/A-18 Super Hornet silhouettes in Mordor black with the red Eye roundel, and
the B-2 Spirit reimagined as a fell-beast (a winged drake with a black rider). 2 frames each
(prop blur / rotor position / afterburner / wingbeat)."""
import math

from draw import bevel, ellipse, new, outline, poly, px, rect, strip
from palette import C

BODY, BODY_LT, BODY_DK = C["iron"], C["smoke"], C["black"]


def a(c, alpha):
    return (*c[:3], alpha)


def roundel(img, x, y):
    """Eye roundel: red disc with a yellow slit, 2x2 (fits the thin wings)."""
    px(img, x, y, C["tie"])
    px(img, x + 1, y, C["fire_orange"])
    px(img, x, y + 1, C["maroon"])
    px(img, x + 1, y + 1, C["tie"])


class Reaper:
    """MQ-9 Reaper: very long thin black wings with Eye roundels, bulbous nose with a red sensor
    eye, V-tail, pusher prop."""

    NAME = "reaper"
    FRAME = (16, 12)
    FRAMES = 2

    @staticmethod
    def frame(f):
        img = new(16, 12)
        rect(img, 8, 0, 8, 11, BODY_LT)
        rect(img, 7, 1, 7, 10, BODY)
        px(img, 8, 0, BODY)
        px(img, 8, 11, BODY)
        rect(img, 3, 5, 13, 6, BODY)
        px(img, 14, 5, BODY)
        px(img, 14, 6, BODY)
        rect(img, 11, 5, 13, 5, BODY_LT)  # nose bulge highlight
        px(img, 3, 4, BODY)  # V-tail
        px(img, 2, 3, BODY_LT)
        px(img, 3, 7, BODY)
        px(img, 2, 8, BODY)
        outline(img)
        px(img, 7, 2, C["tie"])  # Eye roundels on the wings
        px(img, 8, 2, C["fire_orange"])
        px(img, 7, 9, C["tie"])
        px(img, 8, 9, C["fire_orange"])
        px(img, 13, 6, C["fire_red"])  # sensor eye
        blur = [(1, 4), (1, 7), (0, 5), (0, 6)] if f == 0 else [(1, 5), (1, 6), (0, 3), (0, 8)]
        for x, y in blur:
            if img.getpixel((x, y))[3] == 0 or img.getpixel((x, y)) == C["black"]:
                px(img, x, y, a(C["smoke_lt"], 170))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Seahawk:
    """MH-60 Seahawk: black fuselage with a red-lit cockpit and an Eye roundel, tail boom with tail
    rotor, translucent main rotor disc with four blades in two positions."""

    NAME = "seahawk"
    FRAME = (16, 12)
    FRAMES = 2

    @staticmethod
    def frame(f):
        img = new(16, 12)
        rect(img, 1, 5, 7, 6, BODY)
        rect(img, 1, 4, 2, 7, BODY_DK)
        ellipse(img, 5, 3, 13, 8, BODY)
        rect(img, 6, 4, 11, 7, BODY)
        rect(img, 8, 4, 10, 4, BODY_LT)  # engine cowling
        rect(img, 6, 4, 7, 4, BODY_LT)
        bevel(img, light=0.45, dark=-0.4)
        px(img, 12, 4, C["maroon"])  # red-lit cockpit glass
        px(img, 12, 5, C["fire_red"])
        px(img, 12, 6, C["fire_red"])
        px(img, 12, 7, C["maroon"])
        outline(img)
        roundel(img, 7, 6)
        cx, cy, r = 8.5, 5.5, 6.2
        for y in range(12):
            for x in range(16):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                if r - 0.8 < d <= r and img.getpixel((x, y))[3] == 0:
                    px(img, x, y, a(C["smoke_lt"], 90))
        base = 0 if f == 0 else math.pi / 4
        for k in range(4):
            ang = base + k * math.pi / 2
            for t in range(1, 7):
                x, y = round(cx + math.cos(ang) * t - 0.5), round(cy + math.sin(ang) * t - 0.5)
                px(img, x, y, a(C["smoke"], 230 if t < 5 else 160))
        px(img, 8, 5, C["smoke_lt"])  # hub
        px(img, 1, 3 if f == 0 else 8, a(C["smoke_lt"], 200))
        px(img, 2, 3 if f == 0 else 8, a(C["smoke_lt"], 140))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Hornet:
    """F/A-18E Super Hornet: black jet, pointed nose, trapezoid wings with Eye roundels, twin
    canted tails, red-glass canopy, afterburner flicker."""

    NAME = "hornet"
    FRAME = (16, 12)
    FRAMES = 2

    @staticmethod
    def frame(f):
        img = new(16, 12)
        poly(img, [(6, 5), (10, 5), (8, 1), (6, 1)], BODY)
        poly(img, [(6, 6), (10, 6), (8, 10), (6, 10)], BODY)
        poly(img, [(2, 5), (4, 5), (3, 2), (2, 2)], BODY)
        poly(img, [(2, 6), (4, 6), (3, 9), (2, 9)], BODY)
        rect(img, 2, 5, 13, 6, BODY_LT)
        rect(img, 9, 4, 11, 7, BODY)
        px(img, 14, 5, BODY)
        px(img, 14, 6, BODY)
        px(img, 15, 5, BODY_LT)
        px(img, 4, 4, BODY_DK)  # twin canted tails
        px(img, 5, 4, BODY_DK)
        px(img, 4, 7, BODY_DK)
        px(img, 5, 7, BODY_DK)
        bevel(img, light=0.4, dark=-0.4)
        px(img, 11, 5, C["maroon"])  # canopy
        px(img, 12, 5, C["fire_red"])
        px(img, 11, 6, C["maroon"])
        outline(img)
        roundel(img, 6, 2)
        roundel(img, 6, 8)
        if f == 0:
            for y in (5, 6):
                px(img, 1, y, C["fire_yellow"])
                px(img, 0, y, a(C["fire_orange"], 200))
        else:
            for y in (5, 6):
                px(img, 1, y, C["white"])
                px(img, 0, y, C["fire_yellow"])
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class B2:
    """The B-2 as a fell-beast: a winged drake seen from above. Two broad bat wings, each with
    three pale finger bones fanning from the shoulder over dark membrane and deep scallops between
    the tips; a narrow body, a neck and horned head to the east with a burning eye, a thin tail to
    the west ending in a barb, and a tiny black-cloaked rider at the shoulders. Black outline round
    the whole silhouette. Frame 0 wings spread (full height), frame 1 the downstroke (wings half
    folded, tips swept back)."""

    NAME = "b2"
    FRAME = (24, 12)
    FRAMES = 2

    # Top wing, rows 0-4 (the bottom wing mirrors it onto rows 11-7). M membrane (Mordor maroon so
    # the wing mass reads against the black outline and the dark sea), o finger bones, L the lit
    # leading arm. Three fingers fan from the shoulder (x 13-14, row 4) to three tips on the outer
    # edge, with shallow scallops between the tips and a concave trailing edge back to the hip.
    WINGS = (
        [
            "...oo...oo...LL..",
            "....oMM.MoM.MML..",
            "......oMMMoMMMML.",
            ".......MoMMoMMML.",
            "........MMooooL..",
        ],
        [
            ".................",
            ".................",
            "....oo..o..LL....",
            ".....MoMMoMMLL...",
            ".......MMMooooL..",
        ],
    )
    INK = {"L": C["chrome"], "o": C["smoke_lt"], "M": C["maroon"]}

    @classmethod
    def wing(cls, img, f, mirror):
        for y, row in enumerate(cls.WINGS[f]):
            for x, ch in enumerate(row):
                if ch != ".":
                    px(img, x, 11 - y if mirror else y, cls.INK[ch])

    @classmethod
    def frame(cls, f):
        img = new(24, 12)
        cls.wing(img, f, False)
        cls.wing(img, f, True)
        body, lit, dk = C["iron"], C["smoke"], C["stone_dk"]
        rect(img, 8, 5, 16, 6, body)  # body
        rect(img, 11, 4, 14, 7, body)
        rect(img, 11, 4, 14, 4, lit)
        rect(img, 11, 7, 14, 7, dk)
        rect(img, 17, 5, 19, 6, body)  # neck
        rect(img, 17, 5, 19, 5, lit)
        rect(img, 20, 5, 22, 6, body)  # head
        px(img, 20, 5, lit)
        px(img, 23, 5, dk)  # snout
        px(img, 23, 6, dk)
        px(img, 19, 4, C["smoke_lt"])  # horns sweeping back
        px(img, 18, 4, C["smoke"])
        px(img, 19, 7, C["smoke_lt"])
        px(img, 18, 7, C["smoke"])
        rect(img, 4, 5, 7, 6, body)  # tail: tapering to one pixel, then a barb
        px(img, 4, 5, dk)
        rect(img, 1, 6, 3, 6, body)
        px(img, 0, 5, C["smoke_lt"])
        px(img, 0, 6, C["smoke_lt"])
        px(img, 0, 7, C["smoke_lt"])
        px(img, 1, 5, C["smoke"])
        px(img, 1, 7, C["smoke"])
        outline(img)
        # rider: black cloak with a pale crown glint; the burning eye of the beast
        rect(img, 12, 5, 13, 6, C["black"])
        px(img, 13, 5, C["smoke_lt"])
        px(img, 21, 5, C["fire_red"])
        px(img, 21, 6, C["fire_orange"] if f == 0 else C["fire_yellow"])
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class F35:
    """F-35 Lightning II: a faceted dark-grey single-seat jet, diamond wings with straight swept
    edges, small canted twin tails, a red-glass canopy, Mordor-red seams on the wing leading edges
    and an Eye roundel; one engine nozzle flickering."""

    NAME = "f35"
    FRAME = (16, 12)
    FRAMES = 2

    @staticmethod
    def frame(f):
        img = new(16, 12)
        body, lit, dk = C["stone_dk"], C["stone"], C["iron"]
        # diamond wings: long swept leading edge, straight trailing edge
        poly(img, [(5, 5), (10, 5), (6, 1), (5, 1)], body)
        poly(img, [(5, 6), (10, 6), (6, 10), (5, 10)], body)
        # small canted tails
        poly(img, [(2, 5), (4, 5), (3, 3), (2, 3)], body)
        poly(img, [(2, 6), (4, 6), (3, 8), (2, 8)], body)
        # wide blended fuselage tapering to a chined nose
        rect(img, 2, 4, 10, 7, body)
        rect(img, 11, 5, 13, 6, body)
        px(img, 11, 4, body)
        px(img, 11, 7, body)
        px(img, 14, 5, body)
        px(img, 14, 6, dk)
        px(img, 15, 5, lit)
        bevel(img, light=0.35, dark=-0.45)
        # faceted spine: lit north half, dark south half
        rect(img, 4, 5, 10, 5, lit)
        rect(img, 4, 6, 10, 6, dk)
        px(img, 3, 4, dk)
        px(img, 3, 7, dk)
        outline(img)
        # Mordor-red seams on the leading edges, the Eye roundel and the canopy
        for (x, y) in ((7, 2), (8, 3), (9, 4)):
            px(img, x, y, C["maroon"])
        for (x, y) in ((7, 9), (8, 8), (9, 7)):
            px(img, x, y, C["maroon"])
        px(img, 5, 2, C["tie"])
        px(img, 5, 9, C["tie"])
        px(img, 11, 5, C["maroon"])
        px(img, 12, 5, C["fire_red"])
        px(img, 11, 6, C["maroon"])
        px(img, 12, 6, C["tie"])
        # single engine nozzle
        if f == 0:
            px(img, 1, 5, C["fire_yellow"])
            px(img, 1, 6, C["fire_orange"])
            px(img, 0, 5, a(C["fire_orange"], 180))
        else:
            px(img, 1, 5, C["white"])
            px(img, 1, 6, C["fire_yellow"])
            px(img, 0, 5, C["fire_yellow"])
            px(img, 0, 6, a(C["fire_orange"], 200))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])
