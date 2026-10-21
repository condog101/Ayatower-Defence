"""Pixel-art primitives shared by every sheet module.

All helpers draw straight onto RGBA Pillow images with no anti-aliasing so the
results stay crisp under nearest-neighbour scaling.
"""
import os
import random

from PIL import Image, ImageDraw, ImageFont

from palette import C

CLEAR = (0, 0, 0, 0)


def new(w, h, fill=CLEAR):
    return Image.new("RGBA", (w, h), fill)


def px(img, x, y, c):
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((int(x), int(y)), c)


def get(img, x, y):
    if 0 <= x < img.width and 0 <= y < img.height:
        return img.getpixel((x, y))
    return CLEAR


def rect(img, x0, y0, x1, y1, c):
    """Filled rectangle, inclusive corners."""
    ImageDraw.Draw(img).rectangle([x0, y0, x1, y1], fill=c)


def frame_rect(img, x0, y0, x1, y1, c):
    ImageDraw.Draw(img).rectangle([x0, y0, x1, y1], outline=c)


def ellipse(img, x0, y0, x1, y1, c, outline=None):
    ImageDraw.Draw(img).ellipse([x0, y0, x1, y1], fill=c, outline=outline)


def ring(img, cx, cy, r, c):
    ImageDraw.Draw(img).ellipse([cx - r, cy - r, cx + r, cy + r], outline=c)


def circle(img, cx, cy, r, c, thickness=1.0):
    """Round 1px circle outline by distance test (ImageDraw rings look square when small)."""
    for y in range(int(cy - r - 2), int(cy + r + 3)):
        for x in range(int(cx - r - 2), int(cx + r + 3)):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if abs(d - r) < thickness * 0.5 + 0.05:
                px(img, x, y, c)


def disc(img, cx, cy, r, c):
    """Filled circle by distance test (rounder than ImageDraw at tiny radii)."""
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                px(img, x, y, c)


def poly(img, pts, c):
    ImageDraw.Draw(img).polygon([tuple(p) for p in pts], fill=c)


def line(img, x0, y0, x1, y1, c, width=1):
    ImageDraw.Draw(img).line([x0, y0, x1, y1], fill=c, width=width)


def opaque(c):
    return c[3] > 0


def outline(img, c=None, diagonal=False):
    """Add a 1px outline around every opaque region (in transparent pixels)."""
    c = c or C["black"]
    src = img.copy()
    w, h = img.size
    nbrs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    if diagonal:
        nbrs += [(1, 1), (-1, -1), (1, -1), (-1, 1)]
    for y in range(h):
        for x in range(w):
            if opaque(src.getpixel((x, y))):
                continue
            for dx, dy in nbrs:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and src.getpixel((nx, ny))[3] > 160:
                    img.putpixel((x, y), c)
                    break
    return img


def shift(c, amt):
    """Lighten (amt>0) or darken (amt<0) a colour, keeping alpha."""
    r, g, b, a = c
    if amt >= 0:
        return (int(r + (255 - r) * amt), int(g + (255 - g) * amt), int(b + (255 - b) * amt), a)
    k = 1 + amt
    return (int(r * k), int(g * k), int(b * k), a)


def bevel(img, light=0.22, dark=-0.25, mask=None):
    """Top-left light: lighten pixels with an empty pixel up/left, darken down/right."""
    src = img.copy()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            c = src.getpixel((x, y))
            if not opaque(c) or (mask and not mask(x, y)):
                continue
            up = get(src, x, y - 1)[3] == 0 or get(src, x - 1, y)[3] == 0
            dn = get(src, x, y + 1)[3] == 0 or get(src, x + 1, y)[3] == 0
            if up and not dn:
                img.putpixel((x, y), shift(c, light))
            elif dn and not up:
                img.putpixel((x, y), shift(c, dark))
    return img


def dither(img, x0, y0, x1, y1, c, phase=0, only_opaque=True):
    """Checkerboard-dither colour c over a rectangle (inclusive)."""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if (x + y + phase) % 2 == 0:
                if only_opaque and not opaque(get(img, x, y)):
                    continue
                px(img, x, y, c)


def recolor(img, fn):
    """Apply fn(rgba)->rgba to every opaque pixel."""
    out = img.copy()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            c = out.getpixel((x, y))
            if opaque(c):
                out.putpixel((x, y), fn(c))
    return out


def darken(img, amt):
    return recolor(img, lambda c: shift(c, -amt))


def tint(img, target, amt):
    tr, tg, tb, _ = target

    def f(c):
        r, g, b, a = c
        return (int(r + (tr - r) * amt), int(g + (tg - g) * amt), int(b + (tb - b) * amt), a)

    return recolor(img, f)


def fade(img, alpha_mul):
    def f(c):
        return (c[0], c[1], c[2], int(c[3] * alpha_mul))

    return recolor(img, f)


def paste(dst, src, x, y):
    dst.alpha_composite(src, (int(x), int(y)))


def rotate(img, deg):
    return img.rotate(deg, resample=Image.NEAREST, expand=False)


def flip_h(img):
    return img.transpose(Image.FLIP_LEFT_RIGHT)


def strip(frames):
    """Join equal-size frames into one horizontal sheet."""
    fw, fh = frames[0].size
    out = new(fw * len(frames), fh)
    for i, f in enumerate(frames):
        assert f.size == (fw, fh), (f.size, (fw, fh))
        out.paste(f, (i * fw, 0))
    return out


def rng(seed):
    return random.Random(seed)


def blob(img, cx, cy, r, colors, seed=0, density=1.0):
    """Irregular puff: concentric colour bands with jittered edges (fire, smoke)."""
    rnd = rng(seed)
    n = len(colors)
    for y in range(int(cy - r - 2), int(cy + r + 3)):
        for x in range(int(cx - r - 2), int(cx + r + 3)):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 + rnd.uniform(-0.9, 0.9)
            if d <= r and rnd.random() <= density:
                band = min(n - 1, int(d / max(r, 0.01) * n))
                px(img, x, y, colors[band])


# ---------------------------------------------------------------------------
# Text

_GLYPHS = {
    "A": ".#. #.# ### #.# #.#", "B": "##. #.# ##. #.# ##.", "C": ".## #.. #.. #.. .##",
    "D": "##. #.# #.# #.# ##.", "E": "### #.. ##. #.. ###", "F": "### #.. ##. #.. #..",
    "G": ".## #.. #.# #.# .##", "H": "#.# #.# ### #.# #.#", "I": "### .#. .#. .#. ###",
    "J": "..# ..# ..# #.# .#.", "K": "#.# #.# ##. #.# #.#", "L": "#.. #.. #.. #.. ###",
    "M": "#.# ### #.# #.# #.#", "N": "##. #.# #.# #.# #.#", "O": ".#. #.# #.# #.# .#.",
    "P": "##. #.# ##. #.. #..", "Q": ".#. #.# #.# ### .##", "R": "##. #.# ##. #.# #.#",
    "S": ".## #.. .#. ..# ##.", "T": "### .#. .#. .#. .#.", "U": "#.# #.# #.# #.# ###",
    "V": "#.# #.# #.# #.# .#.", "W": "#.# #.# #.# ### #.#", "X": "#.# #.# .#. #.# #.#",
    "Y": "#.# #.# .#. .#. .#.", "Z": "### ..# .#. #.. ###", "0": ".#. #.# #.# #.# .#.",
    "1": ".#. ##. .#. .#. ###", "2": "##. ..# .#. #.. ###", "3": "##. ..# .#. ..# ##.",
    "4": "#.# #.# ### ..# ..#", "5": "### #.. ##. ..# ##.", "6": ".## #.. ### #.# ###",
    "7": "### ..# .#. .#. .#.", "8": "### #.# ### #.# ###", "9": "### #.# ### ..# ##.",
    "$": ".#. ### ##. .## ###", ".": "... ... ... ... .#.", "-": "... ... ### ... ...",
    "!": ".#. .#. .#. ... .#.", "'": ".#. .#. ... ... ...", "/": "..# ..# .#. #.. #..",
    " ": "... ... ... ... ...",
}


def tiny_text_width(s):
    return len(s) * 4 - 1


def tiny_text(img, x, y, s, c):
    """3x5 pixel capitals with a 1px gap. Returns the width drawn."""
    for i, ch in enumerate(s.upper()):
        rows = _GLYPHS.get(ch, _GLYPHS[" "]).split()
        for ry, row in enumerate(rows):
            for rx, bit in enumerate(row):
                if bit == "#":
                    px(img, x + i * 4 + rx, y + ry, c)
    return tiny_text_width(s)


FONT_PATH = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "web", "public", "assets", "fonts", "PressStart2P-Regular.ttf")
)


def font_text(img, x, y, s, size, c):
    """Press Start 2P text with no anti-aliasing (sizes that are multiples of 8 are pixel-exact)."""
    f = ImageFont.truetype(FONT_PATH, size)
    d = ImageDraw.Draw(img)
    d.fontmode = "1"
    d.text((x, y), s, font=f, fill=c)
    return d.textbbox((x, y), s, font=f)


def font_text_width(s, size):
    f = ImageFont.truetype(FONT_PATH, size)
    l, _, r, _ = ImageDraw.Draw(new(1, 1)).textbbox((0, 0), s, font=f)
    return r - l
