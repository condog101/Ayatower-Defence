"""Fireball explosions: white flash -> fireball -> smoke, 6 frames each."""
import math

from draw import blob, new, px, rng, strip
from palette import C


def explosion_frame(size, i, seed):
    img = new(size, size)
    c = (size - 1) / 2
    R = size / 2 - 1
    rnd = rng(seed + i)
    smoke = C["smoke"]
    smoke_lt = C["smoke_lt"]
    if i == 0:
        blob(img, c, c, R * 0.35, [C["white"], C["fire_yellow"]], seed=seed)
    elif i == 1:
        blob(img, c, c, R * 0.65, [C["white"], C["fire_yellow"], C["fire_orange"]], seed=seed + 1)
    elif i == 2:
        blob(img, c, c, R * 0.9, [C["fire_yellow"], C["fire_orange"], C["fire_red"]], seed=seed + 2)
    elif i == 3:
        blob(img, c, c, R * 0.95, [C["fire_orange"], C["fire_red"], smoke], seed=seed + 3, density=0.95)
        blob(img, c - R * 0.2, c - R * 0.2, R * 0.35, [C["fire_yellow"]], seed=seed + 4)
    elif i == 4:
        blob(img, c, c - 1, R * 0.95, [C["fire_red"], smoke, smoke_lt], seed=seed + 5, density=0.8)
    else:
        blob(img, c, c - 2, R, [(*smoke[:3], 170), (*smoke_lt[:3], 120)], seed=seed + 6, density=0.55)
    # debris sparks flying outward in early frames
    if 1 <= i <= 3:
        for _ in range(int(size / 3)):
            a = rnd.uniform(0, 2 * math.pi)
            d = R * (0.6 + 0.15 * i) + rnd.uniform(0, 2)
            px(img, round(c + math.cos(a) * d), round(c + math.sin(a) * d), C["fire_yellow"] if i < 3 else C["fire_orange"])
    return img


class Small:
    NAME = "explosion_sm"
    FRAME = (16, 16)
    FRAMES = 6

    @staticmethod
    def build():
        return strip([explosion_frame(16, i, 100) for i in range(6)])


class Large:
    NAME = "explosion_lg"
    FRAME = (32, 32)
    FRAMES = 6

    @staticmethod
    def build():
        return strip([explosion_frame(32, i, 200) for i in range(6)])
