# Legendary Horizon — Fun Layer, Field Kit, Inventory, and Save Ritual Design Reference

_Last updated: 2026-05-30_

## 1. Design intent

This document records the approved “fun layer” direction for **Legendary Horizon** so the project can balance educational function with game enjoyment.

The goal is not to add random rewards. The goal is to give the Traveler more reasons to **move, notice, collect, try, remember, and return** between required curriculum beats.

The approved direction is:

- Keep the **Scroll of Destiny** as the pause/menu shell.
- Rename the Documents section to **Field Journal**.
- Add a permanent **Field Kit** for exploration tools.
- Add a **Satchel** for consumables and dropped items.
- Add **Mementos** as collectible, low-pressure rewards.
- Add a meaningful **Campfire Kit** save ritual.
- Add HP/Resolve, damage, consumables, and a non-punitive failure state.
- Add small environmental reactions and VFX to improve game feel.
- Avoid a shop/vendor/economy for now; begin with enemy drops and exploration rewards.

## 2. Approved Field Kit tools

The Field Kit contains permanent tools that expand how the Traveler interacts with the world.

| Tool | Verb | Approved role | First implementation |
|---|---|---|---|
| Wayfinder Compass | Orient | Helps the Traveler know where to go next | Points toward active quest target, nearest required realm, or selected trail marker |
| Traveler’s Lantern | Illuminate | Makes exploration feel physical and magical | Local light radius around Traveler; no hidden reveal mechanic yet |
| Field Journal | Remember | New name and expanded function for the old Documents section | Holds work files, review notes, visited places, enemies faced, mementos, and realm notes |
| Trail Markers | Mark | Gives player-made navigation aids | Drop marker at current location; show on map/compass |
| Campfire Kit | Rest / Save | Gives the save sequence a beginning and narrative weight | Player “makes camp” before reflection and save confirmation |

These tools give the Traveler five core exploration verbs:

> Orient, illuminate, remember, mark, rest.

## 3. Scroll of Destiny / pause menu redesign

The current pause menu should not be discarded. It should be evolved.

When the player presses **spacebar**, the **Scroll of Destiny** still opens as the main pause overlay. The bottom buttons should become:

1. Quest Log  
2. World Atlas  
3. Field Journal  
4. Satchel  
5. Make Camp  
6. Settings / Help  

### Key naming changes

| Current label | New label | Reason |
|---|---|---|
| Documents | Field Journal | More game-like; supports work files plus review/memory systems |
| Save | Make Camp | Saving becomes a ritual instead of a button click |
| Inventory / Items | Satchel | Holds consumables, drops, and usable battle/exploration items |

## 4. Field Journal structure

The **Field Journal** should become one of the most important student-facing menus.

Suggested tabs:

| Tab | Contents |
|---|---|
| Work Files | Student work files, worksheets, forms, linked documents, Scroll-related outputs |
| Journey Review | Places visited, realms discovered, Guild HQs entered |
| Enemy Records | Lost Echoes defeated, knowledge battle enemies faced |
| Realm Notes | Quick notes for each visited realm: cluster, HQ, visit status, student notes |
| Mementos | Collectible display grid |
| Reflection Archive | Saved fireside reflection responses, if added later |

### Journey Review example

When a student visits a realm, the journal can show a short review entry:

> You visited Aethelwood Farmsteads. You explored a realm connected to Agriculture, Food, and Natural Resources. You faced 2 Lost Echoes and discovered 1 memento. Notes: This realm connects to careers involving plants, animals, food systems, and land stewardship.

## 5. Campfire Kit save ritual

The Campfire Kit turns saving into an in-world moment.

Recommended sequence:

1. Player opens Scroll of Destiny.
2. Player chooses **Make Camp**.
3. Scroll closes or darkens.
4. Camp gear appears near the Traveler.
5. Lantern dims; campfire glows.
6. Text appears: “The Traveler makes camp and records the day’s discoveries.”
7. Fireside reflection prompt appears.
8. Student answers the prompt or completes the reflection interaction.
9. Save runs.
10. Confirmation appears: “Your journey has been recorded.”
11. Player chooses **Return to Journey** or **End Session**.

This makes saving feel like a ceremony rather than a technical action.

## 6. HP, damage, and failure state

Avoid the word **death**. The Traveler does not die.

Approved language:

> **The Traveler is overwhelmed and retreats to the last safe camp.**

Alternative terms:

- Overwhelmed
- Wounded
- Lost in the Fog
- Shaken
- Forced to Retreat

### Recommended starting HP/Resolve model

| System | Starting value | Notes |
|---|---:|---|
| HP / Resolve | 20 | Keep the number readable and simple |
| Early enemy hit | 2–3 damage | Gentle failure pressure |
| Lost Echo hit | 4–5 damage | Standard combat threat |
| Strong enemy hit | 6–8 damage | Used sparingly |
| Failed knowledge answer | 2–4 focus damage | Frame as lost focus, not punishment |
| Campfire rest | Full recovery | Safe reset point |

### Overwhelmed consequence

When HP/Resolve reaches 0:

- Traveler retreats to last campfire or safe waypoint.
- No required quest item is lost.
- No academic progress is erased.
- Optional consequence: lose a small amount of supplies or gain temporary **Shaken** status.
- Recovery occurs through Campfire Rest, Remedy Herb, or a short encouragement message.

## 7. Consumables and drops

No store or vendor for now.

Enemy drops and exploration finds are enough for the first version.

| Consumable | Verb | Role |
|---|---|---|
| Remedy Herb | Heal | Restores HP |
| Greater Remedy | Heal | Stronger HP recovery |
| Focus Tea | Focus | Helps knowledge battles |
| Sharpening Stone | Empower Weapon | Buffs next weapon attack |
| Rune Oil | Empower Magic | Buffs next magic attack |
| Guard Charm | Guard | Reduces next damage taken |
| Ember Spark | Recharge | Restores small magic/energy amount |
| Clarity Leaf | Cleanse | Removes Shaken/Confused status |
| Trail Ration | Sustain | Small out-of-battle heal |

## 8. Guild Relics and verbs

Guild Relics are the special unlocks granted through Guild HQ discovery/research interaction. They should act as both rewards and verbs.

| Realm HQ | Unlock | Verb |
|---|---|---|
| Aurora Apothecary | Remedy Staff | Heal |
| Chronicler's Spire | Projected Voice | Project |
| Empath's Enclave | Guardian Embrace | Shield |
| Mercantile's Citadel | Freezing Prices | Project |
| The Etheric Nexus | Code Surge | Project |
| The Great Vulcanis Forge | Molten Core | Project |
| Aethelwood Farmsteads | Harvest Scythe | Slash |
| Monolith of Masonry | Stonebreaker Hammer | Smash |
| The Alchemical Observatory | Catalyst Grenade | Throw |
| The Crossroads Haven | Traveler's Saber | Slash |
| The Gilded Vault | Golden Scimitar | Slash |
| The High Council Hall | Regent's Axe | Slash |
| Valor's Watchtower | Peacekeeper's Mace | Smash |
| Odyssey's Harbor | Swift Passage Raft | Float |
| The Archives of Ascension | Librarian's Ladder | Climb |
| The Bard's Beacon | Bard's Bridge | Traverse |

Design rule:

> Every major item should give the Traveler a verb, not just an icon.

## 9. Cosmetic toys

Cosmetics are approved, but they should be implemented elegantly.

Avoid tilework-heavy cosmetics at first. Use UI and sprite overlays first.

### Low-cost cosmetic options

| Cosmetic | Implementation path |
|---|---|
| Journal badges | Icon grid in Field Journal |
| Traveler titles | Text label on Manifest / Scroll |
| Memento shelf | Journal grid |
| Save screen border | UI theme swap |
| Trail marker style | Alternate marker icon |
| Campfire flame color | Particle/light tint |
| Cloak trim color | Sprite tint/palette variant |
| Traveler banner | Manifest decoration |

Recommended order:

1. Titles  
2. Journal badges  
3. Mementos  
4. Trail marker styles  
5. Campfire visual variants  
6. Cloak trim / sprite tint  

## 10. Environmental reactions and VFX

The world should respond to the player in small, frequent ways.

### Environmental reactions

| Interaction | Trigger | Notes |
|---|---|---|
| Grass rustle | Walk through grass | Already started; needs tuning |
| Crop sway | Brush near crops | Less dramatic than grass |
| Bush shake | Touch/interact with bush | Short cooldown |
| Bug scatter | Enter bug cluster radius | Use existing animated bug assets |
| Firefly glow | Near lantern/campfire/night area | Later polish |
| Water ripple | Near shallow water / water edge | Connect with animated water assets |
| Wind streak / leaf drift | Windy areas or gust trigger | Works with windmill/wind systems |
| Dust puff | Start running or walk on dirt | High-value “feel” improvement |

### Combat/action VFX

| VFX | Trigger |
|---|---|
| Hit Spark | Weapon attack connects |
| Rune Burst | Magic attack connects |
| Shield Flash | Guard/defense effect |
| Heal Glow | Remedy or healing staff |
| Focus Pulse | Focus Tea or knowledge battle boost |
| Campfire Spark | Save ceremony |
| Fog Wisp | Fog clear / realm discovery |

### Suggested Tiled metadata

| Tiled property | Behavior |
|---|---|
| `lh_reactive=grass` | Grass rustle |
| `lh_reactive=crop` | Gentle crop sway |
| `lh_reactive=bush` | Bush shake |
| `lh_surface=dirt` | Dust puffs and dirt footsteps |
| `lh_surface=stone` | Sharper footstep, no dust |
| `lh_ambient=bugs` | Spawn/scatter bugs |
| `lh_wind=light` | Occasional leaf drift |
| `lh_water=animated` | Enable water animation hooks |
| `lh_light=warm_torch` | Warm light source |
| `lh_campsite=true` | Valid Make Camp location |

## 11. Inventory buckets

Use three clean buckets:

| Bucket | Examples | Purpose |
|---|---|---|
| Field Kit | Compass, Lantern, Trail Markers, Campfire Kit | Permanent exploration tools |
| Satchel | Herbs, Focus Tea, Stones, Rune Oil | Consumables, drops, temporary boosts |
| Field Journal | Work files, mementos, notes, enemy records | Memory, collection, academic record |

## 12. Implementation pass order

### Pass 1 — Pause menu rename and structure

- Rename Documents to Field Journal.
- Rename Save to Make Camp.
- Add Satchel button.
- Keep Scroll of Destiny as pause shell.
- Add placeholder tabs for Journal and Satchel.

### Pass 2 — Field Kit functionality

- Compass points to active objective.
- Lantern creates local light radius.
- Trail marker can be placed and removed.
- Campfire Kit starts save ritual.
- Field Journal reads visited places from save state.

### Pass 3 — HP and basic consumables

- Add HP/Resolve bar.
- Add Overwhelmed state.
- Add Remedy Herb.
- Add Focus Tea.
- Add weapon buff consumable.
- Add magic buff consumable.
- Add enemy drop table.

### Pass 4 — Game feel VFX

- Hit spark.
- Magic burst.
- Dirt dust.
- Crop/bush reactions.
- Bug scatter.
- Campfire sparks.
- Water animation hook.

## 13. Current design decisions

| Question | Decision |
|---|---|
| Should we add coins now? | No |
| Should we add a shop/vendor now? | No |
| How should items enter the game first? | Enemy drops, Guild HQ rewards, exploration finds |
| Should the Traveler die? | No; the Traveler becomes Overwhelmed and retreats |
| Are cosmetics worth doing? | Yes, but start with UI/journal/sprite overlays, not tilework |
| Should the Scroll pause menu remain? | Yes; evolve it into the shell for Quest Log, Atlas, Field Journal, Satchel, and Make Camp |
| Should the Lantern reveal secrets now? | No; illuminate only for first pass |
| Should Field Journal replace Documents? | Yes |
