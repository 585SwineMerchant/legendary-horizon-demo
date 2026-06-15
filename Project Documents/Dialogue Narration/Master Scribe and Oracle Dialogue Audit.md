# Master Scribe and Oracle Dialogue Narration Audit

## Scope

This audit covers the Master Scribe and Oracle text currently shown in the live RPG dialogue box.

Runtime source:

- `Codex/frontend/src/hooks/useNightOneFlow.ts`
- `Codex/frontend/src/components/DialogueBox.tsx`

ElevenLabs batch tool:

- `Codex/frontend/scripts/generate-elevenlabs-dialogue.mjs`

Generated batch files:

- `Codex/frontend/public/assets/dialogue/narration/manifest.json`
- `Codex/frontend/public/assets/dialogue/narration/elevenlabs_batch.csv`

## Coverage

- 15 live dialogue sequences
- 81 page-level narration clips
- 13 Master Scribe sequences
- 2 Oracle sequences

Each double line break in the runtime text creates a separate visible dialogue page. The batch therefore creates one
MP3 per visible page, rather than one long MP3 per conversation.

The speech batch preserves the displayed wording while normalizing typographic dashes, ellipses, and the UI breadcrumb
arrow so ElevenLabs reads them naturally.

## Important Findings

### 1. The sample dialogue catalog is not the live source for these characters

`Codex/data/samples/dialogue_catalog.json` contains extensive Master Scribe and Oracle banks, but the active gameplay
flow explicitly overrides both characters with quest-aware text in `useNightOneFlow.ts`.

Generating audio only from the sample catalog would miss the dialogue players currently see and would generate many
unused lines.

### 2. The dialogue box has no stable narration ID

The RPG dialogue model currently carries only the speaker, title, portrait, and full body text. It does not carry a
stable sequence ID or page ID. Audio can be generated now, but reliable automatic playback will require adding those
IDs to the runtime dialogue model.

Recommended file naming is already established by the batch:

`<sequence_id>__p<two-digit-page>.mp3`

Example:

`master_scribe_mq_101__p01.mp3`

### 3. Very short pages need deliberate delivery

Several visible pages contain only one or two words:

- "Good."
- "Tools."
- "Maps."
- "Memories."
- "Wait..."
- "Click it."
- "Read."
- "Take notes."

These are intentional dramatic or instructional beats, but ElevenLabs may make them sound abrupt or inconsistent.
Generate and review these clips individually. Do not combine them unless the on-screen pagination is also changed.

### 4. Character voice plan

The Master Scribe should use a distinct elderly female voice: low contralto, weathered, gently scratchy, measured,
warm, and authoritative. The performance should feel original and should not imitate a specific performer.

The Oracle should use a distinct ageless feminine voice: clear, serene, lightly ethereal, intimate, and unnervingly
calm. It should contrast with the Scribe's weathered texture while remaining highly intelligible.

Set `ELEVENLABS_MASTER_SCRIBE_VOICE_ID` to the approved separate Scribe voice. Set `ELEVENLABS_INTRO_VOICE_ID` to the
voice already used for the intro if it is needed for future narration. Set `ELEVENLABS_ORACLE_VOICE_ID` to the approved
separate Oracle voice.

The generator leaves ElevenLabs voice settings untouched by default, using the saved settings attached to each voice.

### 5. Pronunciation should be locked before full generation

Use these initial pronunciations:

- Maia: "MY-uh"
- Grey Commons: "gray commons"
- Foretold Signposts: "fore-told sign-posts"

Listen to a small test set before generating all 81 clips:

- `master_scribe_mq_101__p01`
- `master_scribe_mq_101__p04`
- `master_scribe_mq_107__p02`
- `master_scribe_mq_109__p02`
- `oracle_mq_201__p01`
- `oracle_mq_201__p09`

### 6. Free account production plan

The existing ElevenLabs account is on the free plan. The current live dialogue batch contains approximately 3,410 text
characters, so one clean generation pass should fit within the free plan's 10,000 monthly credits.

Use the existing intro voice and generate the six audition clips listed above first. After confirming voice continuity,
pronunciation, and pacing, generate the remaining clips once with `--skip-existing`.

The generator's default `mp3_44100_128` output matches the free plan's supported 128 kbps, 44.1 kHz quality. Avoid
repeatedly regenerating the full batch because every changed generation consumes additional credits.

### 7. The Oracle cinematic is separate

The audit covers text shown in RPG dialogue boxes. It does not add spoken narration to the Oracle cinematic or the
prophecy reveal screen. The live Oracle NPC primarily guides the player to open the Scroll at the altar.

## Voice Direction

Master Scribe: distinct elderly female voice with a low contralto register, a dry and gently gravelly texture, patient
pacing, warmth, and calm authority. Keep the rasp intelligible and avoid theatrical exaggeration.

Oracle: distinct ageless feminine voice with a clear, serene tone, intimate delivery, and subtle ethereal quality.
Keep the performance restrained and precise. Avoid exaggerated whispering, heavy reverb, and melodrama.

## Generate With ElevenLabs

From `Codex/frontend`:

```powershell
$env:ELEVENLABS_API_KEY = "your key"
node scripts/generate-elevenlabs-dialogue.mjs --list-voices

$env:ELEVENLABS_MASTER_SCRIBE_VOICE_ID = "the approved separate Scribe voice id"
$env:ELEVENLABS_ORACLE_VOICE_ID = "the approved separate Oracle voice id"
node scripts/generate-elevenlabs-dialogue.mjs --generate --only=master_scribe_mq_101__p01,master_scribe_mq_101__p04,master_scribe_mq_107__p02,master_scribe_mq_109__p02,oracle_mq_201__p01,oracle_mq_201__p09

# After approving the auditions:
node scripts/generate-elevenlabs-dialogue.mjs --generate --skip-existing
```

`--list-voices` lists voices already present in the connected ElevenLabs account. It does not create a new voice.

If the original intro used a model other than `eleven_multilingual_v2`, set `ELEVENLABS_MODEL_ID` to that same model
before generating the dialogue.

To rebuild only the JSON and CSV batch files without using ElevenLabs credits:

```powershell
node scripts/generate-elevenlabs-dialogue.mjs --dry-run
```

To audition selected clips before generating the full set:

```powershell
node scripts/generate-elevenlabs-dialogue.mjs --generate --only=master_scribe_mq_101__p01,oracle_mq_201__p01
```

Use `--speaker=oracle` to generate one character only, or `--skip-existing` to avoid regenerating files already in the
output folder.

The script defaults to `eleven_multilingual_v2` and `mp3_44100_128`. Both can be overridden with
`ELEVENLABS_MODEL_ID` and `ELEVENLABS_OUTPUT_FORMAT`.

## Recommended Next Integration

After voices are approved and files are generated:

1. Add a stable `narrationId` to the NPC dialogue overlay model.
2. Pass the active page index from `DialogueBox`.
3. Play the matching page MP3 when each page appears.
4. Stop narration immediately when the player advances or closes the dialogue.
5. Add a narration mute/read-aloud toggle and remember the player's preference.
