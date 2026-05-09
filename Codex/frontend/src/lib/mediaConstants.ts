/** Stable catalog ids used across Codex (fixtures + Drive-backed rows share these keys). */

export const LH_MEDIA_ASSET_ID_TITLE_BACKDROP = 'bg_title_dusk_forge_placeholder';

export const LH_MEDIA_ASSET_ID_SAVE_CHIME = 'sfx_save_chime_placeholder';

/** World Atlas fog lift after Guild Research hub closes (falls back to oscillator stub if unset). */
export const LH_MEDIA_ASSET_ID_ATLAS_FOG_REVEAL = 'sfx_atlas_fog_reveal_placeholder';

/** Prototype-parity fog clearing SFX (local file recommended). */
export const LH_MEDIA_ASSET_ID_FOG_CLEARING = 'sfx_fog_clearing';

/** Guild research hub opens: scroll unfurl. */
export const LH_MEDIA_ASSET_ID_SCROLL_UNFURLING = 'sfx_scroll_unfurling';

export const LH_MEDIA_ASSET_ID_MENTOR_PORTRAIT = 'portrait_mentor_kael_placeholder';

/** Matches `npc_id` on catalog rows (Sheets `LhMediaAssets.npc_id`). */
export const LH_NPC_ID_MENTOR_KAEL = 'mentor_kael';

/** Generic transparent pixel when no row resolves (never shipped to learners as final art). */
export const LH_MEDIA_ASSET_ID_MISSING_IMAGE = 'media_image_missing_placeholder';

/** Preload these on cold start so title + first dialog paint without decode jank. */
export const LH_CORE_PRELOAD_MEDIA_ASSET_IDS: readonly string[] = [
  LH_MEDIA_ASSET_ID_TITLE_BACKDROP,
  'ui_frame_amber_corner',
  LH_MEDIA_ASSET_ID_MENTOR_PORTRAIT,
] as const;
