GUILD HQ HERO IMAGES
====================

All 16 guild hero images are present as WebP files (converted 2026-06-15 from
intro/assets PNGs via ffmpeg libwebp, 1280px wide, quality 82).

File names match the realm slug exactly. Do not rename.

NAMING CONVENTION
-----------------
  aethelwood.webp
  monolith-masonry.webp
  chroniclers-spire.webp
  mercantile-citadel.webp
  archives-ascension.webp
  gilded-vault.webp
  high-council-hall.webp
  aurora-apothecary.webp
  crossroads-haven.webp
  empaths-enclave.webp
  etheric-nexus.webp
  valors-watchtower.webp
  vulcanis-forge.webp
  bards-beacon.webp
  alchemical-observatory.webp
  odyssey-harbor.webp

EXPORT SETTINGS
---------------
  Format:     WebP (preferred) — convert originals with cwebp or Squoosh
  Dimensions: ~1280 x 800 px (original Drive files are 2500px wide; downsample for web)
  Quality:    80–85% WebP quality
  Color:      sRGB

SOURCE IMAGES
-------------
  Original high-res files are in Google Drive (file IDs listed in
  Codex/data/samples/guild_hq_workbook_image_map.json under "drive_file_id").
  Download from Drive, convert to WebP, and place here.

  Once a local file exists, the game will serve it from this directory.
  If a file is missing, the game falls back to the text-card placeholder.

ARCHITECTURE NOTE
-----------------
  Google Drive is NOT the runtime CDN for Legendary Horizon.
  These local files are the authoritative source. Drive IDs are
  retained in the JSON only as a reference for where the originals live.
