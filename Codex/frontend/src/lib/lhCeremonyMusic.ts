import { publicAssetUrl } from './publicAssetUrl';

export type LhCeremonyMusicId =
  | 'scroll_reveal_ceremony'
  | 'fireside_reflection_loop'
  | 'prophecy_reveal_ceremony';

const CUES: Record<LhCeremonyMusicId, { file: string; loop: boolean; volume: number }> = {
  scroll_reveal_ceremony: {
    file: 'scroll_reveal_ceremony.mp3',
    loop: false,
    volume: 0.42,
  },
  fireside_reflection_loop: {
    file: 'fireside_reflection_loop.mp3',
    loop: true,
    volume: 0.32,
  },
  prophecy_reveal_ceremony: {
    file: 'prophecy_reveal_ceremony.mp3',
    loop: false,
    volume: 0.38,
  },
};

function musicEnabled(): boolean {
  if (typeof document === 'undefined') return false;
  return (
    document.documentElement.dataset.lhAudio !== 'muted' &&
    document.documentElement.dataset.lhMusic !== 'muted'
  );
}

/** Starts a special-scene music cue and returns a cleanup function that fades it out. */
export function playLhCeremonyMusic(id: LhCeremonyMusicId, volume?: number): () => void {
  if (typeof Audio === 'undefined' || !musicEnabled()) return () => undefined;

  const cue = CUES[id];
  const audio = new Audio(publicAssetUrl(`assets/music/${cue.file}`));
  audio.preload = 'auto';
  audio.loop = cue.loop;
  audio.volume = Math.max(0, Math.min(1, volume ?? cue.volume));
  void audio.play().catch(() => undefined);

  const observer = new MutationObserver(() => {
    if (!musicEnabled()) audio.pause();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-lh-audio', 'data-lh-music'],
  });

  return () => {
    observer.disconnect();
    const startVolume = audio.volume;
    const startedAt = performance.now();
    const fade = (now: number) => {
      const t = Math.min(1, (now - startedAt) / 500);
      audio.volume = startVolume * (1 - t);
      if (t < 1) requestAnimationFrame(fade);
      else audio.pause();
    };
    requestAnimationFrame(fade);
  };
}
