# Legendary Horizon Suno Production Guide

## Before Generating

These tracks are intended for use in a game. Suno's current terms state that free or Basic-tier output is limited to
personal, non-commercial use. Generate any candidate that may ship in the game while a Pro or Premier subscription is
active, and retain its Suno link and generation date with the production records.

Do not upload existing unapproved project music as a Suno reference. Its presence in the workspace does not establish
that it is approved or that the necessary rights are known.

## Suno Setup

For every cue:

1. Open Suno and choose **Create**.
2. Use **Custom** mode.
3. Enable **Instrumental**.
4. Leave lyrics empty.
5. Enter the title and **Style of Music** prompt below.
6. If Suno shows **Exclude Styles**, paste the corresponding exclusion prompt.
7. Generate two versions and audition both before spending credits on more variations.
8. Keep all candidates outside the live game until one is explicitly approved.

Suno will usually produce a song that is longer than the required in-game cue. That is useful source material, not a
finished game asset. Select the strongest appropriate passage and perform the final crop, fade, or loop edit after
approval.

## Cue 1 - Scroll of Destiny: Reveal Ceremony

**Status:** Confirmed need  
**Suno title:** `Scroll of Destiny - Reveal Ceremony`

**Style of Music**

```text
instrumental fantasy game soundtrack, intimate ancient ceremony, restrained low strings, breathy woodwinds, three warm rune pulses, gentle amber harmonic bloom, mysterious then quietly affirming, sparse arrangement, soft resolved tail
```

**Exclude Styles**

```text
vocals, choir, lyrics, trailer music, epic percussion, battle music, horror, dominant melody, abrupt ending
```

**Selection target**

- The opening seven seconds must move naturally from mystery through three restrained arrivals into a warm reveal.
- Avoid versions that wait too long before developing.
- After approval, crop or fade the first complete 18-25 second ceremonial passage.

## Cue 2 - Fireside Reflection

**Status:** Confirmed need  
**Suno title:** `Fireside Reflection`

**Style of Music**

```text
instrumental ambient fantasy game soundtrack, warm nocturnal fireside reflection, sparse felted strings, soft wooden flute breaths, distant harmonics, subtle ember-like pulse, calm contemplative reassuring, low musical motion, background underscore
```

**Exclude Styles**

```text
vocals, choir, lyrics, dramatic melody, busy rhythm, sadness, loud percussion, loud fire crackle, climax, final cadence
```

**Selection target**

- Choose a version that remains calm and unobtrusive while someone reads and writes.
- Reject versions with a strong chorus, obvious emotional climax, or prominent lead melody.
- After approval, create a seamless 75-120 second loop from its most stable passage in an audio editor.

## Cue 3 - Oracle Prophecy: The Seal

**Status:** Do not generate until the silence-versus-music creative decision is resolved  
**Suno title:** `Oracle Prophecy - The Seal`

**Style of Music**

```text
instrumental fantasy game ceremony, luminous ancient prophecy, delicate glass harmonics, low warm resonance, restrained violet-gold shimmer, sacred serene consequential, gentle build, soft resolved seal
```

**Exclude Styles**

```text
vocals, choir, lyrics, speech, jump scare, heavy bass hit, trailer climax, horror, ominous unresolved ending
```

**Selection target**

- The complete musical idea must fit into a self-contained 12-16 second crop.
- It should support the prophecy-sealing sound effect rather than replacing it.
- Reject versions that make the Oracle feel threatening or turn the reveal into a trailer climax.

## Review and Records

For every generated candidate, record:

- Suno song link
- Generation date
- Suno subscription tier used during generation
- Cue ID
- Candidate version
- Approved or rejected
- Brief reason for the decision
- Final edited master filename, if approved

Download or archive the best original-quality file available from Suno. Keep the untouched download as the source
master, then make cropped, faded, looped, and compressed derivatives separately.

## Batch Files

The Suno-ready fields are also available in:

- `Project Documents/Music/Audition Briefs/manifest.json`
- `Project Documents/Music/Audition Briefs/music_audition_batch.csv`

Rebuild those planning files from `Codex/frontend` with:

```powershell
node .\scripts\prepare-music-briefs.mjs
```

This command only updates production planning files. It does not connect to Suno, generate music, or change the game.
