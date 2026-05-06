# Mirror of Maia Portal Implementation Guide

## Primary Asset Found

The correct Mirror of Maia asset is in the Ancient Ruins bundle.

Source files:

- `Game Map/Tilesets/ERW - Ancient Ruins V 2.2.1/ERW - Ancient Ruins V 2.2.1/Props/animated/Portal/on grass/portal-grassland-activated-loop.png`
- `Game Map/Tilesets/ERW - Ancient Ruins V 2.2.1/ERW - Ancient Ruins V 2.2.1/Props/animated/Portal/on grass/portal-grassland-activating.png`
- `Game Map/Tilesets/ERW - Ancient Ruins V 2.2.1/ERW - Ancient Ruins V 2.2.1/Props/animated/Portal/on grass/portal-grassland-deactivating.png`

Recommended runtime copies:

- `Codex/frontend/public/assets/maps/portal-grassland-activated-loop.png`
- `Codex/frontend/public/assets/maps/portal-grassland-activating.png`
- `Codex/frontend/public/assets/maps/portal-grassland-deactivating.png`

Frame data:

- Frame size: `288x192`
- Activated loop sheet: `2016x384`, arranged as `7` columns by `2` rows
- Activating sheet: `2016x384`, arranged as `7` columns by `2` rows
- Deactivating sheet: `1728x192`, arranged as `6` columns by `1` row

## Why This Works

The grassland portal is the best match for the Mirror of Maia proof-of-concept:

- real portal silhouette
- strong walk-into-the-mirror readability
- grass base that fits the current map palette
- separate activation, active loop, and deactivation states
- enough visual scale to feel like a major instructional handoff

For the leadership demo, present this as the Mirror of Maia.

## Fallback Asset

The earlier shrine/buff asset remains usable as a fallback only:

- `Game Map/Tilesets/ERW - Grass Land 2.0 v1.9/Props/Animated props/shrine-buff available animation-no grass-295x311.png`
- `Game Map/Tilesets/ERW - Grass Land 2.0 v1.9/Props/Animated props/shrine-getting buff animation-no grass-295x311.png`

## Tiled Map Setup

### 1. Add the visual tile

In Tiled, add the idle spritesheet as a tileset:

- Tileset name: `mirror_of_maia_idle`
- Source image: `portal-grassland-activated-loop.png`
- Tile width: `288`
- Tile height: `192`
- Margin: `0`
- Spacing: `0`

If Tiled asks for columns, use `7`.

### 2. Define the idle animation

In the Tiled tileset editor:

- Select tile `0`
- Add visible animation frames from the activated loop sheet.
- Frame duration: about `100ms` each
- Looping idle state is fine

This lets the map author see the portal pulsing in Tiled.

### 3. Place the portal

Create or use a visual object/tile layer:

- Suggested layer name: `lh_animated_props`
- Place the idle portal near the start of the guided demo route.
- Keep the base of the portal on a walkable tile.
- Leave a clear approach path so the player can visibly walk into it.

Recommended first placement:

- Put it close to the current player start / Aethelwood opening path.
- Avoid placing it in dense forest or near guild buildings for the first demo.

### 4. Add the interaction trigger

Create or use an object layer:

- Layer name: `lh_triggers`
- Object type: rectangle
- Object name: `mirror_of_maia_entry`
- Object type field: `lh_trigger_zone`

Rectangle size:

- Width: about `96`
- Height: about `96`
- Position it at the lower/base area of the portal, where the player should stand.

Custom properties:

| Property | Type | Value |
| --- | --- | --- |
| `lh_kind` | string | `maia_portal` |
| `lh_interaction_copy_active` | string | `Enter the Mirror of Maia` |
| `lh_interaction_copy_complete` | string | `Maia handoff logged` |
| `lh_external_url_key` | string | `maia` |
| `lh_demo_beat` | string | `mirror_of_maia_assessment_handoff` |

## App Behavior To Implement

The current Phaser map renderer can render tile layers and trigger rectangles, but it does not yet render animated Tiled tile objects as live sprites. For the Corey demo, the most reliable path is a hybrid:

1. Author the portal position in Tiled.
2. Use the `maia_portal` trigger object as the source of truth.
3. Phaser renders the portal spritesheet at that trigger location.
4. When the player presses Space inside the trigger:
   - play the activation animation
   - open Maia Learning in a new tab
   - show a progress message in game
   - mark the Mirror handoff as visited
   - save the state

## Demo Flow

### Before Maia

The player approaches the Mirror of Maia on the map.

Interaction copy:

`Enter the Mirror of Maia`

On interaction:

- portal activation animation plays
- player appears to be entering/leaving the game world
- Maia Learning opens in a new tab
- in-game progress toast appears:

`Mirror of Maia opened. Complete the Interest Profiler, review recommendations, and return when your teacher-reviewed profile is ready.`

### Return From Maia

Because live Maia integration is not a demo blocker, the first demo version should include an in-game return confirmation:

Button/copy:

`Return from Maia with teacher-reviewed profile`

On click:

- show the same portal activation/emergence moment
- load the sample teacher-reviewed profile
- reveal base stats / Scroll of Destiny signposts
- save progress

## Code Work Needed

### Required

- Add `maia_portal` to `LH_TRIGGER_KINDS`.
- Extend the parser type to preserve `lh_external_url_key` and `lh_demo_beat`.
- Teach `PhaserExplorationView` to load:
  - `portal-grassland-activated-loop.png`
  - `portal-grassland-activating.png`
  - `portal-grassland-deactivating.png`
- Create Phaser animations:
  - `mirror_of_maia_idle`
  - `mirror_of_maia_activate`
  - `mirror_of_maia_deactivate`
- Render portal sprite at the `maia_portal` trigger location.
- Add a callback from Phaser to the React flow for portal activation.
- Open Maia via `buildMaiaLaunchUrl()`.
- Mark the handoff complete and show save feedback.

### Nice To Have

- Fade the player out while the activation animation plays.
- Add a short overlay: `You step through the Mirror of Maia...`
- Add a return button that plays a re-entry animation.
- Add a small `Mirror of Maia` label above the portal only when nearby.

## Recommendation For Corey Demo

Use this portal as the first reliable map interaction. It is more meaningful than a generic research click because it proves the central instructional architecture:

Maia assessment work is not separate from the game. It is the doorway into the game loop.
