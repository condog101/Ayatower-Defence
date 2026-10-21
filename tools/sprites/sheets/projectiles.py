"""Projectiles, all facing EAST (head right): crossbow bolt, fire arrow, great ballista bolt,
winged ornithopter drone, iron sea-dart, spiked iron mine, black-sailed fire skiff, mithril
bolt, and the muzzle flash."""
from draw import disc, new, poly, px, rect, strip
from palette import C


def a(c, alpha):
    return (*c[:3], alpha)


class Bullet:
    """Crossbow bolt: red fletch, pale shaft, steel tip."""

    NAME = "p_bullet"
    FRAME = (4, 4)
    FRAMES = 1

    @staticmethod
    def build():
        img = new(4, 4)
        px(img, 0, 1, C["tie"])
        px(img, 0, 2, C["tie"])
        px(img, 0, 0, a(C["tie"], 150))
        px(img, 0, 3, a(C["tie"], 150))
        px(img, 1, 1, C["cream"])
        px(img, 2, 1, C["cream"])
        px(img, 1, 2, C["parch"])
        px(img, 2, 2, C["parch"])
        px(img, 3, 1, C["white"])
        px(img, 3, 2, C["smoke_lt"])
        return img


class Rocket:
    """Fire arrow: fletched shaft, iron head wrapped in a flickering flame."""

    NAME = "p_rocket"
    FRAME = (6, 3)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(6, 3)
        px(img, 0, 0, C["tie"])
        px(img, 0, 2, C["tie"])
        px(img, 0, 1, C["maroon"])
        rect(img, 1, 1, 3, 1, C["parch"])
        px(img, 5, 1, C["chrome"])
        if i == 0:
            px(img, 4, 1, C["fire_yellow"])
            px(img, 4, 0, C["fire_orange"])
            px(img, 3, 0, a(C["fire_red"], 200))
            px(img, 4, 2, a(C["fire_orange"], 180))
        else:
            px(img, 4, 1, C["white"])
            px(img, 4, 0, C["fire_yellow"])
            px(img, 3, 0, C["fire_orange"])
            px(img, 2, 0, a(C["fire_red"], 160))
            px(img, 3, 2, a(C["fire_orange"], 160))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Missile:
    """Great ballista bolt from the keep's great bow: long shaft, broad iron head, red vanes,
    a streak of ember light behind."""

    NAME = "p_missile"
    FRAME = (8, 3)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(8, 3)
        rect(img, 2, 1, 5, 1, C["wood"])
        px(img, 3, 1, C["parch"])
        px(img, 2, 0, C["tie"])  # vanes
        px(img, 2, 2, C["tie"])
        px(img, 1, 0, C["maroon"])
        px(img, 1, 2, C["maroon"])
        px(img, 6, 0, C["smoke"])  # broadhead
        px(img, 6, 1, C["chrome"])
        px(img, 6, 2, C["iron"])
        px(img, 7, 1, C["white"])
        if i == 0:
            px(img, 1, 1, C["fire_orange"])
            px(img, 0, 1, a(C["fire_red"], 170))
        else:
            px(img, 1, 1, C["fire_yellow"])
            px(img, 0, 1, a(C["fire_orange"], 170))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Shahed:
    """Winged drone from the roost tower: a wood-and-parchment ornithopter with an iron beak,
    wings flapping between the frames."""

    NAME = "p_shahed"
    FRAME = (8, 6)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(8, 6)
        if i == 0:  # wings swept back and spread wide
            poly(img, [(5, 2), (5, 3), (2, 5), (1, 5), (3, 3), (3, 2), (1, 0), (2, 0)], C["cream"])
            px(img, 1, 0, C["parch_dk"])
            px(img, 1, 5, C["parch_dk"])
            px(img, 3, 1, C["parch"])
            px(img, 3, 4, C["parch"])
        else:  # wings beating forward, folded shorter
            poly(img, [(5, 2), (5, 3), (4, 5), (3, 5), (3, 3), (3, 2), (3, 0), (4, 0)], C["cream"])
            px(img, 3, 0, C["parch_dk"])
            px(img, 3, 5, C["parch_dk"])
        rect(img, 1, 2, 6, 3, C["wood"])  # body
        rect(img, 1, 2, 5, 2, C["parch_dk"])
        px(img, 0, 2, C["wood_dk"])  # tail
        px(img, 0, 3, C["wood_dk"])
        px(img, 7, 2, C["smoke_lt"])  # iron beak
        px(img, 7, 3, C["iron"])
        px(img, 6, 2, C["tie"])  # red eye
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Torpedo:
    """Iron sea-dart running just under the surface, trailing bubbles."""

    NAME = "p_torpedo"
    FRAME = (8, 3)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(8, 3)
        rect(img, 3, 1, 7, 1, C["iron"])
        rect(img, 4, 0, 6, 0, C["smoke"])
        rect(img, 4, 2, 6, 2, C["stone_dk"])
        px(img, 7, 1, C["gold_dk"])  # bronze nose
        px(img, 2, 1, C["stone_dk"])  # screw
        bubbles = [(0, 0), (1, 2), (1, 1)] if i == 0 else [(0, 2), (1, 0), (0, 1)]
        for n, (x, y) in enumerate(bubbles):
            px(img, x, y, a(C["foam"], 220 - n * 50))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Mine:
    """Floating spiked iron sphere; the fuse ember glows on the bob frame."""

    NAME = "p_mine"
    FRAME = (6, 6)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(6, 6)
        if i == 1:  # bob: ripple at the waterline
            for x, y in ((0, 5), (5, 5), (1, 5), (4, 5)):
                px(img, x, y, a(C["foam"], 170))
        disc(img, 2.5, 2.5, 1.7, C["iron"])
        px(img, 2, 2, C["smoke"])
        px(img, 1, 2, C["smoke_lt"] if i == 1 else C["smoke"])
        px(img, 2, 1, C["smoke_lt"])
        px(img, 3, 3, C["black"])
        for x, y in ((0, 0), (5, 0), (0, 5), (5, 5), (2, 0), (0, 3), (5, 2), (3, 5)):
            if i == 1 and y == 5 and x in (0, 5):
                continue
            px(img, x, y, C["black"])
        # fuse ember
        px(img, 3, 0, C["fire_yellow"] if i == 1 else C["fire_orange"])
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Boat:
    """Martyr fire skiff: dark hull, black sail, burning pitch at the prow, wake behind."""

    NAME = "p_boat"
    FRAME = (10, 5)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(10, 5)
        poly(img, [(2, 1), (7, 1), (9, 2), (7, 3), (2, 3)], C["wood_dk"])
        rect(img, 2, 1, 6, 1, C["wood"])
        # black sail across the beam, mast in the middle
        rect(img, 4, 0, 5, 4, C["black"])
        px(img, 4, 0, C["iron"])
        px(img, 5, 2, C["wood"])
        # burning prow
        px(img, 8, 2, C["fire_orange"])
        px(img, 9, 2, C["fire_yellow"] if i == 0 else C["white"])
        px(img, 8, 1, C["fire_red"] if i == 0 else C["fire_orange"])
        px(img, 7, 1 if i == 1 else 3, a(C["fire_red"], 180))
        # wake
        if i == 0:
            for x, y in ((1, 1), (0, 0), (1, 3), (0, 4), (1, 2)):
                px(img, x, y, a(C["foam"], 210))
        else:
            for x, y in ((1, 2), (0, 1), (0, 3), (1, 0), (1, 4)):
                px(img, x, y, a(C["foam"], 210))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Sam:
    """Mithril bolt from the twin ballistae: bright shaft, glowing blue head and trail."""

    NAME = "p_sam"
    FRAME = (8, 3)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(8, 3)
        rect(img, 2, 1, 5, 1, C["chrome"])
        px(img, 6, 1, C["mithril_lt"])
        px(img, 7, 1, C["white"])
        px(img, 6, 0, C["mithril"])
        px(img, 6, 2, C["mithril"])
        px(img, 2, 0, C["mithril"])  # vanes
        px(img, 2, 2, C["mithril"])
        if i == 0:
            px(img, 1, 1, C["mithril_lt"])
            px(img, 0, 1, a(C["mithril"], 170))
        else:
            px(img, 1, 1, C["white"])
            px(img, 0, 1, a(C["mithril_lt"], 190))
            px(img, 0, 0, a(C["mithril"], 120))
            px(img, 0, 2, a(C["mithril"], 120))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Muzzle:
    """Release flash star (small, big)."""

    NAME = "muzzle"
    FRAME = (6, 6)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(6, 6)
        if i == 0:
            for x, y in ((2, 1), (3, 1), (1, 2), (4, 2), (1, 3), (4, 3), (2, 4), (3, 4)):
                px(img, x, y, C["fire_orange"])
            rect(img, 2, 2, 3, 3, C["fire_yellow"])
            px(img, 2, 2, C["white"])
        else:
            for x, y in ((0, 0), (5, 0), (0, 5), (5, 5), (2, 0), (3, 5), (0, 3), (5, 2)):
                px(img, x, y, C["fire_orange"])
            rect(img, 1, 1, 4, 4, C["fire_yellow"])
            rect(img, 2, 2, 3, 3, C["white"])
            for x, y in ((1, 1), (4, 1), (1, 4), (4, 4)):
                px(img, x, y, C["fire_orange"])
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])
