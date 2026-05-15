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

## Visual Grade Flag

- `VITE_LH_VISUAL_GRADE=false` disables the subtle exploration overlay grade.
- Keep the grade light enough that map paths, dialogue, prompts, and Chromebook contrast remain readable.

## Torch And Local Light Path

Start with fake lights before any real-time lighting:

- Add translucent radial glow sprites or circles at torch object points.
- Use additive blend only after Chromebook testing; normal alpha radial art is safest.
- Flicker with tiny alpha/scale tweens, staggered per torch.
- Carried lantern should follow the Traveler at low opacity and never obscure text.
- Future Tiled hook: object property `lh_light=warm_torch`, optional `lh_light_radius_px`, `lh_light_flicker`.
