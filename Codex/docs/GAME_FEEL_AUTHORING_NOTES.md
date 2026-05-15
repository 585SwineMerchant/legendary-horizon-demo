# Legendary Horizon Game-Feel Authoring Notes

## Tree, Grass, And Collision Layers

- Tree object sprites should be authored with their origin at the trunk/base line. The Phaser renderer now treats tree tile objects as base-sorted, but the best result still comes from Tiled objects whose `y` value is the trunk contact point.
- Keep tree canopy art visual-only when possible. Put collision only on trunks, roots, cliffs, and dense impassable forest edges.
- Tall grass should stay on tile-object layers with `grass` in the layer name so it receives reactive grass behavior and compares against actor foot depth.
- If a canopy must cover the player, split it into two Tiled objects: trunk/base on the normal object layer, canopy on a high visual-only layer.

## Global Light Direction

- Use northwest/upper-left as the light source.
- Cast soft structure and tree shadows toward southeast/lower-right.
- Contact shadows under Traveler and enemies should stay close to the feet; they are grounding shadows, not long cast shadows.
- Procedural oval shadows are disabled by default (`VITE_LH_PROCEDURAL_SHADOWS=true` re-enables them for experiments). The current tileset needs pixel-authored shadow assets or baked shadows, because repeated generic ellipses make objects look stamped/floating.

## Pixel Shadow Asset Path

- Best near-term result: small transparent PNG shadow sprites per asset family, e.g. `shadow_traveler_contact.png`, `shadow_lost_echo_contact.png`, `shadow_tree_small_se.png`, `shadow_tent_se.png`.
- Keep contact shadows directly under feet/base and cast shadows slightly down-right only for large stationary objects.
- For props with existing baked shadows, do not add another runtime shadow.
- Supported Tiled object hooks: `lh_shadow=none/contact/tree_small/tent`, optional `lh_shadow_offset_x`, `lh_shadow_offset_y`.
- `contact` is reserved for future actor/contact shadow sprites. `tree_small` and `tent` look for shadow textures loaded by the map renderer; if an asset is missing, the hook fails silently in production and logs only with authoring debug enabled.

## Visual Grade Flag

- `VITE_LH_VISUAL_GRADE=true` enables the subtle exploration overlay grade. It defaults off because Phaser prompts and world text share the same canvas as the exploration render.
- Keep the grade light enough that map paths, dialogue, prompts, and Chromebook contrast remain readable.

## Torch And Local Light Path

Start with fake lights before any real-time lighting:

- Add translucent radial glow sprites or circles at torch object points.
- Use additive blend only after Chromebook testing; normal alpha radial art is safest.
- Flicker with tiny alpha/scale tweens, staggered per torch.
- Carried lantern should follow the Traveler at low opacity and never obscure text.
- Supported Tiled hook: object property `lh_light=warm_torch`, optional `lh_light_radius_px`, `lh_light_flicker`.
- Fake lights are enabled by default and can be disabled with `VITE_LH_FAKE_LIGHTS=false`.
- Additive blending remains behind `VITE_LH_ADDITIVE_LIGHTS=true`; normal alpha blending is the Chromebook-safe default.

## DEV Authoring Debug

- Enable `VITE_LH_MAP_AUTHORING_DEBUG=true` while running the local dev build to log Tiled object classification.
- The logs identify base-sorted/tree objects, reactive grass layers, actor foot-depth values, object base-depth values, shadow hook results, light hook results, and whether rendered Tiled tile objects are visual-only.
- Production builds stay quiet unless a normal non-debug warning already existed.

## Concrete Tiled Workflow

1. Place a normal tree
   - Put the tree as a tile object on a visual object layer.
   - Set the object's `y` at the trunk/base contact point on the ground.
   - Use tree tilesets whose names include `tree`, or add custom property `lh_sort=base`.
   - Put collision on a separate collision object/tile layer around only the trunk/base, not the canopy.

2. Place a tree with canopy overlap
   - Split it into two authored pieces if possible.
   - Trunk/base object: normal visual object layer, `lh_sort=base`, collision only at trunk/base.
   - Canopy object: high visual-only layer with no collision. Use this only for art that should visually cover the Traveler.

3. Place grass-reactive objects
   - Put tall grass tile objects on a layer with `grass` in the layer name, for example `lh_decor_tall_grass`.
   - Keep those objects visual-only.
   - The renderer compares the grass base line against actor foot depth so the grass can visually interact with movement.

4. Place a torch
   - Add a point/tile object at the flame or sconce position.
   - Add custom property `lh_light=warm_torch`.
   - Optional: `lh_light_radius_px=72` for radius tuning.
   - Optional: `lh_light_flicker=false` if a stable glow is better for that object.

5. Place a future shadow object
   - Add custom property `lh_shadow=tree_small` or `lh_shadow=tent` on the object that should own the shadow.
   - Use `lh_shadow=none` when the object has baked shadow art or should never receive a runtime shadow.
   - Optional: use `lh_shadow_offset_x` and `lh_shadow_offset_y` to nudge the shadow down-right from the base point.
   - If the matching shadow asset is not present, the game continues without the shadow.

6. Collision versus visual-only layers
   - Collision layers should contain only gameplay blockers: trunks, walls, tents, cliffs, dense forest edges, and impassable props.
   - Visual-only layers should contain canopy art, decorative props, ground details, and grass.
   - Avoid putting large canopy rectangles into collision unless the canopy is truly meant to block movement.

7. Quick verification
   - Run locally with `VITE_LH_MAP_AUTHORING_DEBUG=true`.
   - Walk the Traveler around tree bases and grass.
   - Confirm console logs show tree/base objects as `base_sorted: true`, grass layers as reactive, and actor foot depth changing near the expected ground line.
