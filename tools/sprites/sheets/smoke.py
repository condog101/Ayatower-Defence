"""Grey smoke puff dissipating over 4 frames."""
from draw import blob, new, strip
from palette import C

NAME = "smoke"
FRAME = (8, 8)
FRAMES = 4


def frame(i):
    img = new(8, 8)
    r = 2.2 + i * 0.6
    a = 230 - i * 50
    blob(img, 3.5, 3.5, r, [(*C["smoke_lt"][:3], a), (*C["smoke"][:3], a)], seed=40 + i, density=1 - i * 0.15)
    return img


def build():
    return strip([frame(i) for i in range(FRAMES)])
