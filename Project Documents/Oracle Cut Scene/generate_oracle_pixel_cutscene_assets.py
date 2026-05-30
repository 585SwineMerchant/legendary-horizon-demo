from __future__ import annotations

import json
import math
from collections import deque
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
CUTSCENE_DIR = Path(__file__).resolve().parent
OUT_DIR = CUTSCENE_DIR / "pixel-art-assets"
GAME_OUT_DIR = ROOT / "Codex" / "frontend" / "public" / "assets" / "cutscenes" / "oracle"

ALTAR = ROOT / "ERW - Grass Land 2.0 v1.9" / "ERW - Grass Land 2.0 v1.9" / "Props" / "Static props" / "sheet2-sprites" / "altar - on grass - complete.png"
TRAVELER_REFERENCE = ROOT / "Project Documents" / "New Traveler concept.png"
GHOST_ORACLE = ROOT / "Game Map" / "Tilesets" / "ghost_oracle_pixel.png"

AMBER = (244, 166, 45, 255)
AMBER_DARK = (149, 89, 24, 210)
AMBER_SOFT = (244, 177, 65, 100)
CYAN_GHOST = (82, 226, 241, 210)
CYAN_DIM = (22, 139, 159, 120)
WHITE_SOFT = (220, 255, 255, 170)


def ensure_dirs() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    GAME_OUT_DIR.mkdir(parents=True, exist_ok=True)


def paste_alpha(dst: Image.Image, src: Image.Image, xy: tuple[int, int]) -> None:
    dst.alpha_composite(src.convert("RGBA"), xy)


def crop_first_frame(sheet_path: Path, frame_w: int, frame_h: int) -> Image.Image:
    sheet = Image.open(sheet_path).convert("RGBA")
    return sheet.crop((0, 0, frame_w, frame_h))


def extract_traveler_from_reference(crop_box: tuple[int, int, int, int], target_height: int) -> Image.Image:
    """Extract an approved Traveler cutout from the goal-reference sheet.

    Do not use the older player/traveler or adventurer sheets for this cutscene.
    The goal reference has dark UI panels, so this does a local dark-background
    matte and keeps the sprite's black outline by using a soft alpha ramp.
    """
    ref = Image.open(TRAVELER_REFERENCE).convert("RGBA")
    crop = ref.crop(crop_box)
    px = crop.load()
    w, h = crop.size
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = tuple(sum(c[i] for c in corners) // len(corners) for i in range(3))
    seen = [[False for _ in range(w)] for _ in range(h)]
    bg_mask = [[False for _ in range(w)] for _ in range(h)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    def close_to_bg(color: tuple[int, int, int, int]) -> bool:
        r, g, b, _ = color
        dist = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
        return dist < 42

    while q:
        x, y = q.popleft()
        if x < 0 or x >= w or y < 0 or y >= h or seen[y][x]:
            continue
        seen[y][x] = True
        if not close_to_bg(px[x, y]):
            continue
        bg_mask[y][x] = True
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out_px = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not bg_mask[y][x]:
                out_px[x, y] = (r, g, b, a)
    alpha = out.getchannel("A").filter(ImageFilter.MaxFilter(3))
    out.putalpha(alpha)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    scale = target_height / out.height
    target_width = max(1, int(round(out.width * scale)))
    return out.resize((target_width, target_height), Image.Resampling.NEAREST)


def make_traveler_reference_sheet() -> Path:
    """Approved Traveler reference cutouts from Project Documents/New Traveler concept.png."""
    crops = [
        (40, 234, 168, 464),   # south / front
        (212, 232, 346, 462),  # north / back
        (392, 238, 528, 462),  # west
        (574, 238, 710, 462),  # east
    ]
    sheet = Image.new("RGBA", (96 * 4, 128), (0, 0, 0, 0))
    for i, box in enumerate(crops):
        sprite = extract_traveler_from_reference(box, 112)
        frame = Image.new("RGBA", (96, 128), (0, 0, 0, 0))
        paste_alpha(frame, sprite, ((96 - sprite.width) // 2, 128 - sprite.height - 6))
        sheet.alpha_composite(frame, (i * 96, 0))
    path = OUT_DIR / "oracle_01a_traveler_reference_cutouts_4dir_96x128.png"
    sheet.save(path)
    return path


def outline_rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], color: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = xy
    draw.rectangle((x0, y0, x1, y1), outline=color)
    draw.point((x0, y0), fill=(0, 0, 0, 0))
    draw.point((x1, y0), fill=(0, 0, 0, 0))
    draw.point((x0, y1), fill=(0, 0, 0, 0))
    draw.point((x1, y1), fill=(0, 0, 0, 0))


def draw_rune(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: int, color: tuple[int, int, int, int]) -> None:
    w = max(1, scale)
    h = 14 * scale
    draw.line((cx, cy - h, cx, cy + h), fill=color, width=w)
    draw.line((cx, cy - 7 * scale, cx + 8 * scale, cy - 13 * scale), fill=color, width=w)
    draw.line((cx, cy - 1 * scale, cx + 9 * scale, cy - 7 * scale), fill=color, width=w)
    draw.line((cx, cy + 5 * scale, cx - 8 * scale, cy + 13 * scale), fill=color, width=w)


def make_stage_plate() -> tuple[Path, Path]:
    small = Image.new("RGBA", (640, 360), (7, 10, 13, 255))
    d = ImageDraw.Draw(small, "RGBA")

    for y in range(0, 360, 16):
        shade = 12 + int(10 * (y / 360))
        d.rectangle((0, y, 640, y + 15), fill=(shade, shade + 4, shade + 5, 255))
    for x in range(-40, 680, 48):
        d.line((x, 0, x - 90, 360), fill=(18, 23, 22, 180), width=2)
    for x in range(32, 640, 64):
        d.rectangle((x, 18, x + 24, 322), outline=(37, 32, 28, 190))
        for yy in range(44, 300, 46):
            d.line((x + 6, yy, x + 18, yy + 18), fill=(89, 66, 37, 100), width=1)
            d.line((x + 18, yy, x + 6, yy + 18), fill=(89, 66, 37, 100), width=1)

    d.ellipse((-90, 265, 730, 470), fill=(8, 8, 10, 155))
    d.rectangle((0, 0, 640, 55), fill=(0, 0, 0, 105))
    d.rectangle((0, 320, 640, 360), fill=(0, 0, 0, 125))
    d.rectangle((0, 0, 45, 360), fill=(0, 0, 0, 145))
    d.rectangle((595, 0, 640, 360), fill=(0, 0, 0, 145))

    altar = Image.open(ALTAR).convert("RGBA")
    paste_alpha(small, altar, ((640 - altar.width) // 2, 48))

    for i in range(20):
        x = 32 + i * 31
        y = 275 + int(math.sin(i) * 9)
        d.rectangle((x, y, x + 34, y + 4), fill=(170, 170, 165, 18))

    clean_small = small.copy()

    # Approved source: Project Documents/New Traveler concept.png, top-row North view.
    traveler = extract_traveler_from_reference((212, 232, 346, 462), 74)
    paste_alpha(small, traveler, ((640 - traveler.width) // 2, 280))

    clean = clean_small.resize((1920, 1080), Image.Resampling.NEAREST)
    with_traveler = small.resize((1920, 1080), Image.Resampling.NEAREST)

    clean_path = OUT_DIR / "oracle_00_stage_plate_clean_1920x1080.png"
    traveler_path = OUT_DIR / "oracle_01_traveler_approach_plate_1920x1080.png"
    clean.save(clean_path)
    with_traveler.save(traveler_path)
    return clean_path, traveler_path


def make_oracle_sheets() -> list[Path]:
    paths: list[Path] = []
    ghost = Image.open(GHOST_ORACLE).convert("RGBA")
    manifest = Image.new("RGBA", (96 * 10, 96), (0, 0, 0, 0))
    vanish = Image.new("RGBA", (96 * 10, 96), (0, 0, 0, 0))

    for i in range(10):
        frame = ghost.crop((i * 32, 0, i * 32 + 32, 32)).resize((96, 96), Image.Resampling.NEAREST)
        alpha = frame.getchannel("A")
        frame.putalpha(alpha.point(lambda a, i=i: int(a * (0.25 + 0.075 * i))))
        aura = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        ad = ImageDraw.Draw(aura, "RGBA")
        r = 20 + i * 3
        ad.ellipse((48 - r, 48 - r, 48 + r, 48 + r), outline=(82, 226, 241, 30 + i * 8), width=2)
        paste_alpha(aura, frame, (0, 0))
        paste_alpha(manifest, aura, (i * 96, 0))

        vframe = ghost.crop((i * 32, 0, i * 32 + 32, 32)).resize((96, 96), Image.Resampling.NEAREST)
        alpha2 = vframe.getchannel("A")
        vframe.putalpha(alpha2.point(lambda a, i=i: int(a * max(0, 1 - i / 9))))
        vd = ImageDraw.Draw(vframe, "RGBA")
        for p in range(12):
            px = 24 + ((p * 17 + i * 5) % 50)
            py = 8 + ((p * 13 + i * 9) % 76)
            vd.rectangle((px, py, px + 1, py + 1), fill=(150, 245, 255, max(0, 180 - i * 16)))
        paste_alpha(vanish, vframe, (i * 96, 0))

    p1 = OUT_DIR / "oracle_04_ghost_manifest_sheet_10f_96x96.png"
    p2 = OUT_DIR / "oracle_09_ghost_vanish_sheet_10f_96x96.png"
    manifest.save(p1)
    vanish.save(p2)
    paths.extend([p1, p2])
    return paths


def make_altar_activation() -> Path:
    fw, fh, frames = 288, 256, 12
    sheet = Image.new("RGBA", (fw * frames, fh), (0, 0, 0, 0))
    for i in range(frames):
        f = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(f, "RGBA")
        pulse = 80 + i * 12
        for ring in range(3):
            inset = 42 + ring * 22 - i // 3
            d.ellipse((inset, 48 + inset // 5, fw - inset, 206 - inset // 6), outline=(244, 166, 45, pulse - ring * 20), width=2)
        for a in range(0, 360, 30):
            rad = math.radians(a + i * 8)
            x0 = fw // 2 + int(math.cos(rad) * 24)
            y0 = 136 + int(math.sin(rad) * 16)
            x1 = fw // 2 + int(math.cos(rad) * (95 + i))
            y1 = 136 + int(math.sin(rad) * (55 + i // 2))
            d.line((x0, y0, x1, y1), fill=(244, 166, 45, 85 + i * 6), width=1)
        for r in range(6):
            x = 74 + r * 27 + ((i + r) % 3)
            y = 101 + ((r * 11 + i * 3) % 52)
            draw_rune(d, x, y, 1, (244, 166, 45, 110 + i * 7))
        sheet.alpha_composite(f, (i * fw, 0))
    path = OUT_DIR / "oracle_02_altar_activation_ring_sheet_12f_288x256.png"
    sheet.save(path)
    return path


def make_aura_sheet() -> Path:
    fw, fh, frames = 96, 96, 10
    sheet = Image.new("RGBA", (fw * frames, fh), (0, 0, 0, 0))
    for i in range(frames):
        f = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(f, "RGBA")
        for r in range(18, 48, 6):
            alpha = max(0, 120 - r + i * 6)
            d.ellipse((48 - r, 50 - r, 48 + r, 50 + r), outline=(244, 166, 45, alpha), width=2)
        for p in range(18):
            x = 48 + int(math.sin(p * 1.7 + i * 0.5) * (18 + (p % 4) * 6))
            y = 62 - ((p * 11 + i * 7) % 66)
            d.point((x, y), fill=(255, 215, 108, 150))
        sheet.alpha_composite(f, (i * fw, 0))
    path = OUT_DIR / "oracle_03_oracle_aura_particles_sheet_10f_96x96.png"
    sheet.save(path)
    return path


def make_prophecy_beam() -> Path:
    fw, fh, frames = 192, 192, 12
    sheet = Image.new("RGBA", (fw * frames, fh), (0, 0, 0, 0))
    for i in range(frames):
        f = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(f, "RGBA")
        width = 10 + (i % 6)
        d.polygon([(96 - width, 176), (96 + width, 176), (103 + width // 2, 28), (89 - width // 2, 28)], fill=(244, 166, 45, 36 + i * 7))
        for k in range(5):
            x = 96 + int(math.sin(i * 0.7 + k) * (14 + k * 6))
            d.line((x, 176, 96, 26 + k * 12), fill=(255, 221, 120, 60 + i * 5), width=1)
        for p in range(18):
            x = 72 + ((p * 19 + i * 11) % 49)
            y = 28 + ((p * 23 + i * 17) % 148)
            d.point((x, y), fill=(255, 229, 130, 160))
        sheet.alpha_composite(f, (i * fw, 0))
    path = OUT_DIR / "oracle_06_prophecy_beam_sheet_12f_192x192.png"
    sheet.save(path)
    return path


def make_signpost_rune_reveal() -> Path:
    fw, fh, frames = 192, 64, 12
    sheet = Image.new("RGBA", (fw * frames, fh), (0, 0, 0, 0))
    centers = [42, 96, 150]
    for i in range(frames):
        f = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(f, "RGBA")
        active = min(2, i // 4)
        for idx, cx in enumerate(centers):
            alpha = 70 if idx > active else 180 + (i % 4) * 18
            outline_rect(d, (cx - 22, 8, cx + 22, 56), (119, 88, 47, 170))
            draw_rune(d, cx, 33, 1 if idx != active else 2, (244, 166, 45, alpha))
            if idx == active:
                d.rectangle((cx - 28, 4, cx + 28, 60), outline=(255, 214, 108, 95 + (i % 4) * 22))
        sheet.alpha_composite(f, (i * fw, 0))
    path = OUT_DIR / "oracle_07_signpost_rune_reveal_sheet_12f_192x64.png"
    sheet.save(path)
    return path


def make_floor_mist() -> Path:
    fw, fh, frames = 320, 96, 12
    sheet = Image.new("RGBA", (fw * frames, fh), (0, 0, 0, 0))
    for i in range(frames):
        f = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(f, "RGBA")
        for band in range(5):
            y = 44 + band * 8
            for x in range(-80, fw + 80, 42):
                offset = (i * (3 + band) + band * 19) % 84
                d.ellipse((x + offset, y - 8, x + offset + 96, y + 13), fill=(160, 190, 180, 14 + band * 5))
        f = f.filter(ImageFilter.GaussianBlur(1.2))
        sheet.alpha_composite(f, (i * fw, 0))
    path = OUT_DIR / "oracle_08_floor_mist_sheet_12f_320x96.png"
    sheet.save(path)
    return path


def make_lower_overlay() -> Path:
    img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle((0, 760, 1920, 1080), fill=(0, 0, 0, 88))
    for y in range(760, 1080, 6):
        alpha = max(0, 80 - (y - 760) // 4)
        d.line((0, y, 1920, y), fill=(244, 166, 45, alpha), width=1)
    d.line((420, 828, 1500, 828), fill=(244, 166, 45, 85), width=3)
    d.line((500, 902, 1420, 902), fill=(244, 166, 45, 45), width=2)
    for cx in (760, 960, 1160):
        outline_rect(d, (cx - 44, 846, cx + 44, 934), (244, 166, 45, 120))
        draw_rune(d, cx, 890, 3, (244, 166, 45, 150))
    path = OUT_DIR / "oracle_05_prophecy_lower_third_rune_overlay_1920x1080.png"
    img.save(path)
    return path


def copy_to_game_out(paths: list[Path]) -> None:
    for path in paths:
        shutil.copy2(path, GAME_OUT_DIR / path.name)


def write_manifest(paths: list[Path]) -> None:
    manifest = {
        "generated": [p.name for p in paths],
        "source_assets": {
            "altar": str(ALTAR),
            "traveler_reference_only": str(TRAVELER_REFERENCE),
            "ghost_oracle": str(GHOST_ORACLE),
        },
        "project_copy": str(GAME_OUT_DIR),
        "notes": "Transparent sprite sheets use horizontal frames. Frame sizes are encoded in filenames.",
    }
    (OUT_DIR / "oracle_pixel_asset_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    paths: list[Path] = []
    paths.extend(make_stage_plate())
    paths.append(make_traveler_reference_sheet())
    paths.append(make_altar_activation())
    paths.append(make_aura_sheet())
    paths.extend(make_oracle_sheets())
    paths.append(make_lower_overlay())
    paths.append(make_prophecy_beam())
    paths.append(make_signpost_rune_reveal())
    paths.append(make_floor_mist())
    copy_to_game_out(paths)
    write_manifest(paths)
    print(f"Generated {len(paths)} oracle cutscene pixel assets.")
    print(OUT_DIR)
    print(GAME_OUT_DIR)


if __name__ == "__main__":
    main()
