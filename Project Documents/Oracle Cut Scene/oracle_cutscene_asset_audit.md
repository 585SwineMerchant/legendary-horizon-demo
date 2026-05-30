# Oracle Cutscene Asset Audit

## Source Reviewed

- Production script: `oracle_cutscene_production_v2.md`
- Oracle behavior/reference context: `Oracle of Fate.md`, `OracleProphecyReveal.tsx`, `foretoldSignposts.ts`
- Approved Traveler reference: `Project Documents/New Traveler concept.png`

## Script Visual Requirements

| Beat | Script need | Status | Asset coverage |
|---|---|---:|---|
| Traveler approaches Altar of the Oracle | Traveler in approved hood/cloak design, altar in grass/shrine style, chamber ambience | PARTIAL | New staging plate and Traveler cutouts generated from approved reference. No final native walking sprite sheet exists yet. |
| Chamber / altar waiting | Stone oracle chamber, torchlit, mist floor, altar glowing softly | COVERED | `resolve-ready/oracle_chamber_wide.png`, plus `pixel-art-assets/oracle_00_stage_plate_clean_1920x1080.png` |
| Scroll responds | Scroll of Destiny close-up, three angular runes, no guild names | COVERED | `resolve-ready/oracle_scroll_closeup.png`, `_rendered_oracle_scroll_closeup.png` |
| Altar activation | Presence activates altar; runic glow/ring pulse | COVERED | Existing shrine animations; new `oracle_02_altar_activation_ring_sheet_12f_288x256.png` |
| Oracle awakens / appears | Supernatural Oracle, ghostly/magical, not standard NPC | PARTIAL | Existing `ghost_oracle_pixel.png`; new manifest and vanish sheets. Existing oracle is usable but tiny/simple. |
| Prophecy delivery tied to one of 3 Foretold Signposts | Beam/rune reveal; visual link to three signposts | COVERED | New `oracle_06_prophecy_beam_sheet_12f_192x192.png` and `oracle_07_signpost_rune_reveal_sheet_12f_192x64.png` |
| Ambient supernatural overlays | Mist, particles, aura | COVERED | Existing generic particles/wind sheets; new `oracle_03_oracle_aura_particles_sheet_10f_96x96.png`, `oracle_08_floor_mist_sheet_12f_320x96.png` |
| Oracle vanishes | Dissolve/fade supernatural exit | COVERED | New `oracle_09_ghost_vanish_sheet_10f_96x96.png` |
| Abstract cinematic vision / tome | Threads, silhouettes, tome, cut to black | COVERED | `resolve-ready/oracle_vision_threads.png`, `oracle_vision_glimpse.png`, `oracle_convergence_tome.png` |

## Asset Inventory

### Resolve-ready cinematic stills

- `resolve-ready/oracle_chamber_wide.png`
- `resolve-ready/oracle_scroll_closeup.png`
- `resolve-ready/oracle_statue_glow.png`
- `resolve-ready/oracle_vision_threads.png`
- `resolve-ready/oracle_vision_glimpse.png`
- `resolve-ready/oracle_convergence_tome.png`

### Audio

- `resolve-ready/audio/oracle_ambient_base.mp3`
- `resolve-ready/audio/oracle_music_sting.mp3`
- `resolve-ready/audio/oracle_rune_chime.mp3`
- `resolve-ready/audio/oracle_tremor.mp3`

### Existing pixel assets

- `Game Map/Tilesets/ghost_oracle_pixel.png` - 10 frames, 32x32 each. Usable as Oracle base.
- `Game Map/Tilesets/ghost_oracle_true_pixel_art.png` - 32x32 tiny placeholder; do not rely on it as the main Oracle.
- `ERW - Grass Land 2.0 v1.9/.../altar - on grass - complete.png` - canonical altar.
- `ERW - Grass Land 2.0 v1.9/.../shrine-buff available animation-295x311.png` - usable shrine activation reference.
- `ERW - Grass Land 2.0 v1.9/.../generic nature particles96x96.png` - ambient particles.
- `ERW - Grass Land 2.0 v1.9/.../wind cartoonish fx-288X64- 48frames.png` - mist/wind overlay candidate.

### Rejected Traveler assets

Do not use these for this cutscene:

- `Codex/frontend/public/assets/player/traveler/*`
- `Codex/frontend/public/assets/player/adventurer/*`
- `Game Map/Tilesets/Characters/traveler_hood_backpack_45_grayscale_48*`

They do not match the approved Traveler goal reference.

## Newly Generated Assets

Primary location:

- `Project Documents/Oracle Cut Scene/pixel-art-assets/`

Copied for frontend/game use:

- `Codex/frontend/public/assets/cutscenes/oracle/`

Generated files:

- `oracle_00_stage_plate_clean_1920x1080.png` - pixel staging plate without Traveler.
- `oracle_01_traveler_approach_plate_1920x1080.png` - staging plate with approved-reference Traveler.
- `oracle_01a_traveler_reference_cutouts_4dir_96x128.png` - approved Traveler cutouts from `New Traveler concept.png`.
- `oracle_02_altar_activation_ring_sheet_12f_288x256.png` - transparent altar activation runes/rings.
- `oracle_03_oracle_aura_particles_sheet_10f_96x96.png` - transparent aura/particles.
- `oracle_04_ghost_manifest_sheet_10f_96x96.png` - ghost Oracle manifestation.
- `oracle_05_prophecy_lower_third_rune_overlay_1920x1080.png` - optional prophecy/rune overlay.
- `oracle_06_prophecy_beam_sheet_12f_192x192.png` - prophecy delivery beam.
- `oracle_07_signpost_rune_reveal_sheet_12f_192x64.png` - three-signpost rune reveal.
- `oracle_08_floor_mist_sheet_12f_320x96.png` - floor mist.
- `oracle_09_ghost_vanish_sheet_10f_96x96.png` - ghost Oracle vanish.

## DaVinci Assembly Recommendation

| Time | Beat | Layer order | Notes |
|---|---|---|---|
| 0:00-0:05 | Approach / chamber breathes | Background: `oracle_00_stage_plate_clean_1920x1080.png` or `resolve-ready/oracle_chamber_wide.png`; Character: `oracle_01_traveler_approach_plate_1920x1080.png`; FX: `oracle_08_floor_mist_sheet_12f_320x96.png` | Fade in from black. Slow push. Text: "The scroll hums in your hands..." |
| 0:05-0:13 | Scroll responds | Background: `resolve-ready/oracle_scroll_closeup.png`; FX: DaVinci ripple or `oracle_07_signpost_rune_reveal_sheet_12f_192x64.png` as overlay | Trigger chimes at 0:06, 0:08, 0:10. Text after third rune. |
| 0:13-0:18 | Presence activates altar | Background: stage plate or `resolve-ready/oracle_statue_glow.png`; FX: `oracle_02_altar_activation_ring_sheet_12f_288x256.png`, `oracle_03_oracle_aura_particles_sheet_10f_96x96.png` | Composite activation sheet over altar center. Use Add/Screen blend. |
| 0:18-0:22 | Oracle manifests | Background: altar plate; Character: `oracle_04_ghost_manifest_sheet_10f_96x96.png`; FX: aura particles and tremor | Scale Oracle 2x-3x if using pixel plate. Keep translucent. |
| 0:22-0:27 | Prophecy delivered | Background: darkened altar or `oracle_vision_threads.png`; Oracle: held last manifest frame; FX: `oracle_06_prophecy_beam_sheet_12f_192x192.png`; Overlay: `oracle_07_signpost_rune_reveal_sheet_12f_192x64.png` | This is the best place to show connection to one of the 3 Foretold Signposts. |
| 0:27-0:31 | Oracle vanishes / vision takes over | Background: `oracle_vision_threads.png`; Oracle: `oracle_09_ghost_vanish_sheet_10f_96x96.png`; FX: mist, particles | Fast dissolve into full abstract vision. |
| 0:31-0:37 | Convergence | Background: `resolve-ready/oracle_convergence_tome.png`; FX: DaVinci rays/bloom | Slow push to tome. |
| 0:37-0:40 | Silence | Black | Hard cut, no fade. Hand off to book scroll scene. |

## Remaining Risk

- The approved Traveler is currently reference-derived from the concept sheet, not a native transparent animation sheet. It is good enough for a still/Resolve plate, but a production in-game cutscene should get a clean native 32x32 or 48x48 transparent Traveler sprite sheet matching `New Traveler concept.png`.
- The existing Ghost Oracle reads supernatural and magical, but it is simple. If the Oracle needs to feel like a major character, generate a higher-fidelity ghost Oracle sheet from the existing `ghost_oracle_pixel.png` style.
