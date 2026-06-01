# Phase 2 Controlled Archive Move Plan

No files or folders were moved in Phase 2.

Proposed archive root:

- `archive/legacy-prototypes/`
- `archive/project-documents/`
- `archive/maps/`

| Current Path | Proposed Archive Path | Why Safe / Why Not Yet Safe | Risk If Moved | Current App Reference Check | Approval Still Needed |
|---|---|---|---|---|---|
| `src/` | `archive/legacy-prototypes/root-src/` | Has Phase 1 archive note; root prototype code, not the active Vite app. | Low runtime risk, but broad searches for `/src` are noisy because active app also uses `Codex/frontend/src`. | No current app import of root `src/` identified. Search term `src` is noisy because active app uses that name. | Yes |
| `phaser-game/` | `archive/legacy-prototypes/phaser-game/` | Has Phase 1 archive note; not referenced by current app. | Low runtime risk; historical prototype links may break. | 0 current app references found. | Yes |
| `character-creation/` | `archive/legacy-prototypes/character-creation/` | Has Phase 1 archive note; not referenced by current app. | Low runtime risk; historical prototype links may break. | 0 current app references found. | Yes |
| `CTE Remarkable Learning Experience/` | `archive/legacy-prototypes/cte-remarkable-learning-experience/` | Has Phase 1 archive note; not referenced by current app. | Low runtime risk; external/manual demo links may break if someone opens it by path. | 0 current app references found. | Yes |
| `LegendaryHorizon_Playable.html` | `archive/legacy-prototypes/LegendaryHorizon_Playable.html` | Has Phase 1 sidecar note; standalone prototype not wired to current app. | Low runtime risk; old local demo link breaks. | 0 current app references found. | Yes |
| `Project Documents/Current Scroll of Destiny.html` | `archive/project-documents/html-prototypes/Current Scroll of Destiny.html` | Covered by Phase 1 standalone HTML note; not wired to current app. | Low runtime risk; historical reference path changes. | 0 current app references found. | Yes |
| `Project Documents/Fog of the unknown.html` | `archive/project-documents/html-prototypes/Fog of the unknown.html` | Covered by Phase 1 standalone HTML note, but current app comments cite it as design source. | Medium reference risk: comments/docs cite the path for parity and extracted data. | 7 current app source references found in comments/constants. | Yes |
| `Project Documents/intro_video_v2.html` | `archive/project-documents/html-prototypes/intro_video_v2.html` | Covered by Phase 1 standalone HTML note; not wired to current app. | Low runtime risk; old local preview path changes. | 0 current app references found. | Yes |
| `Project Documents/LH game mentor prompts Video.html` | `archive/project-documents/html-prototypes/LH game mentor prompts Video.html` | Covered by Phase 1 standalone HTML note; not wired to current app. | Low runtime risk. | 0 current app references found. | Yes |
| `Project Documents/Quest_of_Fate.html` | `archive/project-documents/html-prototypes/Quest_of_Fate.html` | Covered by Phase 1 standalone HTML note; not wired to current app. | Low runtime risk. | 0 current app references found. | Yes |
| `Project Documents/Vault_of_ancient_runes.html` | `archive/project-documents/html-prototypes/Vault_of_ancient_runes.html` | Covered by Phase 1 standalone HTML note; not wired to current app. | Low runtime risk. | 0 current app references found. | Yes |
| `Codex/tiled/Legendary_Horizon_Map.json` | `archive/maps/stale-tiled-mirrors/Legendary_Horizon_Map.json` | Stale mirror; not the approved authoring source or runtime export. | Low runtime risk; possible loss of old comparison artifact at original path. | 0 current app references found. | Yes |
| `Codex/tiled/Legendary_Horizon_Map.tmj` | `archive/maps/stale-tiled-mirrors/Legendary_Horizon_Map.tmj` | Stale mirror/source; not the approved authoring source or runtime export. | Low runtime risk. | 0 current app references found. | Yes |
| `Project Documents/Legendary_Horizon_Map1.json` | `archive/maps/project-documents/Legendary_Horizon_Map1.json` | Historical map export. | Low runtime risk. | 0 current app references found. | Yes |
| `Project Documents/Legendary_Horizon_Map1.tmj` | `archive/maps/project-documents/Legendary_Horizon_Map1.tmj` | Historical map export/source copy. | Low runtime risk. | 0 current app references found. | Yes |
| `Game Map/Legendary_Horizon_Map_before_move_towards_final.tmx` | `archive/maps/stale-authoring/Legendary_Horizon_Map_before_move_towards_final.tmx` | Stale authoring-side file, not current approved source. | Low runtime risk; useful comparison file moves. | 0 current app references found. | Yes |
| `Project Documents/Legendary_Horizon_Master_GDD_v1.docx.md` | `archive/project-documents/superseded-planning/Legendary_Horizon_Master_GDD_v1.docx.md` | Older GDD reference superseded by current canon decisions where conflicts exist. | Medium context risk: old links and historical design references may break. | Not part of runtime app. | Yes |
| `Project Documents/Legendary_Horizon_Integrated_Implementation_Plan_v3.md` | `archive/project-documents/superseded-planning/Legendary_Horizon_Integrated_Implementation_Plan_v3.md` | Older planning doc likely superseded by current handoff/canon direction. | Medium reference risk. | Not part of runtime app. | Yes |
| `Project Documents/Implementation_Plan_v4.md` | `archive/project-documents/superseded-planning/Implementation_Plan_v4.md` | Appears like an older implementation plan; should be archived only after owner confirms it is superseded. | Medium reference risk. | Not part of runtime app. | Yes |

## Move Safety Rule

Before any physical move, run a final reference check against:

- `Codex/frontend/src`
- `Codex/frontend/public`
- `Codex/apps-script`
- `Codex/data`
- deployment docs and workflows

Anything with current app references should not move until the referencing code/docs are intentionally updated.

## Protected Non-Move Items

| Path | Classification | Rule |
|---|---|---|
| `Codex/frontend/public/assets/maps/Legendary_Horizon_Map_before_move_towards_final.json` | Active vertical-slice demo runtime map | Protected dependency. Do not archive, move, rename, delete, or replace until the vertical slice demo is intentionally migrated away from it. It is referenced by `Codex/frontend/src/hooks/useNightOneFlow.ts`. |
