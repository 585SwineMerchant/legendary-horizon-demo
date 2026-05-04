/**
 * Milestone 14 — classify `MediaAssetRecord.kind` for delivery (img vs audio vs ignore).
 * Sheet rows use the same string tokens in `kind`.
 */

/** `guild_hq` — primary guild hall / HQ hero plate (Drive-backed row; `realm_ids` should list the hall). */
const IMAGE_LIKE = new Set(['image', 'portrait', 'map_thumb', 'ui', 'banner', 'guild_hq']);

const AUDIO_KINDS = new Set(['audio', 'sfx', 'music']);

export function isImageLikeMediaKind(kind: string): boolean {
  return IMAGE_LIKE.has(String(kind || '').trim().toLowerCase());
}

export function isAudioMediaKind(kind: string): boolean {
  return AUDIO_KINDS.has(String(kind || '').trim().toLowerCase());
}
