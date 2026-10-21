"""Projectiles, all facing EAST (nose right): tracer, rockets, missiles, Shahed, torpedo, mine,
martyr drone boat, SAM, and the muzzle flash."""
from draw import disc, new, poly, px, rect, strip
from palette import C


def a(c, alpha):
    return (*c[:3], alpha)


class Bullet:
    NAME = "p_bullet"
    FRAME = (4, 4)
    FRAMES = 1

    @staticmethod
    def build():
        img = new(4, 4)
        px(img, 0, 1, a(C["fire_orange"], 150))
        px(img, 0, 2, a(C["fire_orange"], 150))
        rect(img, 1, 1, 2, 2, C["fire_yellow"])
        px(img, 1, 0, a(C["fire_yellow"], 140))
        px(img, 1, 3, a(C["fire_yellow"], 140))
        px(img, 2, 1, C["white"])
        px(img, 3, 1, C["fire_yellow"])
        px(img, 3, 2, a(C["fire_yellow"], 170))
        px(img, 2, 2, C["white"])
        return img


class Rocket:
    """107mm rocket: olive tube, dark nose, fins, flickering motor flame."""

    NAME = "p_rocket"
    FRAME = (6, 3)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(6, 3)
        rect(img, 2, 1, 4, 1, C["olive_lt"])
        px(img, 5, 1, C["iron"])
        px(img, 2, 0, C["olive_dk"])
        px(img, 2, 2, C["olive_dk"])
        px(img, 4, 1, C["olive"])
        if i == 0:
            px(img, 1, 1, C["fire_yellow"])
            px(img, 0, 1, C["fire_orange"])
        else:
            px(img, 1, 1, C["white"])
            px(img, 0, 1, C["fire_yellow"])
            px(img, 0, 0, a(C["fire_orange"], 140))
            px(img, 0, 2, a(C["fire_orange"], 140))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Missile:
    """Coastal anti-ship missile (Noor / Khalij Fars): khaki body, black radome, cruciform fins."""

    NAME = "p_missile"
    FRAME = (8, 3)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(8, 3)
        rect(img, 2, 1, 6, 1, C["sand_lt"])
        px(img, 5, 1, C["sand"])
        px(img, 7, 1, C["iron"])
        px(img, 4, 0, C["olive"])  # mid wings
        px(img, 4, 2, C["olive"])
        px(img, 2, 0, C["olive_dk"])  # tail fins
        px(img, 2, 2, C["olive_dk"])
        px(img, 6, 1, C["tie"])
        if i == 0:
            px(img, 1, 1, C["white"])
            px(img, 0, 1, C["fire_orange"])
        else:
            px(img, 1, 1, C["fire_yellow"])
            px(img, 0, 1, a(C["smoke_lt"], 150))
            px(img, 0, 0, a(C["fire_orange"], 120))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Shahed:
    """Shahed-136: beige delta flying wing with tip fins and a pusher prop."""

    NAME = "p_shahed"
    FRAME = (8, 6)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(8, 6)
        poly(img, [(6, 2), (6, 3), (2, 5), (2, 0)], C["sand_lt"])
        rect(img, 2, 2, 6, 3, C["sand"])
        px(img, 2, 0, C["smoke"])  # tip fins
        px(img, 2, 5, C["smoke"])
        px(img, 6, 2, C["sand_lt"])
        px(img, 7, 2, C["smoke"])
        px(img, 7, 3, C["smoke"])
        px(img, 5, 2, C["tie"])  # warhead band
        px(img, 3, 2, C["sand_lt"])
        if i == 0:
            px(img, 1, 1, a(C["smoke_lt"], 190))
            px(img, 1, 4, a(C["smoke_lt"], 190))
            px(img, 1, 2, C["iron"])
            px(img, 1, 3, C["iron"])
        else:
            px(img, 0, 2, a(C["smoke_lt"], 190))
            px(img, 0, 3, a(C["smoke_lt"], 190))
            px(img, 1, 2, C["iron"])
            px(img, 1, 3, C["iron"])
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Torpedo:
    NAME = "p_torpedo"
    FRAME = (8, 3)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(8, 3)
        rect(img, 3, 1, 7, 1, C["iron"])
        rect(img, 4, 0, 6, 0, C["smoke"])
        rect(img, 4, 2, 6, 2, C["deck"])
        px(img, 7, 1, C["smoke"])
        px(img, 2, 1, C["deck"])  # screw
        bubbles = [(0, 0), (1, 2), (1, 1)] if i == 0 else [(0, 2), (1, 0), (0, 1)]
        for n, (x, y) in enumerate(bubbles):
            px(img, x, y, a(C["foam"], 220 - n * 50))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Mine:
    """Floating horned contact mine: dark sphere, five horns, ripple."""

    NAME = "p_mine"
    FRAME = (6, 6)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(6, 6)
        if i == 1:  # bob: ripple at the waterline
            for x, y in ((0, 4), (5, 4), (1, 5), (4, 5)):
                px(img, x, y, a(C["foam"], 170))
        disc(img, 2.5, 2.5, 1.7, C["iron"])
        px(img, 2, 2, C["smoke"])
        px(img, 1, 2, C["smoke"] if i == 0 else C["smoke_lt"])
        px(img, 2, 1, C["smoke_lt"] if i == 1 else C["smoke"])
        px(img, 3, 3, C["black"])
        for x, y in ((2, 0), (3, 0), (0, 2), (5, 2), (0, 3), (5, 3)):
            px(img, x, y, C["black"])
        px(img, 2, 0, C["tie"] if i == 1 else C["black"])
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Boat:
    """Martyr explosive drone boat: low black hull, red warhead nose, wake."""

    NAME = "p_boat"
    FRAME = (10, 5)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(10, 5)
        poly(img, [(2, 1), (7, 1), (9, 2), (7, 3), (2, 3)], C["iron"])
        rect(img, 2, 1, 6, 1, C["smoke"])
        rect(img, 7, 1, 8, 3, C["tie"])
        px(img, 9, 2, C["fire_red"])
        px(img, 7, 1, C["fire_orange"])
        px(img, 4, 2, C["black"])  # sensor mast
        px(img, 5, 2, C["green"])  # antenna light
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
    """SAM interceptor: white body, red nose band, motor flame."""

    NAME = "p_sam"
    FRAME = (8, 3)
    FRAMES = 2

    @staticmethod
    def frame(i):
        img = new(8, 3)
        rect(img, 2, 1, 6, 1, C["white"])
        px(img, 7, 1, C["tie"])
        px(img, 6, 1, C["hull_lt"])
        px(img, 3, 0, C["hull"])
        px(img, 3, 2, C["hull"])
        px(img, 2, 0, C["hull_dk"])
        px(img, 2, 2, C["hull_dk"])
        if i == 0:
            px(img, 1, 1, C["fire_yellow"])
            px(img, 0, 1, C["fire_orange"])
        else:
            px(img, 1, 1, C["white"])
            px(img, 0, 1, C["fire_yellow"])
            px(img, 0, 0, a(C["fire_orange"], 130))
            px(img, 0, 2, a(C["fire_orange"], 130))
        return img

    @classmethod
    def build(cls):
        return strip([cls.frame(0), cls.frame(1)])


class Muzzle:
    """Muzzle flash star (small, big)."""

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
