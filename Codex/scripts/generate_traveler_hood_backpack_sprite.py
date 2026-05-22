from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "Game Map" / "Tilesets" / "Characters"
SPRITE = OUT_DIR / "traveler_hood_backpack_45_grayscale_48.png"
FLIPPED = OUT_DIR / "traveler_hood_backpack_45_grayscale_48_flipped.png"
PREVIEW = OUT_DIR / "traveler_hood_backpack_45_grayscale_48_preview.png"
COMPARISON = OUT_DIR / "traveler_hood_backpack_45_grayscale_48_comparison.png"


P = {
    "outline": (18, 18, 20, 255),
    "deep": (32, 32, 36, 255),
    "dark": (55, 55, 60, 255),
    "mid": (83, 83, 90, 255),
    "soft": (111, 111, 118, 255),
    "light": (148, 148, 154, 255),
    "rim": (188, 188, 190, 255),
    "shadow": (0, 0, 0, 86),
}


def poly(draw, points, fill, outline="outline"):
    draw.polygon(points, fill=P[fill])
    if outline:
        draw.line(points + [points[0]], fill=P[outline], width=1)


def rect(draw, box, fill, outline=None):
    draw.rectangle(box, fill=P[fill])
    if outline:
        draw.rectangle(box, outline=P[outline])


def line(draw, points, fill, width=1):
    draw.line(points, fill=P[fill], width=width)


def build_sprite():
    img = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Broad rear backpack, visible before the small body details.
    poly(d, [(9, 17), (16, 13), (23, 17), (24, 29), (19, 37), (10, 34), (7, 26)], "dark")
    poly(d, [(11, 18), (16, 16), (21, 19), (21, 28), (18, 32), (12, 30), (10, 24)], "mid", None)
    poly(d, [(11, 20), (15, 17), (20, 20), (20, 24), (12, 25)], "soft", None)
    line(d, [(12, 28), (19, 30)], "deep")
    line(d, [(16, 16), (15, 32)], "deep")

    # Cloak silhouette: a single readable block, trailing back-left.
    poly(
        d,
        [(16, 16), (28, 15), (36, 22), (37, 32), (32, 42), (22, 44), (13, 39), (9, 30), (11, 21)],
        "dark",
    )
    poly(d, [(18, 18), (28, 17), (34, 23), (34, 31), (29, 39), (21, 40), (15, 36), (12, 29), (14, 22)], "mid", None)
    poly(d, [(14, 26), (22, 24), (25, 29), (21, 36), (14, 35), (11, 30)], "soft", None)
    poly(d, [(27, 19), (34, 24), (34, 31), (31, 36), (27, 30)], "deep", None)

    # Oversized hood and cowl, pushed forward for a 45-degree facing angle.
    poly(
        d,
        [(15, 6), (24, 3), (32, 5), (38, 12), (38, 19), (34, 25), (25, 27), (17, 24), (11, 18), (11, 11)],
        "dark",
    )
    poly(d, [(17, 8), (25, 5), (31, 7), (35, 12), (35, 18), (31, 23), (24, 24), (18, 21), (14, 17), (14, 11)], "mid", None)
    poly(d, [(27, 8), (34, 12), (35, 18), (31, 23), (25, 24), (27, 17)], "soft", None)
    poly(d, [(23, 11), (31, 10), (35, 14), (34, 20), (29, 23), (23, 21), (21, 16)], "deep")
    poly(d, [(25, 13), (31, 13), (33, 16), (32, 20), (28, 21), (24, 19), (23, 16)], "outline", None)
    rect(d, (29, 15, 30, 17), "rim")
    rect(d, (32, 16, 32, 18), "light")
    line(d, [(17, 9), (24, 6), (31, 7)], "light")
    line(d, [(14, 13), (14, 18), (17, 22)], "deep")
    line(d, [(24, 5), (24, 13)], "soft")

    # Front arm is small and weapon-free so later weapon layers have room.
    poly(d, [(32, 23), (37, 26), (38, 32), (35, 35), (31, 32), (31, 26)], "mid")
    poly(d, [(34, 27), (37, 29), (36, 33), (33, 32)], "soft", None)
    rect(d, (35, 34, 37, 36), "light", "outline")

    # Rear arm peeks out from the pack and cloak.
    poly(d, [(10, 28), (14, 30), (14, 36), (11, 38), (8, 35), (8, 31)], "deep")
    rect(d, (10, 37, 12, 39), "light", "outline")

    # Belt, strap, and cloak folds use a few high-contrast 1px marks.
    line(d, [(18, 20), (28, 31)], "outline")
    line(d, [(19, 20), (29, 31)], "soft")
    rect(d, (22, 29, 30, 31), "deep")
    rect(d, (25, 29, 26, 31), "rim")
    line(d, [(18, 31), (16, 38)], "deep")
    line(d, [(23, 30), (22, 41)], "deep")
    line(d, [(30, 30), (29, 39)], "soft")

    # Staggered legs keep the diagonal read even when mirrored.
    poly(d, [(18, 37), (23, 38), (23, 45), (17, 45), (16, 41)], "deep")
    poly(d, [(27, 36), (33, 37), (34, 44), (28, 45), (26, 41)], "deep")
    rect(d, (17, 43, 23, 46), "outline")
    rect(d, (28, 42, 35, 45), "outline")
    rect(d, (19, 38, 22, 42), "mid")
    rect(d, (28, 37, 32, 41), "mid")
    rect(d, (30, 42, 34, 43), "soft")

    # Tighten the outer silhouette with a few intentional pixels.
    rect(d, (24, 2, 28, 3), "outline")
    rect(d, (37, 14, 39, 19), "outline")
    rect(d, (8, 23, 9, 29), "outline")
    rect(d, (31, 40, 33, 43), "outline")
    rect(d, (13, 39, 17, 41), "outline")

    return img


def make_preview(sprite):
    scale = 8
    pad = 16
    cell = 8
    preview = Image.new("RGBA", (48 * scale + pad * 2, 48 * scale + pad * 2), (24, 24, 26, 255))
    d = ImageDraw.Draw(preview)
    for y in range(0, preview.height, cell):
        for x in range(0, preview.width, cell):
            fill = (54, 54, 58, 255) if ((x // cell) + (y // cell)) % 2 else (34, 34, 38, 255)
            d.rectangle((x, y, x + cell - 1, y + cell - 1), fill=fill)
    big = sprite.resize((48 * scale, 48 * scale), Image.Resampling.NEAREST)
    preview.alpha_composite(big, (pad, pad))
    return preview


def make_comparison(sprite):
    scale = 8
    pad = 16
    gap = 24
    cell = 8
    width = (48 * scale * 2) + (pad * 2) + gap
    height = (48 * scale) + (pad * 2)
    preview = Image.new("RGBA", (width, height), (24, 24, 26, 255))
    d = ImageDraw.Draw(preview)
    for y in range(0, preview.height, cell):
        for x in range(0, preview.width, cell):
            fill = (54, 54, 58, 255) if ((x // cell) + (y // cell)) % 2 else (34, 34, 38, 255)
            d.rectangle((x, y, x + cell - 1, y + cell - 1), fill=fill)
    big = sprite.resize((48 * scale, 48 * scale), Image.Resampling.NEAREST)
    flipped = sprite.transpose(Image.Transpose.FLIP_LEFT_RIGHT).resize((48 * scale, 48 * scale), Image.Resampling.NEAREST)
    preview.alpha_composite(big, (pad, pad))
    preview.alpha_composite(flipped, (pad + 48 * scale + gap, pad))
    return preview


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sprite = build_sprite()
    sprite.save(SPRITE)
    sprite.transpose(Image.Transpose.FLIP_LEFT_RIGHT).save(FLIPPED)
    make_preview(sprite).save(PREVIEW)
    make_comparison(sprite).save(COMPARISON)
    print(SPRITE)
    print(FLIPPED)
    print(PREVIEW)
    print(COMPARISON)


if __name__ == "__main__":
    main()
