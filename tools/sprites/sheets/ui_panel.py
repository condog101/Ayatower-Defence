"""9-slice UI panel (16px borders): black fill, gold frame with a chrome bevel, gold corner rivets."""
from draw import new, px, rect
from palette import C

NAME = "ui_panel"
FRAME = (48, 48)
FRAMES = 1


def build():
    img = new(48, 48)
    rect(img, 0, 0, 47, 47, C["black"])
    rect(img, 1, 1, 46, 46, C["gold"])
    # chrome light on the top/left of the frame, dark gold on the bottom/right
    rect(img, 1, 1, 46, 1, C["chrome"])
    rect(img, 1, 1, 1, 46, C["chrome"])
    rect(img, 1, 46, 46, 46, C["gold_dk"])
    rect(img, 46, 1, 46, 46, C["gold_dk"])
    rect(img, 2, 45, 45, 45, C["gold_dk"])
    rect(img, 45, 2, 45, 45, C["gold_dk"])
    rect(img, 3, 3, 44, 44, C["black"])
    rect(img, 4, 4, 43, 43, (12, 10, 14, 255))
    rect(img, 4, 4, 43, 4, (30, 26, 24, 255))  # inner top light
    # rounded outer corners
    for x, y in [(0, 0), (47, 0), (0, 47), (47, 47)]:
        px(img, x, y, (0, 0, 0, 0))
    # gold rivets, kept inside the 8px corner cells so the 9-slice never stretches them
    for cx, cy in [(4, 4), (42, 4), (4, 42), (42, 42)]:
        px(img, cx, cy, C["cream"])
        px(img, cx + 1, cy, C["gold"])
        px(img, cx, cy + 1, C["gold"])
        px(img, cx + 1, cy + 1, C["gold_dk"])
    return img
