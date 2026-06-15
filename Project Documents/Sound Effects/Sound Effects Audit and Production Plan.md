# Legendary Horizon Sound Effects Audit and Production Plan

## Implementation Update - June 13, 2026

The approved P0 effects are now integrated into the live game:

- `save_confirm`
- `quest_complete`
- `item_acquired`
- `action_blocked`
- `answer_correct`
- `answer_incorrect`

The remaining P1 and P2 effects have not been produced and remain unwired.

## Scope

This audit covers sound effects used by the live frontend game. It excludes dialogue narration and music except where
they interact with sound-effect playback.

This is a production-only audit and planning document. It does not approve, replace, delete, register, or wire any
sound into the game.

Primary runtime sources:

- `Codex/frontend/src/lib/lhSfx.ts`
- `Codex/frontend/src/lib/lhCatalogAudio.ts`
- `Codex/frontend/src/App.tsx`
- `Codex/frontend/src/hooks/useNightOneFlow.ts`
- `Codex/frontend/src/rendering/PhaserExplorationView.tsx`
- `Codex/frontend/src/components/EncounterOverlay.tsx`
- `Codex/frontend/src/components/RealmAtlasOverlay.tsx`

Production batch:

- `Codex/frontend/scripts/prepare-elevenlabs-sfx.mjs`
- `Project Documents/Sound Effects/ElevenLabs Candidates/manifest.json`
- `Project Documents/Sound Effects/ElevenLabs Candidates/elevenlabs_sfx_batch.csv`

## Existing Coverage

### Registered local SFX

The central `lhSfx.ts` registry contains 14 sound IDs, and every registered file currently exists.

Actively used:

- `portal_activation`
- `lost_echo_defeat`
- `ui_hover`
- `ui_select`
- `traveler_swing_1`
- `traveler_swing_2`
- `lost_echo_swing`
- `door_open`
- `door_close`

Registered but not currently played outside the registry:

- `traveler_attack`
- `lost_echo_attack`
- `atlas_scroll_close`
- `aethelwood_hub_open`
- `aethelwood_hub_close`

### Catalog and direct-play SFX

- Fog clearing uses `/assets/Audio/fog clearing.wav`.
- Scroll unfurling uses `/assets/Audio/Scroll Unfurling.wav`.
- Save confirmation still points to `sfx_save_chime_placeholder` and falls back to a synthesized chime.
- Knowledge-combat success uses `/assets/Audio/success trill.wav` through a hard-coded `new Audio(...)` path.

### Unused existing files

Unused files are treated as unapproved legacy material. Their presence does not mean they should be reused, integrated,
or retained. They are outside the approved live sound set until the user explicitly approves them.

## Main Findings

### 1. Playback is fragmented across three systems

Sound effects currently play through:

1. The pooled `lhSfx.ts` registry.
2. The catalog-based `lhCatalogAudio.ts` helper with synthesized fallbacks.
3. Direct `new Audio(...)` calls, currently used by knowledge-combat success.

This makes volume balancing, missing-file detection, cooldowns, and future accessibility behavior inconsistent.

This fragmentation is documented only as an audit finding. No playback-system changes are included in this plan.

### 2. Global UI sounds are broad

`App.tsx` plays hover and select sounds for every button, link, and element with `role="button"`. This provides broad
coverage but can become tiring in dense menus and may overlap with more meaningful event sounds.

The global UI behavior should be evaluated during a later implementation pass. This plan does not alter it.

### 3. Several important player outcomes are silent

High-value missing cues:

- Quest completion
- Memento or item acquired
- Invalid or blocked action
- Correct and incorrect knowledge-combat answers
- Traveler and Lost Echo hit impacts
- Oracle altar activation and prophecy sealing

These should be produced before adding decorative menu or ambient effects.

### 4. Dialogue narration changes the SFX mix

Master Scribe and Oracle narration now exists. Dialogue-open and dialogue-page sounds should be very quiet and short so
they do not mask the first spoken word. Narration should duck music, but it should not be interrupted by global hover
sounds.

### 5. Existing unused assets are not approved

Only effects confirmed as actively used in the live game are treated as part of the current sound identity. Files that
exist but are not used may be junk, rejected experiments, or cleanup candidates. Do not recommend or wire them in based
only on their filenames.

## Production Priorities

### P0 - Essential feedback

Generate and integrate first:

- `save_confirm`
- `quest_complete`
- `item_acquired`
- `action_blocked`
- `answer_correct`
- `answer_incorrect`

### P1 - Gameplay and ceremony polish

- `traveler_hit`
- `lost_echo_hit`
- `dialogue_open`
- `dialogue_advance`
- `oracle_altar_awaken`
- `prophecy_sealed`

### P2 - Session polish

- `campfire_reflection_saved`

## ElevenLabs Audition Workflow

The SFX generator writes candidates only into an isolated folder. It does not overwrite live game sounds, change
runtime behavior, or imply that a candidate has been approved.

From `Codex/frontend`, rebuild the manifests without consuming credits:

```powershell
node .\scripts\prepare-elevenlabs-sfx.mjs --dry-run
```

Generate three representative P0 auditions first:

```powershell
node .\scripts\prepare-elevenlabs-sfx.mjs --generate --only=save_confirm,quest_complete,action_blocked
```

After approving the direction, generate remaining P0 candidates without replacing existing auditions:

```powershell
node .\scripts\prepare-elevenlabs-sfx.mjs --generate --priority=P0 --skip-existing
```

Candidate files appear outside the live game in:

`Project Documents/Sound Effects/ElevenLabs Candidates/`

## Audition Checklist

- The sound communicates its meaning without looking at the screen.
- It remains clear under exploration and battle music.
- It is not harsh through classroom laptop speakers.
- It has no voice, speech, music bed, or excessive tail.
- Repeated sounds remain comfortable after ten plays.
- Incorrect/blocked sounds inform without punishing the student.
- Dialogue sounds do not mask narration.
- Combat sounds remain stylized and non-graphic.

## Production Plan

1. Audit only the sounds demonstrably used by the live game.
2. Treat unused existing files as unapproved and make no assumptions about their quality.
3. Generate a small number of isolated P0 audition candidates.
4. Review candidates outside the game.
5. Record approved/rejected status in the production manifest.
6. Stop after approval decisions. Runtime implementation is a separate future task.

## Acceptance Gate

Before a candidate can be considered approved for a future implementation task:

- Rename it to a URL-safe lowercase filename.
- Trim leading and trailing silence.
- Confirm its duration is appropriate for repeated gameplay.
- Match perceived loudness against the existing UI and combat effects.
- Compare it against the live sound identity.
- Mark it explicitly approved or rejected.

No candidate should be wired into the game as part of this audit.
