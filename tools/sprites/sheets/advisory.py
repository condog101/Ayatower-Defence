"""Black-and-white parody sticker: SANCTIONS ADVISORY / EXPLICIT SATIRE.

Styled after the familiar explicit-content label but with its own wording.
"""
from draw import new, rect, tiny_text, tiny_text_width
from palette import C

NAME = "advisory"
FRAME = (48, 32)
FRAMES = 1

INK = C["black"]
PAPER = C["cream"]


def centred(img, y, s, c):
    tiny_text(img, (48 - tiny_text_width(s)) // 2, y, s, c)


def build():
    img = new(48, 32, INK)
    rect(img, 1, 1, 46, 30, PAPER)
    # top band
    rect(img, 0, 0, 47, 8, INK)
    centred(img, 2, "SANCTIONS", PAPER)
    centred(img, 11, "ADVISORY", INK)
    # bottom band
    rect(img, 0, 17, 47, 31, INK)
    centred(img, 19, "EXPLICIT", PAPER)
    centred(img, 25, "SATIRE", PAPER)
    return img
