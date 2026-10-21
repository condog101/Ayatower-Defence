"""Shared 40-colour palette for every generated sprite sheet.

Colours are RGBA tuples. Keep this list at 40 entries so the art stays coherent;
LibreSprite users can load these as a palette when touching up sheets.
"""

PALETTE = {
    # outlines / neutrals
    "black": (16, 14, 22, 255),
    "white": (244, 244, 236, 255),
    # desert land
    "sand_lt": (232, 206, 150, 255),
    "sand": (212, 178, 116, 255),
    "ochre": (184, 140, 78, 255),
    "rock_lt": (150, 112, 82, 255),
    "rock": (112, 80, 60, 255),
    "rock_dk": (72, 50, 42, 255),
    # water
    "water_dk": (18, 44, 84, 255),
    "water": (28, 72, 124, 255),
    "water_lt": (52, 112, 164, 255),
    "shallow": (70, 160, 178, 255),
    "foam": (206, 232, 236, 255),
    # navy haze grey hull / deck
    "hull_lt": (178, 188, 196, 255),
    "hull": (134, 146, 158, 255),
    "hull_dk": (92, 102, 114, 255),
    "deck": (62, 68, 78, 255),
    # fire
    "fire_red": (196, 40, 32, 255),
    "fire_orange": (238, 112, 30, 255),
    "fire_yellow": (252, 214, 70, 255),
    # skin / hair (caricature + crew)
    "skin_lt": (250, 196, 140, 255),
    "skin": (236, 150, 74, 255),
    "skin_dk": (190, 100, 50, 255),
    "hair": (246, 190, 64, 255),
    "hair_dk": (204, 140, 36, 255),
    # suit / tie
    "suit": (28, 34, 62, 255),
    "suit_lt": (52, 62, 102, 255),
    "tie": (208, 30, 44, 255),
    # misc
    "olive": (104, 112, 58, 255),
    "smoke": (110, 108, 112, 255),
    "smoke_lt": (168, 166, 168, 255),
    "steel": (150, 176, 206, 255),
    # album cover: gold, chrome, candy paint, purple, cream
    "gold": (255, 216, 74, 255),
    "gold_dk": (184, 140, 30, 255),
    "chrome": (222, 228, 236, 255),
    "candy": (210, 24, 48, 255),
    "candy_dk": (140, 12, 32, 255),
    "purple": (178, 107, 255, 255),
    "purple_lt": (214, 170, 255, 255),
    "cream": (243, 234, 215, 255),
}

assert len(PALETTE) == 40, len(PALETTE)

C = PALETTE  # short alias for sheet modules
