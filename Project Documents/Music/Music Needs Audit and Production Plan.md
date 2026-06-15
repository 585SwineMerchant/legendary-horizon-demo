# Legendary Horizon Music Needs Audit and Production Plan

## Implementation Update - June 13, 2026

`Amber Rune Chamber.mp3` was approved as the Scroll Reveal ceremony cue and is now integrated as
`public/assets/music/scroll_reveal_ceremony.mp3`.

Fireside Reflection music has not been produced. Prophecy Reveal remains intentionally silent pending a future
creative-direction decision.

## Scope

This audit covers music demonstrably used by the live frontend game and music needs explicitly identified by the live
flow. It excludes dialogue narration and sound effects except where music must leave room for them.

This is a production-only audit and planning document. It does not approve, replace, delete, register, generate, or
wire any music into the game.

Primary runtime sources:

- `Codex/frontend/src/lib/lhAudioDirector.ts`
- `Codex/frontend/src/App.tsx`
- `Codex/frontend/src/hooks/useNightOneFlow.ts`
- `Codex/frontend/src/modules/act1/ScrollRevealSequence.tsx`
- `Codex/frontend/src/screens/CampfireSaveScreen.tsx`
- `Codex/frontend/src/screens/OracleCinematicPlayer.tsx`
- `Codex/frontend/src/screens/OracleProphecyReveal.tsx`
- `Codex/frontend/src/modules/gt100/GT100GuardianBossModule.tsx`

Production brief package:

- `Codex/frontend/scripts/prepare-music-briefs.mjs`
- `Project Documents/Music/Suno Production Guide.md`
- `Project Documents/Music/Audition Briefs/manifest.json`
- `Project Documents/Music/Audition Briefs/music_audition_batch.csv`

## Approved Live Coverage

Only tracks demonstrably played by the live game are treated as part of the current music identity:

| Live context | Track | Playback behavior |
| --- | --- | --- |
| Intro cinematic and game-title continuation | `Legendary Horizon Title.mp3` | Intro owns its bed; title lane resumes from 2:04 |
| General exploration | `lh_exploration_loop.mp3` | Seamless looping exploration lane |
| Standard encounters | `Moonlit Boss Round.mp3` | Looping battle lane |
| GT100 Guardian phase 1 | `Blood Moon Duel.mp3` | Module-owned looping phase track |
| GT100 Guardian phase 2 | `Moonlit Boss Round.mp3` | Module-owned looping phase track |

The central music director supports three lanes: `title`, `exploration`, and `battle`. It provides clean fades,
music-only mute, Atlas ducking, autoplay recovery, and synthesized fallback beds.

## Intentional Silence

Silence is currently an explicit part of several scenes and should not automatically be treated as a defect:

- Teacher dashboard
- Initial title screen before the game-title continuation
- Intro screen, because its embedded cinematic owns the audio bed
- Oracle cinematic and prophecy reveal, according to the central `App.tsx` direction
- Screens outside active exploration, title continuation, or encounters

The Oracle cinematic video owns its own audio. Any music already baked into that video is outside the central music
director and should be reviewed as part of the final video mix, not assumed missing.

## Existing Unused Files

Music files that exist but are not demonstrably played by the live game are unapproved legacy material. Their presence
does not mean they should be reused, integrated, retained, or used as references.

This includes music in `public/assets/Audio`, Oracle cut-scene production folders, and any other project folder that is
not referenced by the live runtime. No recommendation in this audit is based only on an existing filename.

## Confirmed Music Needs

### P0 - Scroll Reveal ceremony

The Act I Scroll of Destiny reveal explicitly stops exploration music and contains a stub for a future reveal cue.
The visual cascade reaches its Continue button at approximately seven seconds, after which the player can remain on
the completed scroll.

Production need:

- An 18-25 second non-looping ceremonial cue with a soft holdable tail
- Sparse opening for the dark void
- Three restrained musical arrivals matching the three rune reveals
- Warm resolution as the parchment materializes
- Intimate and affirming, not a trailer-scale triumph

### P0 - Fireside Reflection loop

The end-of-session Fireside Reflection explicitly stops music and contains a stub for a future reflection track. This
screen asks the student to write 100-500 characters, so the duration is player-controlled.

Production need:

- A 75-120 second seamless loop
- Very low musical motion and low cognitive load
- Warm nighttime reflection rather than sadness
- No strong cadence, climax, or melody that competes with writing

## Creative-Direction Conflict

### P0 decision gate - Prophecy Reveal ceremony

`OracleProphecyReveal.tsx` contains a TODO for a future prophecy-reveal music lane. However, `App.tsx` explicitly
describes the Oracle cinematic and prophecy reveal as full silence because the ceremony carries its own weight.

This is a creative-direction conflict, not a production failure. Decide whether the reveal should remain silent before
commissioning or generating its cue.

If music is approved:

- Target the reveal's approximately 12-second automatic visual sequence
- Use a 12-16 second non-looping cue with a soft tail under the final button
- Keep it luminous, restrained, and non-vocal
- Leave clear room for the prophecy-sealing SFX

## No Proven Need Yet

The following may become useful as the game expands, but the current live flow does not prove that new music is
required:

- Separate music for every realm or guild
- Replacement title, exploration, or battle tracks
- Additional GT100 boss-phase tracks
- Music under ordinary dialogue
- Music for every menu, modal, or loading screen
- A separate Oracle cinematic score outside the video's own mix

These should remain future creative discussions rather than entering the current production batch.

## Mix and Composition Standards

- No vocals, spoken words, or choir-like syllables that compete with narration.
- Preserve headroom for dialogue narration and meaningful sound effects.
- Avoid harsh bass, piercing highs, and dense percussion on classroom laptop speakers.
- Keep the educational-fantasy tone warm, mysterious, and emotionally safe.
- Seamless loops must survive at least five consecutive repeats without revealing the edit.
- Non-looping cues need clean endings or soft tails that can hold gracefully.
- Deliver lossless WAV masters; derive compressed game formats only after approval.
- Stems are preferred for future balancing, but are not required for first auditions.

## Suno Audition Workflow

From `Codex/frontend`, rebuild the production briefs:

```powershell
node .\scripts\prepare-music-briefs.mjs
```

The script creates planning files only in:

`Project Documents/Music/Audition Briefs/`

It does not connect to Suno, create audio, consume credits, or modify the game. The generated batch includes concise
Suno-ready Style of Music and Exclude Styles prompts. Follow `Project Documents/Music/Suno Production Guide.md` for
the production steps.

Because these candidates are intended for a game, generate any candidate that may ship while a Suno Pro or Premier
subscription is active. Suno's current terms restrict free or Basic-tier output to personal, non-commercial use.

Audition order:

1. Produce the Scroll Reveal and Fireside Reflection candidates.
2. Review them outside the game and mark each approved or rejected.
3. Resolve the Prophecy Reveal silence-versus-music decision.
4. Produce a Prophecy Reveal candidate only if music is approved.
5. Stop after approval decisions. Runtime implementation is a separate future task.

## Acceptance Gate

Before a candidate can be considered approved for a future implementation task:

- Confirm it matches the scene's exact emotional purpose.
- Confirm the cue length or loop behavior matches the live scene.
- Test intelligibility of narration and important SFX over the candidate.
- Test on ordinary laptop speakers and headphones.
- Trim unintended leading or trailing silence.
- Verify a loop has no audible seam or loudness jump.
- Record the source, license, and usage rights.
- Mark the candidate explicitly approved or rejected.

No music should be wired into the game as part of this audit.
