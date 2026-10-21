"""Small effect sheets: stun stars, EW jamming waves, shockwave ring, gold rial coin."""
import math

from draw import circle, disc, new, outline, px, rect, strip
from palette import C


def star(img, x, y, c, core):
    """4-point twinkle: a plus with a bright core."""
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        px(img, x + dx, y + dy, c)
    px(img, x, y, core)


class Stun:
    """Dizzy stars orbiting above a stunned ship (2 positions of the orbit)."""

    NAME = "stun"
    FRAME = (8, 8)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(8, 8)
        # faint orbit ellipse
        for k in range(16):
            a = k / 16 * 2 * math.pi
            x, y = 3.5 + math.cos(a) * 3.2, 4.5 + math.sin(a) * 1.6
            if k % 2 == i:
                px(img, round(x), round(y), (*C["cream"][:3], 120))
        spots = [(1, 4), (5, 2), (6, 6)] if i == 0 else [(2, 2), (6, 4), (3, 6)]
        for n, (x, y) in enumerate(spots):
            star(img, x, y, C["fire_yellow"] if n != 1 else C["gold"], C["white"])
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Jam:
    """EW jamming: concentric zig-zag static rings, cyan-white, mostly transparent."""

    NAME = "jam"
    FRAME = (16, 16)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(16, 16)
        c = 7.5
        radii = (3.0, 6.5) if i == 0 else (4.8, 7.4)
        for ri, r in enumerate(radii):
            n = int(2 * math.pi * r * 1.4)
            for k in range(n):
                a = k / n * 2 * math.pi + i * 0.4
                rr = r + (0.9 if (k + ri) % 2 else -0.6)  # zig-zag
                x, y = c + math.cos(a) * rr, c + math.sin(a) * rr
                if (k // 3 + ri + i) % 4 == 3:  # broken static gaps
                    continue
                col = C["white"] if (k + i) % 5 == 0 else C["foam"] if ri == 0 else C["shallow"]
                alpha = 230 if ri == 0 else 170
                px(img, round(x), round(y), (*col[:3], alpha))
        # centre crackle
        if i == 0:
            for x, y in ((7, 7), (8, 8), (8, 6), (6, 9)):
                px(img, x, y, (*C["white"][:3], 220))
        else:
            for x, y in ((7, 8), (8, 7), (6, 6), (9, 9)):
                px(img, x, y, (*C["foam"][:3], 200))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Ring:
    """White 1px shockwave ring; the game tints and scales it."""

    NAME = "ring"
    FRAME = (24, 24)
    FRAMES = 1

    @staticmethod
    def build():
        img = new(24, 24)
        circle(img, 11.5, 11.5, 10.6, C["white"], thickness=1.0)
        return img


class Coin:
    """Gold rial coin with a stamped star and a top-left glint."""

    NAME = "coin"
    FRAME = (8, 8)
    FRAMES = 1

    @staticmethod
    def build():
        img = new(8, 8)
        disc(img, 3.5, 3.5, 3.0, C["gold"])
        circle(img, 3.5, 3.5, 2.2, C["gold_dk"], thickness=0.8)
        for x, y in ((3, 2), (4, 2), (2, 3), (5, 3), (3, 4), (4, 4), (3, 3), (4, 3)):
            px(img, x, y, C["gold"])
        px(img, 3, 3, C["fire_yellow"])
        px(img, 4, 4, C["gold_dk"])
        px(img, 2, 1, C["cream"])
        px(img, 1, 2, C["cream"])
        rect(img, 5, 6, 5, 6, C["gold_dk"])
        outline(img, C["black"])
        return img
