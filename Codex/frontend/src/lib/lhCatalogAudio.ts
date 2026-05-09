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

function playAtlasFogRevealSynth(): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    // A short filtered noise "whoosh" + low tone bed (matches the prototype's fog-clear vibe without shipping huge base64).
    const dur = 1.25;
    const now = ctx.currentTime;

    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i += 1) ch[i] = (Math.random() * 2 - 1) * 0.55;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(520, now);
    bp.frequency.exponentialRampToValueAtTime(1400, now + 0.55);
    bp.frequency.exponentialRampToValueAtTime(620, now + dur);
    bp.Q.setValueAtTime(0.9, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.16, now + 0.08);
    noiseGain.gain.exponentialRampToValueAtTime(0.012, now + dur);

    const tone = ctx.createOscillator();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(196, now);
    tone.frequency.exponentialRampToValueAtTime(132, now + dur);

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.06, now + 0.12);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(master);

    tone.connect(toneGain);
    toneGain.connect(master);

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.85, now + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.start(now);
    noise.stop(now + dur);
    tone.start(now);
    tone.stop(now + dur);

    void ctx.close().catch(() => undefined);
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
  if (typeof console !== 'undefined') console.info('[LhAudio] tryPlay:', assetId);

  if (!isAudioUnmutedInDom()) {
    if (typeof console !== 'undefined') console.warn('[LhAudio] BLOCKED by mute:', assetId);
    return;
  }

  const rec = getAssetRecord(assetId, catalog);
  if (!rec || !isAudioMediaKind(rec.kind)) {
    if (typeof console !== 'undefined') console.warn('[LhAudio] No record or wrong kind:', assetId, rec?.kind);
    return;
  }

  const url = resolveAssetDeliveryUrl(assetId, catalog).trim();
  if (typeof console !== 'undefined') console.info('[LhAudio] resolved URL:', assetId, url);
  if (!url || url.includes('example.invalid')) {
    if (assetId === 'sfx_atlas_fog_reveal_placeholder') {
      playAtlasFogRevealSynth();
      return;
    }
    playOscillatorStub();
    return;
  }

  const audio = new Audio(url);
  audio.volume = 0.55;
  void audio.play().catch((err) => {
    if (typeof console !== 'undefined') console.warn('[LhAudio] play() failed:', assetId, url, err);
    playOscillatorStub();
  });
}
