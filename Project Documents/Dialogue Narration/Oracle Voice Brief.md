# Oracle Voice Brief

## Creative Direction

Create an original, distinct feminine voice for the Oracle.

The voice should feel:

- Ageless rather than clearly young or elderly
- Feminine, clear, and serene
- Intimate, as though speaking directly into the Traveler's awareness
- Unnaturally calm without sounding emotionless
- Lightly ethereal through vocal quality, not heavy effects
- Precise and deliberate
- Quietly powerful
- Highly intelligible on short prophecy fragments

Avoid:

- Imitating a specific actor or public figure
- A gravelly texture similar to the Master Scribe
- Exaggerated whispering
- A sinister villain voice
- Heavy reverb or echo baked into the voice
- Melodramatic fantasy-trailer delivery
- Speaking so slowly that each short dialogue page feels stalled

## ElevenLabs Voice Design Prompt

An ageless feminine Oracle with a clear, serene voice and an intimate, lightly ethereal presence. Her delivery is
precise, restrained, and unnervingly calm, as though she already knows the listener's question before it is spoken.
She carries quiet power without raising her voice. The performance is mystical but natural, with excellent
intelligibility, subtle warmth, and no exaggerated whisper, rasp, theatricality, or sinister tone. Clear American
English.

## Voice Design Preview Text

Use this as the Voice Design preview text:

"Traveler of the Grey Commons... Your first signs have awakened. Three runes burn upon your Scroll. Not answers. Not
chains. Signposts. Choose only after seeking evidence. I reveal my visions through the Scroll."

## In-Game Audition Clips

After saving the generated Oracle voice, test only these clips:

1. `oracle_mq_201__p01` - "Traveler of the Grey Commons..."
2. `oracle_mq_201__p03` - "Three runes burn upon your Scroll."
3. `oracle_mq_201__p04` - "Not answers."
4. `oracle_mq_201__p06` - "Signposts."
5. `oracle_mq_201__p09` - "Choose only after seeking evidence."
6. `oracle_mq_201__p12` - "Open it here, at this altar."

## Approval Checklist

- The Oracle sounds clearly different from the Master Scribe.
- One-word pages sound intentional rather than clipped.
- The voice remains clear without relying on subtitles.
- The mystical quality comes from delivery, not excessive effects.
- The voice does not sound sinister or threatening.
- The pace feels calm without delaying player interaction.
- "Grey Commons," "runes," "Signposts," and "altar" are pronounced clearly.

## After Approval

Copy the approved Oracle voice ID into the current PowerShell session:

```powershell
$env:ELEVENLABS_ORACLE_VOICE_ID = "approved Oracle voice ID"
```

Do not generate the full Oracle dialogue until the six audition clips are approved.
