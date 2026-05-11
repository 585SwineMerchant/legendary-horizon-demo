type MusicLane = 'title' | 'exploration' | 'battle';

type FadeSpec = { durationMs: number };

type Running = {
  lane: MusicLane;
  kind: 'html' | 'synth';
  stop: (fade?: FadeSpec) => void;
  setVolume: (v: number, fade?: FadeSpec) => void;
};

function isAudioEnabled(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.lhAudio !== 'muted';
}

/**
 * Music-only mute (independent of the broader `data-lh-audio` toggle that silences SFX too).
 * When `data-lh-music === 'muted'` we treat all music lanes as silenced even if `isAudioEnabled()` is true.
 */
function isMusicEnabled(): boolean {
  if (typeof document === 'undefined') return false;
  if (!isAudioEnabled()) return false;
  return document.documentElement.dataset.lhMusic !== 'muted';
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function rafFade(from: number, to: number, durationMs: number, apply: (v: number) => void, done?: () => void) {
  const start = performance.now();
  const dur = Math.max(1, durationMs);
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    // Smoothstep-ish
    const eased = t * t * (3 - 2 * t);
    apply(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
    else done?.();
  };
  requestAnimationFrame(tick);
}

function createLoopingHtmlMusic(url: string, baseVolume = 0.5, startOffsetSec = 0): Running {
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.volume = 0;
  // When an offset is requested we manage looping manually so we can return to
  // the offset on each loop instead of jumping back to 0.
  audio.loop = startOffsetSec <= 0;

  let current = 0;
  let stopped = false;

  const seekToStart = () => {
    try {
      const safe =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? Math.max(0, Math.min(audio.duration - 0.05, startOffsetSec))
          : startOffsetSec;
      audio.currentTime = safe;
    } catch {
      /* ignore */
    }
  };

  if (startOffsetSec > 0) {
    if (audio.readyState >= 1 /* HAVE_METADATA */) {
      seekToStart();
    } else {
      audio.addEventListener('loadedmetadata', seekToStart, { once: true });
    }
    audio.addEventListener('ended', () => {
      if (stopped) return;
      seekToStart();
      void audio.play().catch(() => undefined);
    });
  }

  const ensurePlay = () => {
    if (stopped) return;
    void audio.play().catch(() => {
      // Autoplay may be blocked; we fail silently (classroom-safe).
    });
  };

  ensurePlay();

  return {
    lane: 'exploration',
    kind: 'html',
    stop: (fade) => {
      stopped = true;
      const d = fade?.durationMs ?? 900;
      rafFade(current, 0, d, (v) => {
        current = v;
        audio.volume = v;
      }, () => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {
          /* ignore */
        }
      });
    },
    setVolume: (v, fade) => {
      const target = clamp01(v) * clamp01(baseVolume);
      const d = fade?.durationMs ?? 1100;
      ensurePlay();
      rafFade(current, target, d, (x) => {
        current = x;
        audio.volume = x;
      });
    },
  };
}

function createSynthPadMusic(lane: MusicLane): Running {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) {
    // No audio context available; no-op runner.
    return {
      lane,
      kind: 'synth',
      stop: () => undefined,
      setVolume: () => undefined,
    };
  }

  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lane === 'battle' ? 900 : 520;
  filter.Q.value = lane === 'battle' ? 0.9 : 0.7;
  filter.connect(master);

  const now = ctx.currentTime;

  // Two detuned sines + a very soft triangle bed.
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  const oscC = ctx.createOscillator();
  oscA.type = 'sine';
  oscB.type = 'sine';
  oscC.type = 'triangle';

  const base = lane === 'battle' ? 164.81 : 110; // E3-ish vs A2-ish
  oscA.frequency.setValueAtTime(base, now);
  oscB.frequency.setValueAtTime(base * 1.005, now);
  oscC.frequency.setValueAtTime(base / 2, now);

  const gA = ctx.createGain();
  const gB = ctx.createGain();
  const gC = ctx.createGain();
  gA.gain.value = 0.0001;
  gB.gain.value = 0.0001;
  gC.gain.value = 0.0001;
  oscA.connect(gA);
  oscB.connect(gB);
  oscC.connect(gC);
  gA.connect(filter);
  gB.connect(filter);
  gC.connect(filter);

  // Gentle battle pulse (educational tension, not violence).
  let pulseId = 0;
  if (lane === 'battle') {
    const pulse = () => {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.exponentialRampToValueAtTime(Math.max(master.gain.value, 0.08), t + 0.04);
      master.gain.exponentialRampToValueAtTime(0.04, t + 0.35);
      pulseId = window.setTimeout(pulse, 980);
    };
    pulse();
  }

  oscA.start();
  oscB.start();
  oscC.start();

  let current = 0;
  let stopped = false;

  const close = () => {
    try {
      window.clearTimeout(pulseId);
      oscA.stop();
      oscB.stop();
      oscC.stop();
    } catch {
      /* ignore */
    }
    void ctx.close().catch(() => undefined);
  };

  return {
    lane,
    kind: 'synth',
    stop: (fade) => {
      if (stopped) return;
      stopped = true;
      const d = fade?.durationMs ?? 900;
      rafFade(current, 0.0001, d, (v) => {
        current = v;
        gA.gain.value = v;
        gB.gain.value = v;
        gC.gain.value = v * 0.7;
      }, close);
    },
    setVolume: (v, fade) => {
      const target = Math.max(0.0001, clamp01(v));
      const d = fade?.durationMs ?? 1100;
      rafFade(current, target, d, (x) => {
        current = x;
        gA.gain.value = x;
        gB.gain.value = x;
        gC.gain.value = x * 0.7;
      });
    },
  };
}

export type LhAudioDirectorState = {
  musicLane: MusicLane | null;
  ducked: boolean;
};

class LhAudioDirector {
  private title: Running | null = null;
  private exploration: Running | null = null;
  private battle: Running | null = null;
  private lane: MusicLane | null = null;
  private ducked = false;

  private titleUrl = '/assets/Audio/Legendary%20Horizon%20Title.mp3';
  private explorationUrl = '/assets/music/lh_exploration_loop.mp3';
  private battleUrl = '/assets/Audio/Moonlit%20Boss%20Round.mp3';

  // Title track has a long intro; jump straight to the main hook at 2:04.
  private titleStartOffsetSec = 124;

  setMusicUrls(urls: Partial<{ title: string; exploration: string; battle: string }>) {
    if (urls.title) this.titleUrl = urls.title;
    if (urls.exploration) this.explorationUrl = urls.exploration;
    if (urls.battle) this.battleUrl = urls.battle;
  }

  snapshot(): LhAudioDirectorState {
    return { musicLane: this.lane, ducked: this.ducked };
  }

  stopAll(fadeMs = 900) {
    this.title?.stop({ durationMs: fadeMs });
    this.exploration?.stop({ durationMs: fadeMs });
    this.battle?.stop({ durationMs: fadeMs });
    this.title = null;
    this.exploration = null;
    this.battle = null;
    this.lane = null;
  }

  setDucked(ducked: boolean) {
    this.ducked = ducked;
    this.applyVolumes(800);
  }

  private ensureTitle(): Running {
    if (this.title) return this.title;
    try {
      this.title = createLoopingHtmlMusic(this.titleUrl, 0.46, this.titleStartOffsetSec);
    } catch {
      this.title = createSynthPadMusic('exploration');
    }
    return this.title;
  }

  private ensureExploration(): Running {
    if (this.exploration) return this.exploration;
    // Try real file first; if it fails to autoplay it will remain silent (fine) and we still have synth fallback via lane swap.
    // If the HTML layer can't play (autoplay policies), we still provide a gentle synth bed.
    try {
      this.exploration = createLoopingHtmlMusic(this.explorationUrl, 0.5);
    } catch {
      this.exploration = createSynthPadMusic('exploration');
    }
    return this.exploration;
  }

  private ensureBattle(): Running {
    if (this.battle) return this.battle;
    try {
      this.battle = createLoopingHtmlMusic(this.battleUrl, 0.52);
    } catch {
      this.battle = createSynthPadMusic('battle');
    }
    return this.battle;
  }

  private applyVolumes(fadeMs: number) {
    // Music respects both the broader audio mute (`data-lh-audio`) and the music-only mute (`data-lh-music`).
    const musicEnabled = isMusicEnabled();
    const duck = this.ducked ? 0.35 : 1;
    const targetTitle = musicEnabled && this.lane === 'title' ? 0.64 * duck : 0;
    const targetExplore = musicEnabled && this.lane === 'exploration' ? 0.72 * duck : 0;
    const targetBattle = musicEnabled && this.lane === 'battle' ? 0.78 * duck : 0;

    // Exploration runner (html first; if browser blocks play entirely, it will be silent but not broken).
    if (this.title) this.title.setVolume(targetTitle, { durationMs: fadeMs });
    if (this.exploration) this.exploration.setVolume(targetExplore, { durationMs: fadeMs });
    if (this.battle) this.battle.setVolume(targetBattle, { durationMs: fadeMs });
  }

  /**
   * Re-evaluate volumes against the current document state. Call this when the user toggles a mute pref
   * — the React layer flips `data-lh-audio` / `data-lh-music`, but no event fires, so the director needs a poke.
   *
   * If music has just been re-enabled and the active lane's runner was torn down by an earlier `setLane`
   * call (which stops all runners while music is muted), recreate it here so unmuting actually restores audio.
   */
  refreshAudibility(fadeMs = 600): void {
    if (isMusicEnabled() && this.lane) {
      if (this.lane === 'title') this.ensureTitle();
      else if (this.lane === 'exploration') this.ensureExploration();
      else if (this.lane === 'battle') this.ensureBattle();
    }
    this.applyVolumes(fadeMs);
  }

  setLane(next: MusicLane | null) {
    if (this.lane === next) return;

    // If audio (or music specifically) is muted, keep lane intent but stop runners to prevent hidden playback.
    if (!isMusicEnabled()) {
      this.lane = next;
      this.stopAll(700);
      return;
    }

    this.lane = next;

    if (next === 'title') {
      this.ensureTitle();
      this.exploration?.setVolume(0, { durationMs: 520 });
      this.battle?.setVolume(0, { durationMs: 520 });
      this.applyVolumes(1200);
      return;
    }

    if (next === 'exploration') {
      this.ensureExploration();
      // Fade battle out cleanly on victory / exit.
      this.battle?.setVolume(0, { durationMs: 550 });
      this.applyVolumes(1400);
      return;
    }

    if (next === 'battle') {
      this.ensureBattle();
      // Duck exploration under the battle transition for intentionality.
      this.exploration?.setVolume(0.12, { durationMs: 420 });
      this.applyVolumes(900);
      return;
    }

    // next = null
    this.applyVolumes(700);
    // Let the runners stop themselves shortly after fading to avoid long-lived audio elements.
    window.setTimeout(() => {
      if (this.lane !== null) return;
      this.stopAll(700);
    }, 900);
  }
}

let singleton: LhAudioDirector | null = null;

export function getLhAudioDirector(): LhAudioDirector {
  if (singleton) return singleton;
  singleton = new LhAudioDirector();
  return singleton;
}

