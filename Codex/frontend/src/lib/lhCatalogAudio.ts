import type { MediaAssetRecord } from '../domain/lh-contract';
import { getAssetRecord, resolveAssetDeliveryUrl } from '../services/assetCatalog';

import { playLhSfx } from './lhSfx';
import { isAudioMediaKind } from './mediaKinds';

function isAudioUnmutedInDom(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.lhAudio !== 'muted';
}

function tryGetAudioContext(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    return new AC();
  } catch {
    return null;
  }
}

function playSoftSaveChime(): void {
  const ctx = tryGetAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const freqs = [523.25, 659.25, 783.99]; // C5-E5-G5
    const duration = 0.32;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.06, now + 0.03 + i * 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration + i * 0.02);
      osc.connect(g);
      g.connect(master);
      osc.start(now + i * 0.01);
      osc.stop(now + duration + i * 0.02);
    });

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.55, now + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    void ctx.close().catch(() => undefined);
  } catch {
    /* ignore */
  }
}

function playScrollUnfurlSynth(): void {
  const ctx = tryGetAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const dur = 0.6;
    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i += 1) ch[i] = (Math.random() * 2 - 1) * 0.2;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(900, now);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1800, now);
    bp.frequency.exponentialRampToValueAtTime(1100, now + dur);
    bp.Q.value = 0.7;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(hp);
    hp.connect(bp);
    bp.connect(g);
    g.connect(master);
    noise.start(now);
    noise.stop(now + dur);

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.55, now + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    void ctx.close().catch(() => undefined);
  } catch {
    /* ignore */
  }
}

function playAtlasFogRevealSynth(): void {
  const ctx = tryGetAudioContext();
  if (!ctx) return;
  try {
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const dur = 1.25;
    const now = ctx.currentTime;

    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i += 1) ch[i] = (Math.random() * 2 - 1) * 0.45;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(420, now);
    bp.frequency.exponentialRampToValueAtTime(1400, now + 0.55);
    bp.frequency.exponentialRampToValueAtTime(620, now + dur);
    bp.Q.setValueAtTime(0.9, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
    noiseGain.gain.exponentialRampToValueAtTime(0.010, now + dur);

    const tone = ctx.createOscillator();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(196, now);
    tone.frequency.exponentialRampToValueAtTime(132, now + dur);

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.05, now + 0.12);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(master);

    tone.connect(toneGain);
    toneGain.connect(master);

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.7, now + 0.05);
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

function playGenericInteractSynth(): void {
  const ctx = tryGetAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.2);

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.55, now + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    void ctx.close().catch(() => undefined);
  } catch {
    /* ignore */
  }
}

function getCatalogAudioVolume(assetId: string): number {
  if (assetId === 'sfx_scroll_unfurling') return 0.86;
  if (assetId === 'sfx_save_chime_placeholder') return 0.68;
  return 0.52;
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

  if (assetId === 'sfx_save_chime_placeholder') {
    playLhSfx('save_confirm');
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
    // Presentation-safe: tasteful magical cues so silence never feels "broken".
    if (assetId === 'sfx_fog_clearing' || assetId === 'sfx_atlas_fog_reveal_placeholder') {
      playAtlasFogRevealSynth();
      return;
    }
    if (assetId === 'sfx_scroll_unfurling') {
      playScrollUnfurlSynth();
      return;
    }
    if (assetId === 'sfx_save_chime_placeholder') {
      playSoftSaveChime();
      return;
    }
    playGenericInteractSynth();
    return;
  }

  const audio = new Audio(url);
  audio.volume = getCatalogAudioVolume(assetId);
  void audio.play().catch((err) => {
    if (typeof console !== 'undefined') console.warn('[LhAudio] play() failed:', assetId, url, err);
    // Fall back to the same gentle cues even if the browser blocks playback.
    if (assetId === 'sfx_fog_clearing' || assetId === 'sfx_atlas_fog_reveal_placeholder') {
      playAtlasFogRevealSynth();
      return;
    }
    if (assetId === 'sfx_scroll_unfurling') {
      playScrollUnfurlSynth();
      return;
    }
    if (assetId === 'sfx_save_chime_placeholder') {
      playSoftSaveChime();
      return;
    }
    playGenericInteractSynth();
  });
}
