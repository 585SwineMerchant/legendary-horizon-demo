import type { MediaAssetRecord } from '../domain/lh-contract';
import { getAssetRecord, resolveAssetDeliveryUrl } from '../services/assetCatalog';

import { isAudioMediaKind } from './mediaKinds';

function isAudioUnmutedInDom(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.lhAudio !== 'muted';
}

/** Short sine blip when no hosted audio file is configured (class-safe). */
function playOscillatorStub(): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.06;
    osc.frequency.value = 720;
    osc.type = 'sine';
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    /* ignore */
  }
}

/**
 * Plays a catalog `audio` / `sfx` row when **Display & sound** has not muted future audio (M13 `data-lh-audio`).
 * Falls back to a tiny oscillator when the URL is missing or fails (e.g. Drive not wired yet).
 */
export function tryPlayCatalogAudioAsset(assetId: string, catalog?: readonly MediaAssetRecord[]): void {
  if (typeof window === 'undefined') return;
  if (!isAudioUnmutedInDom()) return;

  const rec = getAssetRecord(assetId, catalog);
  if (!rec || !isAudioMediaKind(rec.kind)) return;

  const url = resolveAssetDeliveryUrl(assetId, catalog).trim();
  if (!url || url.includes('example.invalid')) {
    playOscillatorStub();
    return;
  }

  const audio = new Audio(url);
  audio.volume = 0.35;
  void audio.play().catch(() => playOscillatorStub());
}
