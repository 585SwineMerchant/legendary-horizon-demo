import { useEffect } from 'react';

import { getLhAudioDirector } from '../lib/lhAudioDirector';
import { publicAssetUrl } from '../lib/publicAssetUrl';

type NarrationClip = {
  speaker: 'master_scribe' | 'oracle';
  sequence_id: string;
  page: number;
  file: string;
  text: string;
};

type NarrationManifest = {
  clips?: NarrationClip[];
};

let clipsPromise: Promise<NarrationClip[]> | null = null;

function loadNarrationClips(): Promise<NarrationClip[]> {
  if (!clipsPromise) {
    clipsPromise = fetch(publicAssetUrl('assets/dialogue/narration/manifest.json'))
      .then(async (response) => {
        if (!response.ok) return [];
        const manifest = (await response.json()) as NarrationManifest;
        return Array.isArray(manifest.clips) ? manifest.clips : [];
      })
      .catch(() => []);
  }
  return clipsPromise;
}

function normalizeDialogueText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/→/g, 'to')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveSpeaker(title: string, speakerLabel?: string): NarrationClip['speaker'] | null {
  const label = `${speakerLabel ?? ''} ${title}`.toLowerCase();
  if (label.includes('master scribe')) return 'master_scribe';
  if (label.includes('oracle')) return 'oracle';
  return null;
}

/** Plays the approved narration clip matching the currently visible Scribe or Oracle dialogue page. */
export function useDialogueNarration(
  title: string,
  speakerLabel: string | undefined,
  currentBeat: string,
  sequenceId?: string,
  pageIndex = 0,
): void {
  useEffect(() => {
    const speaker = resolveSpeaker(title, speakerLabel);
    if (!speaker || !currentBeat.trim() || typeof Audio === 'undefined') return;
    if (document.documentElement.dataset.lhAudio === 'muted') return;

    let disposed = false;
    let audio: HTMLAudioElement | null = null;
    let observer: MutationObserver | null = null;
    let ducked = false;
    const director = getLhAudioDirector();
    const releaseDuck = () => {
      if (!ducked) return;
      ducked = false;
      director.setDucked(false);
    };

    void loadNarrationClips().then((clips) => {
      if (disposed) return;
      const normalizedBeat = normalizeDialogueText(currentBeat);
      const clip =
        (sequenceId
          ? clips.find(
              (candidate) =>
                candidate.speaker === speaker &&
                candidate.sequence_id === sequenceId &&
                candidate.page === pageIndex + 1,
            )
          : undefined) ??
        clips.find(
          (candidate) =>
            candidate.speaker === speaker && normalizeDialogueText(candidate.text) === normalizedBeat,
        );
      if (!clip) return;

      audio = new Audio(publicAssetUrl(`assets/dialogue/narration/${clip.file}`));
      audio.preload = 'auto';
      audio.volume = 0.92;
      director.setDucked(true);
      ducked = true;
      audio.addEventListener('ended', releaseDuck, { once: true });
      void audio.play().catch(() => {
        releaseDuck();
      });

      observer = new MutationObserver(() => {
        if (document.documentElement.dataset.lhAudio === 'muted') {
          audio?.pause();
          releaseDuck();
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-lh-audio'],
      });
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      releaseDuck();
    };
  }, [currentBeat, pageIndex, sequenceId, speakerLabel, title]);
}
