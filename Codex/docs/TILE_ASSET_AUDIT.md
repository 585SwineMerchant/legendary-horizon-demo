# Legendary Horizon Tile Asset Audit

This audit answers the practical map-building question: do we have the assets needed to recreate the current World Atlas as a playable Tiled map?

## Short Answer

You have enough assets to start building the atlas map in earnest, especially for Aethelwood, grasslands, forests, water edges, beaches, bridges, rocks, props, and the 16 guild HQ placements.

Before a full polished atlas pass, source or create a few targeted gaps:

- A proper playable traveler spritesheet integration.
- Volcanic/lava/ash terrain for Vulcanis Forge.
- Raft/boat/dock assets for water traversal.
- More deliberate road/path/trail tiles.
- Optional mountain-specific tiles if the missing `mountain.png` / `cliffsheet.png` sources cannot be recovered.

## Current Active Map Tilesets

The current `Game Map/Legendary_Horizon_Map.tmx` references:

- `water to grass - river orientation-spritesheet.tsx`
- `Tileset-Terrain-new grass.tsx`
- `guild_hqs.tsx`
- `Tileset-Terrain.tsx`
- `tree - color scheme 4 - 1.tsx`
- `tree - color scheme 5 - 2.tsx`
- `tree - color scheme 1 - 3.tsx`
- `tree - color scheme 2 - 1.tsx`
- `tree - color scheme 3 - 2.tsx`
- `tree - color scheme 2 - 3.tsx`
- `orc melee - all animations with fx.tsx`
- `cabin.tsx`
- `Aethelwood Farmsteads 2.tsx`

This means the current map can already paint grassland, water-to-grass edges, HQ sprites, trees, a cabin/farmstead area, and orc encounter visuals.

## Available Asset Strengths

### Grassland / Base Terrain

Strong. `Tileset-Terrain-new grass.png` and `Tileset-Terrain.png` are large 32 px terrain sheets. These are enough for the broad green atlas field and Aethelwood approach.

### Water, Rivers, Coasts, Beaches

Strong. There are many water, river-edge, platform-to-water, coast, beach, foam, and full-water animation assets available.

Key examples:

- `water to grass - river orientation-spritesheet.png`
- `water to grass2 - river orientation-spritesheet.png`
- `Animated water tiles (full tile).png`
- `platform - grass- coast - spritesheet.png`
- `platform -grass to water-spritesheet.png`
- `beach - standard - with thick foam - spritesheet.png`
- `Beach-transition tiles between coast platform and beach-spritesheet.png`

Good enough for central rivers, coastlines, islands, bays, and beach detail.

### Forests / Trees / Aethelwood

Very strong. Multiple tree color schemes, pine trees, shadows, naked trees, bushes, vegetation, flowers, mushrooms, and small forest props are present. This is enough to make Aethelwood and the southeast enchanted forest feel distinct.

### Guild HQs / Realm Buildings

Strong. You have the 16 active guild HQ images in `Game Map/Tilesets/New_Guild_HQs/`, plus `guild_hqs.png` / `guild_hqs_clean.png`.

The 16 active HQ image set is present:

- Aethelwood Farmsteads
- Alchemical Observatory
- Archives of Ascension
- Aurora Apothecary
- Bard's Beacon
- Chronicler's Spire
- Crossroads Haven
- Empathy's Enclave
- Etheric Nexus
- Gilded Vault
- High Council Hall
- Mercantile's Citadel
- Monolith of Masonry
- Odyssey's Harbor
- Valor's Watchtower
- Vulcanis Forge

### Bridges / Water Crossings

Good for bridges, weak for vehicles/docks.

You have wooden and stone bridge pieces:

- `wooden bridge - vertical.png`
- `wooden bridge - leftmost tile.png`
- `wooden bridge - mid tiles`
- `wooden bridge - rightmost tile.png`
- `stone bridge - horizontal`
- `stone bridge - vertical`
- woodplanks and small planks

You do not appear to have true raft, boat, ship, or dock assets in the runtime map asset folder. For the "small raft" traversal idea, source or make a raft/dock mini set.

### Mountains / Cliffs / Rocks

Mixed.

You have lots of rock props, cave entrances, holes, wall tiles, and terrain sheets that can support rocky areas. However, two useful Tiled tileset definitions exist but their source images were not found in the expected asset folders:

- `mountain.tsx` expects `Tilesets/mountain.png`
- `cliffsheet.tsx` expects `Tilesets/cliffsheet.png`

If those PNGs can be recovered, they may help a lot with the atlas mountain spine. If not, use the existing wall/rock terrain for first pass and source a dedicated mountain/cliff tileset before polishing the northern and central mountain regions.

### Volcanic / Vulcanis Forge Region

Weak. You have the Vulcanis Forge HQ art and some fire/smoke/campfire assets, but I did not find a strong lava/ash/cracked earth volcanic terrain kit.

For a convincing eastern volcanic realm, source or create:

- Lava river / lava pool tiles
- Ash ground
- Black basalt / obsidian rock
- Cracked glowing earth
- Smoke vents
- Volcanic cliff transitions

### Roads / Trails / Paths

Mixed to weak. There are sand/soil/grass terrain assets and likely some usable bits inside the main terrain sheets, but I did not see an obvious complete road/path/trail set by filename.

For recreating the atlas, roads matter. Consider adding or identifying:

- Dirt path straight/corner/T-junction/crossroad tiles
- Stone road/cobble path tiles for civic realms
- Forest trail overlays
- Mountain pass stair/path tiles

### Props / Interactables

Strong. There are many barrels, crates, chests, wells, tools, crops, flowers, rocks, logs, fences, vendor props, weapons, and campfire assets.

This is enough to decorate small quest areas and make traversal items feel placed in the world.

### Creatures / Ambient Life / Enemies

Good. You have orc melee/mage animations, small animals, ducks, frogs, birds, and ambient creatures. This is enough for optional encounters and life in the world.

## Player / Traveler Assets

You do have traveler-like assets:

- `male_traveler.png` is 96 x 256 px.
- `female_traveler.png` is 96 x 256 px.
- These appear to be compatible with a 32 x 32 grid, but need a proper Phaser spritesheet setup and animation mapping.

You also have:

- `hero.png` 1024 x 1024 px.
- `hero_clean.png` 1024 x 1024 px.

The current Phaser exploration renderer still uses a generated player dot, so the missing piece is not only art. It is integration:

1. Add/import a Tiled or runtime character asset entry.
2. Configure Phaser to load the traveler spritesheet.
3. Define walk/idle animations.
4. Replace the generated dot in `PhaserExplorationView`.
5. Decide whether beta uses male, female, or a selectable/default Traveler.

## Missing Or At-Risk Assets

### Must-Have Before Full Map Polish

- Volcanic terrain kit.
- Raft/boat/dock kit.
- Dedicated road/path/trail kit or verified path tiles from current terrain sheets.
- Traveler spritesheet integration.

### Nice-To-Have

- Mountain/cliff source recovery: `mountain.png`, `cliffsheet.png`.
- Biome transition tiles for grass-to-ash, grass-to-sand, grass-to-rock, forest-to-mountain.
- Realm-specific decorative props for tech/magic, health/apothecary, government/civic, finance/vault, harbor/logistics.
- UI/item icons for traversal unlocks: bridge charm, folded raft, cliffwalk sigils, ember ward, forest wayfinder.

## Recommendation

Start mapping now with the assets you have. Do not wait for perfect completeness.

Recommended prep before "serious cooking":

1. Recover or replace `mountain.png` and `cliffsheet.png` if possible.
2. Source a compact volcanic terrain pack.
3. Source or make a compact raft/dock/boat pack.
4. Pick the Traveler spritesheet and wire it into Phaser.
5. Identify the exact path/road tiles in the terrain sheets or add a small road tileset.

With those in place, the map asset pantry is ready for a real atlas-build pass.
