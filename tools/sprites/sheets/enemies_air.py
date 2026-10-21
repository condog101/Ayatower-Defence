"""US aircraft, top-down, all facing EAST (nose right): MQ-9 Reaper, MH-60 Seahawk, F/A-18 Super
Hornet and B-2 Spirit. 2 frames each (prop blur / rotor position / afterburner / stealth shimmer)."""
import math

from draw import bevel, ellipse, new, outline, poly, px, rect, strip
from palette import C


def a(c, alpha):
    return (*c[:3], alpha)


class Reaper:
    """MQ-9 Reaper: very long thin straight wings, bulbous satcom nose, V-tail, pusher prop."""

    NAME = "reaper"
    FRAME = (16, 12)
    FRAMES = 2

    @staticmethod
    def frame(f):
        img = new(16, 12)
        # wings (one pixel chord, two at the root)
        rect(img, 8, 0, 8, 11, C["hull_lt"])
        rect(img, 7, 3, 7, 8, C["hull_lt"])
        px(img, 8, 0, C["hull"])
        px(img, 8, 11, C["hull"])
        # fuselage
        rect(img, 3, 5, 12, 6, C["hull_lt"])
        rect(img, 11, 5, 13, 6, C["hull_lt"])
        px(img, 14, 5, C["hull"])
        px(img, 14, 6, C["hull"])
        px(img, 12, 5, C["white"])  # satcom bulge highlight
        px(img, 10, 6, C["iron"])  # sensor ball
        # V-tail
        px(img, 3, 4, C["hull"])
        px(img, 2, 3, C["hull"])
        px(img, 3, 7, C["hull"])
        px(img, 2, 8, C["hull"])
        bevel(img, light=0.15, dark=-0.25)
        outline(img)
        # pusher prop blur behind the tail
        blur = [(1, 4), (1, 7), (0, 5), (0, 6)] if f == 0 else [(1, 5), (1, 6), (0, 3), (0, 8)]
        for x, y in blur:
            if img.getpixel((x, y))[3] == 0 or img.getpixel((x, y)) == C["black"]:
                px(img, x, y, a(C["smoke_lt"], 170))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Seahawk:
    """MH-60 Seahawk: fuselage, tail boom with tail rotor, translucent main rotor disc with four
    blades in two positions."""

    NAME = "seahawk"
    FRAME = (16, 12)
    FRAMES = 2

    @staticmethod
    def frame(f):
        img = new(16, 12)
        # tail boom + stabiliser + tail rotor
        rect(img, 1, 5, 7, 6, C["hull"])
        rect(img, 1, 4, 2, 7, C["hull_dk"])
        # fuselage
        ellipse(img, 5, 3, 13, 8, C["hull"])
        rect(img, 6, 4, 11, 7, C["hull"])
        px(img, 12, 4, C["water_dk"])  # cockpit glass
        px(img, 12, 5, C["water_lt"])
        px(img, 12, 6, C["water_dk"])
        px(img, 12, 7, C["water_dk"])
        rect(img, 8, 4, 10, 4, C["hull_lt"])  # engine cowling
        bevel(img, light=0.2, dark=-0.25)
        outline(img)
        # main rotor disc + blades
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
                px(img, x, y, a(C["iron"], 220 if t < 5 else 150))
        px(img, 8, 5, C["iron"])  # hub
        # tail rotor flicker
        px(img, 1, 3 if f == 0 else 8, a(C["smoke_lt"], 200))
        px(img, 2, 3 if f == 0 else 8, a(C["smoke_lt"], 140))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Hornet:
    """F/A-18E Super Hornet: pointed nose, trapezoid wings with LEX, twin canted tails,
    afterburner flicker."""

    NAME = "hornet"
    FRAME = (16, 12)
    FRAMES = 2

    @staticmethod
    def frame(f):
        img = new(16, 12)
        # wings
        poly(img, [(6, 5), (10, 5), (8, 1), (6, 1)], C["hull"])
        poly(img, [(6, 6), (10, 6), (8, 10), (6, 10)], C["hull"])
        # horizontal stabilators
        poly(img, [(2, 5), (4, 5), (3, 2), (2, 2)], C["hull"])
        poly(img, [(2, 6), (4, 6), (3, 9), (2, 9)], C["hull"])
        # fuselage + LEX + nose
        rect(img, 2, 5, 13, 6, C["hull_lt"])
        rect(img, 9, 4, 11, 7, C["hull_lt"])
        px(img, 14, 5, C["hull"])
        px(img, 14, 6, C["hull"])
        px(img, 15, 5, C["hull_dk"])
        px(img, 11, 5, C["water_dk"])  # canopy
        px(img, 12, 5, C["water_lt"])
        px(img, 11, 6, C["water_dk"])
        # twin canted tails
        px(img, 4, 4, C["hull_dk"])
        px(img, 5, 4, C["hull_dk"])
        px(img, 4, 7, C["hull_dk"])
        px(img, 5, 7, C["hull_dk"])
        bevel(img, light=0.18, dark=-0.25)
        px(img, 7, 2, C["suit"])  # roundel hints
        px(img, 7, 9, C["suit"])
        outline(img)
        # twin afterburner flames
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
    """B-2 Spirit: black flying wing with a sawtooth trailing edge; frame 1 shimmers."""

    NAME = "b2"
    FRAME = (24, 12)
    FRAMES = 2

    @staticmethod
    def frame(f):
        img = new(24, 12)
        # straight swept leading edge from the nose to the wingtips, double-W sawtooth trailing edge
        top = [(20, 5), (5, 0), (5, 1), (11, 2.5), (8, 3.5), (12, 4.5), (10, 5)]
        bot = [(10, 6), (12, 6.5), (8, 7.5), (11, 8.5), (5, 10), (5, 11), (20, 6)]
        poly(img, top + bot, C["iron"])
        rect(img, 10, 5, 20, 6, C["iron"])
        # cockpit hump + spine
        rect(img, 14, 5, 18, 6, C["deck"])
        px(img, 18, 5, C["water_dk"])
        px(img, 17, 5, C["water_dk"])
        # engine humps with intakes
        rect(img, 11, 4, 13, 4, C["deck"])
        rect(img, 11, 7, 13, 7, C["deck"])
        px(img, 13, 4, C["black"])
        px(img, 13, 7, C["black"])
        bevel(img, light=0.25, dark=-0.4)
        outline(img)
        if f == 1:  # stealth shimmer: a faint diagonal glint sweeping the wing
            for x, y in ((9, 2), (10, 3), (12, 3), (9, 9), (10, 8), (12, 8)):
                if img.getpixel((x, y))[3]:
                    px(img, x, y, C["hull_dk"])
        else:
            for x, y in ((6, 1), (7, 2), (6, 10), (7, 9)):
                if img.getpixel((x, y))[3]:
                    px(img, x, y, C["deck"])
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])
