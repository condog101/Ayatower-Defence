"""Shell splash on water: column of spray collapsing into a foam ring."""
import math

from draw import blob, new, px, ring, rng, strip
from palette import C

NAME = "splash"
FRAME = (16, 16)
FRAMES = 4


def frame(i):
    img = new(16, 16)
    rnd = rng(30 + i)
    foam = C["foam"]
    if i == 0:
        blob(img, 7.5, 7.5, 3.5, [C["white"], foam, C["shallow"]], seed=1)
    elif i == 1:
        blob(img, 7.5, 7.5, 4.5, [C["white"], foam, C["shallow"]], seed=2, density=0.9)
        ring(img, 7.5, 7.5, 6, C["shallow"])
    elif i == 2:
        ring(img, 7.5, 7.5, 6, foam)
        blob(img, 7.5, 7.5, 3, [foam, C["shallow"]], seed=3, density=0.6)
    else:
        ring(img, 7.5, 7.5, 7, (*foam[:3], 150))
    # flying droplets
    for k in range(6 + i * 2):
        a = rnd.uniform(0, 2 * math.pi)
        d = 3 + i * 1.6 + rnd.uniform(0, 1.5)
        alpha = 255 - i * 50
        px(img, round(7.5 + math.cos(a) * d), round(7.5 + math.sin(a) * d), (*C["white"][:3], alpha))
    return img


def build():
    return strip([frame(i) for i in range(FRAMES)])
