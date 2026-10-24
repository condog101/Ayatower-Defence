"""Home-screen icons: the seal sprite scaled up with nearest-neighbour on the deep-water colour.

iOS fills transparent icon pixels with black, so the background is baked in.
Run: python3 tools/sprites/icons.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SEAL = ROOT / 'web/public/assets/sprites/seal.png'
OUT = ROOT / 'web/public'
BG = (0x0D, 0x2A, 0x33, 255)
SIZES = {'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512}


def icon(size: int) -> Image.Image:
    seal = Image.open(SEAL).convert('RGBA')
    # Largest whole-number scale that leaves a margin, so pixels stay square and crisp.
    scale = max(1, int(size * 0.8) // max(seal.size))
    seal = seal.resize((seal.width * scale, seal.height * scale), Image.NEAREST)
    out = Image.new('RGBA', (size, size), BG)
    out.alpha_composite(seal, ((size - seal.width) // 2, (size - seal.height) // 2))
    return out.convert('RGB')


if __name__ == '__main__':
    for name, size in SIZES.items():
        icon(size).save(OUT / name)
        print(f'wrote {name} ({size}x{size})')
